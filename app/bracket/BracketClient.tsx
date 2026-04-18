"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Bracket, type BracketSettings } from "./Bracket";
import { Confetti } from "./Confetti";
import { GroupStage } from "./GroupStage";
import { QuizModal, ShareModal } from "./Modals";
import { ChatWidget, Leaderboard, btnStyle } from "./SidePanels";
import { TrophyIcon } from "./TeamChip";
import {
  countPicks,
  isComplete,
  makeEmptyPicks,
  advanceTeam,
  clearSlot,
  type BracketState,
} from "./wc-logic";
import { KNOCKOUT_SEEDING, R32_META, TEAMS } from "./wc-data";
import {
  defaultOneClick,
  defaultQuiz,
  type OneClickFn,
  type QuizFn,
} from "./rrtoolbox-api";

const THEMES: Record<BracketSettings["theme"], Record<string, string>> = {
  editorial: {
    "--paper": "oklch(0.985 0.004 80)",
    "--paper-2": "oklch(0.96 0.006 80)",
    "--ink": "oklch(0.18 0.01 80)",
    "--ink-muted": "oklch(0.45 0.01 80)",
    "--ink-faint": "oklch(0.62 0.008 80)",
    "--panel-bg": "oklch(1 0 0)",
    "--panel-border": "oklch(0.88 0.006 80)",
    "--chip-bg": "oklch(1 0 0)",
    "--chip-bg-hover": "oklch(0.97 0.008 80)",
    "--chip-border": "oklch(0.86 0.006 80)",
    "--match-bg": "oklch(0.995 0.003 80)",
    "--match-border": "oklch(0.9 0.006 80)",
    "--champion-bg": "color-mix(in oklch, var(--accent) 10%, transparent)",
    "--rule": "oklch(0.88 0.006 80)",
    "--header-bg": "oklch(0.99 0.004 80)",
  },
  broadcast: {
    "--paper": "oklch(0.97 0.01 50)",
    "--paper-2": "oklch(0.93 0.02 50)",
    "--ink": "oklch(0.14 0.02 260)",
    "--ink-muted": "oklch(0.42 0.03 260)",
    "--ink-faint": "oklch(0.62 0.02 260)",
    "--panel-bg": "oklch(1 0 0)",
    "--panel-border": "oklch(0.82 0.02 260)",
    "--chip-bg": "oklch(1 0 0)",
    "--chip-bg-hover": "oklch(0.95 0.02 50)",
    "--chip-border": "oklch(0.78 0.02 260)",
    "--match-bg": "oklch(0.99 0.006 50)",
    "--match-border": "oklch(0.84 0.02 260)",
    "--champion-bg": "color-mix(in oklch, var(--accent) 14%, transparent)",
    "--rule": "oklch(0.82 0.02 260)",
    "--header-bg": "linear-gradient(180deg, oklch(0.14 0.04 260) 0%, oklch(0.2 0.05 260) 100%)",
  },
  dark: {
    "--paper": "oklch(0.14 0.01 260)",
    "--paper-2": "oklch(0.18 0.01 260)",
    "--ink": "oklch(0.96 0.005 80)",
    "--ink-muted": "oklch(0.68 0.008 80)",
    "--ink-faint": "oklch(0.48 0.008 80)",
    "--panel-bg": "oklch(0.19 0.01 260)",
    "--panel-border": "oklch(0.28 0.015 260)",
    "--chip-bg": "oklch(0.22 0.012 260)",
    "--chip-bg-hover": "oklch(0.27 0.014 260)",
    "--chip-border": "oklch(0.32 0.015 260)",
    "--match-bg": "oklch(0.17 0.01 260)",
    "--match-border": "oklch(0.28 0.015 260)",
    "--champion-bg": "color-mix(in oklch, var(--accent) 20%, transparent)",
    "--rule": "oklch(0.3 0.015 260)",
    "--header-bg": "oklch(0.12 0.01 260)",
  },
};

const ACCENTS: Record<BracketSettings["accent"], string> = {
  red: "oklch(0.62 0.21 25)",
  blue: "oklch(0.55 0.19 255)",
  green: "oklch(0.65 0.17 150)",
  gold: "oklch(0.78 0.16 85)",
};

