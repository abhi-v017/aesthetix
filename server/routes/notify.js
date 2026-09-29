import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { saveDeviceToken } from "../services/notificationService.js";

const router = Router();

router.post("/register-device", requireAuth, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token is required" });
  await saveDeviceToken(req.user.uid, token);
  res.json({ ok: true });
});

export default router;
