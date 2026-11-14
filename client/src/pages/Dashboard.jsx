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
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState("focused"); // "focused" (one day) | "all" (all 4 days)
  const [checkedExercises, setCheckedExercises] = useState({});
  const [loggedWorkoutForToday, setLoggedWorkoutForToday] = useState(null);
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

  // Toggle general date on streak calendar
  async function handleToggleDate(dateStr) {
    const alreadyCompleted = completedDates.includes(dateStr);
    const nextDates = alreadyCompleted
      ? completedDates.filter((d) => d !== dateStr)
      : [...completedDates, dateStr];

    setCompletedDates(nextDates);
    setStreakCount(computeLocalStreak(nextDates, todayStr));

    if (dateStr === todayStr) {
      if (alreadyCompleted) {
        setLoggedWorkoutForToday(null);
        try {
          localStorage.removeItem(`aesthetix_today_workout_${todayStr}`);
        } catch (e) {}
      } else if (plan?.weeklySplit?.[selectedDayIndex]) {
        const activeDay = plan.weeklySplit[selectedDayIndex];
        const wData = {
          date: todayStr,
          dayName: activeDay.day,
          focus: activeDay.focus,
          exercises: activeDay.exercises || [],
        };
        setLoggedWorkoutForToday(wData);
        try {
          localStorage.setItem(`aesthetix_today_workout_${todayStr}`, JSON.stringify(wData));
        } catch (e) {}
      }
    }

    try {
      localStorage.setItem(`aesthetix_completed_dates`, JSON.stringify(nextDates));
    } catch (e) {}

    try {
      const res = await api.toggleStreak(dateStr);
      if (res?.completedDates) {
        setCompletedDates(res.completedDates);
        setStreakCount(res.streak);
      }
    } catch (err) {
      console.warn("Streak sync notice (saved locally):", err.message);
    }
  }

  // Handle Mark Done / Undo for the active workout day
  async function handleToggleWorkoutDay(dayObj) {
    const isCompleted = completedDates.includes(todayStr);

    if (isCompleted) {
      // Undo completion
      const nextDates = completedDates.filter((d) => d !== todayStr);
      setCompletedDates(nextDates);
      setLoggedWorkoutForToday(null);
      setStreakCount(computeLocalStreak(nextDates, todayStr));

      try {
        localStorage.removeItem(`aesthetix_today_workout_${todayStr}`);
        localStorage.setItem(`aesthetix_completed_dates`, JSON.stringify(nextDates));
      } catch (e) {}

      try {
        await api.unlogWorkout(todayStr);
      } catch (err) {
        console.warn("Unlog sync notice:", err.message);
      }
    } else {
      // Mark as completed
      const nextDates = [...new Set([...completedDates, todayStr])];
      const wData = {
        date: todayStr,
        dayName: dayObj.day,
        focus: dayObj.focus,
        exercises: dayObj.exercises || [],
      };

      setCompletedDates(nextDates);
      setLoggedWorkoutForToday(wData);
      setStreakCount(computeLocalStreak(nextDates, todayStr));

      // Auto check all exercises for visual satisfaction
      const newChecks = { ...checkedExercises };
      dayObj.exercises?.forEach((_, idx) => {
        newChecks[`${dayObj.day}-${idx}`] = true;
      });
      setCheckedExercises(newChecks);

      try {
        localStorage.setItem(`aesthetix_today_workout_${todayStr}`, JSON.stringify(wData));
        localStorage.setItem(`aesthetix_completed_dates`, JSON.stringify(nextDates));
        localStorage.setItem(`aesthetix_checked_ex`, JSON.stringify(newChecks));
      } catch (e) {}

      try {
        const res = await api.logWorkout(wData);
        if (res?.completedDates) {
          setCompletedDates(res.completedDates);
          setStreakCount(res.streak);
        }
      } catch (err) {
        console.warn("Log workout sync notice (saved locally):", err.message);
      }
    }
  }

  function toggleExerciseCheck(exerciseKey) {
    const updated = { ...checkedExercises, [exerciseKey]: !checkedExercises[exerciseKey] };
    setCheckedExercises(updated);
    try {
      localStorage.setItem(`aesthetix_checked_ex`, JSON.stringify(updated));
    } catch (e) {}
  }

  async function refresh() {
    try {
      // Check local cache first
      try {
        const cachedDates = localStorage.getItem("aesthetix_completed_dates");
        if (cachedDates) {
          const parsed = JSON.parse(cachedDates);
          setCompletedDates(parsed);
          setStreakCount(computeLocalStreak(parsed, todayStr));
        }
        const cachedWorkout = localStorage.getItem(`aesthetix_today_workout_${todayStr}`);
        if (cachedWorkout) {
          setLoggedWorkoutForToday(JSON.parse(cachedWorkout));
        }
        const cachedChecks = localStorage.getItem("aesthetix_checked_ex");
        if (cachedChecks) {
          setCheckedExercises(JSON.parse(cachedChecks));
        }
      } catch (e) {}

      const [u, p, d, t, w] = await Promise.all([
        api.getProfile().catch(() => ({ profile: null })),
        api.getLatestPlan().catch(() => ({ plan: null })),
        api.getLatestDiet().catch(() => ({ dietPlan: null })),
        api.getTodayFood().catch(() => ({ totals: { calories: 0, protein: 0 }, logs: [] })),
        api.getTodayWorkout().catch(() => ({ logged: false, workout: null })),
      ]);

      if (u?.profile) setProfile(u.profile);
      if (u?.completedDates && u.completedDates.length > 0) {
        setCompletedDates(u.completedDates);
        setStreakCount(u.streak || computeLocalStreak(u.completedDates, todayStr));
      }

      setPlan(p?.plan || null);
      setDiet(d?.dietPlan || null);
      setToday(t || { totals: { calories: 0, protein: 0 }, logs: [] });

      if (w?.logged && w.workout) {
        setLoggedWorkoutForToday(w.workout);
        const idx = p?.plan?.weeklySplit?.findIndex((day) => day.day === w.workout.dayName);
        if (idx !== -1 && idx !== undefined) {
          setSelectedDayIndex(idx);
        }
      }
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

            {/* Day Selector Navigation & View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-sand border border-line/60 shadow-neumorphic-inner overflow-x-auto scrollbar-hide">
                {plan.weeklySplit?.map((d, idx) => {
                  const isSelected = selectedDayIndex === idx && viewMode === "focused";
                  const isCompletedToday = completedDates.includes(todayStr) && (loggedWorkoutForToday?.dayName === d.day || selectedDayIndex === idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedDayIndex(idx);
                        setViewMode("focused");
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        isSelected
                          ? "bg-teal text-coral shadow-neumorphic-sm border border-coral/40 font-bold"
                          : "text-textMuted hover:text-textMain hover:bg-teal/40"
                      }`}
                    >
                      <span>{d.day}</span>
                      {isCompletedToday && <span className="text-emerald text-[11px] font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setViewMode(viewMode === "focused" ? "all" : "focused")}
                className="btn-inset !text-xs !py-1.5 !px-3 self-start sm:self-center shrink-0"
              >
                {viewMode === "focused" ? "📅 View All 4 Days" : "🎯 Focus Single Day"}
              </button>
            </div>

            {/* MODE 1: Focused Single Day View (Default - Today's Workout Focus) */}
            {viewMode === "focused" && plan.weeklySplit?.[selectedDayIndex] && (() => {
              const activeDay = plan.weeklySplit[selectedDayIndex];
              const isTodayDone = completedDates.includes(todayStr);

              return (
                <div className="well-neu p-5 sm:p-6 border-coral/30 shadow-neumorphic-coral/10 animate-fadeIn">
                  {/* Active Day Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-line/60">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-coral uppercase tracking-wider">
                          {activeDay.day} Protocol
                        </span>
                        <span className="text-textSubtle">•</span>
                        <span className="text-xs text-textMuted font-mono">
                          {activeDay.exercises?.length || 0} Movements
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-display font-extrabold text-textMain">
                        {activeDay.focus}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {isTodayDone ? (
                        <span className="px-3 py-1 rounded-full bg-emerald/10 border border-emerald/30 text-emerald font-mono font-bold text-xs flex items-center gap-1.5">
                          <span>✓</span>
                          <span>Completed Today</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-coral/10 border border-coral/30 text-coral font-mono font-bold text-xs">
                          ⚡ Today's Target
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interactive Exercise Checklist */}
                  <div className="space-y-3 mb-6">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-textSubtle block mb-1">
                      Exercise Routine Checklist (tap to mark off sets):
                    </span>
                    {activeDay.exercises?.map((ex, j) => {
                      const exKey = `${activeDay.day}-${j}`;
                      const isChecked = checkedExercises[exKey] || isTodayDone;

                      return (
                        <div
                          key={j}
                          onClick={() => toggleExerciseCheck(exKey)}
                          className={`flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                            isChecked
                              ? "bg-sand/90 border-emerald/40 shadow-neumorphic-inner"
                              : "bg-teal/60 border-line/60 hover:bg-teal hover:border-line shadow-neumorphic-xs"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                isChecked
                                  ? "bg-emerald text-ink shadow-neumorphic-xs"
                                  : "border border-line bg-sand text-textSubtle"
                              }`}
                            >
                              {isChecked ? "✓" : j + 1}
                            </div>
                            <div className="min-w-0">
                              <span
                                className={`text-xs sm:text-sm font-semibold block truncate ${
                                  isChecked ? "line-through text-textMuted" : "text-textMain"
                                }`}
                              >
                                {ex.name}
                              </span>
                              {ex.notes && (
                                <span className="text-[10px] text-textSubtle block truncate">
                                  {ex.notes}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2 py-1 rounded bg-sand font-mono text-[11px] font-semibold text-coral border border-line/60 shadow-neumorphic-inner">
                              {ex.sets} sets
                            </span>
                            <span className="px-2 py-1 rounded bg-sand font-mono text-[11px] text-textMuted border border-line/60 shadow-neumorphic-inner">
                              {ex.reps}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Single Action Button For Today's Workout */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleToggleWorkoutDay(activeDay)}
                      className={`w-full py-3.5 px-6 rounded-xl font-display font-extrabold text-sm sm:text-base tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
                        isTodayDone
                          ? "bg-sand border-2 border-emerald/50 text-emerald shadow-neumorphic-inner hover:border-coral/60 hover:text-coral"
                          : "btn-coral shadow-neumorphic-coral"
                      }`}
                    >
                      {isTodayDone ? (
                        <>
                          <span>✓</span>
                          <span>{activeDay.day} Completed Today (Click to Undo)</span>
                        </>
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>Mark {activeDay.day} Done Today & Record Streak</span>
                        </>
                      )}
                    </button>
                    {isTodayDone && (
                      <p className="text-[11px] text-emerald text-center mt-2.5 font-medium animate-fadeIn">
                        🎉 Workout recorded! Synced with your weekly streak calendar and AI coach history.
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* MODE 2: Full 4-Day Split Grid Overview */}
            {viewMode === "all" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                {plan.weeklySplit?.map((day, i) => {
                  const isThisDayActive = selectedDayIndex === i;
                  const isCompletedToday = completedDates.includes(todayStr) && loggedWorkoutForToday?.dayName === day.day;

                  return (
                    <div
                      key={i}
                      className={`well-neu p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 ${
                        isThisDayActive ? "border-coral/40 shadow-neumorphic-coral/10" : "hover:border-line"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3 pb-2.5 border-b border-line/50">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-bold text-coral uppercase tracking-wider block">
                              {day.day}
                            </span>
                            {isCompletedToday && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald/10 text-emerald border border-emerald/30 font-bold">
                                Done Today ✓
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-display font-bold text-textMain">
                            {day.focus}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal border border-line text-textMuted shrink-0">
                          {day.exercises?.length || 0} movements
                        </span>
                      </div>

                      <ul className="space-y-2 mb-4">
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
                                {ex.sets}s
                              </span>
                              <span className="px-2 py-0.5 rounded bg-sand font-mono text-[11px] text-textMuted border border-line/60">
                                {ex.reps}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-2 border-t border-line/40 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDayIndex(i);
                            setViewMode("focused");
                          }}
                          className="btn-inset !text-xs !py-1 !px-3 text-textMuted hover:text-coral"
                        >
                          Focus This Routine →
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDayIndex(i);
                            handleToggleWorkoutDay(day);
                          }}
                          className={`btn-inset !text-xs !py-1 !px-3 transition-all ${
                            isCompletedToday
                              ? "text-emerald border-emerald/30 font-bold"
                              : "text-coral border-coral/30 hover:border-coral font-bold"
                          }`}
                        >
                          {isCompletedToday ? "✓ Done Today" : "Mark Done Today"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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