const DEFAULT_SETTINGS: BracketSettings = {
  theme: "editorial",
  accent: "red",
  chipStyle: "pill",
  showSeeds: true,
  showFlags: true,
  showScores: false,
};

/**
 * External callers (a wrapper that knows about RRToolbox-API) can pass their
 * own oneClick/quiz generators; otherwise we fall back to the local helpers.
 * See rrtoolbox-api.ts + BUILD_API.md for the contract.
 */
export type BracketClientProps = {
  oneClick?: OneClickFn;
  quiz?: QuizFn;
};

export function BracketClient({ oneClick = defaultOneClick, quiz = defaultQuiz }: BracketClientProps) {
  const [settings, setSettings] = useState<BracketSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem("wc26-settings") || "{}")) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [state, setState] = useState<BracketState>(() => {
    if (typeof window === "undefined") return makeEmptyPicks();
    try {
      const saved = localStorage.getItem("wc26-picks-v2");
      if (saved) return JSON.parse(saved);
    } catch {}
    return makeEmptyPicks();
  });
  const [showQuiz, setShowQuiz] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showTweaks, setShowTweaks] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [toast, setToast] = useState<{ champ: string } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("wc26-picks-v2", JSON.stringify(state));
    } catch {}
  }, [state]);
  useEffect(() => {
    try {
      localStorage.setItem("wc26-settings", JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const updateSetting = <K extends keyof BracketSettings>(k: K, v: BracketSettings[K]) => {
    setSettings((s) => ({ ...s, [k]: v }));
  };

  const onPick = useCallback((round: number | "tp", idx: number, team: string) => {
    if (round === "tp") {
      setState((s) => ({ ...s, thirdPlace: team }));
      return;
    }
    setState((s) => {
      const next = advanceTeam(s, round as number, idx, team);
      if (!isComplete(s) && isComplete(next)) {
        setTimeout(() => setConfetti(true), 200);
        setTimeout(() => {
          const champ = next.picks[4][0];
          if (champ) setToast({ champ });
        }, 400);
      }
      return next;
    });
  }, []);

  const onClear = useCallback((round: number | "tp", idx: number) => {
    if (round === "tp") {
      setState((s) => ({ ...s, thirdPlace: null }));
      return;
    }
    setState((s) => clearSlot(s, round as number, idx));
  }, []);

  const clearAll = () => {
    if (confirm("Clear every pick?")) setState(makeEmptyPicks());
  };
  const applyOneClick = async () => {
    setState(await oneClick());
  };
  const applyQuiz = async (q: Parameters<QuizFn>[0]) => {
    setState(await quiz(q));
  };

  const { done, total } = countPicks(state);
  const pct = Math.round((done / total) * 100);

  const themeVars = useMemo(() => {
    const t = THEMES[settings.theme] ?? THEMES.editorial;
    return { ...t, "--accent": ACCENTS[settings.accent] ?? ACCENTS.red };
  }, [settings.theme, settings.accent]);

  const themeStyle = useMemo<CSSProperties>(() => ({
    ...(themeVars as CSSProperties),
    ["--sans" as string]: '"Geist", "Söhne", "Helvetica Neue", Helvetica, Arial, sans-serif',
    ["--serif" as string]: '"Instrument Serif", "Times New Roman", serif',
    ["--mono" as string]: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
    ["--seed-1" as string]: "oklch(0.62 0.21 25)",
    ["--seed-2" as string]: "oklch(0.55 0.19 255)",
    ["--seed-3" as string]: "oklch(0.65 0.17 150)",
    ["--seed-4" as string]: "oklch(0.72 0.14 75)",
    ["--c-red" as string]: "oklch(0.62 0.21 25)",
    ["--c-blue" as string]: "oklch(0.55 0.19 255)",
    ["--c-green" as string]: "oklch(0.65 0.17 150)",
  }), [themeVars]);

  const rootStyle: CSSProperties = {
    ...themeStyle,
    background: "var(--paper)",
    color: "var(--ink)",
    minHeight: "100vh",
    fontFamily: "var(--sans)",
  };

  return (
    <div style={rootStyle}>
      <Header
        pct={pct}
        done={done}
        total={total}
        onOneClick={applyOneClick}
        onQuiz={() => setShowQuiz(true)}
        onClear={clearAll}
        onShare={() => setShowShare(true)}
        onTweaks={() => setShowTweaks((v) => !v)}
      />

      <main
        style={{
          maxWidth: 1640,
          margin: "0 auto",
          padding: "22px 28px 60px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
          gap: 28,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <HeroStrip state={state} />
          <section>
            <SectionHeader title="Group Stage" kicker="12 groups · June 11 – June 15" />
            <GroupStage compact />
          </section>
          <section>
            <SectionHeader title="Knockout Bracket" kicker="Click any slot · pick the final first, back-fill the rest" />
            <Bracket state={state} onPick={onPick} onClear={onClear} settings={settings} themeStyle={themeStyle} />
          </section>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Leaderboard myChampion={state.picks[4][0]} pickCount={done} totalPicks={total} />
          <UpcomingCard state={state} />
          <ChatWidget />
        </aside>
      </main>

      {showTweaks && <TweaksPanel settings={settings} onChange={updateSetting} onClose={() => setShowTweaks(false)} />}
      <QuizModal open={showQuiz} onClose={() => setShowQuiz(false)} onApply={applyQuiz} />
      <ShareModal open={showShare} onClose={() => setShowShare(false)} state={state} />
      <Confetti fire={confetti} onDone={() => setConfetti(false)} />
      {toast && (
        <ToastComplete
          champ={toast.champ}
          onClose={() => setToast(null)}
          onShare={() => {
            setToast(null);
            setShowShare(true);
          }}
        />
      )}
    </div>
  );
}

function Header({
  pct,
  done,
  total,
  onOneClick,
  onQuiz,
  onClear,
  onShare,
  onTweaks,
}: {
  pct: number;
  done: number;
  total: number;
  onOneClick: () => void;
  onQuiz: () => void;
  onClear: () => void;
  onShare: () => void;
  onTweaks: () => void;
}) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "var(--header-bg)",
        borderBottom: "1px solid var(--rule)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          maxWidth: 1640,
          margin: "0 auto",
          padding: "10px 28px",
          display: "grid",
          gridTemplateColumns: "minmax(240px, auto) 1fr minmax(380px, auto)",
          gap: 24,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo />
          <div style={{ height: 22, width: 1, background: "var(--rule)" }} />
          <div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 18,
                fontStyle: "italic",
                fontWeight: 500,
                lineHeight: 1,
                color: "var(--ink)",
              }}
            >
              World Cup 2026
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9.5,
                letterSpacing: "0.14em",
                color: "var(--ink-muted)",
                textTransform: "uppercase",
                marginTop: 3,
              }}
            >
              USA · Canada · Mexico
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.14em",
              color: "var(--ink-muted)",
              textTransform: "uppercase",
            }}
          >
            {done}/{total} picks
          </div>
          <div style={{ width: 260, height: 4, borderRadius: 2, background: "var(--rule)", overflow: "hidden", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: `${pct}%`,
                background: "linear-gradient(90deg, var(--c-red), var(--c-blue) 50%, var(--c-green))",
                transition: "width 300ms ease",
              }}
            />
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink)", width: 30 }}>{pct}%</div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button style={btnStyle()} onClick={onOneClick}>
            1-click bracket
          </button>
          <button style={btnStyle()} onClick={onQuiz}>
            3-question quiz
          </button>
          <button style={btnStyle()} onClick={onClear}>
            Clear
          </button>
          <button style={btnStyle()} onClick={onTweaks}>
            Tweaks
          </button>
          <button
            onClick={onShare}
            style={{
              ...btnStyle(),
              background: "var(--accent)",
              color: "#fff",
              border: "1px solid var(--accent)",
              fontWeight: 600,
            }}
          >
            Share ↗
          </button>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "var(--serif)",
        fontSize: 18,
        fontWeight: 500,
        letterSpacing: "-0.02em",
      }}
    >
      <svg width={24} height={24} viewBox="0 0 24 24">
        <circle cx={12} cy={12} r={10} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
        <path d="M12 2 L13 10 L21 12 L13 14 L12 22 L11 14 L3 12 L11 10 Z" fill="var(--c-red)" opacity={0.9} />
        <circle cx={12} cy={12} r={2.2} fill="var(--ink)" />
      </svg>
      <span style={{ fontWeight: 600 }}>smartbracket</span>
    </div>
  );
}

