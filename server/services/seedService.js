import admin, { db, auth } from "../config/firebase.js";

export const DEMO_USER = {
  email: "recruiter@aesthetix.ai",
  password: "recruiter123",
  displayName: "Recruiter Demo Athlete",
};

export async function seedDemoUser() {
  console.log(`[Seed] Checking demo user: ${DEMO_USER.email}...`);
  let userRecord;

  try {
    userRecord = await auth.getUserByEmail(DEMO_USER.email);
    console.log(`[Seed] Found existing demo user with UID: ${userRecord.uid}`);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      console.log(`[Seed] User not found. Creating new auth account...`);
      userRecord = await auth.createUser({
        email: DEMO_USER.email,
        password: DEMO_USER.password,
        displayName: DEMO_USER.displayName,
      });
      console.log(`[Seed] Auth account created with UID: ${userRecord.uid}`);
    } else {
      console.error(`[Seed] Firebase Auth lookup error:`, err.message);
      throw err;
    }
  }

  const uid = userRecord.uid;

  // 1. Biometric Physiological Profile
  const profile = {
    age: 26,
    sex: "male",
    heightCm: 180,
    currentWeightKg: 78,
    targetWeightKg: 75,
    activityLevel: "moderate",
    goal: "recomp",
    dietaryRestrictions: ["none"],
    workoutTime: "18:00",
    updatedAt: new Date().toISOString(),
  };

  const today = new Date();
  const getFormatDate = (daysAgo) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Seed 4 days of completed workouts (today, yesterday, 2 days ago, 3 days ago)
  const completedDates = [
    getFormatDate(3),
    getFormatDate(2),
    getFormatDate(1),
    getFormatDate(0),
  ];

  await db.collection("users").doc(uid).set(
    {
      profile,
      completedDates,
      fcmToken: null,
      latestReminderTimes: ["08:30", "13:00", "16:30", "20:00"],
    },
    { merge: true }
  );
  console.log(`[Seed] Seeded profile and ${completedDates.length} completed dates for UID: ${uid}`);

  // 2. 4-Day Progressive Overload Training Protocol
  const trainingPlan = {
    summary:
      "A hypertrophy-focused Upper/Lower protocol emphasizing progressive overload on foundational compound movements with dedicated metabolic conditioning.",
    weeklySplit: [
      {
        day: "Day 1",
        focus: "Upper Body Power & Vertical Pull",
        exercises: [
          { name: "Barbell Bench Press", sets: 4, reps: "6-8", notes: "2 min rest between sets" },
          { name: "Weighted Pull-ups", sets: 3, reps: "6-8", notes: "Control the eccentric phase" },
          { name: "Standing Overhead Press", sets: 3, reps: "8-10", notes: "Strict form, squeeze glutes" },
          { name: "Chest-Supported Row", sets: 3, reps: "10-12", notes: "Full scapular retraction" },
        ],
      },
      {
        day: "Day 2",
        focus: "Lower Body Strength & Posterior Chain",
        exercises: [
          { name: "Barbell Back Squat", sets: 4, reps: "6-8", notes: "Hit parallel depth consistently" },
          { name: "Romanian Deadlift", sets: 3, reps: "8-10", notes: "Hinge at hips, keep bar close" },
          { name: "Walking Dumbbell Lunges", sets: 3, reps: "12 per leg", notes: "Knee over midfoot" },
          { name: "Standing Calf Raises", sets: 4, reps: "15", notes: "Hold stretch at bottom 1s" },
        ],
      },
      {
        day: "Day 3",
        focus: "Active Recovery & Core Stability",
        exercises: [
          { name: "Hanging Leg Raises", sets: 3, reps: "12-15", notes: "Avoid swinging momentum" },
          { name: "Weighted Plank", sets: 3, reps: "60s", notes: "Tuck pelvis and brace" },
          { name: "Zone 2 Incline Walk", sets: 1, reps: "30 mins", notes: "Maintain conversational pace" },
        ],
      },
      {
        day: "Day 4",
        focus: "Full Body Hypertrophy & Arms",
        exercises: [
          { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", notes: "30 degree bench angle" },
          { name: "Barbell Front Squat", sets: 3, reps: "8-10", notes: "Elbows high, upright torso" },
          { name: "Neutral-Grip Lat Pulldown", sets: 3, reps: "10-12", notes: "Pull to upper chest" },
          { name: "Dumbbell Lateral Raises", sets: 4, reps: "15", notes: "Slight forward lean" },
        ],
      },
    ],
    tdee: 2650,
    bmr: 1780,
    cardioRecommendation: "20 minutes of steady-state Zone 2 cardio post-lifting sessions or on rest days.",
    estimatedTimelineWeeks: 12,
    generatedAt: new Date().toISOString(),
  };

  // Add plan to plans subcollection
  await db.collection("users").doc(uid).collection("plans").add(trainingPlan);
  console.log(`[Seed] Seeded active resistance protocol`);

  // 3. Science-Backed Nutrition Protocol
  const dietPlan = {
    dailyCalorieTarget: 2400,
    dailyProteinTargetG: 175,
    rationale:
      "Calibrated for athletic body recomposition: prioritizing 1.8-2.2g/kg protein distribution across 4 feeding windows to maximize muscle protein synthesis while sustaining a mild ~250 kcal deficit for fat loss.",
    meals: [
      {
        name: "Power Breakfast",
        items: ["4 Whole Scrambled Eggs with Spinach", "1 cup Rolled Oatmeal with Blueberries", "Black Coffee"],
        calories: 580,
        protein: 38,
      },
      {
        name: "High-Protein Fuel Lunch",
        items: ["220g Grilled Chicken Breast", "1 cup Steamed Brown Rice", "Steamed Broccoli with Olive Oil"],
        calories: 680,
        protein: 54,
      },
      {
        name: "Pre-Workout Anabolic Snack",
        items: ["200g 0% Greek Yogurt", "1 Medium Banana", "1 scoop Whey Isolate"],
        calories: 340,
        protein: 36,
      },
      {
        name: "Recovery Dinner",
        items: ["180g Wild Salmon Fillet", "Baked Sweet Potato", "Grilled Asparagus"],
        calories: 620,
        protein: 47,
      },
    ],
    reminderTimes: ["08:30", "13:00", "16:30", "20:00"],
    groundedOn: [
      "Protein Requirements for Recomposition",
      "Carbohydrate Timing around Training",
      "Caloric Deficit Constraints",
      "Hydration & Electrolytes",
    ],
    generatedAt: new Date().toISOString(),
  };

  await db.collection("users").doc(uid).collection("dietPlans").add(dietPlan);
  console.log(`[Seed] Seeded diet protocol`);

  // 4. Seed Logged Meals For Today (so Macro Rings on Dashboard show live 67% Cals & 73% Protein progress!)
  const now = new Date();
  const breakfastTime = new Date(now);
  breakfastTime.setHours(8, 30, 0, 0);

  const lunchTime = new Date(now);
  lunchTime.setHours(13, 15, 0, 0);

  const snackTime = new Date(now);
  snackTime.setHours(16, 45, 0, 0);

  // Clear older logs for a clean recruiter experience
  const oldLogsSnap = await db.collection("users").doc(uid).collection("logs").limit(50).get();
  const batch = db.batch();
  oldLogsSnap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  const logs = [
    {
      type: "food_log",
      summary: "Logged Scrambled Eggs & Oatmeal: 580 kcal, 38g protein.",
      estimate: {
        food: "Scrambled Eggs & Oatmeal",
        estimatedGrams: 350,
        calories: 580,
        protein: 38,
        carbs: 55,
        fat: 22,
        confidence: "high",
        note: "High biological value morning protein base.",
      },
      classifications: [
        { label: "scrambled_eggs", score: 0.96 },
        { label: "oatmeal", score: 0.88 },
      ],
      createdAt: breakfastTime,
    },
    {
      type: "food_log",
      summary: "Logged Grilled Chicken Rice Bowl: 680 kcal, 54g protein.",
      estimate: {
        food: "Grilled Chicken & Rice Bowl",
        estimatedGrams: 420,
        calories: 680,
        protein: 54,
        carbs: 68,
        fat: 16,
        confidence: "high",
        note: "Optimal post-training glycogen and leucine replenishment.",
      },
      classifications: [
        { label: "chicken_breast", score: 0.94 },
        { label: "brown_rice", score: 0.85 },
      ],
      createdAt: lunchTime,
    },
    {
      type: "food_log",
      summary: "Logged Greek Yogurt & Banana: 340 kcal, 36g protein.",
      estimate: {
        food: "Greek Yogurt & Banana",
        estimatedGrams: 280,
        calories: 340,
        protein: 36,
        carbs: 42,
        fat: 4,
        confidence: "high",
        note: "Pre-workout slow-digesting casein + whey blend.",
      },
      classifications: [
        { label: "greek_yogurt", score: 0.92 },
        { label: "banana", score: 0.89 },
      ],
      createdAt: snackTime,
    },
    {
      type: "diet_plan",
      summary: `Diet plan generated: 2400 kcal, 175g protein/day for goal recomp.`,
      createdAt: breakfastTime,
    },
  ];

  for (const log of logs) {
    await db.collection("users").doc(uid).collection("logs").add(log);
  }

  console.log(`[Seed] Seeded ${logs.length} live logs for today.`);
  return {
    success: true,
    uid,
    email: DEMO_USER.email,
    password: DEMO_USER.password,
    metrics: {
      caloriesLogged: 1600,
      caloriesTarget: 2400,
      proteinLogged: 128,
      proteinTarget: 175,
      streak: "4 Day Streak",
    },
  };
}
