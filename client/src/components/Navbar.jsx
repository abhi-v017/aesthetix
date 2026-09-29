import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/dashboard", label: "🏠 Home" },
  { to: "/diet", label: "🥗 Diet" },
  { to: "/scan", label: "📸 Scan" },
  { to: "/coach", label: "🤖 Coach" },
  { to: "/profile", label: "👤 Profile" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="border-b border-line bg-teal shadow-neumorphic-sm mb-4 relative z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="font-display text-2xl font-bold tracking-tight text-coral">
            AESTHETIX
          </span>
          
          {/* Mobile Menu Button */}
          <button 
            className="sm:hidden p-2 text-textMuted hover:text-coral transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-6">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors duration-200 ${isActive ? "text-coral" : "text-textMuted hover:text-textMain"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <button
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="text-sm px-3 py-1 rounded-lg bg-sand shadow-neumorphic-sm hover:shadow-neumorphic-inner text-textMuted hover:text-coral transition-all"
            >
              Log out
            </button>
          </nav>
        </div>

        {/* Mobile Nav Dropdown */}
        {isOpen && (
          <nav className="sm:hidden mt-4 pt-4 border-t border-line flex flex-col gap-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block text-base font-medium transition-colors duration-200 ${isActive ? "text-coral" : "text-textMuted hover:text-textMain"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <button
              onClick={async () => {
                setIsOpen(false);
                await logout();
                navigate("/login");
              }}
              className="w-full text-left text-base font-medium text-textMuted hover:text-coral transition-all pt-2 pb-2"
            >
              Log out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
