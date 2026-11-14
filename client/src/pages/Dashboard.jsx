import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { makeApi } from "../lib/api.js";
import MacroRing from "../components/MacroRing.jsx";

export default function Dashboard() {
  const { user, getToken } = useAuth();
  const api = makeApi(getToken);
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [diet, setDiet] = useState(null);
  const [today, setToday] = useState({ totals: { calories: 0, protein: 0 }, logs: [] });
  const [completedDates, setCompletedDates] = useState([]);
  const [streakCount, setStreakCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dynamic 7-day streak calendar ending today
  const todayDate = new Date();
  const formatYMD = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatYMD(todayDate);

  function computeLocalStreak(dates = [], refStr = todayStr) {
    if (!dates.length) return 0;
    const dateSet = new Set(dates);
    const ref = new Date(refStr);

    const getOffsetDate = (offset) => {
      const d = new Date(ref);
      d.setDate(d.getDate() - offset);
      return formatYMD(d);
    };

    let streak = 0;
    let offset = 0;

    // If today is not checked, check if yesterday was checked
    if (!dateSet.has(getOffsetDate(0))) {
      if (!dateSet.has(getOffsetDate(1))) {
        return 0;
      }
      offset = 1;
    }

    while (dateSet.has(getOffsetDate(offset))) {
      streak++;
      offset++;
    }

    return streak;
  }

  const streakDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = formatYMD(d);
    const isToday = dateStr === todayStr;
    const workedOut = completedDates.includes(dateStr);
    return {
      dateStr,
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dateNum: d.getDate(),
      isToday,
      workedOut
    };
  });

  async function handleToggleDate(dateStr) {
    // Optimistic UI update
    const alreadyCompleted = completedDates.includes(dateStr);
    const nextDates = alreadyCompleted
      ? completedDates.filter((d) => d !== dateStr)
      : [...completedDates, dateStr];

    setCompletedDates(nextDates);
    setStreakCount(computeLocalStreak(nextDates, todayStr));

    try {
      const res = await api.toggleStreak(dateStr);
      if (res?.completedDates) {
        setCompletedDates(res.completedDates);
        setStreakCount(res.streak);
      }
    } catch (err) {
      console.error("Streak update error:", err);
      // Revert on error
      setCompletedDates(completedDates);
      setStreakCount(computeLocalStreak(completedDates, todayStr));
    }
  }

  async function refresh() {
    try {
      const [u, p, d, t] = await Promise.all([
        api.getProfile().catch(() => ({ profile: null })),
        api.getLatestPlan().catch(() => ({ plan: null })),
        api.getLatestDiet().catch(() => ({ dietPlan: null })),
        api.getTodayFood().catch(() => ({ totals: { calories: 0, protein: 0 }, logs: [] })),
      ]);
      if (u?.profile) setProfile(u.profile);
      if (u?.completedDates) {
        setCompletedDates(u.completedDates);
        setStreakCount(u.streak || computeLocalStreak(u.completedDates));
      }
      setPlan(p?.plan || null);
      setDiet(d?.dietPlan || null);
      setToday(t || { totals: { calories: 0, protein: 0 }, logs: [] });
    } finally {
      setLoading(false);
    }
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Top Header & Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal border border-line text-xs font-mono text-coral mb-2 shadow-neumorphic-sm">
            <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span className="font-semibold uppercase tracking-wider">
              {profile?.goal ? profile.goal.replace(/_/g, " ") : "Protocol Active"}
            </span>
            <span>•</span>
            <span className="text-textSubtle">{user?.email?.split("@")[0]}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-textMain tracking-tight">
            Daily Execution 🚀
          </h1>
          <p className="text-textMuted text-xs sm:text-sm mt-1">
            Consistency is the algorithm. Track your intake, hit your numbers, execute the split.
          </p>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
          <Link to="/scan" className="btn-neu !py-2 !px-3.5 !text-xs whitespace-nowrap">
            <span>📸</span>
            <span>Log Meal</span>
          </Link>
          <Link to="/coach" className="btn-neu !py-2 !px-3.5 !text-xs whitespace-nowrap">
            <span>🤖</span>
            <span>Ask Coach</span>
          </Link>
          <Link to="/diet" className="btn-neu !py-2 !px-3.5 !text-xs whitespace-nowrap">
            <span>🥗</span>
            <span>Diet Plan</span>
          </Link>
        </div>
      </div>

      {/* Weekly Consistency Streak Card */}
      <section className="card-neu p-5 sm:p-6 mb-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sand border border-line flex items-center justify-center text-sm shadow-neumorphic-inner">
              🔥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-display font-bold text-textMain">Weekly Momentum</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sand border border-line text-textSubtle">
                  Interactive
                </span>
              </div>
              <p className="text-[11px] text-textSubtle">Tap any day to toggle workout completion & track consistency</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => handleToggleDate(todayStr)}
              className={`btn-inset !text-xs !py-1.5 !px-3 transition-all ${
                completedDates.includes(todayStr)
                  ? "text-emerald border-emerald/30 font-bold"
                  : "text-coral border-coral/30 hover:border-coral font-bold"
              }`}
            >
              {completedDates.includes(todayStr) ? "✓ Today Completed" : "⚡ Check In Today"}
            </button>
            <span className="px-2.5 py-1.5 rounded-xl bg-coral/10 border border-coral/30 text-coral font-mono font-bold text-xs whitespace-nowrap">
              🔥 {streakCount} {streakCount === 1 ? "Day" : "Days"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-1">
          {streakDays.map((d, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleToggleDate(d.dateStr)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 group cursor-pointer active:scale-95 ${
                d.isToday 
                  ? "bg-sand border-2 border-coral/60 shadow-neumorphic-inner" 
                  : "bg-sand/40 border border-line/40 hover:bg-sand/80 hover:border-line"
              }`}
              title={`Click to toggle ${d.isToday ? "Today" : d.dayName} (${d.dateStr})`}
            >
              <span className={`text-[10px] sm:text-xs font-semibold ${d.isToday ? "text-coral font-bold" : "text-textSubtle group-hover:text-textMain"}`}>
                {d.isToday ? "Today" : d.dayName}
              </span>
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm font-display transition-all duration-300 ${
                  d.workedOut
                    ? "bg-coral text-ink shadow-neumorphic-coral scale-105"
                    : "bg-teal text-textMuted border border-line shadow-neumorphic-xs group-hover:text-coral group-hover:border-coral/40"
                }`}
              >
                {d.workedOut ? "✓" : d.dateNum}
              </div>
              <span className={`text-[9px] font-mono transition-colors ${d.workedOut ? "text-coral font-bold" : "text-textSubtle"}`}>
                {d.workedOut ? "Done" : "Rest"}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-3.5 pt-2.5 border-t border-line/40 flex items-center justify-between text-[11px] text-textSubtle">
          <span>💡 Tap a date tile to mark workouts or rest days</span>
          <span className="font-mono">
            {completedDates.includes(todayStr) ? "🎉 Today logged" : "⏳ Today pending"}
          </span>
        </div>
      </section>

      {/* Macronutrient Tracking Rings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <MacroRing 
          label="Calories Consumed" 
          value={today.totals.calories} 
          target={diet?.dailyCalorieTarget} 
          unit="kcal" 
          color="coral"
        />
        <MacroRing 
          label="Protein Consumed" 
          value={today.totals.protein} 
          target={diet?.dailyProteinTargetG} 
          unit="g" 
          color="sage"
        />
      </div>

      {/* Training Protocol Section */}
      <section className="card-neu p-5 sm:p-7 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-line/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-display font-extrabold text-textMain">
                💪 Resistance Split
              </h2>
              {plan && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sand border border-line text-textMuted">
                  4 Days / Week
                </span>
              )}
            </div>
            <p className="text-xs text-textMuted mt-1">
              Physiologically tailored progressive overload protocol
            </p>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={busy}
            className="btn-neu sm:self-center !text-coral !border-coral/30 hover:!border-coral"
          >
            {busy ? (
              <>
                <span className="animate-spin">⚙️</span>
                <span>Synthesizing...</span>
              </>
            ) : plan ? (
              <>
                <span>🔄</span>
                <span>Reroll Split</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Forge Protocol</span>
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-textMuted">
            <span className="animate-spin text-2xl mb-2">⚙️</span>
            <span className="text-xs">Loading training telemetry...</span>
          </div>
        ) : !plan ? (
          <div className="well-neu py-12 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal border border-line flex items-center justify-center text-2xl shadow-neumorphic-sm mb-3">
              🏋️‍♂️
            </div>
            <h3 className="text-base font-display font-bold text-textMain mb-1">
              No Protocol Generated Yet
            </h3>
            <p className="text-xs text-textMuted max-w-sm mb-4">
              Click the button above to generate a custom 4-day progressive overload split based on your BMR & TDEE.
            </p>
            <button onClick={handleGeneratePlan} disabled={busy} className="btn-coral">
              ⚡ Forge 4-Day Plan
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {plan.summary && (
              <div className="p-3.5 rounded-xl bg-sand/60 border border-line/60 text-xs sm:text-sm text-textMuted leading-relaxed italic">
                "{plan.summary}"
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.weeklySplit?.map((day, i) => (
                <div 
                  key={i} 
                  className="well-neu p-4 sm:p-5 flex flex-col justify-between hover:border-line transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2 mb-3 pb-2.5 border-b border-line/50">
                    <div>
                      <span className="text-xs font-mono font-bold text-coral uppercase tracking-wider block">
                        {day.day}
                      </span>
                      <h4 className="text-sm font-display font-bold text-textMain">
                        {day.focus}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal border border-line text-textMuted shrink-0">
                      {day.exercises?.length || 0} movements
                    </span>
                  </div>

                  <ul className="space-y-2.5">
                    {day.exercises?.map((ex, j) => (
                      <li 
                        key={j} 
                        className="flex items-center justify-between gap-3 text-xs p-2 rounded-lg bg-teal/50 border border-line/40 hover:bg-teal transition-colors"
                      >
                        <span className="font-medium text-textMain truncate">
                          {ex.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded bg-sand font-mono text-[11px] font-semibold text-coral border border-line/60">
                            {ex.sets} sets
                          </span>
                          <span className="px-2 py-0.5 rounded bg-sand font-mono text-[11px] text-textMuted border border-line/60">
                            {ex.reps}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3.5 pt-2.5 border-t border-line/40 flex items-center justify-between">
                    <span className="text-[10px] text-textSubtle font-mono">Routine Execution</span>
                    <button
                      type="button"
                      onClick={() => handleToggleDate(todayStr)}
                      className={`btn-inset !text-[11px] !py-1 !px-2.5 transition-all ${
                        completedDates.includes(todayStr)
                          ? "text-emerald border-emerald/30 font-bold"
                          : "text-coral border-coral/30 hover:border-coral font-medium"
                      }`}
                    >
                      {completedDates.includes(todayStr) ? "✓ Done Today" : "Mark Done Today"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Physiological Metrics Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <div className="p-3.5 rounded-xl bg-sand border border-line/60 text-center shadow-neumorphic-inner">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-textSubtle block">
                  Maintenance TDEE
                </span>
                <span className="text-lg font-display font-extrabold text-textMain">
                  {plan.tdee || "—"} <span className="text-xs text-textMuted font-normal">kcal/day</span>
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-sand border border-line/60 text-center shadow-neumorphic-inner">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-textSubtle block">
                  Basal Metabolic (BMR)
                </span>
                <span className="text-lg font-display font-extrabold text-textMain">
                  {plan.bmr || "—"} <span className="text-xs text-textMuted font-normal">kcal/day</span>
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-sand border border-line/60 text-center shadow-neumorphic-inner">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-textSubtle block">
                  Cardio Directive
                </span>
                <span className="text-xs font-medium text-coral block mt-1 truncate" title={plan.cardioRecommendation}>
                  🏃‍♂️ {plan.cardioRecommendation || "20m steady-state"}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
