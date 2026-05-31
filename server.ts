import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer, type IncomingMessage } from "http";
import crypto from "crypto";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SITE_URL, getProductPath } from "./src/lib/seo";

const LIVE_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const LIVE_MAX_CONNECTIONS_PER_WINDOW = 5;
const LIVE_MAX_ACTIVE_CONNECTIONS = 2;
const LIVE_SESSION_MAX_MS = Number(process.env.LIVE_SESSION_MAX_MS ?? 2 * 60 * 1000);
const GEMINI_LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview";
const SERVER_STARTED_AT = Date.now();
const IS_PRODUCTION = process.env.NODE_ENV === "production";

type SitemapProductRow = {
  id: string;
  name: string;
  created_at?: string | null;
};

type PaymentIntentLineItem = {
  product_id?: unknown;
  quantity?: unknown;
};

type ProductPaymentRow = {
  id: string;
  price: number;
  stock: number | null;
};

type StripePaymentIntent = {
  id: string;
  client_secret?: string;
  status: string;
};

type StripeWebhookEvent = {
  id: string;
  type: string;
  data?: { object?: { id?: string; status?: string } };
};

type LiveRateRecord = {
  windowStart: number;
  count: number;
  active: number;
};

const liveRateLimits = new Map<string, LiveRateRecord>();

function getClientIp(request: IncomingMessage) {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.socket.remoteAddress || "unknown";
}

function registerLiveConnection(ip: string) {
  const now = Date.now();
  const current = liveRateLimits.get(ip);
  const record = !current || now - current.windowStart > LIVE_RATE_LIMIT_WINDOW_MS
    ? { windowStart: now, count: 0, active: 0 }
    : current;

  if (record.active >= LIVE_MAX_ACTIVE_CONNECTIONS) {
    liveRateLimits.set(ip, record);
    return { allowed: false, reason: "Trop de sessions vocales simultanées." };
  }

  if (record.count >= LIVE_MAX_CONNECTIONS_PER_WINDOW) {
    liveRateLimits.set(ip, record);
    return { allowed: false, reason: "Limite temporaire de sessions vocales atteinte." };
  }

  record.count += 1;
  record.active += 1;
  liveRateLimits.set(ip, record);

  return {
    allowed: true,
    release: () => {
      const latest = liveRateLimits.get(ip);
      if (latest) latest.active = Math.max(0, latest.active - 1);
    },
  };
}



function normalizePaymentItems(rawItems: unknown) {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 100) {
    throw new Error("Payment items are required");
  }

  const quantities = new Map<string, number>();
  for (const rawItem of rawItems as PaymentIntentLineItem[]) {
    const productId = typeof rawItem.product_id === "string" ? rawItem.product_id.trim() : "";
    const quantity = Number(rawItem.quantity);

    if (!productId) {
      throw new Error("Invalid product id");
    }
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99) {
      throw new Error("Invalid product quantity");
    }

    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  return [...quantities.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

function createCartHash(items: Array<{ productId: string; quantity: number }>) {
  const stablePayload = items
    .map((item) => `${item.productId}:${item.quantity}`)
    .sort()
    .join("|");
  return crypto.createHash("sha256").update(stablePayload).digest("hex").slice(0, 32);
}

async function calculatePaymentAmountCents(
  catalogClient: SupabaseClient | null,
  rawItems: unknown
) {
  if (!catalogClient) {
    throw new Error("Catalog pricing is not configured");
  }

  const items = normalizePaymentItems(rawItems);
  const productIds = items.map((item) => item.productId);
  const { data, error } = await catalogClient
    .from("products")
    .select("id,price,stock")
    .in("id", productIds);

  if (error) throw error;

  const products = new Map((data ?? []).map((product) => {
    const row = product as ProductPaymentRow;
    return [row.id, row];
  }));

  let amountCents = 0;
  for (const item of items) {
    const product = products.get(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }
    if (typeof product.stock === "number" && product.stock < item.quantity) {
      throw new Error(`Insufficient stock for product ${item.productId}`);
    }

    amountCents += Math.round(Number(product.price) * 100) * item.quantity;
  }

  if (!Number.isInteger(amountCents) || amountCents < 50 || amountCents > 9999999) {
    throw new Error("Invalid payment amount");
  }

  return { amountCents, itemCount: items.reduce((sum, item) => sum + item.quantity, 0), cartHash: createCartHash(items) };
}

function getStripeWebhookPayload(rawBody: Buffer, signatureHeader: string, secret: string) {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  const timestamp = parts.t;
  const signature = parts.v1;

  if (!timestamp || !signature) {
    throw new Error("Invalid Stripe signature header");
  }

  const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  const provided = Buffer.from(signature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    throw new Error("Stripe signature verification failed");
  }

  const toleranceSeconds = 5 * 60;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > toleranceSeconds) {
    throw new Error("Stripe signature timestamp is outside tolerance");
  }

  return JSON.parse(rawBody.toString("utf8")) as StripeWebhookEvent;
}

