import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { makeApi } from "../lib/api.js";
import MacroRing from "../components/MacroRing.jsx";

export default function Dashboard() {
  const { getToken } = useAuth();
  const api = makeApi(getToken);
  const [plan, setPlan] = useState(null);
  const [diet, setDiet] = useState(null);
  const [today, setToday] = useState({ totals: { calories: 0, protein: 0 } });
  const [busy, setBusy] = useState(false);

  // Dummy data for streak calendar
  const todayDate = new Date();
  const streakDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - (6 - i));
    // Simulate some past workouts
    const workedOut = i === 1 || i === 3 || i === 5 || i === 6;
    return { day: d.toLocaleDateString("en-US", { weekday: "short" }), date: d.getDate(), workedOut };
  });

  async function refresh() {
    const [p, d, t] = await Promise.all([api.getLatestPlan(), api.getLatestDiet(), api.getTodayFood()]);
    setPlan(p.plan);
    setDiet(d.dietPlan);
    setToday(t);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleGeneratePlan() {
    setBusy(true);
    try {
      await api.generatePlan();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 overflow-x-hidden">
      <div className="flex items-center gap-3 mb-1 animate-bounce-slight">
        <h1 className="text-2xl sm:text-3xl font-display font-semibold">Today's Vibe 🚀</h1>
      </div>
      <p className="text-textMuted text-xs sm:text-sm mb-6 sm:mb-8">Stay hard, stay disciplined. Your goals don't care how you feel.</p>

      {/* Streak Calendar Section */}
      <section className="mb-6 sm:mb-10 p-4 sm:p-6 rounded-2xl shadow-neumorphic bg-teal">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-display font-semibold text-textMain">🔥 Weekly Streak</h2>
          <span className="text-coral font-bold text-xs sm:text-sm">4 Day Streak!</span>
        </div>
        <div className="flex justify-between items-center overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {streakDays.map((d, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 sm:gap-2 min-w-[3rem]">
              <span className="text-[10px] sm:text-xs text-textMuted">{d.day}</span>
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-neumorphic-sm transition-all duration-300 ${
                  d.workedOut ? "bg-coral text-ink shadow-none" : "bg-sand text-textMuted"
                }`}
              >
                {d.date}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-10">
        <MacroRing label="Calories" value={today.totals.calories} target={diet?.dailyCalorieTarget} unit="kcal" />
        <MacroRing label="Protein" value={today.totals.protein} target={diet?.dailyProteinTargetG} unit="g" />
      </div>

      <section className="mb-6 sm:mb-10 p-4 sm:p-6 rounded-2xl shadow-neumorphic bg-teal">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg sm:text-xl font-display font-semibold flex items-center gap-2">
            💪 Training Protocol
          </h2>
          <button
            onClick={handleGeneratePlan}
            disabled={busy}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg bg-sand text-coral font-bold text-sm shadow-neumorphic-sm hover:shadow-neumorphic-inner transition-all disabled:opacity-50"
          >
            {busy ? "⚙️ Forging Plan..." : plan ? "🔄 Reroll Plan" : "⚡ Generate Plan"}
          </button>
        </div>

        {!plan && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="text-4xl mb-4">🏋️‍♂️</span>
            <p className="text-sm text-textMuted">No protocol active. Time to forge your plan.</p>
          </div>
        )}

        {plan && (
          <div className="grid gap-4 sm:grid-cols-2">
            {plan.weeklySplit?.map((day, i) => (
              <div key={i} className="p-4 rounded-xl shadow-neumorphic-inner bg-sand">
                <div className="text-sm font-bold text-coral mb-2">
                  {day.day} <span className="text-textMuted font-normal">— {day.focus}</span>
                </div>
                <ul className="text-sm text-textMain mt-1 space-y-1">
                  {day.exercises?.map((ex, j) => (
                    <li key={j} className="flex flex-col sm:flex-row sm:justify-between border-b border-line pb-2 sm:pb-1 last:border-0 gap-1">
                      <span>{ex.name}</span>
                      <span className="text-textMuted font-mono text-xs">{ex.sets} x {ex.reps}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {plan && (
        <div className="p-4 rounded-xl shadow-neumorphic-sm bg-teal text-center">
          <p className="text-xs sm:text-sm text-textMuted">
            🔥 Maintenance: <span className="text-textMain font-mono">{plan.tdee}</span> kcal/day (BMR {plan.bmr} kcal). <br className="sm:hidden" />
            <span className="hidden sm:inline"> </span>🏃‍♂️ {plan.cardioRecommendation}
          </p>
        </div>
      )}
    </div>
  );
}
