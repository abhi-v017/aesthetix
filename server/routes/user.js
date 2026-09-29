import { Router } from "express";
import { db } from "../config/firebase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

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
  if (!doc.exists) return res.json({ profile: null });
  res.json({ profile: doc.data().profile || null });
});

export default router;
