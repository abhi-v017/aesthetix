import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/user.js";
import planRoutes from "./routes/plan.js";
import dietRoutes from "./routes/diet.js";
import foodRoutes from "./routes/food.js";
import chatRoutes from "./routes/chat.js";
import notifyRoutes from "./routes/notify.js";
import { startNotificationScheduler } from "./services/notificationService.js";

dotenv.config();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection (server stayed up):", err.message || err);
});

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/user", userRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/diet", dietRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notify", notifyRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Fitness AI server running on http://localhost:${PORT}`);
  startNotificationScheduler();
});
