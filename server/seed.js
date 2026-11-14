import dotenv from "dotenv";
dotenv.config();

import { seedDemoUser, DEMO_USER } from "./services/seedService.js";

async function main() {
  console.log("=== AESTHETIX DEMO SEEDER ===");
  try {
    const result = await seedDemoUser();
    console.log("Seeding completed successfully!");
    console.log("-----------------------------------------");
    console.log("Recruiter Demo Credentials:");
    console.log(`Email:    ${DEMO_USER.email}`);
    console.log(`Password: ${DEMO_USER.password}`);
    console.log("-----------------------------------------");
    console.log("Seeded data:");
    console.log("- Full Athlete Profile (Recomp, 26yo, 78kg -> 75kg)");
    console.log("- 4-Day Progressive Overload Workout Split");
    console.log("- 4-Meal Science-Backed Nutrition Protocol (2400 kcal, 175g protein)");
    console.log("- 3 Live Meal Logs for today (1600 kcal & 128g protein logged)");
    console.log("- Active 4-Day Momentum Streak");
    console.log("=========================================");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

main();
