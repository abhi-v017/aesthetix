import { Router } from "express";
import { db } from "../config/firebase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

export function calculateConsecutiveStreak(dates = [], referenceDateStr = null) {
  if (!dates || dates.length === 0) return 0;
  const dateSet = new Set(dates);

  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date();

  const formatDate = (dateObj, offsetDays = 0) => {
    const d = new Date(dateObj);
    d.setDate(d.getDate() - offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDate(ref, 0);
  const yesterdayStr = formatDate(ref, 1);

  let streak = 0;
  let checkOffset = 0;

  // If today isn't checked yet, check if yesterday was checked to keep the active streak alive
  if (!dateSet.has(todayStr)) {
    if (!dateSet.has(yesterdayStr)) {
      return 0;
    }
    checkOffset = 1;
  }

  while (dateSet.has(formatDate(ref, checkOffset))) {
    streak++;
    checkOffset++;
  }

  return streak;
}

// Create/update the user's profile: current stats + goal physique.
// This profile is what plan.js and diet.js prompt Claude with.
router.put("/profile", requireAuth, async (req, res) => {
  const { age, sex, heightCm, currentWeightKg, targetWeightKg, activityLevel, goal, dietaryRestrictions } = req.body;

  if (!age || !heightCm || !currentWeightKg || !goal) {
    return res.status(400).json({ error: "age, heightCm, currentWeightKg, and goal are required" });
  }

  const profile = {
    age,
    sex: sex || "unspecified",
    heightCm,
    currentWeightKg,
    targetWeightKg: targetWeightKg || currentWeightKg,
    activityLevel: activityLevel || "moderate", // sedentary | light | moderate | active | very_active
    goal, // "lose_fat" | "gain_muscle" | "recomp" | "maintain"
    dietaryRestrictions: dietaryRestrictions || [],
    updatedAt: new Date().toISOString(),
  };

  await db.collection("users").doc(req.user.uid).set({ profile }, { merge: true });
  res.json({ profile });
});

router.get("/profile", requireAuth, async (req, res) => {
  const doc = await db.collection("users").doc(req.user.uid).get();
  if (!doc.exists) return res.json({ profile: null, completedDates: [], streak: 0 });
  const data = doc.data();
  const completedDates = data.completedDates || [];
  const streak = calculateConsecutiveStreak(completedDates);
  res.json({
    profile: data.profile || null,
    completedDates,
    streak,
  });
});

// Toggle workout completion for a specific date (YYYY-MM-DD)
router.post("/streak/toggle", requireAuth, async (req, res) => {
  const { date } = req.body;
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const targetDate = date || `${year}-${month}-${day}`;

  const userRef = db.collection("users").doc(req.user.uid);
  const userDoc = await userRef.get();
  const data = userDoc.data() || {};
  const currentSet = new Set(data.completedDates || []);

  const isCompleted = !currentSet.has(targetDate);
  if (isCompleted) {
    currentSet.add(targetDate);
    // Add workout completion log so the RAG Coach can reference it
    await userRef.collection("logs").add({
      type: "workout_log",
      date: targetDate,
      summary: `Completed scheduled workout session on ${targetDate}.`,
      createdAt: new Date(),
    });
  } else {
    currentSet.delete(targetDate);
  }

  const updatedDates = Array.from(currentSet).sort();
  await userRef.set({ completedDates: updatedDates }, { merge: true });

  const streak = calculateConsecutiveStreak(updatedDates);

  res.json({
    completedDates: updatedDates,
    toggledDate: targetDate,
    completed: isCompleted,
    streak,
  });
});

router.get("/streak", requireAuth, async (req, res) => {
  const doc = await db.collection("users").doc(req.user.uid).get();
  const completedDates = doc.data()?.completedDates || [];
  const streak = calculateConsecutiveStreak(completedDates);
  res.json({ completedDates, streak });
});

export default router;
