import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { makeApi } from "../lib/api.js";

const goals = [
  { value: "lose_fat", label: "Lose Fat", icon: "🔥", desc: "Calorie deficit & definition" },
  { value: "gain_muscle", label: "Gain Muscle", icon: "💪", desc: "Hypertrophy & surplus" },
  { value: "recomp", label: "Recomposition", icon: "⚡", desc: "Build muscle while dropping fat" },
  { value: "maintain", label: "Maintain", icon: "⚖️", desc: "Peak performance & health" },
];

export default function Onboarding() {
  const { getToken } = useAuth();
  const api = makeApi(getToken);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    age: "",
    sex: "unspecified",
    heightCm: "",
    currentWeightKg: "",
    targetWeightKg: "",
    activityLevel: "moderate",
    goal: "recomp",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.saveProfile({
        ...form,
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        currentWeightKg: Number(form.currentWeightKg),
        targetWeightKg: Number(form.targetWeightKg || form.currentWeightKg),
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
      <div className="card-neu p-6 sm:p-8 relative overflow-hidden">
        {/* Top Decorative Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-coral to-transparent opacity-80" />

        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sand border border-line text-xs font-mono text-coral mb-3 shadow-neumorphic-inner">
            <span>STEP 1 OF 1</span>
            <span>•</span>
            <span>PHYSIQUE PROFILE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-textMain tracking-tight">
            Calibrate Your Physiology
          </h1>
          <p className="text-textMuted text-xs sm:text-sm mt-1.5 leading-relaxed">
            This powers your metabolic math (BMR & TDEE), custom 4-day split, and science-grounded diet protocol.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Age">
              <input 
                required 
                type="number" 
                min="14" 
                max="90" 
                placeholder="e.g. 25"
                value={form.age} 
                onChange={(e) => update("age", e.target.value)} 
                className="input" 
              />
            </Field>
            <Field label="Biological Sex">
              <select 
                value={form.sex} 
                onChange={(e) => update("sex", e.target.value)} 
                className="input cursor-pointer"
              >
                <option value="unspecified">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Height (cm)">
              <input 
                required 
                type="number" 
                placeholder="e.g. 178"
                value={form.heightCm} 
                onChange={(e) => update("heightCm", e.target.value)} 
                className="input" 
              />
            </Field>
            <Field label="Current Weight (kg)">
              <input 
                required 
                type="number" 
                step="0.1"
                placeholder="e.g. 75"
                value={form.currentWeightKg} 
                onChange={(e) => update("currentWeightKg", e.target.value)} 
                className="input" 
              />
            </Field>
          </div>

          <Field label="Target Weight (kg)">
            <input 
              type="number" 
              step="0.1"
              placeholder="e.g. 72 (defaults to current if blank)"
              value={form.targetWeightKg} 
              onChange={(e) => update("targetWeightKg", e.target.value)} 
              className="input" 
            />
          </Field>

          <Field label="Weekly Activity Level">
            <select 
              value={form.activityLevel} 
              onChange={(e) => update("activityLevel", e.target.value)} 
              className="input cursor-pointer"
            >
              <option value="sedentary">Sedentary (Desk job / little to no exercise)</option>
              <option value="light">Lightly Active (1-3 workout days/week)</option>
              <option value="moderate">Moderately Active (3-5 workout days/week)</option>
              <option value="active">Very Active (6-7 hard training days/week)</option>
              <option value="very_active">Extremely Active (Physical job + heavy lifting)</option>
            </select>
          </Field>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
              Primary Fitness Objective
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goals.map((g) => {
                const isSelected = form.goal === g.value;
                return (
                  <button
                    type="button"
                    key={g.value}
                    onClick={() => update("goal", g.value)}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? "bg-sand border-coral text-coral shadow-neumorphic-inner"
                        : "bg-teal border-line/70 text-textMuted hover:text-textMain hover:border-line shadow-neumorphic-sm"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{g.icon}</span>
                      <span className={`text-sm font-bold ${isSelected ? "text-coral" : "text-textMain"}`}>
                        {g.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-textSubtle leading-relaxed">
                      {g.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-coral/10 border border-coral/30 text-coral text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={busy} 
            className="btn-coral w-full mt-2 !py-3.5 !text-sm"
          >
            {busy ? "Saving Profile & Calibrating..." : "Save Profile & Launch Protocol 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wider text-textMuted">{label}</span>
      {children}
    </label>
  );
}
