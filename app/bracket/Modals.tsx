"use client";

import { useState, type CSSProperties } from "react";
import { btnStyle } from "./SidePanels";
import { FlagSvg } from "./TeamChip";
import { TEAMS } from "./wc-data";
import type { BracketState, QuizAnswers } from "./wc-logic";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ink-muted)",
          }}
        >
          {label}
        </div>
        {hint && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-faint)" }}>{hint}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function TeamGrid({
  pool,
  selected,
  limit,
  onToggle,
}: {
  pool: string[];
  selected: string[];
  limit: number;
  onToggle: (code: string) => void;
}) {
  const isFull = selected.length >= limit;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 6,
        maxHeight: 176,
        overflowY: "auto",
        padding: 4,
        border: "1px solid var(--panel-border)",
        borderRadius: 8,
        background: "var(--chip-bg)",
      }}
    >
      {pool.map((code) => {
        const T = TEAMS[code];
        const picked = selected.includes(code);
        const disabled = !picked && isFull;
        const style: CSSProperties = {
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 8px",
          borderRadius: 6,
          border: `1px solid ${picked ? "var(--accent)" : "var(--panel-border)"}`,
          background: picked
            ? "color-mix(in oklch, var(--accent) 18%, transparent)"
            : "var(--panel-bg)",
          color: disabled ? "var(--ink-faint)" : "var(--ink)",
          cursor: disabled ? "not-allowed" : "pointer",
          fontFamily: "var(--sans)",
          fontSize: 12,
          fontWeight: picked ? 600 : 500,
          opacity: disabled ? 0.5 : 1,
          textAlign: "left",
        };
        return (
          <button
            key={code}
            type="button"
            onClick={() => {
              if (disabled) return;
              onToggle(code);
            }}
            disabled={disabled}
            style={style}
          >
            <FlagSvg stripes={T.stripes} w={16} h={11} radius={2} />
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {T.name}
            </span>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9,
                color: "var(--ink-muted)",
                letterSpacing: "0.05em",
              }}
            >
              {T.seed}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  const accentColor = destructive ? "oklch(0.58 0.22 25)" : "var(--accent)";
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 120,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: "90vw",
          background: "var(--panel-bg)",
          border: `1px solid ${accentColor}`,
          borderRadius: 10,
          padding: 24,
          color: "var(--ink)",
          boxShadow: "0 30px 80px -30px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            color: accentColor,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          {destructive ? "Heads up" : "Confirm"}
        </div>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: 24,
            fontStyle: "italic",
            fontWeight: 500,
            lineHeight: 1.15,
            marginBottom: body ? 10 : 18,
          }}
        >
          {title}
        </div>
        {body && (
          <div
            style={{
              fontFamily: "var(--sans)",
              fontSize: 13,
              color: "var(--ink-muted)",
              lineHeight: 1.45,
              marginBottom: 20,
            }}
          >
            {body}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={btnStyle()}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              ...btnStyle(),
              background: accentColor,
              color: "#fff",
              border: `1px solid ${accentColor}`,
              fontWeight: 600,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function QuizModal({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (q: QuizAnswers) => void | Promise<void>;
}) {
  const [popular, setPopular] = useState<string[]>([]);
  const [overrated, setOverrated] = useState<string[]>([]);
  const [underrated, setUnderrated] = useState<string[]>([]);
  if (!open) return null;

  const toggleIn = (
    list: string[],
    setter: (v: string[]) => void,
    limit: number,
  ) => (code: string) => {
    if (list.includes(code)) {
      setter(list.filter((c) => c !== code));
      return;
    }
    if (list.length >= limit) return;
    setter([...list, code]);
  };

  const allTeams = Object.keys(TEAMS).sort((a, b) => {
    const sa = TEAMS[a].seed, sb = TEAMS[b].seed;
    if (sa !== sb) return sa - sb;
    return TEAMS[a].name.localeCompare(TEAMS[b].name);
  });

  const canSubmit = popular.length > 0 || overrated.length > 0 || underrated.length > 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 580,
          maxWidth: "92vw",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--panel-bg)",
          border: "1px solid var(--panel-border)",
          borderRadius: 10,
          padding: 24,
          color: "var(--ink)",
        }}
      >
        <div style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 500, fontStyle: "italic", lineHeight: 1.1, marginBottom: 4 }}>
          Three questions, one bracket.
        </div>
        <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-muted)", marginBottom: 20 }}>
          Tap teams to toggle. We&apos;ll lean the bracket on your read of the pool. You can still edit anything after.
        </div>

        <Field label="1 — Who are popular in your pool?" hint={`${popular.length} / 3`}>
          <TeamGrid pool={allTeams} selected={popular} limit={3} onToggle={toggleIn(popular, setPopular, 3)} />
        </Field>

        <Field label="2 — Who are overrated?" hint={`${overrated.length} / 2`}>
          <TeamGrid pool={allTeams} selected={overrated} limit={2} onToggle={toggleIn(overrated, setOverrated, 2)} />
        </Field>

        <Field label="3 — Who are underrated?" hint={`${underrated.length} / 2`}>
          <TeamGrid pool={allTeams} selected={underrated} limit={2} onToggle={toggleIn(underrated, setUnderrated, 2)} />
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={btnStyle()}>
            Cancel
          </button>
          <button
            disabled={!canSubmit}
            onClick={async () => {
              await onApply({ popular, overrated, underrated });
              onClose();
            }}
            style={{
              ...btnStyle(),
              background: canSubmit ? "var(--accent)" : "var(--chip-bg)",
              color: canSubmit ? "#fff" : "var(--ink-faint)",
              border: `1px solid ${canSubmit ? "var(--accent)" : "var(--panel-border)"}`,
              fontWeight: 600,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            Generate bracket →
          </button>
        </div>
      </div>
    </div>
  );
}