function HeroStrip({ state }: { state: BracketState }) {
  const champ = state.picks[4][0];
  const champTeam = champ ? TEAMS[champ] : null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 14, alignItems: "stretch" }}>
      <div
        style={{
          padding: "18px 20px",
          background: "var(--panel-bg)",
          border: "1px solid var(--panel-border)",
          borderRadius: 8,
          position: "relative",
          overflow: "hidden",
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
          Your bracket
        </div>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: 30,
            fontStyle: "italic",
            fontWeight: 500,
            lineHeight: 1.05,
            marginTop: 4,
          }}
        >
          {champTeam ? `${champTeam.name} lifts the trophy.` : "Pick a champion."}
        </div>
        <div style={{ fontFamily: "var(--sans)", fontSize: 12.5, color: "var(--ink-muted)", marginTop: 6, maxWidth: 520 }}>
          {champTeam
            ? "Click any team anywhere in the bracket to rewrite the path that gets them there — we'll back-fill the rest."
            : "Click a team in the Round of 32 to advance them, or skip to the final and work backwards."}
        </div>
      </div>
      <HeroStat k="Round of 32" v="16 matches" sub="Jun 18 – 21" />
      <HeroStat k="First match" v="Arg · Hai" sub="Jun 18 · 12:00 ET" accent />
      <HeroStat k="Final" v="MetLife" sub="Jul 12 · 15:00 ET" />
    </div>
  );
}

