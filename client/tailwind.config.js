/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0a",       // very dark background (almost black)
        teal: "#171717",      // element background (neutral dark gray)
        coral: "#FF4500",     // solid electric orange for high energy/motivation
        sand: "#0f0f0f",      // main background
        line: "#262626",      // dark borders
        sage: "#3b82f6",      // secondary accent (solid blue)
        textMain: "#f5f5f5",
        textMuted: "#a3a3a3"
      },
      boxShadow: {
        'neumorphic': '6px 6px 12px #060606, -6px -6px 12px #181818',
        'neumorphic-inner': 'inset 4px 4px 8px #060606, inset -4px -4px 8px #181818',
        'neumorphic-sm': '3px 3px 6px #060606, -3px -3px 6px #181818',
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      animation: {
        'bounce-slight': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
};
