"use client";

import { useEffect, useRef, useState } from "react";
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
}: {
  myChampion: string | null;
  pickCount: number;
  totalPicks: number;
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
        <button style={btnStyle()} onClick={() => alert("Invite flow coming up!")}>
          + Invite
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {sorted.map((f, i) => {
          const isMe = f.name === "you";
          return (
            <div
              key={f.name}
              style={{
                display: "grid",
                gridTemplateColumns: "18px 22px 1fr auto auto",
                alignItems: "center",
                gap: 8,
                padding: "6px 6px",
                borderRadius: 4,
                background: isMe ? "color-mix(in oklch, var(--accent) 10%, transparent)" : "transparent",
                border: isMe ? "1px solid color-mix(in oklch, var(--accent) 25%, transparent)" : "1px solid transparent",
              }}
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

type ChatMsg = { who: string; av: string; text: string; t: string; accent: number; me?: boolean };

export function ChatWidget() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { who: "marcos.b", av: "MB", text: "calling it now — Brazil lifts it again 🏆", t: "14:02", accent: 3 },
    { who: "sofia_p", av: "SP", text: "Argentina back to back, you heard it here first", t: "14:05", accent: 1 },
    { who: "dk.morales", av: "DK", text: "anyone else picking Morocco over Brazil in QF 👀", t: "14:09", accent: 2 },
    { who: "lin.wei", av: "LW", text: "bold take lol", t: "14:11", accent: 4 },
  ]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollTop = endRef.current.scrollHeight;
  }, [msgs]);

  const send = () => {
    if (!draft.trim()) return;
    const now = new Date();
    setMsgs((m) => [
      ...m,
      {
        who: "you",
        av: "YO",
        text: draft.trim(),
        t: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
        accent: 1,
        me: true,
      },
    ]);
    setDraft("");
    setTimeout(() => {
      const replies = ["lmao", "bold pick 👀", "you're cooked", "updating mine rn", "heyyy same 🙌"];
      const r = replies[Math.floor(Math.random() * replies.length)];
      const who = ["marcos.b", "sofia_p", "lin.wei"][Math.floor(Math.random() * 3)];
      const avMap: Record<string, string> = { "marcos.b": "MB", sofia_p: "SP", "lin.wei": "LW" };
      const now2 = new Date();
      setMsgs((m) => [
        ...m,
        {
          who,
          av: avMap[who],
          text: r,
          t: `${now2.getHours()}:${String(now2.getMinutes()).padStart(2, "0")}`,
          accent: Math.ceil(Math.random() * 4),
        },
      ]);
    }, 900);
  };

  return (
    <div
      style={{
        background: "var(--panel-bg)",
        border: "1px solid var(--panel-border)",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        height: 360,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--panel-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 15, fontStyle: "italic", fontWeight: 500, lineHeight: 1 }}>
            Trash talk
          </div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: "0.12em",
              color: "var(--ink-muted)",
              textTransform: "uppercase",
              marginTop: 3,
            }}
          >
            4 online · live
          </div>
        </div>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: "var(--c-green)",
            boxShadow: "0 0 0 3px color-mix(in oklch, var(--c-green) 25%, transparent)",
          }}
        />
      </div>
      <div
        ref={endRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              flexDirection: m.me ? "row-reverse" : "row",
            }}
          >
            <div
              style={{
                flex: "0 0 auto",
                width: 22,
                height: 22,
                borderRadius: 999,
                background: `var(--seed-${m.accent})`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--mono)",
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              {m.av}
            </div>
            <div
              style={{
                maxWidth: "78%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                alignItems: m.me ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  letterSpacing: "0.08em",
                  color: "var(--ink-muted)",
                  textTransform: "uppercase",
                }}
              >
                {m.me ? "you" : m.who} · {m.t}
              </div>
              <div
                style={{
                  background: m.me ? "var(--accent)" : "var(--chip-bg)",
                  color: m.me ? "#fff" : "var(--ink)",
                  padding: "6px 10px",
                  borderRadius: 10,
                  fontSize: 12,
                  lineHeight: 1.4,
                  border: m.me ? "none" : "1px solid var(--chip-border)",
                }}
              >
                {m.text}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          padding: "8px 10px",
          borderTop: "1px solid var(--panel-border)",
          display: "flex",
          gap: 6,
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="talk some trash…"
          style={{
            flex: 1,
            border: "1px solid var(--chip-border)",
            background: "var(--chip-bg)",
            color: "var(--ink)",
            borderRadius: 999,
            padding: "6px 12px",
            fontSize: 12,
            fontFamily: "var(--sans)",
            outline: "none",
          }}
        />
        <button
          onClick={send}
          style={{
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            borderRadius: 999,
            padding: "6px 14px",
            fontSize: 11,
            fontFamily: "var(--sans)",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
