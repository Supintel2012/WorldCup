"use client";

import { useMemo } from "react";
import { FlagSvg } from "./TeamChip";
import { TEAMS, type Team } from "./wc-data";

export function GroupStage({ compact = false }: { compact?: boolean }) {
  const groups = useMemo(() => {
    const g: Record<string, Team[]> = {};
    Object.values(TEAMS).forEach((t) => {
      (g[t.group] = g[t.group] || []).push(t);
    });
    Object.keys(g).forEach((k) => g[k].sort((a, b) => a.seed - b.seed));
    return g;
  }, []);

  const pts = [9, 6, 4, 1];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: compact ? 6 : 10,
        width: "100%",
      }}
    >
      {Object.keys(groups)
        .sort()
        .map((key) => (
          <div
            key={key}
            style={{
              background: "var(--panel-bg)",
              border: "1px solid var(--panel-border)",
              borderRadius: 6,
              padding: compact ? "8px 10px" : "10px 12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 6,
                paddingBottom: 6,
                borderBottom: "1px solid var(--panel-border)",
              }}
            >
              <span style={{ fontFamily: "var(--serif)", fontSize: 15, fontWeight: 500, fontStyle: "italic" }}>
                Group {key}
              </span>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  color: "var(--ink-muted)",
                  textTransform: "uppercase",
                }}
              >
                PTS
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {groups[key].map((t, i) => (
                <div
                  key={t.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontFamily: "var(--sans)",
                    color: i < 2 ? "var(--ink)" : "var(--ink-muted)",
                    fontWeight: i < 2 ? 600 : 400,
                  }}
                >
                  <span style={{ width: 14, fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-faint)" }}>
                    {t.seed}
                  </span>
                  <FlagSvg stripes={t.stripes} w={14} h={10} radius={1.5} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.code}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      color: i < 2 ? "var(--accent)" : "var(--ink-faint)",
                      fontWeight: 600,
                    }}
                  >
                    {pts[i] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
