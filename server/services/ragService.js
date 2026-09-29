import { pipeline } from "@xenova/transformers";
import { nutritionKB } from "../data/nutritionKB.js";
import { db } from "../config/firebase.js";

/**
 * Retrieval-Augmented Generation service.
 *
 * Embeddings are generated LOCALLY with a small open-source sentence
 * transformer (all-MiniLM-L6-v2, ~90MB, runs on CPU via transformers.js) —
 * no external embeddings API, no per-call cost. Vectors are compared with
 * cosine similarity in-memory, which is plenty for a knowledge base of this
 * size. Swap this store for Pinecone/pgvector/Weaviate to scale.
 *
 * Two retrieval corpora are supported:
 *  - the static nutrition/fitness knowledge base (nutritionKB)
 *  - each user's own logged meals & workouts (personalized RAG)
 */

let embedder = null;
let kbIndex = null; // [{ ...entry, vector }]

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
}

async function embed(text) {
  const model = await getEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

function cosineSim(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // vectors are already normalized, so dot product == cosine similarity
}

/** Lazily embeds the static KB once per server process. */
async function buildKbIndex() {
  if (kbIndex) return kbIndex;
  kbIndex = [];
  for (const entry of nutritionKB) {
    const vector = await embed(`${entry.topic}: ${entry.text}`);
    kbIndex.push({ ...entry, vector });
  }
  return kbIndex;
}

/** Top-k passages from the static nutrition knowledge base. */
export async function retrieveFromKB(query, k = 3) {
  const index = await buildKbIndex();
  const qVec = await embed(query);
  return index
    .map((entry) => ({ ...entry, score: cosineSim(qVec, entry.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/**
 * Personalized RAG: embeds the user's recent logged meals/workouts
 * (stored in Firestore by routes/food.js and routes/plan.js) on the fly
 * and retrieves the most relevant entries to the current question.
 * On-the-fly embedding is fine at this scale (dozens of logs); a real
 * product would cache vectors on write instead of recomputing per query.
 */
export async function retrieveFromUserHistory(uid, query, k = 4) {
  const snapshot = await db
    .collection("users")
    .doc(uid)
    .collection("logs")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  if (snapshot.empty) return [];

  const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const qVec = await embed(query);

  const scored = await Promise.all(
    logs.map(async (log) => {
      const text = log.summary || JSON.stringify(log);
      const vector = await embed(text);
      return { ...log, score: cosineSim(qVec, vector) };
    })
  );

  return scored.sort((a, b) => b.score - a.score).slice(0, k);
}

export async function buildRagContext(uid, query) {
  const [kbResults, historyResults] = await Promise.all([
    retrieveFromKB(query),
    uid ? retrieveFromUserHistory(uid, query) : Promise.resolve([]),
  ]);

  const kbBlock = kbResults
    .map((r) => `[Nutrition science] ${r.topic}: ${r.text}`)
    .join("\n");

  const historyBlock = historyResults
    .map((r) => `[User history, ${new Date(r.createdAt?._seconds * 1000 || Date.now()).toDateString()}] ${r.summary}`)
    .join("\n");

  return { kbResults, historyResults, contextText: [kbBlock, historyBlock].filter(Boolean).join("\n") };
}
