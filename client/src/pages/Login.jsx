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
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-neu p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle Decorative Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-coral to-transparent opacity-80" />

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-sand border border-line flex items-center justify-center shadow-neumorphic-inner mb-3">
            <span className="text-coral text-2xl font-bold font-display">A</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-textMain tracking-tight">
            Welcome Back
          </h1>
          <p className="text-textMuted text-xs sm:text-sm mt-1">
            Enter your credentials to access your protocol
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="athlete@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-coral/10 border border-coral/30 text-coral text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-coral w-full mt-2 !py-3 !text-sm"
          >
            {busy ? "Authenticating..." : "Sign In to Protocol"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-line/60 text-center text-xs sm:text-sm text-textMuted">
          New to Aesthetix?{" "}
          <Link to="/signup" className="text-coral hover:text-coralHover font-semibold transition-colors">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
