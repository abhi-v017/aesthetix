import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { makeApi } from "../lib/api.js";

export default function DietPlan() {
  const { getToken } = useAuth();
  const api = makeApi(getToken);
  const [diet, setDiet] = useState(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const d = await api.getLatestDiet();
    setDiet(d.dietPlan);
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h1 className="text-2xl sm:text-3xl font-display font-semibold flex items-center gap-2">🥗 Nutrition Protocol</h1>
        <button 
          onClick={handleGenerate} 
          disabled={busy} 
          className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg bg-sand text-coral font-bold text-sm shadow-neumorphic-sm hover:shadow-neumorphic-inner transition-all disabled:opacity-50"
        >
          {busy ? "⚙️ Generating..." : diet ? "🔄 Reroll Plan" : "⚡ Generate Plan"}
        </button>
      </div>
      <p className="text-textMuted text-xs sm:text-sm mb-6 sm:mb-8">AI-forged and science-backed macros tailored to your goal.</p>

      {!diet && (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl shadow-neumorphic bg-teal">
          <span className="text-4xl mb-4">🍗</span>
          <p className="text-sm text-textMuted px-4">No diet plan active. Generate your training protocol first.</p>
        </div>
      )}

      {diet && (
        <div className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
            <div className="p-4 sm:p-6 rounded-2xl shadow-neumorphic bg-teal flex flex-col items-center">
              <div className="text-textMuted mb-1 sm:mb-2 text-xs sm:text-sm">🔥 Target Calories</div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-textMain">{diet.dailyCalorieTarget} <span className="text-sm sm:text-lg text-textMuted font-normal">kcal</span></div>
            </div>
            <div className="p-4 sm:p-6 rounded-2xl shadow-neumorphic bg-teal flex flex-col items-center">
              <div className="text-textMuted mb-1 sm:mb-2 text-xs sm:text-sm">🥩 Target Protein</div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-textMain">{diet.dailyProteinTargetG} <span className="text-sm sm:text-lg text-textMuted font-normal">g</span></div>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl shadow-neumorphic bg-teal">
            <p className="text-xs sm:text-sm text-textMain italic border-l-4 border-coral pl-3 sm:pl-4">{diet.rationale}</p>
          </div>

          <div className="rounded-2xl shadow-neumorphic bg-teal overflow-hidden divide-y divide-line">
            {diet.meals?.map((meal, i) => (
              <div key={i} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-sand/30 transition-colors">
                <div>
                  <div className="text-sm sm:text-base font-bold text-coral mb-1">{meal.name}</div>
                  <div className="text-xs sm:text-sm text-textMuted leading-relaxed">{meal.items?.join(", ")}</div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 text-xs font-mono text-textMuted whitespace-nowrap">
                  <span className="bg-sand px-2 py-1 rounded shadow-neumorphic-sm">{meal.calories} kcal</span>
                  <span className="bg-sand px-2 py-1 rounded shadow-neumorphic-sm">{meal.protein}g</span>
                </div>
              </div>
            ))}
          </div>

          {diet.reminderTimes?.length > 0 && (
            <p className="text-[10px] sm:text-xs text-textMuted text-center">
              ⏰ Meal reminders set for {diet.reminderTimes.join(", ")}.
            </p>
          )}

          {diet.groundedOn?.length > 0 && (
            <p className="text-[10px] sm:text-xs text-textMuted mt-2 text-center opacity-50 hover:opacity-100 transition-opacity">
              🧬 Grounded on: {diet.groundedOn.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