export function ShareModal({
  open,
  onClose,
  state,
  inviteUrl,
}: {
  open: boolean;
  onClose: () => void;
  state: BracketState;
  inviteUrl: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  if (!open) return null;
  const champ = state.picks[4][0];
  const champName = champ ? TEAMS[champ].name : "your pick";

  const url = inviteUrl ?? "";
  const msg = champ
    ? `I've got ${champName} lifting the cup — join my WC26 bracket pool: ${url}`
    : `Join my WC26 bracket pool: ${url}`;

  const flash = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(null), 1400);
  };

  const hasNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const onCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      flash("copy failed — select the link manually");
    }
  };

  const onNative = async () => {
    if (!hasNativeShare || !url) return;
    try {
      await navigator.share({ title: "WC26 bracket pool", text: msg, url });
    } catch {
      // user cancelled — ignore
    }
  };

  const open_ = (href: string) => {
    if (typeof window === "undefined") return;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          maxWidth: "90vw",
          background: "var(--panel-bg)",
          border: "1px solid var(--panel-border)",
          borderRadius: 10,
          padding: 24,
        }}
      >
        <div style={{ fontFamily: "var(--serif)", fontSize: 26, fontStyle: "italic", fontWeight: 500, lineHeight: 1.1, marginBottom: 4 }}>
          Share your bracket.
        </div>
        <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-muted)", marginBottom: 16 }}>
          Anyone with this link can submit their own picks and chat in the pool.
        </div>

        <div
          style={{
            border: "1px solid var(--panel-border)",
            borderRadius: 6,
            padding: 12,
            marginBottom: 12,
            background: "var(--chip-bg)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--ink-muted)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Your pool link
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 12,
                marginTop: 3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={url}
            >
              {url || "generating…"}
            </div>
          </div>
          <button style={btnStyle()} onClick={onCopy} disabled={!url}>
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {hasNativeShare && (
            <button style={btnStyle()} onClick={onNative} disabled={!url}>
              Share…
            </button>
          )}
          <button
            style={btnStyle()}
            onClick={() => open_(`sms:&body=${encodeURIComponent(msg)}`)}
            disabled={!url}
          >
            iMessage / SMS
          </button>
          <button
            style={btnStyle()}
            onClick={() => open_(`https://wa.me/?text=${encodeURIComponent(msg)}`)}
            disabled={!url}
          >
            WhatsApp
          </button>
          <button
            style={btnStyle()}
            onClick={() =>
              open_(
                `mailto:?subject=${encodeURIComponent("Join my WC26 bracket pool")}&body=${encodeURIComponent(msg)}`,
              )
            }
            disabled={!url}
          >
            Email
          </button>
          <button
            style={btnStyle()}
            onClick={() =>
              open_(`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`)
            }
            disabled={!url}
          >
            QR code
          </button>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "color-mix(in oklch, var(--accent) 8%, transparent)",
            border: "1px solid color-mix(in oklch, var(--accent) 25%, transparent)",
            borderRadius: 6,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--ink)" }}>
            <strong>Your pick:</strong> {champName} to win it all. Friends get <strong>3 days</strong> to submit before tip-off.
          </div>
        </div>

        {toast && (
          <div
            style={{
              marginTop: 10,
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--ink-muted)",
            }}
          >
            {toast}
          </div>
        )}

        <div style={{ textAlign: "right", marginTop: 16 }}>
          <button onClick={onClose} style={btnStyle()}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
