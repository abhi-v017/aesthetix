import { Router } from "express";
import { db } from "../config/firebase.js";
import { requireAuth } from "../middleware/auth.js";
import { askGemini, parseJsonResponse } from "../services/geminiService.js";
import { retrieveFromKB } from "../services/ragService.js";

const router = Router();

// Generates a diet plan grounded in the nutrition knowledge base (RAG),
// tailored to the user's profile and latest generated training plan.
router.post("/generate", requireAuth, async (req, res) => {
  const userDoc = await db.collection("users").doc(req.user.uid).get();
  const profile = userDoc.data()?.profile;
  if (!profile) return res.status(400).json({ error: "Complete your profile first" });

  const planSnap = await db
    .collection("users")
    .doc(req.user.uid)
    .collection("plans")
    .orderBy("generatedAt", "desc")
    .limit(1)
    .get();
  const tdee = planSnap.empty ? null : planSnap.docs[0].data().tdee;

  const query = `Diet plan for goal ${profile.goal}, activity ${profile.activityLevel}`;
  const kbResults = await retrieveFromKB(query, 4);
  const groundingText = kbResults.map((r) => `- ${r.topic}: ${r.text}`).join("\n");

  const prompt = `User profile: goal=${profile.goal}, current weight=${profile.currentWeightKg}kg, target=${profile.targetWeightKg}kg, TDEE=${tdee || "unknown, estimate reasonably"} kcal/day, dietary restrictions=${(profile.dietaryRestrictions || []).join(", ") || "none"}.

Ground your recommendations in this retrieved nutrition science (cite it implicitly, don't just restate it verbatim):
${groundingText}

Produce a 1-day example meal plan (4 meals) hitting an appropriate calorie and protein target for the goal.
Respond with ONLY raw JSON, no markdown fences, in this exact shape:
{
  "dailyCalorieTarget": number,
  "dailyProteinTargetG": number,
  "rationale": string,
  "meals": [{"name": string, "items": [string], "calories": number, "protein": number}],
  "reminderTimes": [string]
}
reminderTimes should be 3-4 HH:MM (24h) times matching the meals, used for notifications.`;

  let dietPlan;
  try {
    const text = await askGemini({
      system: "You are a registered-dietitian-style assistant. Ground advice in the provided nutrition science context. Be practical and specific with real foods.",
      prompt,
      maxTokens: 1200,
    });
    dietPlan = parseJsonResponse(text);
  } catch (err) {
    console.error("Diet generation failed, using fallback mock diet:", err.message);
    // Hardcoded fallback so the user can still test the UI
    const targetCals = tdee ? Math.round(tdee * 0.9) : 2200;
    dietPlan = {
      dailyCalorieTarget: targetCals,
      dailyProteinTargetG: 160,
      rationale: "This baseline plan prioritizes high protein for muscle retention and a moderate calorie deficit. (Auto-generated due to AI downtime).",
      meals: [
        {
          name: "Breakfast",
          items: ["4 Scrambled Eggs", "1 cup Oatmeal", "Handful of Berries"],
          calories: 550,
          protein: 35
        },
        {
          name: "Lunch",
          items: ["Grilled Chicken Breast (200g)", "Quinoa (1 cup)", "Steamed Broccoli"],
          calories: 600,
          protein: 50
        },
        {
          name: "Pre-Workout Snack",
          items: ["Greek Yogurt", "Banana"],
          calories: 250,
          protein: 15
        },
        {
          name: "Dinner",
          items: ["Baked Salmon (150g)", "Sweet Potato", "Asparagus"],
          calories: 500,
          protein: 40
        }
      ],
      reminderTimes: ["08:00", "13:00", "16:00", "19:00"]
    };
  }

  dietPlan.groundedOn = kbResults.map((r) => r.topic);
  dietPlan.generatedAt = new Date().toISOString();

  await db.collection("users").doc(req.user.uid).collection("dietPlans").add(dietPlan);

  // Log a summary entry so this plan can be retrieved later by the
  // personalized-history RAG used in the coach chat.
  await db.collection("users").doc(req.user.uid).collection("logs").add({
    type: "diet_plan",
    summary: `Diet plan generated: ${dietPlan.dailyCalorieTarget} kcal, ${dietPlan.dailyProteinTargetG}g protein/day for goal ${profile.goal}.`,
    createdAt: new Date(),
  });

  res.json({ dietPlan });
});

router.get("/latest", requireAuth, async (req, res) => {
  const snap = await db
    .collection("users")
    .doc(req.user.uid)
    .collection("dietPlans")
    .orderBy("generatedAt", "desc")
    .limit(1)
    .get();
  res.json({ dietPlan: snap.empty ? null : snap.docs[0].data() });
});

export default router;
