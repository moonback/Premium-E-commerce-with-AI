import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer, type IncomingMessage } from "http";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const LIVE_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const LIVE_MAX_CONNECTIONS_PER_WINDOW = 5;
const LIVE_MAX_ACTIVE_CONNECTIONS = 2;

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


async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = createServer(app);

  app.use(express.json());

  // Dummy API to fetch initial state or products if needed
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ---- WebSocket handler for Gemini Live API ----
  const wss = new WebSocketServer({ server, path: "/live" });

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseAuth = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    : null;

  wss.on("connection", async (clientWs: WebSocket, request: IncomingMessage) => {
    const clientIp = getClientIp(request);
    const rateLimit = registerLiveConnection(clientIp);
    if (!rateLimit.allowed) {
      clientWs.send(JSON.stringify({ error: rateLimit.reason }));
      clientWs.close(1008, "Rate limit exceeded");
      return;
    }
    clientWs.once("close", () => rateLimit.release?.());

    console.log("Client connected to WebSocket");

    try {
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
        model: "gemini-3.1-flash-live-preview",
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
          systemInstruction: "Vous êtes Ava, une conseillère IA et chef pâtissière pour 'Véridian', une boutique premium de pâtisseries trompe-l'œil. Soyez accueillante, experte et conversationnelle. Posez des questions pour comprendre les préférences de goût du client (fruité, chocolaté, texture, etc.), puis recommandez la pâtisserie idéale. Soyez concise dans vos réponses.",
          tools: [{
            functionDeclarations: [{
              name: "addToCart",
              description: "Ajoute un produit au panier du client ou propose un achat.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  productId: {
                    type: Type.STRING, 
                    description: "L'identifiant exact de la pâtisserie choisie. Valeurs possibles: prod_1 (La Noisette Fraîche), prod_2 (Le Citron Jaune), prod_3 (La Gousse de Vanille), prod_4 (Le Grain de Café)."
                  },
                  quantity: { type: Type.INTEGER, description: "La quantité souhaitée par le client" }
                },
                required: ["productId", "quantity"]
              }
            }]
          }]
        },
      });

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
        console.log("Client disconnected");
        (session as any).close?.();
      });
    } catch (e) {
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
