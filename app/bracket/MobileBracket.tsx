"use client";

import { useRef, useState, type CSSProperties } from "react";
import { FlagSvg, TeamChip, TrophyIcon } from "./TeamChip";
import { TeamPicker, type PickerAnchor } from "./TeamPicker";
import {
  getMatchup,
  getSlotCandidates,
  getThirdPlaceMatchup,
  type BracketState,
} from "./wc-logic";
import { R32_META, TEAMS } from "./wc-data";
import type { BracketSettings } from "./Bracket";

type OnPick = (round: number | "tp", idx: number, team: string) => void;
type OnClear = (round: number | "tp", idx: number) => void;

type TabKey = 0 | 1 | 2 | 3 | 4 | "tp";

const TABS: { key: TabKey; label: string; kicker: string }[] = [
  { key: 0, label: "R32", kicker: "Round of 32 · Jun 18 – 21" },
  { key: 1, label: "R16", kicker: "Round of 16 · Jun 24 – 29" },
  { key: 2, label: "QF", kicker: "Quarterfinals · Jun 30 – Jul 3" },
  { key: 3, label: "SF", kicker: "Semifinals · Jul 4 – 5" },
  { key: 4, label: "Final", kicker: "Final · Jul 12 · MetLife" },
  { key: "tp", label: "3rd", kicker: "Third-place · Jul 11 · Miami" },
];

const ROUND_TITLES = ["Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Final"];

type PickerState = {
  open: boolean;
  anchor: PickerAnchor | null;
  round: number | "tp";
  idx: number;
  candidates: string[];
  current: string | null;
  title: string;
  subtitle?: string;
};

export function MobileBracket({
  state,
  onPick,
  onClear,
  settings,
  themeStyle,
  glow,
}: {
  state: BracketState;
  onPick: OnPick;
  onClear: OnClear;
  settings: BracketSettings;
  themeStyle?: CSSProperties;
  glow?: Set<string>;
}) {
  const [tab, setTab] = useState<TabKey>(0);
  const [picker, setPicker] = useState<PickerState>({
    open: false,
    anchor: null,
    round: 0,
    idx: 0,
    candidates: [],
    current: null,
    title: "",
  });

  const openPicker = (
    anchor: PickerAnchor,
    round: number | "tp",
    idx: number,
    candidates: string[],
    current: string | null,
    title: string,
    subtitle?: string,
  ) => {
    setPicker({ open: true, anchor, round, idx, candidates, current, title, subtitle });
  };

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  return (
    <div>
      <TabRow tab={tab} onChange={setTab} />
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          letterSpacing: "0.14em",
          color: "var(--ink-muted)",
          textTransform: "uppercase",
          marginTop: 10,
          marginBottom: 10,
        }}
      >
        {active.kicker}
      </div>

      {tab === 4 ? (
        <FinalTab state={state} settings={settings} onPick={onPick} openPicker={openPicker} glow={glow} />
      ) : tab === "tp" ? (
        <ThirdPlaceTab state={state} settings={settings} onPick={onPick} openPicker={openPicker} />
      ) : (
        <RoundList
          round={tab as number}
          state={state}
          settings={settings}
          onPick={onPick}
          openPicker={openPicker}
          glow={glow}
        />
      )}

      <TeamPicker
        open={picker.open}
        candidates={picker.candidates}
        currentPick={picker.current}
        anchor={picker.anchor}
        title={picker.title}
        subtitle={picker.subtitle}
        themeStyle={themeStyle}
        onSelect={(team) => onPick(picker.round, picker.idx, team)}
        onClear={() => onClear(picker.round, picker.idx)}
        onClose={() => setPicker((p) => ({ ...p, open: false }))}
      />
    </div>
  );
}

