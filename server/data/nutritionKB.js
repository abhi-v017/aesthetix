// Small curated nutrition/fitness knowledge base used to ground the RAG coach.
// In production this would be a larger corpus (USDA FoodData Central, ACSM
// guidelines, etc.) loaded from a real vector DB (Pinecone/Weaviate/pgvector).
// Keeping it in-repo keeps the demo runnable with zero external services.

export const nutritionKB = [
  {
    id: "protein-intake",
    topic: "Protein requirements",
    text: "For muscle growth, aim for 1.6-2.2g of protein per kg of bodyweight per day, spread across 3-5 meals. For fat loss while preserving muscle, the higher end of that range (up to 2.4g/kg) is often more effective, especially in a calorie deficit.",
  },
  {
    id: "calorie-deficit",
    topic: "Fat loss calorie deficit",
    text: "A sustainable fat loss rate is 0.5-1% of bodyweight per week, achieved through a 300-500 kcal daily deficit. Deficits larger than 25% of maintenance calories increase muscle loss risk and are harder to sustain.",
  },
  {
    id: "calorie-surplus",
    topic: "Muscle gain calorie surplus",
    text: "For lean muscle gain, a surplus of 200-300 kcal above maintenance supports growth while limiting fat gain. Combine with progressive overload resistance training at least 3x per week.",
  },
  {
    id: "carb-timing",
    topic: "Carbohydrate timing",
    text: "Carbohydrates consumed around training (1-2 hours before and within 2 hours after) improve performance and recovery by replenishing muscle glycogen. Total daily carb intake matters more than precise timing for most recreational trainees.",
  },
  {
    id: "hydration",
    topic: "Hydration",
    text: "Aim for roughly 30-35ml of water per kg of bodyweight daily, increasing by 500-750ml per hour of moderate-to-intense exercise, more in hot/humid conditions.",
  },
  {
    id: "sleep-recovery",
    topic: "Sleep and recovery",
    text: "7-9 hours of sleep is associated with better strength gains, appetite regulation, and reduced injury risk. Poor sleep raises cortisol and can blunt fat loss even with a correct calorie deficit.",
  },
  {
    id: "fiber",
    topic: "Fiber intake",
    text: "25-38g of fiber daily supports satiety and gut health, which helps adherence to a calorie deficit. Vegetables, legumes, and whole grains are the primary sources.",
  },
  {
    id: "meal-frequency",
    topic: "Meal frequency",
    text: "Meal frequency (2 vs 6 meals/day) has minimal independent effect on fat loss or muscle gain when total daily protein and calories are matched. Choose a frequency that fits adherence and lifestyle.",
  },
  {
    id: "cardio-vs-weights",
    topic: "Cardio vs resistance training for fat loss",
    text: "Resistance training preserves lean mass during a deficit better than cardio alone. A combination — 2-4 resistance sessions plus 100-150 minutes of moderate cardio weekly — is most effective for body recomposition.",
  },
  {
    id: "bmi-limitation",
    topic: "BMI limitations",
    text: "BMI does not distinguish muscle from fat mass, so it can misclassify muscular individuals as overweight. Body fat percentage and waist circumference are more informative for physique goals.",
  },
];
