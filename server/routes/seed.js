import { Router } from "express";
import { seedDemoUser, DEMO_USER } from "../services/seedService.js";

const router = Router();

// Endpoint accessible for automated seeding or 1-click recruiter reset
router.all("/demo", async (_req, res) => {
  try {
    const result = await seedDemoUser();
    res.json(result);
  } catch (err) {
    console.error("Demo seeding failed:", err);
    res.status(500).json({ error: "Failed to seed demo user", details: err.message });
  }
});

router.get("/info", (_req, res) => {
  res.json({
    email: DEMO_USER.email,
    password: DEMO_USER.password,
    displayName: DEMO_USER.displayName,
  });
});

export default router;
