"use client";

import { useState } from "react";
import { btnStyle } from "./SidePanels";
import { TEAMS } from "./wc-data";
import type { BracketState, QuizAnswers } from "./wc-logic";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function selectStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid var(--panel-border)",
    background: "var(--chip-bg)",
    color: "var(--ink)",
    fontSize: 13,
    fontFamily: "var(--sans)",
    cursor: "pointer",
    outline: "none",
  };
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
  const [champion, setChampion] = useState("ARG");
  const [darkHorse, setDarkHorse] = useState("MAR");
  const [upset, setUpset] = useState<"low" | "med" | "high">("med");
  if (!open) return null;

  const topTeams = Object.keys(TEAMS).filter((k) => TEAMS[k].seed <= 2);
  const allTeams = Object.keys(TEAMS);

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
          width: 520,
          maxWidth: "90vw",
          background: "var(--panel-bg)",
          border: "1px solid var(--panel-border)",
          borderRadius: 10,
          padding: 24,
        }}
      >
        <div style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 500, fontStyle: "italic", lineHeight: 1.1, marginBottom: 4 }}>
          Three questions, one bracket.
        </div>
        <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-muted)", marginBottom: 20 }}>
          We&apos;ll fill the rest using your instincts. You can still edit anything after.
        </div>

        <Field label="1 — Who lifts the trophy?">
          <select value={champion} onChange={(e) => setChampion(e.target.value)} style={selectStyle()}>
            {topTeams.map((k) => (
              <option key={k} value={k}>
                {TEAMS[k].name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="2 — Pick one dark horse to make a deep run.">
          <select value={darkHorse} onChange={(e) => setDarkHorse(e.target.value)} style={selectStyle()}>
            {allTeams
              .filter((k) => TEAMS[k].seed >= 3 || k !== champion)
              .map((k) => (
                <option key={k} value={k}>
                  {TEAMS[k].name} · seed {TEAMS[k].seed}
                </option>
              ))}
          </select>
        </Field>

        <Field label="3 — How chaotic are your brackets?">
          <div style={{ display: "flex", gap: 6 }}>
            {([
              ["low", "Chalky"],
              ["med", "Balanced"],
              ["high", "Chaotic"],
            ] as const).map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setUpset(val)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: `1px solid ${upset === val ? "var(--accent)" : "var(--panel-border)"}`,
                  background: upset === val ? "color-mix(in oklch, var(--accent) 12%, transparent)" : "var(--chip-bg)",
                  color: "var(--ink)",
                  fontSize: 12,
                  fontFamily: "var(--sans)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={btnStyle()}>
            Cancel
          </button>
          <button
            onClick={async () => {
              await onApply({ champion, darkHorse, upsetTolerance: upset });
              onClose();
            }}
            style={{
              ...btnStyle(),
              background: "var(--accent)",
              color: "#fff",
              border: "1px solid var(--accent)",
              fontWeight: 600,
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
}: {
  open: boolean;
  onClose: () => void;
  state: BracketState;
}) {
  if (!open) return null;
  const champ = state.picks[4][0];
  const champName = champ ? TEAMS[champ].name : "—";
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
          Your friends can submit their own picks and ride along.
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
          }}
        >
          <div>
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
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, marginTop: 3 }}>smartbracket.io/p/wc26-group-chat</div>
          </div>
          <button style={btnStyle()} onClick={() => alert("Copied!")}>
            Copy
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Copy link", "iMessage", "WhatsApp", "Email", "QR code"].map((x) => (
            <button key={x} style={btnStyle()} onClick={() => alert(`${x} share coming up`)}>
              {x}
            </button>
          ))}
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

        <div style={{ textAlign: "right", marginTop: 16 }}>
          <button onClick={onClose} style={btnStyle()}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
