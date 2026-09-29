import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
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
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Couldn't sign in — check your email and password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-24">
      <h1 className="text-2xl font-display font-semibold mb-1">Welcome back</h1>
      <p className="text-ink/60 mb-8 text-sm">Sign in to your Forma coach.</p>

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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border hairline rounded px-3 py-2 bg-white text-sm"
        />
        {error && <p className="text-sm text-coral">{error}</p>}
        <button
          disabled={busy}
          className="bg-teal text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-6">
        New here?{" "}
        <Link to="/signup" className="text-teal font-medium">
          Create an account
        </Link>
      </p>
    </div>
  );
}
