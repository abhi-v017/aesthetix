import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { makeApi } from "../lib/api.js";

const portionChips = ["Single serving", "Large plate", "1 bowl", "2 slices", "Handful (~100g)"];

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
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
  }

  function handleReset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    setPortionHint("");
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
      setError(err.message || "Failed to analyze image. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal border border-line text-xs font-mono text-coral mb-2 shadow-neumorphic-sm">
          <span>EDGE VISION</span>
          <span>•</span>
          <span>TRANSFORMERS.JS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-textMain tracking-tight">
          📸 Meal Scanner
        </h1>
        <p className="text-textMuted text-xs sm:text-sm mt-1">
          Local Vision Transformer classifies the meal on-device; Gemini models portion density & macronutrients.
        </p>
      </div>

      <div className="card-neu p-5 sm:p-7 space-y-6">
        {/* Upload Dropzone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
            Upload Meal Photo
          </label>
          <div className="relative">
            <label className="block border-2 border-dashed border-line/70 rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 hover:border-coral/50 hover:bg-sand/40 well-neu group">
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              {preview ? (
                <div className="relative inline-block">
                  <img 
                    src={preview} 
                    alt="Selected food" 
                    className="max-h-56 sm:max-h-64 mx-auto rounded-xl shadow-neumorphic object-cover border border-line" 
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleReset();
                    }}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-coral text-ink font-bold text-xs flex items-center justify-center shadow-neumorphic hover:scale-110 transition-transform"
                    title="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-16 h-16 rounded-2xl bg-teal border border-line flex items-center justify-center text-3xl shadow-neumorphic-sm group-hover:scale-105 transition-transform">
                    📸
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-semibold text-textMain block">
                      Click to browse or snap a meal photo
                    </span>
                    <span className="text-xs text-textSubtle mt-1 block">
                      JPEG, PNG, WebP supported (up to 8MB)
                    </span>
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Portion Description Input & Chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-textMuted">
              Portion Description (Optional)
            </label>
            <span className="text-[10px] text-textSubtle">Helps calculate density</span>
          </div>

          <input
            placeholder="e.g. 'Large dinner plate with rice', '2 slices', '1 medium bowl'"
            value={portionHint}
            onChange={(e) => setPortionHint(e.target.value)}
            className="input mb-2.5"
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-textSubtle mr-1">Quick presets:</span>
            {portionChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setPortionHint(chip)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  portionHint === chip
                    ? "bg-sand border-coral text-coral shadow-neumorphic-inner font-semibold"
                    : "bg-teal/80 border-line text-textMuted hover:text-textMain hover:border-lineLight shadow-neumorphic-xs"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleAnalyze}
          disabled={!file || busy}
          className="btn-coral w-full !py-3.5 !text-sm"
        >
          {busy ? (
            <>
              <span className="animate-spin text-base">⚙️</span>
              <span>Running Local Vision Transformer & AI...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Classify & Estimate Macros</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-3.5 rounded-xl bg-coral/10 border border-coral/30 text-coral text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Analysis Result Card */}
        {result && (
          <div className="well-neu p-5 sm:p-6 mt-6 border-line animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-line/60">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-textSubtle block">
                  Vision Identification
                </span>
                <h3 className="text-xl font-display font-extrabold capitalize text-coral">
                  {result.estimate.food.replace(/_/g, " ")}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-teal border border-line text-textMuted font-semibold">
                  ~{result.estimate.estimatedGrams}g portion
                </span>
                <span className={`text-[10px] font-mono px-2 py-1 rounded-md uppercase font-bold border ${
                  result.estimate.confidence === "high"
                    ? "bg-emerald/10 text-emerald border-emerald/30"
                    : "bg-amber/10 text-amber border-amber/30"
                }`}>
                  {result.estimate.confidence} Confidence
                </span>
              </div>
            </div>

            {/* Macronutrient Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
              <StatCard label="Calories" value={result.estimate.calories} unit="kcal" color="coral" />
              <StatCard label="Protein" value={result.estimate.protein} unit="g" color="sage" />
              <StatCard label="Carbs" value={result.estimate.carbs} unit="g" color="amber" />
              <StatCard label="Fat" value={result.estimate.fat} unit="g" color="emerald" />
            </div>

            {/* AI Estimation Note */}
            {result.estimate.note && (
              <div className="p-3 rounded-xl bg-teal/60 border border-line/50 text-xs text-textMuted leading-relaxed italic mb-4">
                "{result.estimate.note}"
              </div>
            )}

            {/* Alternates list */}
            {result.classifications?.length > 1 && (
              <div className="text-[11px] text-textSubtle mb-4">
                <span>Model candidate classifications: </span>
                <span className="text-textMuted font-mono">
                  {result.classifications.map((c) => `${c.label} (${(c.score * 100).toFixed(0)}%)`).join(" • ")}
                </span>
              </div>
            )}

            {/* Added to log notification & Dashboard Link */}
            <div className="pt-3 border-t border-line/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-emerald font-semibold flex items-center gap-1.5">
                <span>✓</span> Logged to your daily totals and personal RAG history!
              </span>
              <Link to="/dashboard" className="btn-neu !py-1.5 !px-3 !text-xs text-coral">
                View on Dashboard →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, color }) {
  const colorMap = {
    coral: "text-coral",
    sage: "text-sage",
    amber: "text-amber",
    emerald: "text-emerald",
  };

  return (
    <div className="bg-sand p-3 rounded-xl border border-line/60 shadow-neumorphic-inner flex flex-col items-center justify-center min-h-[4.5rem]">
      <div className={`font-display font-extrabold text-lg sm:text-xl ${colorMap[color] || "text-textMain"}`}>
        {value} <span className="text-[10px] text-textMuted font-mono font-normal">{unit}</span>
      </div>
      <div className="text-[9px] uppercase tracking-wider font-semibold text-textSubtle mt-0.5">
        {label}
      </div>
    </div>
  );
}
