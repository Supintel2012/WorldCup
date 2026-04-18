"use client";

import { FRIENDS } from "./wc-data";

export function btnStyle(): React.CSSProperties {
  return {
    fontFamily: "var(--sans)",
    fontSize: 11,
    padding: "5px 10px",
    borderRadius: 999,
    border: "1px solid var(--panel-border)",
    background: "var(--chip-bg)",
    color: "var(--ink)",
    cursor: "pointer",
    fontWeight: 500,
  };
}

export function Leaderboard({
  myChampion,
  pickCount,
  totalPicks,
  onInvite,
  onDMByName,
}: {
  myChampion: string | null;
  pickCount: number;
  totalPicks: number;
  onInvite?: () => void;
  onDMByName?: (displayName: string) => boolean;
}) {
  const me = FRIENDS[0];
  const rest = FRIENDS.slice(1).sort((a, b) => b.pts - a.pts);
  const myEntry = {
    ...me,
    pts: Math.round(40 + (pickCount / totalPicks) * 55),
    pick: myChampion || "—",
  };
  const sorted = [...rest, myEntry].sort((a, b) => b.pts - a.pts);

  return (
    <div
      style={{
        background: "var(--panel-bg)",
        border: "1px solid var(--panel-border)",
        borderRadius: 8,
        padding: "14px 14px 10px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 17, fontStyle: "italic", fontWeight: 500, lineHeight: 1 }}>
            Pool · Group Chat
          </div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9.5,
              letterSpacing: "0.12em",
              color: "var(--ink-muted)",
              textTransform: "uppercase",
              marginTop: 4,
            }}
          >
            8 friends · Round of 32
          </div>
        </div>
        <button style={btnStyle()} onClick={() => onInvite?.()}>
          + Invite
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {sorted.map((f, i) => {
          const isMe = f.name === "you";
          const canDM = !isMe && onDMByName != null;
          return (
            <div
              key={f.name}
              onClick={() => {
                if (!canDM) return;
                onDMByName?.(f.name);
              }}
              style={{
                display: "grid",
                gridTemplateColumns: "18px 22px 1fr auto auto",
                alignItems: "center",
                gap: 8,
                padding: "6px 6px",
                borderRadius: 4,
                background: isMe ? "color-mix(in oklch, var(--accent) 10%, transparent)" : "transparent",
                border: isMe ? "1px solid color-mix(in oklch, var(--accent) 25%, transparent)" : "1px solid transparent",
                cursor: canDM ? "pointer" : "default",
              }}
              title={canDM ? `Message ${f.name}` : undefined}
            >
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: i === 0 ? "var(--accent)" : "var(--ink-muted)",
                  fontWeight: 600,
                }}
              >
                {i + 1}
              </span>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: `var(--seed-${(i % 4) + 1})`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {f.avatar}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: isMe ? 600 : 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isMe ? "You" : f.name}
                  {f.badge ? ` ${f.badge}` : ""}
                </div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    letterSpacing: "0.08em",
                    color: "var(--ink-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  {f.correct}/{f.total} correct · picks {f.pick}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: isMe ? "var(--accent)" : "var(--ink)",
                }}
              >
                {f.pts}
              </div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  color: i === 0 ? "var(--accent)" : "var(--ink-faint)",
                  width: 26,
                  textAlign: "right",
                }}
              >
                {i === 0 ? "LEAD" : `-${sorted[0].pts - f.pts}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

