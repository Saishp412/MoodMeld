"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, AlertCircle, Waves, Brain } from "lucide-react";

interface VoiceResult {
  detected_emotion: string;
  emotion_confidence: number;
  message: string;
  voice_features?: {
    pitch: number;
    energy: number;
    tempo: number;
  };
}

export type VoiceState = "idle" | "recording" | "processing" | "error";

interface VoiceRecorderProps {
  onResult: (result: VoiceResult) => void;
  onStateChange?: (state: VoiceState) => void;
  token: string;
  disabled?: boolean;
}

const EMOTION_COLORS: Record<string, string> = {
  happy: "#f59e0b", calm: "#06b6d4", sad: "#6366f1",
  anxious: "#f43f5e", stressed: "#ef4444", burned_out: "#78716c",
  fatigued: "#94a3b8", motivated: "#10b981",
};

const WAVEFORM_BARS = 32;

export function VoiceRecorder({ onResult, onStateChange, token, disabled = false }: VoiceRecorderProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastResult, setLastResult] = useState<VoiceResult | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(WAVEFORM_BARS).fill(0));
  const [analysisPhase, setAnalysisPhase] = useState(0);
  const [transcript, setTranscript] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          let fullTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript;
          }
          setTranscript(fullTranscript);
        };
        recognition.onerror = (e: any) => console.warn("SpeechRec error", e);
        recognition.onend = () => {
          // Restart if it stops abruptly while we still want to record
          if (recognitionRef.current && chunksRef.current.length > 0) {
            try { recognitionRef.current.start(); } catch (e) {}
          }
        };
        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Notify parent of state changes
  const updateState = useCallback((newState: VoiceState) => {
    setState(newState);
    onStateChange?.(newState);
  }, [onStateChange]);

  // Live waveform visualizer — captures frequency data for bar visualization
  const trackWaveform = useCallback(() => {
    if (!analyserRef.current) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Downsample to WAVEFORM_BARS bars
    const step = Math.floor(bufferLength / WAVEFORM_BARS);
    const bars: number[] = [];
    for (let i = 0; i < WAVEFORM_BARS; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += dataArray[i * step + j] || 0;
      }
      // Normalize 0-1 with some boost for low-amplitude speech
      bars.push(Math.min(1, (sum / step / 255) * 2.5));
    }
    setWaveformData(bars);
    animFrameRef.current = requestAnimationFrame(trackWaveform);
  }, []);

  const startRecording = useCallback(async () => {
    setErrorMsg("");
    setLastResult(null);
    setTranscript("");

    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 22050, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      // Set up analyser for waveform
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Pick best codec
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        updateState("processing");
        setWaveformData(new Array(WAVEFORM_BARS).fill(0));
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

        // Start analysis phase animation
        setAnalysisPhase(0);
        const phaseTimer = setInterval(() => {
          setAnalysisPhase(p => Math.min(p + 1, 3));
        }, 800);

        const blob = new Blob(chunksRef.current, { type: mimeType });

        if (blob.size < 5000) {
          clearInterval(phaseTimer);
          setErrorMsg("Recording too short — please speak for at least 2 seconds.");
          updateState("error");
          return;
        }

        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");
          // Send transcript if available so backend can use it for better context
          if (recognitionRef.current?.transcript || transcript) {
            formData.append("transcript", transcript);
          }

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/conversations/voice`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          clearInterval(phaseTimer);

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Server error ${res.status}`);
          }

          const data: VoiceResult = await res.json();
          setLastResult(data);
          onResult(data);
          updateState("idle");
        } catch (err: any) {
          clearInterval(phaseTimer);
          setErrorMsg(err.message || "Voice analysis failed. Try again.");
          updateState("error");
        }
      };

      recorder.start(100);
      updateState("recording");
      setDuration(0);
      trackWaveform();

      timerRef.current = setInterval(() => {
        setDuration(d => {
          if (d >= 30) { stopRecording(); return d; }
          return d + 1;
        });
      }, 1000);

    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setErrorMsg("Microphone permission denied. Please allow mic access in your browser.");
      } else if (err.name === "NotFoundError") {
        setErrorMsg("No microphone found. Please connect a microphone.");
      } else {
        setErrorMsg("Could not start recording: " + err.message);
      }
      updateState("error");
    }
  }, [token, onResult, trackWaveform, updateState]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
    }
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { stopRecording(); }, [stopRecording]);

  const handleMicClick = () => {
    if (disabled) return;
    if (state === "idle" || state === "error") startRecording();
  };

  const handleStopClick = () => {
    stopRecording();
  };

  const ANALYSIS_PHASES = [
    "Capturing audio features...",
    "Extracting pitch & energy...",
    "Analyzing emotional tone...",
    "Classifying mood...",
  ];

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ── Idle state: just the mic button ──
  if (state === "idle") {
    return (
      <div className="relative flex items-center">
        <button
          onClick={handleMicClick}
          disabled={disabled}
          aria-label="Start voice recording"
          className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/[0.06] flex items-center justify-center transition-all duration-200"
        >
          <Mic size={16} />
        </button>

        {/* Last result mini badge */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -4 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-2 -right-2 text-[8px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{
                background: `${EMOTION_COLORS[lastResult.detected_emotion] || "#8b5cf6"}25`,
                color: EMOTION_COLORS[lastResult.detected_emotion] || "#8b5cf6",
                border: `1px solid ${EMOTION_COLORS[lastResult.detected_emotion] || "#8b5cf6"}40`,
              }}
            >
              {lastResult.detected_emotion}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Error state: mic button with error tooltip ──
  if (state === "error") {
    return (
      <div className="relative flex items-center">
        <button
          onClick={handleMicClick}
          aria-label="Retry voice recording"
          className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 flex items-center justify-center transition-all duration-200"
        >
          <Mic size={16} />
        </button>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full mb-2 left-0 w-64 p-2.5 rounded-xl bg-[#1a1a24] border border-orange-500/20 shadow-xl shadow-black/30 z-50"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={12} className="text-orange-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-orange-400/80 leading-relaxed">{errorMsg}</p>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // ── Recording state: full inline waveform bar ──
  if (state === "recording") {
    return (
      <motion.div
        className="flex-1 flex items-center gap-3 px-4 py-2 rounded-xl bg-red-500/[0.06] border border-red-500/20 relative overflow-hidden"
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        style={{ transformOrigin: "left" }}
      >
        {/* Subtle scanning effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/[0.04] to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        {/* Recording indicator */}
        <div className="flex items-center gap-2 flex-shrink-0 z-10">
          <motion.div
            className="w-2 h-2 rounded-full bg-red-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span className="text-xs text-red-400/90 font-mono font-medium tracking-wider">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Live waveform bars or transcript */}
        <div className="flex-1 flex items-center justify-center gap-[2px] h-8 z-10 overflow-hidden">
          <AnimatePresence mode="wait">
            {transcript ? (
              <motion.span
                key="transcript"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm text-white/90 font-medium truncate w-full text-center tracking-wide"
              >
                {transcript}
              </motion.span>
            ) : (
              <motion.div
                key="waveform"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-[2px] h-full"
              >
                {waveformData.map((val, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] rounded-full bg-red-400/80"
                    animate={{
                      height: `${Math.max(3, val * 28)}px`,
                      opacity: 0.4 + val * 0.6,
                    }}
                    transition={{ duration: 0.06, ease: "easeOut" }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stop button */}
        <motion.button
          onClick={handleStopClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors flex-shrink-0 z-10"
          aria-label="Stop recording"
        >
          <Square size={14} fill="currentColor" />
        </motion.button>
      </motion.div>
    );
  }

  // ── Processing state: animated analysis progress bar ──
  if (state === "processing") {
    return (
      <motion.div
        className="flex-1 flex items-center gap-3 px-4 py-2 rounded-xl bg-violet-500/[0.06] border border-violet-500/20 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Scanning gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/[0.08] to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />

        {/* Brain icon with pulse */}
        <div className="relative flex-shrink-0 z-10">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Brain size={18} className="text-violet-400" />
          </motion.div>
          <motion.div
            className="absolute -inset-1 rounded-full bg-violet-500/20"
            animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>

        {/* Phase text and progress */}
        <div className="flex-1 z-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={analysisPhase}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-xs text-violet-400/90 font-medium"
            >
              {ANALYSIS_PHASES[Math.min(analysisPhase, ANALYSIS_PHASES.length - 1)]}
            </motion.p>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="h-1 mt-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
              initial={{ width: "5%" }}
              animate={{ width: `${Math.min(15 + analysisPhase * 25, 95)}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Spinning loader */}
        <Loader2 size={16} className="animate-spin text-violet-400/60 flex-shrink-0 z-10" />
      </motion.div>
    );
  }

  return null;
}
