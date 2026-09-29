import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { askGemini } from "../services/geminiService.js";
import { buildRagContext } from "../services/ragService.js";

const router = Router();

// The RAG coach: retrieves from BOTH the static nutrition knowledge base
// and the user's own logged history (meals, workouts, past plans), then
// asks Claude to answer using only that retrieved context. This endpoint
// also backs the voice guidance feature -- the client sends transcribed
// speech here and speaks the response back with the Web Speech API.
router.post("/ask", requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  const { kbResults, historyResults, contextText } = await buildRagContext(req.user.uid, message);

  const prompt = `Context retrieved for this question:
${contextText || "(no relevant context found)"}

User question: "${message}"

Answer using the retrieved context where relevant. If the context doesn't cover something, say so rather than inventing facts. Keep the answer conversational and under 120 words since it may be read aloud.`;

  try {
    const answer = await askGemini({
      system:
        "You are an encouraging AI fitness & nutrition coach. Be specific, evidence-based, and concise. You're speaking to someone tracking their own fitness data.",
      prompt,
      maxTokens: 500,
    });

    res.json({
      answer,
      sources: {
        knowledgeBase: kbResults.map((r) => r.topic),
        personalHistory: historyResults.map((r) => r.summary),
      },
    });
  } catch (err) {
    console.error("Chat coach failed:", err.message);
    res.json({
      answer: "I'm sorry, I'm currently experiencing high demand. Please try asking again in a moment!",
      sources: null
    });
  }
});

export default router;
