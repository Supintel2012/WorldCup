"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { btnStyle } from "../SidePanels";
import { useChat } from "./ChatProvider";
import type { Member, Message } from "./types";

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function Avatar({ label, accent, size = 22 }: { label: string; accent: number; size?: number }) {
  return (
    <div
      style={{
        flex: "0 0 auto",
        width: size,
        height: size,
        borderRadius: 999,
        background: `var(--seed-${((accent - 1) % 4) + 1})`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--mono)",
        fontSize: size * 0.4,
        fontWeight: 700,
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
}

function TabBar({
  tabs,
  activeKey,
  onPick,
  onClose,
}: {
  tabs: { key: string; label: string; accent?: number; avatar?: string }[];
  activeKey: string;
  onPick: (key: string) => void;
  onClose: (key: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "6px 8px 0",
        borderBottom: "1px solid var(--panel-border)",
        overflowX: "auto",
      }}
    >
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <div
            key={t.key}
            onClick={() => onPick(t.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: "6px 6px 0 0",
              border: "1px solid var(--panel-border)",
              borderBottom: active ? "1px solid var(--panel-bg)" : "1px solid var(--panel-border)",
              background: active ? "var(--panel-bg)" : "var(--chip-bg)",
              color: active ? "var(--ink)" : "var(--ink-muted)",
              fontFamily: "var(--sans)",
              fontSize: 11,
              fontWeight: active ? 600 : 500,
              cursor: "pointer",
              marginBottom: -1,
              whiteSpace: "nowrap",
            }}
          >
            {t.avatar != null && t.accent != null && <Avatar label={t.avatar} accent={t.accent} size={16} />}
            <span>{t.label}</span>
            {t.key !== "pool" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(t.key);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--ink-faint)",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: 1,
                  padding: 0,
                }}
                aria-label="Close thread"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MessageRow({ m, authorMember, isMe }: { m: Message; authorMember: Member | null; isMe: boolean }) {
  const label = authorMember?.avatar ?? (isMe ? "YO" : "??");
  const accent = authorMember?.accent ?? 1;
  const name = authorMember?.display_name ?? "unknown";
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        flexDirection: isMe ? "row-reverse" : "row",
      }}
    >
      <Avatar label={label} accent={accent} />
      <div
        style={{
          maxWidth: "78%",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: isMe ? "flex-end" : "flex-start",
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
          {isMe ? "you" : name} · {hhmm(m.created_at)}
        </div>
        <div
          style={{
            background: isMe ? "var(--accent)" : "var(--chip-bg)",
            color: isMe ? "#fff" : "var(--ink)",
            padding: "6px 10px",
            borderRadius: 10,
            fontSize: 12,
            lineHeight: 1.4,
            border: isMe ? "none" : "1px solid var(--chip-border)",
            wordBreak: "break-word",
          }}
        >
          {m.body}
        </div>
      </div>
    </div>
  );
}

function Shell({ children, header }: { children: React.ReactNode; header?: React.ReactNode }) {
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
      {header}
      {children}
    </div>
  );
}

