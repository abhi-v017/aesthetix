import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { makeApi } from "../lib/api.js";

const mealIcons = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🥩",
  snack: "🍎",
  "pre-workout": "⚡",
  "post-workout": "🥤",
};

export default function DietPlan() {
  const { getToken } = useAuth();
  const api = makeApi(getToken);
  const [diet, setDiet] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const d = await api.getLatestDiet();
      setDiet(d?.dietPlan || null);
    } catch {
      setDiet(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleGenerate() {
    setBusy(true);
    try {
      await api.generateDiet();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function getMealIcon(name = "") {
    const lower = name.toLowerCase();
    for (const [key, icon] of Object.entries(mealIcons)) {
      if (lower.includes(key)) return icon;
    }
    return "🍽️";
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-line/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal border border-line text-xs font-mono text-coral mb-2 shadow-neumorphic-sm">
            <span>RAG GROUNDED</span>
            <span>•</span>
            <span>EVIDENCE BASED</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-textMain tracking-tight">
            🥗 Nutrition Protocol
          </h1>
          <p className="text-textMuted text-xs sm:text-sm mt-1">
            Grounded in peer-reviewed sports nutrition and calibrated to your active resistance split.
          </p>
        </div>

        <button 
          onClick={handleGenerate} 
          disabled={busy} 
          className="btn-neu sm:self-center !text-coral !border-coral/30 hover:!border-coral"
        >
          {busy ? (
            <>
              <span className="animate-spin">⚙️</span>
              <span>Synthesizing...</span>
            </>
          ) : diet ? (
            <>
              <span>🔄</span>
              <span>Reroll Protocol</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Generate Protocol</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-textMuted">
          <span className="animate-spin text-2xl mb-2">⚙️</span>
          <span className="text-xs">Loading nutrition protocol...</span>
        </div>
      ) : !diet ? (
        <div className="card-neu py-14 px-6 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-sand border border-line flex items-center justify-center text-3xl shadow-neumorphic-inner mb-4">
            🍗
          </div>
          <h2 className="text-lg font-display font-bold text-textMain mb-1">
            No Active Diet Protocol
          </h2>
          <p className="text-xs sm:text-sm text-textMuted max-w-md mb-6 leading-relaxed">
            Generate your personalized meal strategy tailored to your physiological metabolic needs and training frequency.
          </p>
          <button onClick={handleGenerate} disabled={busy} className="btn-coral">
            ⚡ Forge 1-Day Protocol
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Daily Calorie & Protein Targets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="card-neu p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sand border border-line flex items-center justify-center text-xl shadow-neumorphic-inner text-coral shrink-0">
                🔥
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-textMuted block">
                  Daily Caloric Target
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-display font-extrabold text-textMain tracking-tight">
                    {diet.dailyCalorieTarget}
                  </span>
                  <span className="text-xs text-textMuted font-mono">kcal / day</span>
                </div>
              </div>
            </div>

            <div className="card-neu p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sand border border-line flex items-center justify-center text-xl shadow-neumorphic-inner text-sage shrink-0">
                🥩
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-textMuted block">
                  Daily Protein Target
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-display font-extrabold text-textMain tracking-tight">
                    {diet.dailyProteinTargetG}
                  </span>
                  <span className="text-xs text-textMuted font-mono">grams / day</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Rationale Card */}
          {diet.rationale && (
            <div className="card-neu p-5 sm:p-6 border-l-4 !border-l-coral">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-coral">
                  Scientific Rationale
                </span>
              </div>
              <p className="text-xs sm:text-sm text-textMain leading-relaxed italic">
                "{diet.rationale}"
              </p>
            </div>
          )}

          {/* Meals Breakdown List */}
          <div className="card-neu p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-line/60">
              <h2 className="text-base sm:text-lg font-display font-bold text-textMain flex items-center gap-2">
                <span>🍽️</span>
                <span>Structured Meal Breakdown</span>
              </h2>
              <span className="text-xs font-mono text-textSubtle">
                {diet.meals?.length || 0} meals planned
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {diet.meals?.map((meal, i) => (
                <div 
                  key={i} 
                  className="well-neu p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-line transition-all duration-200"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-teal border border-line flex items-center justify-center text-lg shadow-neumorphic-sm shrink-0 mt-0.5">
                      {getMealIcon(meal.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-display font-bold text-coral">
                          {meal.name}
                        </span>
                        {diet.reminderTimes?.[i] && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sand border border-line text-textSubtle">
                            ⏰ {diet.reminderTimes[i]}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {meal.items?.map((item, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center text-xs px-2.5 py-1 rounded-lg bg-teal/80 border border-line/60 text-textMuted"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-line/40 shrink-0">
                    <span className="px-3 py-1 rounded-lg bg-sand border border-line/70 font-mono text-xs font-bold text-coral shadow-neumorphic-inner">
                      {meal.calories} kcal
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-sand border border-line/70 font-mono text-xs font-bold text-sage shadow-neumorphic-inner">
                      {meal.protein}g protein
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RAG Citations & Reminders Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {diet.reminderTimes?.length > 0 && (
              <div className="well-neu p-4 flex items-center gap-3">
                <span className="text-xl">⏰</span>
                <div className="text-xs">
                  <span className="font-semibold text-textMain block">Automated Meal Reminders</span>
                  <span className="text-textSubtle font-mono">{diet.reminderTimes.join(" • ")}</span>
                </div>
              </div>
            )}

            {diet.groundedOn?.length > 0 && (
              <div className="well-neu p-4 flex items-center gap-3">
                <span className="text-xl">🧬</span>
                <div className="text-xs">
                  <span className="font-semibold text-textMain block">Science RAG Sources</span>
                  <span className="text-textSubtle truncate block" title={diet.groundedOn.join(", ")}>
                    {diet.groundedOn.join(" • ")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
