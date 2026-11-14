import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "⚡" },
  { to: "/diet", label: "Nutrition", icon: "🥗" },
  { to: "/scan", label: "Scanner", icon: "📸" },
  { to: "/coach", label: "AI Coach", icon: "🤖" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-sand/90 backdrop-blur-md shadow-neumorphic-sm transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-teal border border-line flex items-center justify-center shadow-neumorphic-sm group-hover:shadow-neumorphic-coral transition-all">
              <span className="text-coral text-lg font-bold">A</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl font-extrabold tracking-tight text-textMain group-hover:text-coral transition-colors">
                AESTHETIX
              </span>
              <span className="text-[9px] uppercase tracking-widest text-textSubtle -mt-1 font-mono">
                AI Protocol
              </span>
            </div>
          </NavLink>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-teal/80 border border-line/60 p-1.5 rounded-2xl shadow-neumorphic-inner">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-sand text-coral shadow-neumorphic-sm border border-line/80"
                      : "text-textMuted hover:text-textMain hover:bg-sand/40"
                  }`
                }
              >
                <span>{l.icon}</span>
                <span>{l.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="btn-neu !py-1.5 !px-3.5 !text-xs !rounded-xl text-textMuted hover:text-coral"
              title="Sign out"
            >
              <span>Logout</span>
              <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2.5 rounded-xl bg-teal border border-line text-textMuted hover:text-coral shadow-neumorphic-sm active:shadow-neumorphic-inner transition-all"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isOpen && (
          <nav className="md:hidden mt-3 pt-3 pb-2 border-t border-line/80 flex flex-col gap-1.5 animate-fadeIn">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-teal text-coral shadow-neumorphic-inner border border-coral/30"
                      : "text-textMuted hover:text-textMain hover:bg-teal/50"
                  }`
                }
              >
                <span className="text-base">{l.icon}</span>
                <span>{l.label}</span>
              </NavLink>
            ))}
            <div className="pt-2 mt-1 border-t border-line/50">
              <button
                onClick={async () => {
                  setIsOpen(false);
                  await logout();
                  navigate("/login");
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold text-textMuted hover:text-coral hover:bg-teal/50 transition-all"
              >
                <span>Sign Out</span>
                <span className="text-xs font-mono text-textSubtle">{user.email?.slice(0, 18)}...</span>
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
