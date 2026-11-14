/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0a",       // very dark background (almost black)
        teal: "#151515",      // surface element background (neutral dark card)
        coral: "#FF4500",     // electric orange accent for motivation
        coralHover: "#ff571a",
        sand: "#0d0d0d",      // root main canvas background
        line: "#222222",      // subtle borders
        lineLight: "#2e2e2e",
        sage: "#3b82f6",      // secondary accent (electric blue)
        emerald: "#10b981",   // healthy/fat or streak accent
        amber: "#f59e0b",     // carbs accent
        textMain: "#f5f5f5",
        textMuted: "#9ca3af",
        textSubtle: "#6b7280"
      },
      boxShadow: {
        'neumorphic': '8px 8px 16px #050505, -8px -8px 16px #1b1b1b',
        'neumorphic-sm': '4px 4px 8px #050505, -4px -4px 8px #1b1b1b',
        'neumorphic-xs': '2px 2px 4px #050505, -2px -2px 4px #1b1b1b',
        'neumorphic-inner': 'inset 4px 4px 8px #050505, inset -4px -4px 8px #1b1b1b',
        'neumorphic-inner-sm': 'inset 2px 2px 5px #050505, inset -2px -2px 5px #1b1b1b',
        'neumorphic-coral': '0 0 20px rgba(255, 69, 0, 0.25), 6px 6px 14px #050505',
        'neumorphic-sage': '0 0 20px rgba(59, 130, 246, 0.25), 6px 6px 14px #050505',
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      animation: {
        'bounce-slight': 'bounce 2.5s infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
