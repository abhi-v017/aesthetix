import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { makeApi } from "../lib/api.js";

export default function FoodScanner() {
  const { getToken } = useAuth();
  const api = makeApi(getToken);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [portionHint, setPortionHint] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  }

  async function handleAnalyze() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("portionHint", portionHint);
      const res = await api.analyzeFood(formData);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-display font-semibold mb-1 flex items-center gap-2">📸 Scan a meal</h1>
      <p className="text-textMuted text-xs sm:text-sm mb-6 sm:mb-8">
        Local vision model + AI to estimate your macros instantly.
      </p>

      <label className="block border-2 border-dashed border-line rounded-2xl p-4 sm:p-6 text-center cursor-pointer mb-6 hover:bg-sand/30 transition-colors shadow-neumorphic-inner bg-teal">
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        {preview ? (
          <img src={preview} alt="Selected food" className="max-h-48 sm:max-h-56 mx-auto rounded-xl shadow-neumorphic-sm object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="text-4xl">🍎</span>
            <span className="text-xs sm:text-sm text-textMuted">Tap to upload a food photo</span>
          </div>
        )}
      </label>

      <input
        placeholder="Portion (e.g. 'large plate', '1 bowl', '2 slices')"
        value={portionHint}
        onChange={(e) => setPortionHint(e.target.value)}
        className="input mb-6 text-sm"
      />

      <button
        onClick={handleAnalyze}
        disabled={!file || busy}
        className="w-full bg-coral text-ink rounded-xl px-4 py-3 text-sm sm:text-base font-bold shadow-neumorphic hover:shadow-neumorphic-inner transition-all disabled:opacity-50"
      >
        {busy ? "🔍 Analyzing..." : "⚡ Analyze"}
      </button>

      {error && <p className="text-sm text-coral mt-4">{error}</p>}

      {result && (
        <div className="mt-8 rounded-2xl shadow-neumorphic bg-teal p-4 sm:p-6">
          <div className="text-lg sm:text-xl font-display font-semibold mb-1 capitalize text-coral">{result.estimate.food.replace(/_/g, " ")}</div>
          <div className="text-xs sm:text-sm text-textMuted mb-6">~{result.estimate.estimatedGrams}g · Confidence: {result.estimate.confidence}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center text-sm mb-4">
            <Stat label="kcal" value={result.estimate.calories} />
            <Stat label="protein" value={`${result.estimate.protein}g`} />
            <Stat label="carbs" value={`${result.estimate.carbs}g`} />
            <Stat label="fat" value={`${result.estimate.fat}g`} />
          </div>
          <p className="text-[10px] sm:text-xs text-textMuted mt-4 italic leading-relaxed">"{result.estimate.note}"</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-sand p-2 rounded-lg shadow-neumorphic-sm flex flex-col items-center justify-center min-h-[4rem]">
      <div className="font-display font-bold text-textMain text-sm sm:text-base">{value}</div>
      <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-textMuted mt-1">{label}</div>
    </div>
  );
}