function HeroStat({ k, v, sub, accent }: { k: string; v: string; sub: string; accent?: boolean }) {
  return (
    <div
      style={{
        padding: "18px 20px",
        background: "var(--panel-bg)",
        border: "1px solid var(--panel-border)",
        borderRadius: 8,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {accent && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, var(--c-red), var(--c-blue), var(--c-green))",
          }}
        />
      )}
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 9.5,
          letterSpacing: "0.18em",
          color: "var(--ink-muted)",
          textTransform: "uppercase",
        }}
      >
        {k}
      </div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 26, fontStyle: "italic", fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>
        {v}
      </div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          color: "var(--ink-muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginTop: 4,
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function SectionHeader({ title, kicker }: { title: string; kicker: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 14,
        paddingBottom: 12,
        marginBottom: 14,
        borderBottom: "1px solid var(--rule)",
      }}
    >
      <div style={{ fontFamily: "var(--serif)", fontSize: 24, fontStyle: "italic", fontWeight: 500, lineHeight: 1 }}>
        {title}
      </div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          letterSpacing: "0.14em",
          color: "var(--ink-muted)",
          textTransform: "uppercase",
        }}
      >
        {kicker}
      </div>
    </div>
  );
}

function UpcomingCard({ state }: { state: BracketState }) {
  const nextIdx = state.picks[0].findIndex((w) => !w);
  if (nextIdx === -1) return null;
  const [a, b] = KNOCKOUT_SEEDING[nextIdx];
  const meta = R32_META[nextIdx];
  return (
    <div
      style={{
        background: "var(--panel-bg)",
        border: "1px solid var(--panel-border)",
        borderRadius: 8,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 9.5,
          letterSpacing: "0.14em",
          color: "var(--ink-muted)",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        Next up · your pick
      </div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 17, fontStyle: "italic", marginBottom: 2 }}>
        {TEAMS[a].name} <span style={{ color: "var(--ink-muted)" }}>vs</span> {TEAMS[b].name}
      </div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          letterSpacing: "0.08em",
          color: "var(--ink-muted)",
          textTransform: "uppercase",
        }}
      >
        {meta.date} · {meta.time} · {meta.venue}
      </div>
    </div>
  );
}

