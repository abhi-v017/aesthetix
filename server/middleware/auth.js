import { auth } from "../config/firebase.js";

// Verifies the Firebase ID token sent by the React client in the
// Authorization: Bearer <token> header, and attaches the decoded user to req.user
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (err) {
    console.error("Auth verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