function TabRow({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: 4,
        overflowX: "auto",
        borderBottom: "1px solid var(--rule)",
        paddingBottom: 6,
        marginBottom: 0,
        scrollbarWidth: "none",
      }}
    >
      {TABS.map((t) => {
        const active = t.key === tab;
        return (
          <button
            key={String(t.key)}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            style={{
              flex: "0 0 auto",
              padding: "8px 14px",
              border: "none",
              background: "transparent",
              borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
              color: active ? "var(--ink)" : "var(--ink-muted)",
              fontFamily: "var(--sans)",
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              cursor: "pointer",
              letterSpacing: "0.02em",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function RoundList({
  round,
  state,
  settings,
  onPick,
  openPicker,
  glow,
}: {
  round: number;
  state: BracketState;
  settings: BracketSettings;
  onPick: OnPick;
  openPicker: PickerOpener;
  glow?: Set<string>;
}) {
  const n = state.picks[round].length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: n }).map((_, idx) => (
        <MobileMatchCard
          key={`${round}-${idx}`}
          round={round}
          idx={idx}
          state={state}
          settings={settings}
          onPick={onPick}
          openPicker={openPicker}
          glowing={glow?.has(`${round}-${idx}`) ?? false}
        />
      ))}
    </div>
  );
}

type PickerOpener = (
  anchor: PickerAnchor,
  round: number | "tp",
  idx: number,
  candidates: string[],
  current: string | null,
  title: string,
  subtitle?: string,
) => void;

function MobileMatchCard({
  round,
  idx,
  state,
  settings,
  onPick,
  openPicker,
  glowing,
}: {
  round: number;
  idx: number;
  state: BracketState;
  settings: BracketSettings;
  onPick: OnPick;
  openPicker: PickerOpener;
  glowing: boolean;
}) {
  const [a, b] = getMatchup(state.picks, round, idx);
  const winner = state.picks[round][idx];
  const candidates = getSlotCandidates(round, idx);
  const meta = round === 0 ? R32_META[idx] : null;
  const title = `${ROUND_TITLES[round]} · Match ${idx + 1}`;
  const subtitle =
    a && b
      ? `${TEAMS[a].name} vs ${TEAMS[b].name}`
      : "Pick a winner";

  const aRef = useRef<HTMLDivElement>(null);
  const bRef = useRef<HTMLDivElement>(null);

  const onAdvance = (team: string) => onPick(round, idx, team);
  const openFor = (ref: HTMLDivElement | null) => {
    if (!ref) return;
    const r = ref.getBoundingClientRect();
    openPicker(
      { x: r.left, y: r.top, width: r.width, height: r.height },
      round,
      idx,
      candidates,
      state.picks[round][idx],
      title,
      subtitle,
    );
  };

  const row = (team: string | null, ref: React.RefObject<HTMLDivElement>) => {
    const isWinner = !!winner && winner === team;
    const isLoser = !!winner && team !== null && winner !== team;
    const handleClick = () => {
      if (team) {
        onAdvance(team);
        return;
      }
      openFor(ref.current);
    };
    return (
      <div ref={ref}>
        <TeamChip
          team={team}
          showSeed={settings.showSeeds}
          showFlag={settings.showFlags}
          showScore={settings.showScores}
          score={settings.showScores && isWinner ? "—" : null}
          variant={settings.chipStyle}
          status={isWinner ? "winner" : "idle"}
          dim={isLoser}
          onClick={handleClick}
        />
      </div>
    );
  };

  return (
    <div
      style={{
        background: "var(--match-bg)",
        border: `1px solid ${glowing ? "var(--accent)" : "var(--match-border)"}`,
        borderRadius: 8,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        animation: glowing ? "bracketPulse 1.4s ease-out" : undefined,
        transition: "border-color 200ms",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9.5,
            letterSpacing: "0.14em",
            color: "var(--ink-muted)",
            textTransform: "uppercase",
          }}
        >
          Match {idx + 1}
        </span>
        {meta && (
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9.5,
              letterSpacing: "0.08em",
              color: "var(--ink-muted)",
              textTransform: "uppercase",
              textAlign: "right",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {meta.date} · {meta.time} · {meta.venue}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {row(a, aRef)}
        {row(b, bRef)}
      </div>
    </div>
  );
}

function FinalTab({
  state,
  settings,
  onPick,
  openPicker,
  glow,
}: {
  state: BracketState;
  settings: BracketSettings;
  onPick: OnPick;
  openPicker: PickerOpener;
  glow?: Set<string>;
}) {
  const [a, b] = getMatchup(state.picks, 4, 0);
  const winner = state.picks[4][0];
  const candidates = getSlotCandidates(4, 0);
  const champ = winner ? TEAMS[winner] : null;
  const champRef = useRef<HTMLDivElement>(null);
  const aRef = useRef<HTMLDivElement>(null);
  const bRef = useRef<HTMLDivElement>(null);
  const glowing = glow?.has("4-0") ?? false;

  const openChamp = () => {
    if (!champRef.current) return;
    const r = champRef.current.getBoundingClientRect();
    openPicker(
      { x: r.left, y: r.top, width: r.width, height: r.height },
      4,
      0,
      candidates,
      state.picks[4][0],
      "Final · Champion",
      "Pick the team lifting the trophy",
    );
  };
  const openRow = (ref: HTMLDivElement | null) => {
    if (!ref) return;
    const r = ref.getBoundingClientRect();
    openPicker(
      { x: r.left, y: r.top, width: r.width, height: r.height },
      4,
      0,
      candidates,
      state.picks[4][0],
      "Final · Champion",
      a && b ? `${TEAMS[a].name} vs ${TEAMS[b].name}` : "Pick the winner of the final",
    );
  };
  const onAdvance = (team: string) => onPick(4, 0, team);

  const row = (team: string | null, ref: React.RefObject<HTMLDivElement>) => {
    const isWinner = !!winner && winner === team;
    const isLoser = !!winner && team !== null && winner !== team;
    return (
      <div ref={ref}>
        <TeamChip
          team={team}
          showSeed={settings.showSeeds}
          showFlag={settings.showFlags}
          showScore={settings.showScores}
          score={settings.showScores && isWinner ? "—" : null}
          variant={settings.chipStyle}
          status={isWinner ? "winner" : "idle"}
          dim={isLoser}
          onClick={team ? () => onAdvance(team) : () => openRow(ref.current)}
        />
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        ref={champRef}
        onClick={openChamp}
        style={{
          textAlign: "center",
          padding: "20px 16px",
          background: champ ? "var(--champion-bg)" : "transparent",
          border: champ ? "1px solid var(--accent)" : "1px dashed var(--match-border)",
          borderRadius: 10,
          cursor: "pointer",
          animation: glowing ? "bracketPulse 1.4s ease-out" : undefined,
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9.5,
            letterSpacing: "0.22em",
            color: "var(--ink-muted)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Champion
        </div>
        {champ ? (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <TrophyIcon size={32} color="var(--accent)" />
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <FlagSvg stripes={champ.stripes} w={44} h={30} radius={3} />
            </div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 26,
                fontStyle: "italic",
                fontWeight: 500,
                lineHeight: 1.05,
              }}
            >
              {champ.name}
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9.5,
                letterSpacing: "0.14em",
                color: "var(--ink-muted)",
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              Seed {champ.seed} · {champ.code}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <TrophyIcon size={28} color="var(--ink-faint)" />
            </div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 18,
                fontStyle: "italic",
                color: "var(--ink-muted)",
                lineHeight: 1.15,
              }}
            >
              Pick the champion
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9,
                letterSpacing: "0.14em",
                color: "var(--ink-faint)",
                textTransform: "uppercase",
                marginTop: 6,
              }}
            >
              We&apos;ll back-fill their path
            </div>
          </>
        )}
      </div>

      <div
        style={{
          background: "var(--match-bg)",
          border: "1px solid var(--match-border)",
          borderRadius: 8,
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9.5,
            letterSpacing: "0.14em",
            color: "var(--ink-muted)",
            textTransform: "uppercase",
          }}
        >
          Final · Jul 12 · MetLife Stadium
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {row(a, aRef)}
          {row(b, bRef)}
        </div>
      </div>
    </div>
  );
}

function ThirdPlaceTab({
  state,
  settings,
  onPick,
  openPicker,
}: {
  state: BracketState;
  settings: BracketSettings;
  onPick: OnPick;
  openPicker: PickerOpener;
}) {
  const [a, b] = getThirdPlaceMatchup(state);
  const winner = state.thirdPlace;
  const candidates = [a, b].filter((x): x is string => !!x);
  const aRef = useRef<HTMLDivElement>(null);
  const bRef = useRef<HTMLDivElement>(null);

  const open = (ref: HTMLDivElement | null) => {
    if (!ref) return;
    const r = ref.getBoundingClientRect();
    openPicker(
      { x: r.left, y: r.top, width: r.width, height: r.height },
      "tp",
      0,
      candidates,
      state.thirdPlace,
      "Third-Place Match",
      a && b ? `${TEAMS[a].name} vs ${TEAMS[b].name}` : "Fill both semifinals first",
    );
  };

  const row = (team: string | null, ref: React.RefObject<HTMLDivElement>) => {
    const isWinner = !!winner && winner === team;
    const isLoser = !!winner && team !== null && winner !== team;
    return (
      <div ref={ref}>
        <TeamChip
          team={team}
          showSeed={settings.showSeeds}
          showFlag={settings.showFlags}
          showScore={settings.showScores}
          score={settings.showScores && isWinner ? "—" : null}
          variant={settings.chipStyle}
          status={isWinner ? "winner" : "idle"}
          dim={isLoser}
          onClick={team ? () => onPick("tp", 0, team) : () => open(ref.current)}
        />
      </div>
    );
  };

  return (
    <div
      style={{
        background: "var(--match-bg)",
        border: "1px dashed var(--match-border)",
        borderRadius: 8,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 9.5,
          letterSpacing: "0.14em",
          color: "var(--ink-muted)",
          textTransform: "uppercase",
        }}
      >
        Third-Place · Jul 11 · Miami
      </div>
      {!a && !b && (
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: 13,
            color: "var(--ink-muted)",
            padding: "6px 0",
          }}
        >
          Fill both semifinals to unlock this match.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {row(a, aRef)}
        {row(b, bRef)}
      </div>
    </div>
  );
}
