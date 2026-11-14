import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-teal border border-line flex items-center justify-center shadow-neumorphic animate-spin">
          <span className="text-coral text-sm">⚙️</span>
        </div>
        <span className="text-xs font-mono text-textMuted uppercase tracking-wider">
          Authenticating Athlete...
        </span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