function toPaymentStatus(stripeStatus?: string) {
  switch (stripeStatus) {
    case "succeeded":
      return "paid";
    case "processing":
      return "processing";
    case "canceled":
      return "cancelled";
    case "requires_payment_method":
    case "requires_action":
    case "requires_confirmation":
      return "requires_payment";
    default:
      return "failed";
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sitemapUrl(location: string, lastmod?: string | null) {
  const escapedLocation = escapeXml(location);
  const escapedLastmod = lastmod ? `<lastmod>${escapeXml(lastmod.slice(0, 10))}</lastmod>` : "";
  return `<url><loc>${escapedLocation}</loc>${escapedLastmod}</url>`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = createServer(app);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseAuth = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    : null;
  const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    : null;

  app.post("/api/payments/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!stripeWebhookSecret) {
      res.status(503).json({ error: "Stripe webhook secret is not configured" });
      return;
    }

    const signature = req.header("stripe-signature");
    if (!signature || !Buffer.isBuffer(req.body)) {
      res.status(400).json({ error: "Missing Stripe signature or raw body" });
      return;
    }

    try {
      const event = getStripeWebhookPayload(req.body, signature, stripeWebhookSecret);
      const paymentIntentId = event.data?.object?.id;
      if (supabaseAdmin && paymentIntentId && event.type.startsWith("payment_intent.")) {
        const status = toPaymentStatus(event.data?.object?.status);
        const { data: payments, error } = await supabaseAdmin
          .from("payments")
          .update({
            status,
            raw_provider_status: event.data?.object?.status || null,
            metadata: { stripe_event_id: event.id, stripe_event_type: event.type },
            reconciled_at: new Date().toISOString(),
          })
          .eq("provider", "stripe")
          .eq("provider_payment_id", paymentIntentId)
          .select("id, order_id");

        if (error) {
          console.warn("Unable to reconcile Stripe payment webhook", error);
          res.status(500).json({ error: "Payment reconciliation failed" });
          return;
        }

        if (!payments || payments.length === 0) {
          if (status === "paid") {
            console.warn("Stripe webhook arrived before local payment row", { paymentIntentId, eventId: event.id });
            res.status(409).json({ error: "Payment row not ready" });
            return;
          }
          res.json({ received: true, ignored: "no_local_payment" });
          return;
        }

        const orderIds = payments
          .map((payment) => payment.order_id)
          .filter((orderId): orderId is string => typeof orderId === "string" && orderId.length > 0);
        if (orderIds.length > 0) {
          const { error: orderError } = await supabaseAdmin
            .from("orders")
            .update({ payment_status: status })
            .in("id", orderIds);
          if (orderError) {
            console.warn("Unable to update order payment status", orderError);
            res.status(500).json({ error: "Order reconciliation failed" });
            return;
          }
        }
      } else if (!supabaseAdmin && paymentIntentId && event.type.startsWith("payment_intent.")) {
        console.warn("Stripe webhook received but SUPABASE_SERVICE_ROLE_KEY is not configured");
        res.status(503).json({ error: "Payment reconciliation is not configured" });
        return;
      }

      res.json({ received: true });
    } catch (error) {
      console.warn("Invalid Stripe webhook", error);
      res.status(400).json({ error: "Invalid webhook" });
    }
  });

  app.use(express.json());

  app.get("/robots.txt", (req, res) => {
    const siteUrl = (process.env.SITE_URL || `${req.protocol}://${req.get("host") || "localhost:3000"}`).replace(/\/$/, "");
    res.type("text/plain").send([
      "User-agent: *",
      "Allow: /",
      `Sitemap: ${siteUrl}/sitemap.xml`,
    ].join("\n"));
  });

  app.get("/sitemap.xml", async (req, res) => {
    const siteUrl = (process.env.SITE_URL || `${req.protocol}://${req.get("host") || DEFAULT_SITE_URL}`).replace(/\/$/, "");
    const staticUrls = [
      sitemapUrl(`${siteUrl}/`),
      sitemapUrl(`${siteUrl}/checkout`),
    ];

    let productUrls: string[] = [];
    if (supabaseAuth) {
      const { data, error } = await supabaseAuth
        .from("products")
        .select("id,name,created_at")
        .limit(500);

      if (error) {
        console.warn("Unable to build product sitemap entries", error);
      } else {
        const products = (data ?? []) as SitemapProductRow[];
        productUrls = products.map((product) => sitemapUrl(`${siteUrl}${getProductPath(product)}`, product.created_at));
      }
    }

    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...staticUrls, ...productUrls].join("")}</urlset>`);
  });


  app.post("/api/payments/create-intent", async (req, res) => {
    if (!stripeSecretKey) {
      res.status(503).json({ error: "Stripe is not configured on the server" });
      return;
    }

    if (supabaseAuth) {
      const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
      if (!token) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      const { data, error } = await supabaseAuth.auth.getUser(token);
      if (error || !data.user) {
        res.status(401).json({ error: "Invalid authentication token" });
        return;
      }
    }

    const currency = String(req.body?.currency || "eur").toLowerCase();
    const customer = req.body?.customer as { name?: string; email?: string } | undefined;

    if (!/^[a-z]{3}$/.test(currency)) {
      res.status(400).json({ error: "Invalid currency" });
      return;
    }

    try {
      const catalogClient = supabaseAdmin || supabaseAuth;
      const { amountCents, itemCount, cartHash } = await calculatePaymentAmountCents(catalogClient, req.body?.items);
      const body = new URLSearchParams({
        amount: String(amountCents),
        currency,
        "automatic_payment_methods[enabled]": "true",
        "automatic_payment_methods[allow_redirects]": "never",
        "metadata[source]": "veridian_checkout",
        "metadata[item_count]": String(itemCount),
        "metadata[cart_hash]": cartHash,
      });
      if (customer?.email) body.set("receipt_email", customer.email);
      if (customer?.name) body.set("metadata[customer_name]", customer.name);

      const stripeResponse = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      const paymentIntent = await stripeResponse.json() as StripePaymentIntent & { error?: { message?: string } };

      if (!stripeResponse.ok || !paymentIntent.client_secret) {
        res.status(stripeResponse.status).json({ error: paymentIntent.error?.message || "Stripe payment intent failed" });
        return;
      }

      res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, amountCents });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment provider unavailable";
      if (
        message === "Payment items are required" ||
        message === "Invalid product id" ||
        message === "Invalid product quantity" ||
        message === "Invalid payment amount" ||
        message.includes("not found") ||
        message.includes("Insufficient stock")
      ) {
        res.status(400).json({ error: message });
        return;
      }
      if (message === "Catalog pricing is not configured") {
        res.status(503).json({ error: message });
        return;
      }
      console.error("Unable to create Stripe PaymentIntent", error);
      res.status(502).json({ error: "Payment provider unavailable" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      version: process.env.npm_package_version || "0.0.0",
      uptimeSeconds: Math.floor((Date.now() - SERVER_STARTED_AT) / 1000),
      dependencies: {
        geminiLive: Boolean(process.env.GEMINI_API_KEY),
        supabaseAuth: Boolean(supabaseAuth),
        supabaseAdmin: Boolean(supabaseAdmin),
        stripePayments: Boolean(stripeSecretKey),
      },
    });
  });

  // ---- WebSocket handler for Gemini Live API ----
  const wss = new WebSocketServer({ server, path: "/live" });

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
  wss.on("connection", async (clientWs: WebSocket, request: IncomingMessage) => {
    const clientIp = getClientIp(request);
    const rateLimit = registerLiveConnection(clientIp);
    if (!rateLimit.allowed) {
      clientWs.send(JSON.stringify({ error: rateLimit.reason }));
      clientWs.close(1008, "Rate limit exceeded");
      return;
    }
    clientWs.once("close", () => rateLimit.release?.());

    console.log("Client connected to WebSocket", { clientIp });

    let liveSession: (Awaited<ReturnType<GoogleGenAI['live']['connect']>> & { close?: () => void }) | null = null;
    let sessionTimeout: NodeJS.Timeout | null = null;

    const cleanupLiveSession = () => {
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        sessionTimeout = null;
      }
      liveSession?.close?.();
      liveSession = null;
    };

    try {
      if (!ai) {
        clientWs.send(JSON.stringify({ error: "AI voice service is not configured" }));
        clientWs.close(1013, "AI service unavailable");
        return;
      }
      if (!supabaseAuth && IS_PRODUCTION) {
        clientWs.send(JSON.stringify({ error: "Voice authentication is not configured" }));
        clientWs.close(1011, "Authentication unavailable");
        return;
      }

      if (supabaseAuth) {
        const token = new URL(request.url || "/live", "http://localhost").searchParams.get("token");
        if (!token) {
          clientWs.send(JSON.stringify({ error: "Authentication required" }));
          clientWs.close(1008, "Authentication required");
          return;
        }

        const { data, error } = await supabaseAuth.auth.getUser(token);
        if (error || !data.user) {
          clientWs.send(JSON.stringify({ error: "Invalid authentication token" }));
          clientWs.close(1008, "Invalid authentication token");
          return;
        }
      }

      const session = await ai.live.connect({
        model: GEMINI_LIVE_MODEL,
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              clientWs.send(JSON.stringify({ audio: audioData }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.functionCall) {
                  clientWs.send(JSON.stringify({ functionCall: part.functionCall }));
                }
              }
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "Vous êtes Ava, une conseillère IA pour Véridian, une boutique e-commerce premium. Utilisez uniquement le contexte catalogue fourni par le client ou les outils pour recommander des produits existants. Soyez accueillante, experte, concise et confirmez toute action d'ajout au panier.",
          tools: [{
            functionDeclarations: [{
              name: "addToCart",
              description: "Ajoute un produit au panier du client ou propose un achat.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  productId: {
                    type: Type.STRING, 
                    description: "L'identifiant exact du produit choisi dans le contexte catalogue fourni pour la session."
                  },
                  quantity: { type: Type.INTEGER, description: "La quantité souhaitée par le client" }
                },
                required: ["productId", "quantity"]
              }
            }]
          }]
        },
      });

      liveSession = session;
      sessionTimeout = setTimeout(() => {
        clientWs.send(JSON.stringify({ error: "Session vocale terminée: durée maximale atteinte." }));
        clientWs.close(1000, "Session duration limit reached");
        cleanupLiveSession();
      }, LIVE_SESSION_MAX_MS);

      // Handle messages coming from the client
      clientWs.on("message", (data: string) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: {
                mimeType: "audio/pcm;rate=16000",
                data: parsed.audio,
              }
            });
          } else if (parsed.text) {
             session.sendRealtimeInput({ text: parsed.text });
          } else if (parsed.functionResponse) {
             session.sendToolResponse({ functionResponses: [parsed.functionResponse] });
          }
        } catch (e) {
          console.error("Error processing client message", e);
        }
      });

      clientWs.on("close", () => {
        console.log("Client disconnected", { clientIp });
        cleanupLiveSession();
      });
    } catch (e) {
      cleanupLiveSession();
      console.error("Failed to start Gemini Live Session:", e);
      clientWs.send(JSON.stringify({ error: "Failed to connect to AI server" }));
      clientWs.close();
    }
  });

  // ---- Vite Middleware ----
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
