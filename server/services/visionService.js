import { pipeline } from "@xenova/transformers";
import { foodNutritionDB, defaultFoodEstimate } from "../data/foodNutritionDB.js";
import { askGemini, parseJsonResponse } from "./geminiService.js";

/**
 * Food image -> macros pipeline.
 *
 * Step 1 (local, open-source, free): an image-classification model runs
 * ON THE SERVER via transformers.js to identify the food in the photo.
 * Step 2 (Claude): Claude takes the classifier's label + confidence and
 * the user's stated portion size and reasons about a realistic calorie/
 * protein estimate, since a single label ("pizza") hides huge portion
 * variance that a lookup table alone can't handle well.
 */

let classifier = null;
async function getClassifier() {
  if (!classifier) {
    // nateraw/food is a ViT model fine-tuned on Food-101, hosted on the HF hub
    // and pulled once, cached locally by transformers.js.
    classifier = await pipeline("image-classification", "Xenova/food101");
  }
  return classifier;
}

export async function classifyFoodImage(imageBuffer) {
  const model = await getClassifier();
  // transformers.js accepts a data URL directly
  const dataUrl = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
  const results = await model(dataUrl, { topk: 3 });
  return results; // [{ label, score }, ...]
}

export async function estimateMacros({ classifications, portionHint }) {
  const top = classifications[0];
  const key = top.label.toLowerCase().replace(/\s+/g, "_");
  const base = foodNutritionDB[key] || defaultFoodEstimate;

  // Ask Claude to adjust the base per-100g figures for a realistic serving,
  // given the portion description the user typed (e.g. "large plate", "1 bowl").
  const prompt = `A food image was classified as "${top.label}" (confidence ${(top.score * 100).toFixed(0)}%), with alternates: ${classifications
    .slice(1)
    .map((c) => c.label)
    .join(", ")}.
Base macro reference per 100g: ${JSON.stringify(base)}.
User's portion description: "${portionHint || "not specified, assume a typical single serving"}".

Estimate the realistic total calories, protein, carbs, and fat for this actual portion.
Respond with ONLY raw JSON, no markdown fences, in this exact shape:
{"food": string, "estimatedGrams": number, "calories": number, "protein": number, "carbs": number, "fat": number, "confidence": "low"|"medium"|"high", "note": string}`;

  try {
    const text = await askGemini({
      system:
        "You are a sports nutrition assistant that converts food classifications and portion descriptions into realistic macro estimates. Be conservative and note uncertainty honestly.",
      prompt,
      maxTokens: 400,
    });
    return parseJsonResponse(text);
  } catch (err) {
    console.warn("Gemini macro estimation failed, using local baseline:", err.message);
    // Fallback if AI fails or returns invalid JSON
    return {
      food: top.label,
      estimatedGrams: 250,
      calories: Math.round((base.calories * 250) / 100),
      protein: Math.round((base.protein * 250) / 100),
      carbs: Math.round((base.carbs * 250) / 100),
      fat: Math.round((base.fat * 250) / 100),
      confidence: "low",
      note: "Estimate based on default serving size; AI refinement currently unavailable.",
    };
  }
}
