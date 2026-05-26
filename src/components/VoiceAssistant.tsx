import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);

  // Quick hide on screen route
  if (window.location.pathname === '/screen') return null;

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const wsUrl = `ws://${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      nextStartTimeRef.current = audioCtx.currentTime;

      ws.onopen = async () => {
        setIsConnecting(false);
        setIsRecording(true);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;
          
          source.connect(processor);
          processor.connect(audioCtx.destination);

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
              ws.send(JSON.stringify({ audio: base64 }));
            }
          };
        } catch (err) {
          setError("Microphone access denied.");
          stopSession();
        }
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.audio) {
          playAudioChunk(msg.audio);
        }
        if (msg.interrupted) {
          // Clear audio queue
          if (audioCtxRef.current) {
            nextStartTimeRef.current = audioCtxRef.current.currentTime;
          }
        }
      };

      ws.onclose = () => {
        stopSession();
      };
      
      ws.onerror = () => {
        setError("Connection error");
        stopSession();
      }

    } catch (err: any) {
      setError(err.message || "Failed to start");
      stopSession();
    }
  };

  const playAudioChunk = (base64Audio: string) => {
    if (!audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const binaryStr = atob(base64Audio);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 0x7FFF;
      }
      const audioBuffer = ctx.createBuffer(1, float32Array.length, 16000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
    } catch (e) {
      console.error("Audio playback error", e);
    }
  };

  const stopSession = () => {
    setIsRecording(false);
    setIsConnecting(false);
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const toggleAssistant = () => {
    if (!isOpen) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      stopSession();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-80 bg-white shadow-xl border border-ink/10 overflow-hidden"
          >
            <div className="p-4 border-b border-ink/10 bg-soft-green/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="font-serif italic font-medium text-sm">Ava</span>
              </div>
            </div>
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-soft-green/50 border border-accent/30 flex items-center justify-center relative">
                {isRecording && (
                    <motion.div 
                      key="indicator"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 bg-accent/20 rounded-full"
                    />
                )}
                <Mic className={cn("w-6 h-6", isRecording ? "text-accent" : "text-ink/40")} />
              </div>

              {error ? (
                <p className="text-red-500 text-sm">{error}</p>
              ) : isConnecting ? (
                <p className="text-ink/50 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin"/> Connexion...
                </p>
              ) : isRecording ? (
                <p className="text-ink/60 text-sm italic">Je vous écoute. Cherchez-vous plutôt du fruité ou du chocolaté ?</p>
              ) : (
                <p className="text-ink/60 text-sm italic">Appuyez pour parler à Ava.</p>
              )}

              <button 
                onClick={isRecording ? stopSession : startSession}
                className={cn(
                  "mt-2 px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors w-full border",
                  isRecording 
                    ? "bg-white border-ink text-ink hover:bg-soft-green" 
                    : "bg-ink border-ink text-white hover:bg-ink/90"
                )}
              >
                {isRecording ? "Terminer l'appel" : "Activer la voix"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={toggleAssistant}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all border",
          isOpen ? "bg-soft-green border-ink/10 text-ink rotate-45 scale-90" : "bg-ink border-ink text-white hover:bg-ink/90 hover:scale-105"
        )}
      >
        <span className="font-serif italic text-xl">V</span>
      </button>
    </div>
  );
}
