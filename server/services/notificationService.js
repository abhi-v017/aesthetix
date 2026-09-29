import cron from "node-cron";
import { db } from "../config/firebase.js";
import admin from "../config/firebase.js";

/**
 * Meal/workout reminder scheduler.
 *
 * Runs every minute, checks which users have a diet-plan reminderTime
 * matching the current HH:MM, and sends a push notification via Firebase
 * Cloud Messaging to any registered device token. FCM requires the client
 * to request notification permission and register a token (see
 * client/src/lib/notifications.js) -- this is stubbed to no-op safely if
 * FCM_ENABLED is false, so the rest of the app works without it configured.
 */
export function startNotificationScheduler() {
  cron.schedule("* * * * *", async () => {
    if (process.env.FCM_ENABLED !== "true") return;

    const nowHHMM = new Date().toISOString().slice(11, 16);

    try {
      const usersSnap = await db.collection("users").get();
      for (const userDoc of usersSnap.docs) {
        const data = userDoc.data();
        const reminderTimes = data.latestReminderTimes || [];
        const fcmToken = data.fcmToken;
        if (!fcmToken || !reminderTimes.includes(nowHHMM)) continue;

        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: "Meal time 🍽️",
            body: "Time for your next meal — check your diet plan for what's next.",
          },
        });
      }
    } catch (err) {
      console.error("Notification scheduler error:", err.message);
    }
  });

  console.log("Notification scheduler started (runs every minute).");
}

// Called by the client to register its FCM device token against the user doc.
export async function saveDeviceToken(uid, token) {
  await db.collection("users").doc(uid).set({ fcmToken: token }, { merge: true });
}
