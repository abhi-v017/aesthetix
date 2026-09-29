import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-1.5-flash-8b";

export async function askGemini({ system, prompt, maxTokens = 1200, retries = 3 }) {
  try {
    return await callModel(MODEL, { system, prompt, maxTokens, retries });
  } catch (err) {
    const transient = err.status === 503 || err.status === 429 || /overloaded|unavailable|high demand/i.test(err.message || "");
    if (!transient || MODEL === FALLBACK_MODEL) throw err;

    console.warn(`${MODEL} still unavailable after retries, falling back to ${FALLBACK_MODEL}`);
    return await callModel(FALLBACK_MODEL, { system, prompt, maxTokens, retries: 1 });
  }
}

async function callModel(modelName, { system, prompt, maxTokens, retries }) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: system,
    generationConfig: { maxOutputTokens: maxTokens },
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      const transient = err.status === 503 || err.status === 429 || /overloaded|unavailable|high demand/i.test(err.message || "");
      const isLastAttempt = attempt === retries;

      if (!transient || isLastAttempt) throw err;

      const delayMs = 1000 * 2 ** (attempt - 1);
      console.warn(`${modelName} request failed (attempt ${attempt}/${retries}), retrying in ${delayMs}ms: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export function parseJsonResponse(text) {
  // Try to extract JSON block from markdown fences first
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match) {
    return JSON.parse(match[1].trim());
  }
  
  // Try to find the outermost brackets if no fences exist
  const firstCurly = text.indexOf('{');
  const lastCurly = text.lastIndexOf('}');
  const firstSquare = text.indexOf('[');
  const lastSquare = text.lastIndexOf(']');
  
  let startIdx = -1;
  let endIdx = -1;
  
  if (firstCurly !== -1 && lastCurly > firstCurly && (firstSquare === -1 || firstCurly < firstSquare)) {
    startIdx = firstCurly;
    endIdx = lastCurly;
  } else if (firstSquare !== -1 && lastSquare > firstSquare) {
    startIdx = firstSquare;
    endIdx = lastSquare;
  }

  if (startIdx !== -1 && endIdx !== -1) {
    try {
      return JSON.parse(text.substring(startIdx, endIdx + 1));
    } catch (e) {
      // fallthrough
    }
  }

  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export default genAI;