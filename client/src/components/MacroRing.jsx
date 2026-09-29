import React from "react";

// A simple SVG progress ring for calories/protein, used instead of a
// generic shadowed stat card -- the ring itself encodes progress-toward-goal.
export default function MacroRing({ label, value, target, unit }) {
  const pct = target ? Math.min(value / target, 1) : 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-xl shadow-neumorphic bg-teal">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#262626" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#FF4500"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
        <text x="50" y="54" textAnchor="middle" fontSize="16" fontWeight="600" fill="#e4e4e7">
          {Math.round(value)}
        </text>
      </svg>
      <div className="text-center">
        <div className="text-sm font-medium text-textMain">{label}</div>
        <div className="text-xs text-textMuted">
          of {target || "—"} {unit}
        </div>
      </div>
    </div>
  );
}
