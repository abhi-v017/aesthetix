import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { makeApi } from "../lib/api.js";

const SpeechRecognition = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

const promptChips = [
  "How is my protein intake today?",
  "What should I eat post-workout?",
  "Explain my 4-day resistance split",
  "How much water should I drink on a cut?"
];

export default function Coach() {
  const { getToken } = useAuth();
  const api = makeApi(getToken);
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      text: "I am your AESTHETIX AI Coach. I synthesize sports nutrition literature and your logged workout/meal history. Ask me anything via voice or text." 
    },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, busy]);

  async function send(text) {
    if (!text.trim() || busy) return;
    const userText = text.trim();
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setInput("");
    setBusy(true);

    try {
      const res = await api.askCoach(userText);
      setMessages((m) => [...m, { role: "assistant", text: res.answer, sources: res.sources }]);
      if (ttsEnabled) {
        speak(res.answer);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: `Sorry — ${err.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  function speak(text) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    window.speechSynthesis.speak(utterance);
  }

  function toggleListening() {
    if (!SpeechRecognition) {
      alert("Voice input isn't supported in this browser — try Chrome, or type your question.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (transcript) send(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col h-[calc(100dvh-95px)] sm:h-[calc(100dvh-115px)]">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-line/60 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-textMain tracking-tight">
              🤖 Conversational AI Coach
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sand border border-line text-coral font-semibold">
              RAG 2.0
            </span>
          </div>
          <p className="text-textMuted text-xs mt-0.5">
            Real-time personalized coaching backed by dual-corpus retrieval.
          </p>
        </div>

        {/* Audio Mute/Unmute Toggle */}
        <button
          onClick={() => {
            if (ttsEnabled && typeof window !== "undefined" && window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            setTtsEnabled(!ttsEnabled);
          }}
          className={`btn-inset !p-2 !rounded-xl text-xs flex items-center gap-1.5 ${
            ttsEnabled ? "text-coral border-coral/40" : "text-textSubtle"
          }`}
          title={ttsEnabled ? "Speech response enabled (Click to mute)" : "Speech response muted (Click to unmute)"}
        >
          <span>{ttsEnabled ? "🔊" : "🔇"}</span>
          <span className="hidden sm:inline font-mono">{ttsEnabled ? "Voice On" : "Muted"}</span>
        </button>
      </div>

      {/* Chat Messages Log Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto card-neu p-4 sm:p-6 flex flex-col gap-4 mb-3 custom-scrollbar"
      >
        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`flex flex-col max-w-[90%] sm:max-w-[80%] ${
              m.role === "user" ? "self-end items-end" : "self-start items-start"
            }`}
          >
            {/* Sender Tag */}
            <span className="text-[10px] font-mono text-textSubtle mb-1 px-1">
              {m.role === "user" ? "You" : "AESTHETIX COACH"}
            </span>

            {/* Bubble */}
            <div 
              className={`text-xs sm:text-sm rounded-2xl px-4 py-3 leading-relaxed transition-all ${
                m.role === "user" 
                  ? "bg-coral text-ink font-medium rounded-br-none shadow-neumorphic-coral" 
                  : "well-neu text-textMain rounded-bl-none shadow-neumorphic-inner border border-line/60"
              }`}
            >
              {m.text}
            </div>

            {/* Cited Sources (Dual-Corpus RAG Display) */}
            {m.sources && (
              <div className="mt-2 flex flex-col gap-1 text-[10px] font-mono px-1">
                {m.sources.knowledgeBase?.length > 0 && (
                  <div className="flex items-center gap-1.5 text-textMuted">
                    <span className="text-coral">🧬 Science KB:</span>
                    <span className="truncate">{m.sources.knowledgeBase.join(", ")}</span>
                  </div>
                )}
                {m.sources.personalHistory?.length > 0 && (
                  <div className="flex items-center gap-1.5 text-textSubtle">
                    <span className="text-sage">👤 History Logs:</span>
                    <span className="truncate">{m.sources.personalHistory.join(", ")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="self-start max-w-[80%]">
            <span className="text-[10px] font-mono text-textSubtle mb-1 block px-1">
              AESTHETIX COACH
            </span>
            <div className="well-neu text-xs rounded-2xl px-4 py-3 text-textMuted rounded-bl-none flex items-center gap-2 border border-line">
              <span className="w-2 h-2 rounded-full bg-coral animate-ping" />
              <span>Querying sports KB & your history logs...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompt Suggestions (visible when chat history is small) */}
      {messages.length <= 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide shrink-0">
          <span className="text-[10px] font-mono text-textSubtle uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => send(chip)}
              className="btn-inset !text-[11px] whitespace-nowrap !py-1 !px-2.5 hover:!text-coral hover:!border-coral/40"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input Action Bar */}
      <div className="flex gap-2 sm:gap-3 items-center shrink-0">
        <button
          onClick={toggleListening}
          className={`shrink-0 rounded-xl w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl border transition-all duration-300 ${
            listening 
              ? "bg-coral text-ink border-coral shadow-neumorphic-coral animate-pulse" 
              : "bg-teal border-line text-textMain shadow-neumorphic-sm hover:text-coral hover:shadow-neumorphic-inner active:scale-95"
          }`}
          title={listening ? "Listening... (Tap to stop)" : "Tap to speak question"}
        >
          {listening ? "🛑" : "🎤"}
        </button>

        <div className="relative flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder={listening ? "Listening to your voice..." : "Ask your coach about meals, reps, macros..."}
            className="input !h-11 sm:!h-12 !text-xs sm:!text-sm pr-10"
          />
          {input && (
            <button
              onClick={() => setInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-textSubtle hover:text-textMain text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <button 
          onClick={() => send(input)} 
          disabled={busy || !input.trim()} 
          className="btn-coral shrink-0 !h-11 sm:!h-12 !px-4 sm:!px-6 !text-xs sm:!text-sm"
        >
          <span>Send</span>
          <span className="hidden sm:inline">→</span>
        </button>
      </div>
    </div>
  );
}
