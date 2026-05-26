import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

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

  wss.on("connection", async (clientWs: WebSocket) => {
    console.log("Client connected to WebSocket");

    try {
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
                type: "OBJECT",
                properties: {
                  productId: {
                    type: "STRING", 
                    description: "L'identifiant exact de la pâtisserie choisie. Valeurs possibles: prod_1 (La Noisette Fraîche), prod_2 (Le Citron Jaune), prod_3 (La Gousse de Vanille), prod_4 (Le Grain de Café)."
                  },
                  quantity: { type: "INTEGER", description: "La quantité souhaitée par le client" }
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
            session.sendRealtimeInput([
              {
                mimeType: "audio/pcm;rate=16000",
                data: parsed.audio,
              },
            ]);
          } else if (parsed.text) {
             session.sendRealtimeInput([{text: parsed.text}]);
          } else if (parsed.functionResponse) {
             session.sendRealtimeInput([{ functionResponse: parsed.functionResponse }]);
          }
        } catch (e) {
          console.error("Error processing client message", e);
        }
      });

      clientWs.on("close", () => {
        console.log("Client disconnected");
        // close the session if possible
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
