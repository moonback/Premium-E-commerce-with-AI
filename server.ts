import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer, type IncomingMessage } from "http";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_SITE_URL, getProductPath } from "./src/lib/seo";

const LIVE_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const LIVE_MAX_CONNECTIONS_PER_WINDOW = 5;
const LIVE_MAX_ACTIVE_CONNECTIONS = 2;
const LIVE_SESSION_MAX_MS = Number(process.env.LIVE_SESSION_MAX_MS ?? 2 * 60 * 1000);
const GEMINI_LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview";
const SERVER_STARTED_AT = Date.now();
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const FALLBACK_SITEMAP_PRODUCTS = [
  { id: "prod_1", name: "Sac Cabas Signature" },
  { id: "prod_2", name: "Écharpe Cachemire" },
  { id: "prod_3", name: "Tasse Artisanale" },
  { id: "prod_4", name: "Gourde Isotherme" },
];

type SitemapProduct = {
  id: string;
  name: string;
  slug?: string | null;
  updated_at?: string | null;
};

function getPublicSiteOrigin(request: IncomingMessage) {
  const configuredOrigin = process.env.SITE_URL || process.env.VITE_SITE_URL;
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "");
  const forwardedProto = request.headers["x-forwarded-proto"];
  const protocol = typeof forwardedProto === "string" ? forwardedProto.split(",")[0] : "https";
  return `${protocol}://${request.headers.host || "localhost:3000"}`;
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getSitemapProductPath(product: SitemapProduct) {
  return `/product/${product.slug || `${slugify(product.name)}-${product.id}`}`;
}

type SitemapUrl = {
  loc: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
};

function renderSitemapXml(origin: string, products: SitemapProduct[]) {
  const staticUrls: SitemapUrl[] = [
    { loc: `${origin}/`, changefreq: "daily", priority: "1.0" },
  ];
  const productUrls: SitemapUrl[] = products.map(product => ({
    loc: `${origin}${getSitemapProductPath(product)}`,
    changefreq: "weekly",
    priority: "0.8",
    lastmod: product.updated_at ?? undefined,
  }));
  const urls = [...staticUrls, ...productUrls]
    .map(({ loc, changefreq, priority, lastmod }) => [
      "  <url>",
      `    <loc>${xmlEscape(loc)}</loc>`,
      lastmod ? `    <lastmod>${xmlEscape(new Date(lastmod).toISOString())}</lastmod>` : null,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      "  </url>",
    ].filter(Boolean).join("\n"))
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

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
  const supabaseAuth = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    : null;

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

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      version: process.env.npm_package_version || "0.0.0",
      uptimeSeconds: Math.floor((Date.now() - SERVER_STARTED_AT) / 1000),
      dependencies: {
        geminiLive: Boolean(process.env.GEMINI_API_KEY),
        supabaseAuth: Boolean(supabaseAuth),
      },
    });
  });


  app.get("/robots.txt", (req, res) => {
    const origin = getPublicSiteOrigin(req);
    res.type("text/plain").send(`User-agent: *
Allow: /
Sitemap: ${origin}/sitemap.xml
`);
  });

  app.get("/sitemap.xml", async (req, res) => {
    const origin = getPublicSiteOrigin(req);
    let products: SitemapProduct[] = FALLBACK_SITEMAP_PRODUCTS;

    if (supabaseAuth) {
      try {
        const { data, error } = await supabaseAuth
          .from("products")
          .select("id,name,slug,updated_at")
          .order("name", { ascending: true });

        if (!error && data && data.length > 0) {
          products = data as SitemapProduct[];
        }
      } catch (error) {
        console.error("Failed to build sitemap from Supabase products", error);
      }
    }

    res.type("application/xml").send(renderSitemapXml(origin, products));
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
