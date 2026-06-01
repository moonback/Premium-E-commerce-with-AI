import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer, type IncomingMessage } from "http";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";
import { DEFAULT_SITE_URL, getProductPath } from "./src/lib/seo";
import { createSkillsEngine } from "./src/lib/skillsEngine";

// Load .env before anything else (tsx doesn't auto-inject env files)
loadDotenv({ path: ".env" });
loadDotenv({ path: ".env.local", override: true }); // .env.local takes precedence
import {
  calculatePaymentAmountCents,
  createStripeIdempotencyKey,
  getPaymentIntentErrorStatus,
  getStripeWebhookPayload,
  normalizeCheckoutAttemptId,
  toPaymentStatus,
} from "./src/services/paymentSecurity";
import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

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

type StripePaymentIntent = {
  id: string;
  client_secret?: string;
  status: string;
};

type LiveRateRecord = {
  windowStart: number;
  count: number;
  active: number;
};

const liveRateLimits = new Map<string, LiveRateRecord>();

// ─── Structured logger ────────────────────────────────────────────────────────
/** Redact sensitive fields before logging */
function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE = new Set(['email', 'token', 'password', 'authorization', 'secret', 'key', 'access_token']);
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = SENSITIVE.has(k.toLowerCase()) ? '[REDACTED]' : v;
  }
  return result;
}

function log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? redact(meta) : {}),
  });
  if (level === 'error') {
    console.error(entry);
  } else if (level === 'warn') {
    console.warn(entry);
  } else {
    console.log(entry);
  }
}

// ─── Request ID middleware ────────────────────────────────────────────────────
function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  (req as Request & { requestId: string }).requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

// ─── Request logger middleware ────────────────────────────────────────────────
function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const requestId = (req as Request & { requestId?: string }).requestId;
    log(res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info', 'http_request', {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
    });
  });
  next();
}

// ─── Global error handler ─────────────────────────────────────────────────────
function errorHandlerMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as Request & { requestId?: string }).requestId;
  const message = err instanceof Error ? err.message : 'Internal server error';
  log('error', 'unhandled_error', { requestId, message, path: req.path, method: req.method });
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error', requestId });
  }
}

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

  // ── Skills Engine — chargé une fois au démarrage ───────────────────────────
  const skillsEngine = createSkillsEngine(process.cwd());

  // ── Observability middlewares ──────────────────────────────────────────────
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

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

    let authenticatedUserId: string | null = null;
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
      authenticatedUserId = data.user.id;
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

      const checkoutAttemptId = normalizeCheckoutAttemptId(req.body?.checkoutAttemptId);
      const idempotencyKey = createStripeIdempotencyKey({
        userId: authenticatedUserId,
        attemptId: checkoutAttemptId,
        cartHash,
      });

      const stripeResponse = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
          ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
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
      const status = getPaymentIntentErrorStatus(message);
      if (status < 500 || message === "Catalog pricing is not configured") {
        res.status(status).json({ error: message });
        return;
      }
      console.error("Unable to create Stripe PaymentIntent", error);
      res.status(status).json({ error: "Payment provider unavailable" });
    }
  });

  app.get("/api/health", (req, res) => {
    const requestId = (req as Request & { requestId?: string }).requestId;
    res.json({
      status: "ok",
      version: process.env.npm_package_version || "0.0.0",
      uptimeSeconds: Math.floor((Date.now() - SERVER_STARTED_AT) / 1000),
      requestId,
      dependencies: {
        geminiLive: Boolean(process.env.GEMINI_API_KEY),
        supabaseAuth: Boolean(supabaseAuth),
        supabaseAdmin: Boolean(supabaseAdmin),
        stripePayments: Boolean(stripeSecretKey),
      },
    });
  });

  // ── E-commerce event tracking endpoint (P1.9) ─────────────────────────────
  const ALLOWED_EVENT_TYPES = new Set([
    'view_item', 'add_to_cart', 'remove_from_cart',
    'begin_checkout', 'purchase', 'search',
  ]);

  app.post("/api/events", async (req, res) => {
    const { event_type, payload } = req.body as { event_type?: string; payload?: Record<string, unknown> };
    if (!event_type || !ALLOWED_EVENT_TYPES.has(event_type)) {
      res.status(400).json({ error: "Invalid or missing event_type" });
      return;
    }
    const requestId = (req as Request & { requestId?: string }).requestId;
    log('info', 'ecommerce_event', { requestId, event_type });

    if (supabaseAdmin) {
      const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
      let userId: string | null = null;
      if (token && supabaseAuth) {
        const { data } = await supabaseAuth.auth.getUser(token);
        userId = data.user?.id ?? null;
      }
      const { error } = await supabaseAdmin.from("events").insert({
        event_type,
        user_id: userId,
        payload: payload ?? {},
        created_at: new Date().toISOString(),
      });
      if (error) {
        log('warn', 'event_persist_failed', { requestId, event_type, error: error.message });
      }
    }
    res.json({ ok: true });
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
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          // Prompt système chargé depuis prompts/ava-system.md
          systemInstruction: skillsEngine.systemPrompt,
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
            // ── Skills auto-injection ──────────────────────────────────────
            // Détecte les skills pertinents et les injecte comme contexte
            // avant le message du client (uniquement pour les messages texte
            // non-système, i.e. pas le contexte catalogue initial)
            const isCatalogContext = (parsed.text as string).startsWith('Contexte catalogue');
            if (!isCatalogContext) {
              const activeSkills = skillsEngine.getActiveSkills(parsed.text as string);
              if (activeSkills.length > 0) {
                const skillNames = activeSkills.map(s => s.name).join(', ');
                log('info', 'skills_activated', { skills: skillNames });
                const skillsContext = activeSkills
                  .map(s => `[Skill actif: ${s.name}]\n${s.content}`)
                  .join('\n\n');
                // Injecte le contexte des skills comme instruction système juste avant le message
                session.sendRealtimeInput({ text: `[Instructions contextuelles — ne pas lire à voix haute]\n${skillsContext}` });
              }
            }
            session.sendRealtimeInput({ text: parsed.text });
          } else if (parsed.functionResponse) {
             session.sendToolResponse({ functionResponses: [parsed.functionResponse] });
          }
        } catch (e) {
          console.error("Error processing client message", e);
        }
      });

      clientWs.on("close", () => {
        log('info', 'ws_client_disconnected', { clientIp });
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

  // ── Global error handler (must be last middleware) ────────────────────────
  app.use(errorHandlerMiddleware);

  server.listen(PORT, "0.0.0.0", () => {
    log('info', 'server_started', { port: PORT, env: process.env.NODE_ENV || 'development' });
  });
}

startServer();
