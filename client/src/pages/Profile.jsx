import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { makeApi } from "../lib/api.js";

export default function Profile() {
  const { getToken, user, logout } = useAuth();
  const api = makeApi(getToken);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState(0);
  const [notifStatus, setNotifStatus] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );
  const [workoutTime, setWorkoutTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    api.getProfile().then((r) => {
      setProfile(r.profile);
      if (r.streak !== undefined) setStreak(r.streak);
      if (r.profile?.workoutTime) setWorkoutTime(r.profile.workoutTime);
    });
  }, []);

  async function enableNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifStatus(permission);
  }

  async function handleSaveWorkoutTime() {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.saveProfile({ ...profile, workoutTime });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal border border-line text-xs font-mono text-coral mb-2 shadow-neumorphic-sm">
            <span>ATHLETE ID</span>
            <span>•</span>
            <span className="text-textSubtle">{user?.uid?.slice(0, 8)}...</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-textMain tracking-tight">
            👤 Athlete Profile
          </h1>
          <p className="text-textMuted text-xs sm:text-sm mt-1">{user?.email}</p>
        </div>

        <Link to="/onboarding" className="btn-neu !text-xs !py-2 !px-4 self-start sm:self-center">
          <span>✏️</span>
          <span>Recalibrate Physique</span>
        </Link>
      </div>

      {/* Biometric Telemetry Grid */}
      <div className="card-neu p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-line/60">
          <h2 className="text-base font-display font-bold text-textMain flex items-center gap-2">
            <span>🧬</span>
            <span>Physiological Telemetry</span>
          </h2>
          <span className="text-[10px] font-mono text-coral uppercase font-bold tracking-wider">
            {profile?.goal ? profile.goal.replace(/_/g, " ") : "Not Calibrated"}
          </span>
        </div>

        {profile ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricCard label="Age" value={`${profile.age} yrs`} icon="🎂" />
            <MetricCard label="Biological Sex" value={profile.sex} icon="🧬" />
            <MetricCard label="Height" value={`${profile.heightCm} cm`} icon="📏" />
            <MetricCard label="Current Weight" value={`${profile.currentWeightKg} kg`} icon="⚖️" />
            <MetricCard label="Target Weight" value={`${profile.targetWeightKg} kg`} icon="🎯" />
            <MetricCard label="Activity Level" value={profile.activityLevel} icon="🏃‍♂️" />
            <MetricCard label="Discipline Streak" value={`${streak} ${streak === 1 ? "Day" : "Days"}`} icon="🔥" />
          </div>
        ) : (
          <div className="well-neu p-6 text-center">
            <p className="text-xs text-textMuted mb-3">No biometric profile saved yet.</p>
            <Link to="/onboarding" className="btn-coral !text-xs">
              Complete Setup Now →
            </Link>
          </div>
        )}
      </div>

      {/* Workout Reminder Scheduling */}
      <div className="card-neu p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">⏰</span>
          <h2 className="text-base font-display font-bold text-textMain">
            Daily Workout Schedule
          </h2>
        </div>
        <p className="text-xs text-textMuted mb-4">
          Set your preferred training hour. If FCM push notifications are configured, you will receive an alert at this time.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input 
            type="time" 
            value={workoutTime} 
            onChange={(e) => setWorkoutTime(e.target.value)}
            className="input !w-full sm:!w-48"
          />
          <button 
            onClick={handleSaveWorkoutTime}
            disabled={saving}
            className="btn-coral !text-xs !py-2.5 sm:!py-2"
          >
            {saving ? "Saving..." : "Save Routine Time"}
          </button>
          {savedSuccess && (
            <span className="text-xs text-emerald font-semibold animate-fadeIn">
              ✓ Saved successfully!
            </span>
          )}
        </div>
      </div>

      {/* Push Notifications Card */}
      <div className="card-neu p-5 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <h2 className="text-base font-display font-bold text-textMain">
              Browser Alerts & Push Reminders
            </h2>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase ${
            notifStatus === "granted"
              ? "bg-emerald/10 text-emerald border-emerald/30"
              : "bg-sand text-textSubtle border-line"
          }`}>
            {notifStatus}
          </span>
        </div>
        <p className="text-xs text-textMuted mb-4">
          Enables instant push notifications for each scheduled meal and workout reminder.
        </p>

        <button
          onClick={enableNotifications}
          disabled={notifStatus === "granted"}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all ${
            notifStatus === "granted"
              ? "bg-sand text-emerald border border-emerald/30 cursor-default"
              : "btn-neu !text-coral !border-coral/40"
          }`}
        >
          {notifStatus === "granted" ? "✓ Notifications Enabled" : "Enable Push Notifications"}
        </button>
      </div>

      {/* Account Logout */}
      <div className="pt-2 text-center">
        <button
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
          className="text-xs text-textSubtle hover:text-coral transition-colors font-mono"
        >
          Log out of current session ({user?.email})
        </button>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <div className="well-neu p-3 sm:p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-textSubtle truncate">
          {label}
        </span>
        <span className="text-xs">{icon}</span>
      </div>
      <div className="font-display font-bold text-sm sm:text-base text-textMain capitalize truncate">
        {value || "—"}
      </div>
    </div>
  );
}
