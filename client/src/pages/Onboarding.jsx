import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { makeApi } from "../lib/api.js";

const goals = [
  { value: "lose_fat", label: "Lose fat" },
  { value: "gain_muscle", label: "Gain muscle" },
  { value: "recomp", label: "Recomposition" },
  { value: "maintain", label: "Maintain" },
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
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-display font-semibold mb-1">Tell us about your physique</h1>
      <p className="text-ink/60 mb-8 text-sm">
        This drives your training plan, calorie target, and diet plan — you can update it any time.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Age">
            <input required type="number" min="14" max="90" value={form.age} onChange={(e) => update("age", e.target.value)} className="input" />
          </Field>
          <Field label="Sex">
            <select value={form.sex} onChange={(e) => update("sex", e.target.value)} className="input">
              <option value="unspecified">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Height (cm)">
            <input required type="number" value={form.heightCm} onChange={(e) => update("heightCm", e.target.value)} className="input" />
          </Field>
          <Field label="Current weight (kg)">
            <input required type="number" value={form.currentWeightKg} onChange={(e) => update("currentWeightKg", e.target.value)} className="input" />
          </Field>
        </div>

        <Field label="Target weight (kg)">
          <input type="number" value={form.targetWeightKg} onChange={(e) => update("targetWeightKg", e.target.value)} className="input" />
        </Field>

        <Field label="Activity level">
          <select value={form.activityLevel} onChange={(e) => update("activityLevel", e.target.value)} className="input">
            <option value="sedentary">Sedentary (little/no exercise)</option>
            <option value="light">Light (1-3 days/week)</option>
            <option value="moderate">Moderate (3-5 days/week)</option>
            <option value="active">Active (6-7 days/week)</option>
            <option value="very_active">Very active (physical job + training)</option>
          </select>
        </Field>

        <Field label="Primary goal">
          <div className="grid grid-cols-2 gap-2">
            {goals.map((g) => (
              <button
                type="button"
                key={g.value}
                onClick={() => update("goal", g.value)}
                className={`text-sm rounded px-3 py-2 border hairline ${
                  form.goal === g.value ? "bg-teal text-white border-teal" : "bg-white text-ink/70"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </Field>

        {error && <p className="text-sm text-coral">{error}</p>}
        <button disabled={busy} className="bg-coral text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50 mt-2">
          {busy ? "Saving..." : "Save profile & continue"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-ink/70">{label}</span>
      {children}
    </label>
  );
}
