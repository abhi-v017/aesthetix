import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signup(email, password);
      navigate("/onboarding");
    } catch (err) {
      setError(err.message.includes("weak-password") ? "Password must be at least 6 characters." : "Couldn't create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-24">
      <h1 className="text-2xl font-display font-semibold mb-1">Create your account</h1>
      <p className="text-ink/60 mb-8 text-sm">Start with a quick profile so your plan fits you.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border hairline rounded px-3 py-2 bg-white text-sm"
        />
        <input
          type="password"
          required
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border hairline rounded px-3 py-2 bg-white text-sm"
        />
        {error && <p className="text-sm text-coral">{error}</p>}
        <button
          disabled={busy}
          className="bg-teal text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Creating..." : "Create account"}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-teal font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
