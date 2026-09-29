import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-16 text-ink/50">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
