// Per-100g macro reference for the food classes the local vision model
// recognizes. Real product: swap for a USDA FoodData Central API lookup.
export const foodNutritionDB = {
  pizza: { calories: 266, protein: 11, carbs: 33, fat: 10 },
  hamburger: { calories: 295, protein: 17, carbs: 24, fat: 14 },
  sushi: { calories: 150, protein: 6, carbs: 30, fat: 0.7 },
  salad: { calories: 20, protein: 1.5, carbs: 4, fat: 0.2 },
  steak: { calories: 271, protein: 25, carbs: 0, fat: 19 },
  chicken_curry: { calories: 165, protein: 14, carbs: 6, fat: 10 },
  fried_rice: { calories: 163, protein: 4, carbs: 20, fat: 7 },
  pasta: { calories: 158, protein: 6, carbs: 31, fat: 1 },
  ice_cream: { calories: 207, protein: 3.5, carbs: 24, fat: 11 },
  omelette: { calories: 154, protein: 11, carbs: 1, fat: 12 },
  pancakes: { calories: 227, protein: 6, carbs: 28, fat: 10 },
  french_fries: { calories: 312, protein: 3.4, carbs: 41, fat: 15 },
  donuts: { calories: 452, protein: 4.9, carbs: 51, fat: 25 },
  sandwich: { calories: 250, protein: 12, carbs: 28, fat: 10 },
  soup: { calories: 60, protein: 3, carbs: 8, fat: 2 },
};

// Fallback used when the classifier returns a label not in this table.
export const defaultFoodEstimate = { calories: 200, protein: 8, carbs: 20, fat: 8 };