function ToastComplete({ champ, onClose, onShare }: { champ: string; onClose: () => void; onShare: () => void }) {
  const c = TEAMS[champ];
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--panel-bg)",
        border: "1px solid var(--accent)",
        borderRadius: 10,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        zIndex: 200,
        boxShadow: "0 20px 50px -20px rgba(0,0,0,0.3)",
        maxWidth: 520,
      }}
    >
      <TrophyIcon size={24} color="var(--accent)" />
      <div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 18, fontStyle: "italic", lineHeight: 1 }}>
          Bracket complete. {c.name} for the cup.
        </div>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.1em",
            color: "var(--ink-muted)",
            textTransform: "uppercase",
            marginTop: 3,
          }}
        >
          Share it before your friends steal the pick
        </div>
      </div>
      <button
        onClick={onShare}
        style={{
          ...btnStyle(),
          background: "var(--accent)",
          color: "#fff",
          border: "1px solid var(--accent)",
          fontWeight: 600,
        }}
      >
        Share ↗
      </button>
      <button
        onClick={onClose}
        style={{
          border: "none",
          background: "transparent",
          color: "var(--ink-muted)",
          fontSize: 18,
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

function TweaksPanel({
  settings,
  onChange,
  onClose,
}: {
  settings: BracketSettings;
  onChange: <K extends keyof BracketSettings>(k: K, v: BracketSettings[K]) => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        width: 280,
        zIndex: 80,
        background: "var(--panel-bg)",
        border: "1px solid var(--panel-border)",
        borderRadius: 10,
        padding: "14px 16px 16px",
        boxShadow: "0 20px 50px -15px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 17, fontStyle: "italic", fontWeight: 500 }}>Tweaks</div>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            color: "var(--ink-muted)",
            fontSize: 18,
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <TField label="Theme">
        <Seg
          value={settings.theme}
          onChange={(v) => onChange("theme", v as BracketSettings["theme"])}
          options={[
            ["editorial", "Editorial"],
            ["broadcast", "Broadcast"],
            ["dark", "Dark"],
          ]}
        />
      </TField>

      <TField label="Accent">
        <div style={{ display: "flex", gap: 6 }}>
          {(Object.entries(ACCENTS) as [BracketSettings["accent"], string][]).map(([k, v]) => (
            <button
              key={k}
              onClick={() => onChange("accent", k)}
              style={{
                flex: 1,
                height: 26,
                borderRadius: 4,
                background: v,
                border: `2px solid ${settings.accent === k ? "var(--ink)" : "transparent"}`,
                cursor: "pointer",
              }}
              title={k}
            />
          ))}
        </div>
      </TField>

      <TField label="Chip style">
        <Seg
          value={settings.chipStyle}
          onChange={(v) => onChange("chipStyle", v as BracketSettings["chipStyle"])}
          options={[
            ["pill", "Pill"],
            ["square", "Square"],
            ["flag", "Flag"],
          ]}
        />
      </TField>

      <TField label="Display">
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <Toggle label="Show seeds" on={settings.showSeeds} onChange={(v) => onChange("showSeeds", v)} />
          <Toggle label="Show flags" on={settings.showFlags} onChange={(v) => onChange("showFlags", v)} />
          <Toggle label="Show scores" on={settings.showScores} onChange={(v) => onChange("showScores", v)} />
        </div>
      </TField>
    </div>
  );
}

function TField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 9,
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

function Seg({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: "var(--chip-bg)",
        border: "1px solid var(--chip-border)",
        borderRadius: 6,
        padding: 3,
      }}
    >
      {options.map(([k, lbl]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          style={{
            flex: 1,
            padding: "5px 6px",
            border: "none",
            borderRadius: 4,
            background: value === k ? "var(--accent)" : "transparent",
            color: value === k ? "#fff" : "var(--ink)",
            fontSize: 11,
            fontFamily: "var(--sans)",
            fontWeight: value === k ? 600 : 500,
            cursor: "pointer",
          }}
        >
          {lbl}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "var(--sans)",
      }}
    >
      <span>{label}</span>
      <span
        onClick={() => onChange(!on)}
        style={{
          width: 28,
          height: 16,
          borderRadius: 999,
          background: on ? "var(--accent)" : "var(--chip-border)",
          position: "relative",
          transition: "background 120ms",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: on ? 14 : 2,
            width: 12,
            height: 12,
            borderRadius: 999,
            background: "#fff",
            transition: "left 120ms",
          }}
        />
      </span>
    </label>
  );
}
