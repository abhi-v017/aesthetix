import React from "react";

export default function MacroRing({ label, value = 0, target, unit, color = "coral" }) {
  const safeValue = Number(value) || 0;
  const safeTarget = Number(target) || 0;
  const pct = safeTarget > 0 ? Math.min(safeValue / safeTarget, 1) : 0;
  const pctDisplay = safeTarget > 0 ? Math.round((safeValue / safeTarget) * 100) : 0;
  
  const radius = 44;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  const strokeColor = color === "sage" ? "#3b82f6" : "#FF4500";
  const glowShadow = color === "sage" ? "drop-shadow(0 0 6px rgba(59,130,246,0.35))" : "drop-shadow(0 0 6px rgba(255,69,0,0.35))";
  const badgeColor = color === "sage" ? "text-sage bg-sage/10 border-sage/30" : "text-coral bg-coral/10 border-coral/30";

  return (
    <div className="card-neu p-5 flex flex-col sm:flex-row items-center gap-5 justify-between relative overflow-hidden group hover:border-line transition-all">
      {/* Visual Ring Well */}
      <div className="relative flex items-center justify-center p-3 rounded-2xl bg-sand shadow-neumorphic-inner border border-line/40 shrink-0">
        <svg width="112" height="112" viewBox="0 0 112 112" className="transform -rotate-90">
          {/* Background Track with soft inset appearance */}
          <circle 
            cx="56" 
            cy="56" 
            r={radius} 
            fill="none" 
            stroke="#1c1c1c" 
            strokeWidth={strokeWidth} 
          />
          {/* Active Progress Ring */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ 
              transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: pct > 0 ? glowShadow : "none"
            }}
          />
        </svg>

        {/* Inner Centered Percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-display font-extrabold text-textMain tracking-tight">
            {pctDisplay}%
          </span>
          <span className="text-[10px] text-textSubtle font-medium uppercase tracking-wider">
            done
          </span>
        </div>
      </div>

      {/* Info & Metrics */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-bold text-textMain tracking-wide uppercase font-display">
            {label}
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${badgeColor}`}>
            {pctDisplay >= 100 ? "Goal Met" : pctDisplay >= 50 ? "On Track" : "In Progress"}
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-3xl font-display font-extrabold text-textMain tracking-tight">
            {Math.round(safeValue)}
          </span>
          <span className="text-xs text-textMuted font-mono">
            / {safeTarget > 0 ? safeTarget : "—"} {unit}
          </span>
        </div>

        {/* Remaining info pill */}
        <div className="text-xs text-textSubtle flex items-center gap-1.5 font-medium">
          {safeTarget > safeValue ? (
            <span>
              ⚡ <strong className="text-textMuted font-semibold">{Math.round(safeTarget - safeValue)} {unit}</strong> remaining today
            </span>
          ) : safeTarget > 0 ? (
            <span className="text-emerald font-semibold">🎉 Target achieved for today!</span>
          ) : (
            <span>Set diet protocol to calculate target</span>
          )}
        </div>
      </div>
    </div>
  );
}
