import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { makeApi } from "../lib/api.js";

export default function Profile() {
  const { getToken, user } = useAuth();
  const api = makeApi(getToken);
  const [profile, setProfile] = useState(null);
  const [notifStatus, setNotifStatus] = useState(Notification?.permission || "unsupported");
  const [workoutTime, setWorkoutTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getProfile().then((r) => {
      setProfile(r.profile);
      if (r.profile?.workoutTime) setWorkoutTime(r.profile.workoutTime);
    });
  }, []);

  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifStatus(permission);
  }

  async function handleSaveWorkoutTime() {
    setSaving(true);
    await api.saveProfile({ ...profile, workoutTime });
    setSaving(false);
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-display font-semibold mb-1 flex items-center gap-2">👤 Profile</h1>
      <p className="text-textMuted text-xs sm:text-sm mb-6 sm:mb-8">{user?.email}</p>

      {profile ? (
        <div className="rounded-2xl shadow-neumorphic bg-teal divide-y divide-line text-sm mb-6 sm:mb-8 overflow-hidden">
          <Row label="Age" value={profile.age} />
          <Row label="Height" value={`${profile.heightCm} cm`} />
          <Row label="Current weight" value={`${profile.currentWeightKg} kg`} />
          <Row label="Target weight" value={`${profile.targetWeightKg} kg`} />
          <Row label="Activity level" value={profile.activityLevel} />
          <Row label="Goal" value={profile.goal.replace(/_/g, " ")} />
        </div>
      ) : (
        <p className="text-sm text-textMuted mb-6 sm:mb-8">No profile saved yet.</p>
      )}

      <div className="rounded-2xl shadow-neumorphic bg-teal p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="text-base sm:text-lg font-display font-semibold mb-1 flex items-center gap-2">⏰ Workout Routine</div>
        <p className="text-xs text-textMuted mb-4">
          Set your daily workout time to receive a push notification reminder. Never skip a day.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <input 
            type="time" 
            value={workoutTime} 
            onChange={e => setWorkoutTime(e.target.value)}
            className="bg-sand text-textMain border border-line rounded-lg px-3 py-2 shadow-neumorphic-inner w-full flex-1 focus:outline-none focus:border-coral text-sm"
          />
          <button 
            onClick={handleSaveWorkoutTime}
            disabled={saving}
            className="w-full sm:w-auto text-sm bg-sand text-coral font-bold rounded-lg px-4 py-2 shadow-neumorphic hover:shadow-neumorphic-inner transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Time"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl shadow-neumorphic bg-teal p-4 sm:p-6">
        <div className="text-base sm:text-lg font-display font-semibold mb-1 flex items-center gap-2">🔔 Alerts & Notifications</div>
        <p className="text-xs text-textMuted mb-4">
          Get a push notification at each meal time and workout time.
        </p>
        <button
          onClick={enableNotifications}
          disabled={notifStatus === "granted"}
          className="w-full text-sm sm:text-base bg-sand text-coral font-bold rounded-lg px-4 py-3 shadow-neumorphic hover:shadow-neumorphic-inner transition-all disabled:opacity-50"
        >
          {notifStatus === "granted" ? "✅ Notifications enabled" : "Enable notifications"}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="px-4 py-3 sm:py-4 flex justify-between items-center transition-colors hover:bg-sand/30">
      <span className="text-textMuted font-medium text-xs sm:text-sm">{label}</span>
      <span className="font-bold text-textMain capitalize text-xs sm:text-sm">{value}</span>
    </div>
  );
}
