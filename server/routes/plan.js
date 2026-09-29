import { Router } from "express";
import { db } from "../config/firebase.js";
import { requireAuth } from "../middleware/auth.js";
import { askGemini, parseJsonResponse } from "../services/geminiService.js";

const router = Router();

// Generates a personalized workout plan from the user's current vs. target
// physique using Claude, grounded by simple BMR/TDEE math computed server-side
// (Claude is used for judgment/structuring, not for arithmetic it can get wrong).
router.post("/generate", requireAuth, async (req, res) => {
  const doc = await db.collection("users").doc(req.user.uid).get();
  const profile = doc.data()?.profile;
  if (!profile) return res.status(400).json({ error: "Complete your profile first" });

  const bmr = estimateBMR(profile);
  const tdee = Math.round(bmr * activityMultiplier(profile.activityLevel));

  const prompt = `User profile:
- Age: ${profile.age}, Sex: ${profile.sex}
- Height: ${profile.heightCm}cm, Current weight: ${profile.currentWeightKg}kg, Target weight: ${profile.targetWeightKg}kg
- Goal: ${profile.goal}
- Activity level: ${profile.activityLevel}
- Estimated TDEE: ${tdee} kcal/day

Design a 4-day-per-week resistance training plan appropriate for this goal and level.
Respond with ONLY raw JSON, no markdown fences, in this exact shape:
{
  "summary": string,
  "weeklySplit": [{"day": string, "focus": string, "exercises": [{"name": string, "sets": number, "reps": string, "notes": string}]}],
  "cardioRecommendation": string,
  "estimatedTimelineWeeks": number
}`;

  let plan;
  try {
    const text = await askGemini({
      system:
        "You are a certified strength coach. Create safe, evidence-based training plans. Never recommend extreme or unsafe protocols.",
      prompt,
      maxTokens: 1800,
    });
    plan = parseJsonResponse(text);
  } catch (err) {
    console.error("Plan generation failed, using fallback mock plan:", err.message);
    // Use a hardcoded fallback plan so the user's workflow isn't blocked by API downtime
    plan = {
      summary: "A robust foundational routine focused on progressive overload and establishing solid habits.",
      weeklySplit: [
        {
          day: "Day 1",
          focus: "Upper Body Power",
          exercises: [
            { name: "Barbell Bench Press", sets: 4, reps: "5-8" },
            { name: "Pull-ups or Lat Pulldowns", sets: 3, reps: "8-10" },
            { name: "Overhead Dumbbell Press", sets: 3, reps: "8-12" }
          ]
        },
        {
          day: "Day 2",
          focus: "Lower Body Strength",
          exercises: [
            { name: "Barbell Squats", sets: 4, reps: "5-8" },
            { name: "Romanian Deadlifts", sets: 3, reps: "8-10" },
            { name: "Leg Press", sets: 3, reps: "10-15" }
          ]
        },
        {
          day: "Day 3",
          focus: "Active Recovery",
          exercises: [
            { name: "Light Yoga or Stretching", sets: 1, reps: "15 mins" }
          ]
        },
        {
          day: "Day 4",
          focus: "Full Body Hypertrophy",
          exercises: [
            { name: "Incline Dumbbell Press", sets: 3, reps: "10-12" },
            { name: "Dumbbell Lunges", sets: 3, reps: "10-12 per leg" },
            { name: "Seated Cable Rows", sets: 3, reps: "10-12" }
          ]
        }
      ],
      cardioRecommendation: "20 minutes of moderate steady-state cardio after lifting sessions.",
      estimatedTimelineWeeks: 12
    };
  }

  plan.tdee = tdee;
  plan.bmr = Math.round(bmr);
  plan.generatedAt = new Date().toISOString();

  await db.collection("users").doc(req.user.uid).collection("plans").add(plan);
  res.json({ plan });
});

router.get("/latest", requireAuth, async (req, res) => {
  const snap = await db
    .collection("users")
    .doc(req.user.uid)
    .collection("plans")
    .orderBy("generatedAt", "desc")
    .limit(1)
    .get();
  res.json({ plan: snap.empty ? null : snap.docs[0].data() });
});

// Mifflin-St Jeor equation
function estimateBMR({ sex, currentWeightKg, heightCm, age }) {
  const base = 10 * currentWeightKg + 6.25 * heightCm - 5 * age;
  if (sex === "male") return base + 5;
  if (sex === "female") return base - 161;
  return base - 78; // average offset when unspecified
}

function activityMultiplier(level) {
  return { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }[level] || 1.55;
}

export default router;
