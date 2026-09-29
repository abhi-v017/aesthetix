import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { makeApi } from "../lib/api.js";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function Coach() {
  const { getToken } = useAuth();
  const api = makeApi(getToken);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Ask me anything about your plan, nutrition, or progress — by text or voice." },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send(text) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await api.askCoach(text);
      setMessages((m) => [...m, { role: "assistant", text: res.answer, sources: res.sources }]);
      speak(res.answer);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: `Sorry — ${err.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    window.speechSynthesis.speak(utterance);
  }

  function toggleListening() {
    if (!SpeechRecognition) {
      alert("Voice input isn't supported in this browser — try Chrome, or type your question instead.");
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
      const transcript = e.results[0][0].transcript;
      send(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)]">
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-2 mb-1 text-textMain">🤖 AI Coach</h1>
        <p className="text-textMuted text-xs sm:text-sm">
          Grounded in nutrition science and your personal RAG history. No BS.
        </p>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-teal rounded-2xl shadow-neumorphic-inner p-4 sm:p-6 flex flex-col gap-4 mb-4 scrollbar-hide"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${m.role === "user" ? "self-end items-end" : "self-start items-start"}`}>
            <div 
              className={`text-sm sm:text-base rounded-2xl px-4 py-3 leading-relaxed shadow-neumorphic-sm ${
                m.role === "user" ? "bg-coral text-ink rounded-br-none" : "bg-sand text-textMain rounded-bl-none border border-line"
              }`}
            >
              {m.text}
            </div>
            {m.sources && (m.sources.knowledgeBase?.length > 0 || m.sources.personalHistory?.length > 0) && (
              <div className="text-[10px] text-textMuted mt-2 px-2 italic opacity-60 hover:opacity-100 transition-opacity">
                {m.sources.knowledgeBase?.length > 0 && <>Sources: {m.sources.knowledgeBase.join(", ")}</>}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="self-start max-w-[80%]">
            <div className="text-sm rounded-2xl px-4 py-3 bg-sand text-textMuted rounded-bl-none border border-line shadow-neumorphic-sm flex gap-2">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce" style={{animationDelay: "0.2s"}}>●</span>
              <span className="animate-bounce" style={{animationDelay: "0.4s"}}>●</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 sm:gap-3 items-end">
        <button
          onClick={toggleListening}
          className={`shrink-0 rounded-xl w-12 h-12 flex items-center justify-center text-xl shadow-neumorphic transition-all ${
            listening ? "bg-coral text-ink animate-pulse" : "bg-sand text-textMain hover:shadow-neumorphic-inner"
          }`}
          title="Speak your question"
        >
          🎤
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Type or tap the mic..."
          className="input flex-1 h-12 text-sm sm:text-base bg-sand border-line rounded-xl shadow-neumorphic-inner px-4 text-textMain placeholder-textMuted"
        />
        <button 
          onClick={() => send(input)} 
          disabled={busy || !input.trim()} 
          className="shrink-0 h-12 px-4 sm:px-6 bg-coral text-ink rounded-xl font-bold text-sm shadow-neumorphic transition-all disabled:opacity-50 hover:shadow-neumorphic-inner"
        >
          Send
        </button>
      </div>
    </div>
  );
}
