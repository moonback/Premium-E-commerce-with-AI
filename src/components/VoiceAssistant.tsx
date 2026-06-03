// src/components/VoiceAssistant.tsx
// P1.10 — Text fallback, quick suggestions, visual cart confirmation, injection guards
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Send, ShoppingBag, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../lib/errors';

// ── Safety: strip prompt-injection attempts from user text input ──────────────
const MAX_TEXT_INPUT_LENGTH = 300;
function sanitizeTextInput(raw: string): string {
  return raw
    .slice(0, MAX_TEXT_INPUT_LENGTH)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars
    .trim();
}

// ── Cart confirmation toast shown inside the panel ────────────────────────────
interface CartConfirmation {
  productName: string;
  quantity: number;
}

// ── Quick suggestion chips ────────────────────────────────────────────────────
const QUICK_SUGGESTIONS = [
  'Quoi de nouveau ?',
  'Recommande-moi quelque chose',
  'Produits en stock',
  'Moins de 30€',
];

export default function VoiceAssistant() {
  const products = useStore(state => state.products);
  const addToCart = useStore(state => state.addToCart);

  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micDenied, setMicDenied] = useState(false);

  // Text mode fallback
  const [textMode, setTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isSendingText, setIsSendingText] = useState(false);

  // Visual cart confirmation
  const [cartConfirmation, setCartConfirmation] = useState<CartConfirmation | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);   // 24 kHz — playback only
  const micCtxRef = useRef<AudioContext | null>(null);     // 16 kHz — mic capture only
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Hide on screen route
  if (window.location.pathname === '/screen') return null;

  // Auto-clear cart confirmation after 3s
  useEffect(() => {
    if (!cartConfirmation) return;
    const t = setTimeout(() => setCartConfirmation(null), 3000);
    return () => clearTimeout(t);
  }, [cartConfirmation]);

  // Focus text input when switching to text mode
  useEffect(() => {
    if (textMode && isOpen) {
      setTimeout(() => textInputRef.current?.focus(), 80);
    }
  }, [textMode, isOpen]);

  const getWsUrl = (token?: string) => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${proto}://${window.location.host}/live${tokenParam}`;
  };

  const handleFunctionCall = (ws: WebSocket, id: string, name: string, args: Record<string, unknown>) => {
    if (name !== 'addToCart') return;
    const productId = typeof args.productId === 'string' ? args.productId : null;
    let quantity = typeof args.quantity === 'number' ? args.quantity : 1;
    
    // Bounds check
    quantity = Math.max(1, Math.min(Math.floor(quantity), 10));

    if (!productId) {
      ws.send(JSON.stringify({ functionResponse: { id, name, response: { error: 'productId manquant.' } } }));
      return;
    }

    const store = useStore.getState();
    const product = store.products.find(p => p.id === productId);
    if (product) {
      if (product.stock < quantity) {
         ws.send(JSON.stringify({
           functionResponse: { id, name, response: { error: `Stock insuffisant. Seulement ${product.stock} en stock.` } },
         }));
         return;
      }
      addToCart(product, quantity);
      setCartConfirmation({ productName: product.name, quantity });
      ws.send(JSON.stringify({
        functionResponse: { id, name, response: { result: `Succès : ${quantity} x ${product.name} ajouté(s).` } },
      }));
    } else {
      ws.send(JSON.stringify({
        functionResponse: { id, name, response: { error: 'Produit introuvable dans le catalogue actuel.' } },
      }));
    }
  };

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const { data: { session } } = supabase
        ? await supabase.auth.getSession()
        : { data: { session: null } };

      if (supabase && !session?.access_token) {
        setError('Connectez-vous pour utiliser Ava en mode vocal.');
        setIsConnecting(false);
        return;
      }

      const ws = new WebSocket(getWsUrl(session?.access_token));
      wsRef.current = ws;

      const AudioContextCtor =
        window.AudioContext ||
        (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) throw new Error('AudioContext non disponible dans ce navigateur');

      // Gemini Live outputs audio at 24 kHz — use a separate context for playback
      // The mic capture context stays at 16 kHz (sent to the server)
      const audioCtx = new AudioContextCtor({ sampleRate: 24000 });
      audioCtxRef.current = audioCtx;
      nextStartTimeRef.current = audioCtx.currentTime;

      ws.onopen = async () => {
        setIsConnecting(false);
        setIsRecording(true);

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          // Mic capture uses its own 16 kHz context — independent from the 24 kHz playback context
          const micCtx = new AudioContextCtor({ sampleRate: 16000 });
          micCtxRef.current = micCtx;
          const source = micCtx.createMediaStreamSource(stream);
          const processor = micCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;
          source.connect(processor);
          processor.connect(micCtx.destination);

          processor.onaudioprocess = e => {
            if (ws.readyState !== WebSocket.OPEN) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
            }
            const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
            ws.send(JSON.stringify({ audio: base64 }));
          };
        } catch {
          setMicDenied(true);
          setError('Microphone refusé. Utilisez le mode texte ci-dessous.');
          setTextMode(true);
          stopSession();
        }
      };

      ws.onmessage = event => {
        const msg = JSON.parse(event.data as string) as Record<string, unknown>;
        if (msg.audio) playAudioChunk(msg.audio as string);
        if (msg.interrupted && audioCtxRef.current) {
          nextStartTimeRef.current = audioCtxRef.current.currentTime;
        }
        if (msg.functionCall) {
          const fc = msg.functionCall as { id: string; name: string; args: Record<string, unknown> };
          handleFunctionCall(ws, fc.id, fc.name, fc.args);
        }
        if (msg.error) {
          setError(String(msg.error));
        }
      };

      ws.onclose = () => stopSession();
      ws.onerror = () => { setError('Erreur de connexion.'); stopSession(); };
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Impossible de démarrer'));
      stopSession();
    }
  };

  const playAudioChunk = (base64Audio: string) => {
    if (!audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const bytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 0x7fff;
      const buf = ctx.createBuffer(1, float32.length, 24000);
      buf.getChannelData(0).set(float32);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      const now = ctx.currentTime;
      if (nextStartTimeRef.current < now) nextStartTimeRef.current = now;
      src.start(nextStartTimeRef.current);
      nextStartTimeRef.current += buf.duration;
    } catch (e) {
      console.error('Audio playback error', e);
    }
  };

  const stopSession = () => {
    setIsRecording(false);
    setIsConnecting(false);
    processorRef.current?.disconnect();
    processorRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    micCtxRef.current?.close();
    micCtxRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
  };

  // Send text message via WebSocket
  const sendTextMessage = async () => {
    const safe = sanitizeTextInput(textInput);
    if (!safe) return;
    setIsSendingText(true);
    setTextInput('');

    try {
      // Ensure WS is open
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        await startSession();
        // Wait briefly for connection
        await new Promise(r => setTimeout(r, 600));
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ text: safe }));
      } else {
        setError('Connexion non disponible. Réessayez.');
      }
    } finally {
      setIsSendingText(false);
    }
  };

  const toggleAssistant = () => {
    if (!isOpen) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      stopSession();
      setError(null);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-80 overflow-hidden border border-ink/10 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 bg-soft-green/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                <span className="font-serif italic text-sm font-medium">Ava</span>
              </div>
              <div className="flex items-center gap-1">
                {/* Toggle voice / text mode */}
                <button
                  onClick={() => setTextMode(m => !m)}
                  aria-label={textMode ? 'Passer en mode vocal' : 'Passer en mode texte'}
                  title={textMode ? 'Mode vocal' : 'Mode texte'}
                  className="rounded-full p-1.5 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  {textMode ? <Mic className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                </button>
                <button
                  onClick={toggleAssistant}
                  aria-label="Fermer Ava"
                  className="rounded-full p-1.5 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Cart confirmation banner */}
              <AnimatePresence>
                {cartConfirmation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                    role="status"
                    aria-live="polite"
                  >
                    <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {cartConfirmation.quantity}× {cartConfirmation.productName} ajouté au panier
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Voice mode */}
              {!textMode && (
                <>
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-soft-green/50">
                      {isRecording && (
                        <motion.div
                          animate={{ scale: [1, 1.25, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute inset-0 rounded-full bg-accent/20"
                          aria-hidden="true"
                        />
                      )}
                      <Mic className={cn('h-6 w-6', isRecording ? 'text-accent' : 'text-ink/40')} />
                    </div>

                    {error ? (
                      <p className="text-center text-sm text-red-500" role="alert">{error}</p>
                    ) : isConnecting ? (
                      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/50">
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Connexion…
                      </p>
                    ) : isRecording ? (
                      <p className="text-center text-sm italic text-ink/60">Je vous écoute…</p>
                    ) : (
                      <p className="text-center text-sm italic text-ink/60">Appuyez pour parler à Ava.</p>
                    )}

                    <button
                      onClick={isRecording ? stopSession : startSession}
                      disabled={isConnecting}
                      className={cn(
                        'w-full border px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors',
                        isRecording
                          ? 'border-ink bg-white text-ink hover:bg-soft-green'
                          : 'border-ink bg-ink text-white hover:bg-ink/90',
                        isConnecting && 'cursor-not-allowed opacity-60'
                      )}
                    >
                      {isRecording ? "Terminer l'appel" : 'Activer la voix'}
                    </button>
                  </div>

                  {/* Quick suggestions */}
                  {!isRecording && !isConnecting && (
                    <div>
                      <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-ink/30">
                        Suggestions rapides
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_SUGGESTIONS.map(s => (
                          <button
                            key={s}
                            onClick={async () => {
                              if (!isRecording) await startSession();
                              setTimeout(() => {
                                wsRef.current?.send(JSON.stringify({ text: s }));
                              }, 700);
                            }}
                            className="rounded-full border border-ink/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink/60 transition-colors hover:border-ink/40 hover:text-ink"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fallback to text mode hint */}
                  {micDenied && (
                    <button
                      onClick={() => setTextMode(true)}
                      className="text-center text-xs text-ink/50 underline underline-offset-2 hover:text-ink transition-colors"
                    >
                      Utiliser le mode texte
                    </button>
                  )}
                </>
              )}

              {/* Text mode */}
              {textMode && (
                <div className="flex flex-col gap-3">
                  <p className="text-center text-sm italic text-ink/60">
                    Posez votre question à Ava par écrit.
                  </p>

                  {/* Quick suggestions in text mode */}
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => setTextInput(s)}
                        className="rounded-full border border-ink/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink/60 transition-colors hover:border-ink/40 hover:text-ink"
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {error && (
                    <p className="text-sm text-red-500" role="alert">{error}</p>
                  )}

                  <form
                    onSubmit={e => { e.preventDefault(); sendTextMessage(); }}
                    className="flex gap-2"
                  >
                    <input
                      ref={textInputRef}
                      type="text"
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      maxLength={MAX_TEXT_INPUT_LENGTH}
                      placeholder="Votre message…"
                      aria-label="Message pour Ava"
                      className="flex-1 border-b border-ink/20 bg-transparent py-2 text-sm text-ink placeholder:text-ink/30 outline-none focus:border-ink transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!textInput.trim() || isSendingText}
                      aria-label="Envoyer"
                      className="rounded-full bg-ink p-2 text-bg transition-colors hover:bg-ink/90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSendingText
                        ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        : <Send className="h-4 w-4" aria-hidden="true" />
                      }
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB toggle */}
      <button
        onClick={toggleAssistant}
        aria-label={isOpen ? 'Fermer Ava' : 'Ouvrir Ava, assistante vocale'}
        aria-expanded={isOpen}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full border shadow-lg transition-all',
          isOpen
            ? 'scale-90 rotate-45 border-ink/10 bg-soft-green text-ink'
            : 'border-ink bg-ink text-white hover:scale-105 hover:bg-ink/90'
        )}
      >
        <span className="font-serif italic text-xl" aria-hidden="true">V</span>
      </button>
    </div>
  );
}