function NamePromptModal({
  onSubmit,
  title = "Join the chat",
  subtitle = "Your friends will see this name.",
}: {
  onSubmit: (name: string) => void;
  title?: string;
  subtitle?: string;
}) {
  const [name, setName] = useState("");
  const canSubmit = name.trim().length > 0;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 110,
      }}
    >
      <div
        style={{
          width: 380,
          maxWidth: "92vw",
          background: "var(--panel-bg)",
          border: "1px solid var(--panel-border)",
          borderRadius: 10,
          padding: 22,
          color: "var(--ink)",
        }}
      >
        <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 500, fontStyle: "italic", lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ fontFamily: "var(--sans)", fontSize: 12.5, color: "var(--ink-muted)", marginTop: 4, marginBottom: 14 }}>
          {subtitle}
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canSubmit && onSubmit(name)}
          placeholder="your name"
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--chip-border)",
            background: "var(--chip-bg)",
            color: "var(--ink)",
            fontFamily: "var(--sans)",
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button
            disabled={!canSubmit}
            onClick={() => onSubmit(name)}
            style={{
              ...btnStyle(),
              background: canSubmit ? "var(--accent)" : "var(--chip-bg)",
              color: canSubmit ? "#fff" : "var(--ink-faint)",
              border: `1px solid ${canSubmit ? "var(--accent)" : "var(--panel-border)"}`,
              fontWeight: 600,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            Join chat
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatPanel({ onStartChat }: { onStartChat: () => void }) {
  const chat = useChat();
  const { status, identity, members, messages, target, setTarget, send, openDM, setDisplayName, error, pool } = chat;

  const [draft, setDraft] = useState("");
  const [openDMs, setOpenDMs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (target.kind === "dm" && !openDMs.includes(target.userId)) {
      setOpenDMs((xs) => [...xs, target.userId]);
    }
  }, [target, openDMs]);

  const filtered = useMemo(() => {
    if (target.kind === "pool") return messages.filter((m) => m.recipient_id == null);
    const other = target.userId;
    const me = identity?.userId;
    if (!me) return [];
    return messages.filter(
      (m) =>
        m.recipient_id != null &&
        ((m.author_id === me && m.recipient_id === other) || (m.author_id === other && m.recipient_id === me)),
    );
  }, [messages, target, identity]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [filtered.length, target]);

  const memberByUserId = useMemo(() => {
    const m = new Map<string, Member>();
    for (const x of members) m.set(x.user_id, x);
    return m;
  }, [members]);

  if (status === "unconfigured") {
    return (
      <Shell>
        <div style={{ padding: 16, color: "var(--ink-muted)", fontSize: 12, fontFamily: "var(--sans)" }}>
          <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 15, color: "var(--ink)", marginBottom: 6 }}>
            Chat offline
          </div>
          Set <code style={{ fontFamily: "var(--mono)", fontSize: 11 }}>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code style={{ fontFamily: "var(--mono)", fontSize: 11 }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
          <code style={{ fontFamily: "var(--mono)", fontSize: 11 }}>.env.local</code>, then run the migration in{" "}
          <code style={{ fontFamily: "var(--mono)", fontSize: 11 }}>supabase/migrations/002_chat.sql</code>.
        </div>
      </Shell>
    );
  }

  if (status === "idle") {
    return (
      <Shell>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 17, lineHeight: 1.1 }}>
            Start the trash talk.
          </div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-muted)" }}>
            Share your bracket to open a group chat. Anyone with the link can join and talk — and you can DM them one-on-one.
          </div>
          <div style={{ marginTop: 4 }}>
            <button
              onClick={onStartChat}
              style={{
                ...btnStyle(),
                background: "var(--accent)",
                color: "#fff",
                border: "1px solid var(--accent)",
                fontWeight: 600,
              }}
            >
              Start group chat →
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  if (status === "needs-name") {
    return (
      <>
        <Shell>
          <div style={{ padding: 16, color: "var(--ink-muted)", fontSize: 12 }}>Joining chat…</div>
        </Shell>
        <NamePromptModal onSubmit={(name) => setDisplayName(name)} />
      </>
    );
  }

  if (status === "error") {
    return (
      <Shell>
        <div style={{ padding: 16, color: "var(--ink-muted)", fontSize: 12 }}>
          <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 15, color: "var(--ink)", marginBottom: 6 }}>
            Chat error
          </div>
          {error ?? "something went wrong"}
        </div>
      </Shell>
    );
  }

  const onlineCount = members.length;
  const peerMember = target.kind === "dm" ? memberByUserId.get(target.userId) ?? null : null;

  const tabs = [
    { key: "pool", label: pool?.name ? `# ${pool.name}` : "Pool" },
    ...openDMs.map((uid) => {
      const m = memberByUserId.get(uid);
      return {
        key: `dm:${uid}`,
        label: m?.display_name ?? "direct",
        accent: m?.accent ?? 1,
        avatar: m?.avatar ?? "??",
      };
    }),
  ];
  const activeKey = target.kind === "pool" ? "pool" : `dm:${target.userId}`;

  return (
    <Shell
      header={
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
              {target.kind === "pool" ? "Group chat" : `DM · ${peerMember?.display_name ?? "direct"}`}
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
              {target.kind === "pool" ? `${onlineCount} joined · live` : "one-on-one · live"}
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
      }
    >
      {members.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "8px 10px",
            overflowX: "auto",
            borderBottom: "1px solid var(--panel-border)",
            background: "var(--chip-bg)",
          }}
        >
          {members.map((m) => {
            const isMe = m.user_id === identity?.userId;
            const isActive = target.kind === "dm" && target.userId === m.user_id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  if (isMe) return;
                  openDM(m.user_id);
                }}
                disabled={isMe}
                title={isMe ? `${m.display_name} (you)` : `Message ${m.display_name}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 8px 3px 3px",
                  borderRadius: 999,
                  border: `1px solid ${isActive ? "var(--accent)" : "var(--panel-border)"}`,
                  background: isActive
                    ? "color-mix(in oklch, var(--accent) 16%, transparent)"
                    : "var(--panel-bg)",
                  color: "var(--ink)",
                  fontFamily: "var(--sans)",
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 500,
                  cursor: isMe ? "default" : "pointer",
                  opacity: isMe ? 0.7 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                <Avatar label={m.avatar ?? "??"} accent={m.accent} size={18} />
                <span>{isMe ? "you" : m.display_name}</span>
              </button>
            );
          })}
        </div>
      )}

      <TabBar
        tabs={tabs}
        activeKey={activeKey}
        onPick={(key) => {
          if (key === "pool") setTarget({ kind: "pool" });
          else setTarget({ kind: "dm", userId: key.slice(3) });
        }}
        onClose={(key) => {
          const uid = key.slice(3);
          setOpenDMs((xs) => xs.filter((u) => u !== uid));
          if (target.kind === "dm" && target.userId === uid) setTarget({ kind: "pool" });
        }}
      />

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ margin: "auto", color: "var(--ink-faint)", fontSize: 12 }}>
            {target.kind === "pool" ? "No messages yet. Say hey." : "No DMs yet. Start the thread."}
          </div>
        ) : (
          filtered.map((m) => (
            <MessageRow
              key={m.id}
              m={m}
              authorMember={memberByUserId.get(m.author_id) ?? null}
              isMe={m.author_id === identity?.userId}
            />
          ))
        )}
      </div>

      {target.kind === "dm" && peerMember == null && (
        <div
          style={{
            padding: "6px 12px",
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--ink-muted)",
            borderTop: "1px dashed var(--panel-border)",
          }}
        >
          peer not in pool yet — your message will wait
        </div>
      )}

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
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              const body = draft;
              setDraft("");
              send(body).catch(() => setDraft(body));
            }
          }}
          placeholder={target.kind === "pool" ? "talk some trash…" : `message ${peerMember?.display_name ?? "…"}`}
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
          onClick={() => {
            if (!draft.trim()) return;
            const body = draft;
            setDraft("");
            send(body).catch(() => setDraft(body));
          }}
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
    </Shell>
  );
}

export { NamePromptModal };
