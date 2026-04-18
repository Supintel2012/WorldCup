"use client";

import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { FlagSvg } from "./TeamChip";
import { TEAMS } from "./wc-data";

export type PickerAnchor = { x: number; y: number; width: number; height: number };

const SEED_ROW_BG: Record<number, string> = {
  1: "color-mix(in oklch, var(--c-green) 22%, transparent)",
  2: "color-mix(in oklch, var(--c-blue) 18%, transparent)",
  3: "color-mix(in oklch, var(--c-red) 16%, transparent)",
  4: "color-mix(in oklch, var(--seed-4) 20%, transparent)",
};

export function TeamPicker({
  open,
  candidates,
  currentPick,
  anchor,
  title,
  subtitle,
  themeStyle,
  onSelect,
  onClear,
  onClose,
}: {
  open: boolean;
  candidates: string[];
  currentPick: string | null;
  anchor: PickerAnchor | null;
  title: string;
  subtitle?: string;
  themeStyle?: CSSProperties;
  onSelect: (team: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !anchor || typeof window === "undefined") return;
    const W = 288;
    const maxH = Math.min(480, window.innerHeight - 32);
    let top = anchor.y + anchor.height + 8;
    let left = anchor.x;
    if (top + maxH > window.innerHeight - 8) {
      const flipped = anchor.y - 8 - maxH;
      if (flipped >= 8) top = flipped;
      else top = Math.max(8, window.innerHeight - maxH - 8);
    }
    if (left + W > window.innerWidth - 8) left = Math.max(8, window.innerWidth - W - 8);
    if (left < 8) left = 8;
    setPos({ top, left, maxHeight: maxH });
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open || !anchor || !pos) return null;

  const sorted = [...candidates].sort((a, b) => {
    const sa = TEAMS[a].seed;
    const sb = TEAMS[b].seed;
    if (sa !== sb) return sa - sb;
    return TEAMS[a].name.localeCompare(TEAMS[b].name);
  });

  const style: CSSProperties = {
    ...(themeStyle ?? {}),
    position: "fixed",
    top: pos.top,
    left: pos.left,
    width: 288,
    maxHeight: pos.maxHeight,
    zIndex: 400,
    background: "var(--panel-bg)",
    border: "1px solid var(--panel-border)",
    borderRadius: 12,
    boxShadow: "0 28px 60px -18px rgba(0,0,0,0.55)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "var(--sans)",
    color: "var(--ink)",
  };

  return createPortal(
    <div ref={ref} style={style}>
      <div
        style={{
          padding: "10px 14px 10px",
          borderBottom: "1px solid var(--panel-border)",
          background:
            "linear-gradient(90deg, color-mix(in oklch, var(--c-red) 14%, var(--panel-bg)), color-mix(in oklch, var(--c-blue) 14%, var(--panel-bg)) 50%, color-mix(in oklch, var(--c-green) 14%, var(--panel-bg)))",
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9.5,
            letterSpacing: "0.18em",
            color: "var(--ink-muted)",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 16,
              fontStyle: "italic",
              marginTop: 2,
              lineHeight: 1.15,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          onClear();
          onClose();
        }}
        disabled={!currentPick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          border: "none",
          borderBottom: "1px solid var(--panel-border)",
          background: "transparent",
          color: currentPick ? "var(--ink)" : "var(--ink-faint)",
          cursor: currentPick ? "pointer" : "not-allowed",
          fontSize: 13,
          fontWeight: 500,
          textAlign: "left",
          fontFamily: "var(--sans)",
        }}
      >
        <EraserIcon />
        Clear Pick
      </button>

      <div style={{ flex: 1, overflowY: "auto", padding: 4 }}>
        {sorted.length === 0 && (
          <div
            style={{
              padding: "16px 12px",
              fontFamily: "var(--sans)",
              fontSize: 12.5,
              color: "var(--ink-muted)",
              textAlign: "center",
            }}
          >
            Fill the semifinals first to pick the bronze match.
          </div>
        )}
        {sorted.map((code) => {
          const T = TEAMS[code];
          const picked = currentPick === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => {
                onSelect(code);
                onClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "7px 10px",
                margin: "2px 0",
                border: picked ? "1px solid var(--accent)" : "1px solid transparent",
                borderRadius: 8,
                background: picked
                  ? "color-mix(in oklch, var(--accent) 22%, transparent)"
                  : SEED_ROW_BG[T.seed],
                color: "var(--ink)",
                fontFamily: "var(--sans)",
                fontSize: 13,
                fontWeight: picked ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  flex: "0 0 auto",
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: `var(--seed-${T.seed})`,
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {T.seed}
              </span>
              <FlagSvg stripes={T.stripes} w={18} h={12} radius={2} />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {T.name}
              </span>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9.5,
                  color: "var(--ink-muted)",
                  letterSpacing: "0.06em",
                }}
              >
                {T.code}
              </span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

function EraserIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 4l5 5-9 9H6l-3-3z" />
      <path d="M9 10l6 6" />
      <path d="M5 21h15" />
    </svg>
  );
}
