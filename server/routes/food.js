import { Router } from "express";
import multer from "multer";
import { db } from "../config/firebase.js";
import { requireAuth } from "../middleware/auth.js";
import { classifyFoodImage, estimateMacros } from "../services/visionService.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

// Food photo -> macro estimate. Local vision model classifies the food,
// Claude reasons about portion size, result is logged to Firestore so it
// feeds the personalized RAG coach and daily totals.
router.post("/analyze", requireAuth, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Attach an image as 'image'" });

  try {
    const classifications = await classifyFoodImage(req.file.buffer);
    const estimate = await estimateMacros({ classifications, portionHint: req.body.portionHint });

    await db.collection("users").doc(req.user.uid).collection("logs").add({
      type: "food_log",
      summary: `Logged ${estimate.food} (~${estimate.estimatedGrams}g): ${estimate.calories} kcal, ${estimate.protein}g protein.`,
      estimate,
      classifications,
      createdAt: new Date(),
    });

    res.json({ classifications, estimate });
  } catch (err) {
    console.error("Food analysis failed:", err);
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

router.get("/today", requireAuth, async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const snap = await db
    .collection("users")
    .doc(req.user.uid)
    .collection("logs")
    .where("createdAt", ">=", startOfDay)
    .orderBy("createdAt", "desc")
    .get();

  const logs = snap.docs.map((d) => d.data()).filter((l) => l.type === "food_log");
  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.estimate?.calories || 0),
      protein: acc.protein + (l.estimate?.protein || 0),
    }),
    { calories: 0, protein: 0 }
  );

  res.json({ logs, totals });
});

export default router;
