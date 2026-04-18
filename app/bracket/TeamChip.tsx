"use client";

import type { CSSProperties } from "react";
import { TEAMS } from "./wc-data";

export type ChipVariant = "pill" | "square" | "flag";

export function FlagSvg({
  stripes = [],
  w = 22,
  h = 16,
  radius = 3,
  orientation = "v",
}: {
  stripes?: string[];
  w?: number;
  h?: number;
  radius?: number;
  orientation?: "v" | "h";
}) {
  const n = stripes.length || 1;
  const id = `clip-${w}-${h}-${radius}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", borderRadius: radius, overflow: "hidden" }}>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={w} height={h} rx={radius} ry={radius} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {stripes.map((c, i) => {
          if (orientation === "h") {
            const sh = h / n;
            return <rect key={i} x={0} y={i * sh} width={w} height={sh} fill={c} />;
          }
          const sw = w / n;
          return <rect key={i} x={i * sw} y={0} width={sw} height={h} fill={c} />;
        })}
        <rect x={0} y={0} width={w} height={h} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={0.75} />
      </g>
    </svg>
  );
}

export function TeamChip({
  team,
  seed,
  status = "idle",
  variant = "pill",
  showSeed = true,
  showFlag = true,
  showScore = false,
  score = null,
  onClick,
  highlight = false,
  dim = false,
  small = false,
}: {
  team: string | null;
  seed?: number;
  status?: "idle" | "winner";
  variant?: ChipVariant;
  showSeed?: boolean;
  showFlag?: boolean;
  showScore?: boolean;
  score?: string | number | null;
  onClick?: () => void;
  highlight?: boolean;
  dim?: boolean;
  small?: boolean;
}) {
  const T = team ? TEAMS[team] : null;
  const empty = !T;
  const name = T?.name ?? "—";
  const stripes = T?.stripes ?? ["#ddd", "#bbb"];
  const s = seed ?? T?.seed;

  const base: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    minWidth: 0,
    height: small ? 26 : 32,
    padding: variant === "square" ? "0 10px" : "0 10px 0 4px",
    cursor: empty ? "default" : "pointer",
    background: "var(--chip-bg)",
    color: empty ? "var(--ink-muted)" : "var(--ink)",
    border: `1px solid ${highlight ? "var(--accent)" : "var(--chip-border)"}`,
    borderRadius: variant === "square" ? 2 : variant === "flag" ? 4 : 999,
    fontFamily: "var(--sans)",
    fontSize: small ? 11 : 12.5,
    fontWeight: status === "winner" ? 600 : 500,
    letterSpacing: status === "winner" ? "-0.005em" : 0,
    opacity: dim ? 0.42 : 1,
    boxShadow: highlight ? "0 0 0 3px color-mix(in oklch, var(--accent) 22%, transparent)" : "none",
    transition: "background 120ms, border-color 120ms, opacity 160ms, box-shadow 160ms, transform 120ms",
    userSelect: "none",
    position: "relative",
  };
  if (variant === "square") base.paddingLeft = 8;

  const seedDot = s != null && showSeed && (
    <span
      style={{
        flex: "0 0 auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: small ? 18 : 22,
        height: small ? 18 : 22,
        borderRadius: 999,
        background: `var(--seed-${s})`,
        color: "#fff",
        fontFamily: "var(--mono)",
        fontSize: small ? 9 : 10,
        fontWeight: 600,
      }}
    >
      {s}
    </span>
  );

  const flagEl =
    showFlag &&
    (variant === "flag" ? (
      <FlagSvg stripes={stripes} w={small ? 18 : 22} h={small ? 12 : 14} radius={2} />
    ) : (
      <FlagSvg stripes={stripes} w={small ? 14 : 16} h={small ? 10 : 12} radius={2} />
    ));

  return (
    <button
      type="button"
      onClick={empty ? undefined : onClick}
      disabled={empty}
      style={base}
      onMouseEnter={(e) => {
        if (!empty) (e.currentTarget as HTMLButtonElement).style.background = "var(--chip-bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (!empty) (e.currentTarget as HTMLButtonElement).style.background = "var(--chip-bg)";
      }}
    >
      {variant === "pill" && seedDot}
      {variant !== "pill" && showSeed && s != null && (
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: small ? 9 : 10,
            fontWeight: 600,
            color: `var(--seed-${s})`,
            width: 14,
            textAlign: "left",
          }}
        >
          {s}
        </span>
      )}
      {variant !== "pill" && flagEl}
      {variant === "pill" && flagEl}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textAlign: "left",
        }}
      >
        {empty ? "—" : name}
      </span>
      {showScore && score != null && (
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: small ? 10 : 11,
            color: status === "winner" ? "var(--ink)" : "var(--ink-muted)",
            fontWeight: 600,
          }}
        >
          {score}
        </span>
      )}
      {status === "winner" && !showScore && (
        <span
          style={{
            flex: "0 0 auto",
            fontFamily: "var(--mono)",
            fontSize: 10,
            fontWeight: 700,
            color: "var(--accent)",
            letterSpacing: "0.1em",
          }}
        >
          ↑
        </span>
      )}
    </button>
  );
}

export function TrophyIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v4a5 5 0 01-10 0V4z" />
      <path d="M17 5h3v2a3 3 0 01-3 3" />
      <path d="M7 5H4v2a3 3 0 003 3" />
      <path d="M10 14h4v3h-4z" />
      <path d="M8 20h8" />
      <path d="M12 17v3" />
    </svg>
  );
}
