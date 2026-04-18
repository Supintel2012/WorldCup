"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { FlagSvg, TeamChip, TrophyIcon, type ChipVariant } from "./TeamChip";
import { TeamPicker, type PickerAnchor } from "./TeamPicker";
import {
  getMatchup,
  getSlotCandidates,
  getThirdPlaceMatchup,
  type BracketState,
} from "./wc-logic";
import { R32_META, TEAMS } from "./wc-data";

export type BracketSettings = {
  theme: "editorial" | "broadcast" | "dark";
  accent: "red" | "blue" | "green" | "gold";
  chipStyle: ChipVariant;
  showSeeds: boolean;
  showFlags: boolean;
  showScores: boolean;
};

const MATCH_H = 68;
const MATCH_H_CMP = 56;
// R32 matches carry a date/venue label that sits in the gap above each cell
// (labelSpace = 12 below). The gap must be at least that tall, plus a few
// pixels of breathing room, or the meta line overlaps the previous match.
const R32_GAP = 20;
const R32_GAP_CMP = 20;

const ROUND_TITLES = ["Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Final"];

function layout(compact: boolean) {
  const H = compact ? MATCH_H_CMP : MATCH_H;
  const G = compact ? R32_GAP_CMP : R32_GAP;
  const cell = H + G;
  const rounds = 4;
  const tops: number[][] = Array.from({ length: rounds }, () => []);
  for (let i = 0; i < 16; i++) tops[0][i] = i * cell;
  for (let r = 1; r < rounds; r++) {
    const n = 16 / Math.pow(2, r);
    for (let i = 0; i < n; i++) {
      const a = tops[r - 1][i * 2];
      const b = tops[r - 1][i * 2 + 1];
      tops[r][i] = (a + b) / 2;
    }
  }
  const totalH = tops[0][15] + H;
  return { tops, totalH, H };
}

type OnPick = (round: number | "tp", idx: number, team: string) => void;
type OnClear = (round: number | "tp", idx: number) => void;

type OpenPicker = (
  anchor: PickerAnchor,
  round: number | "tp",
  idx: number,
  candidates: string[],
  current: string | null,
  title: string,
  subtitle?: string,
) => void;

function SlotRow({
  team,
  winner,
  settings,
  compact,
  onAdvance,
  onOpenPicker,
}: {
  team: string | null;
  winner: string | null;
  settings: BracketSettings;
  compact: boolean;
  onAdvance: (team: string) => void;
  onOpenPicker: (anchor: PickerAnchor) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isWinner = !!winner && winner === team;
  const isLoser = !!winner && team !== null && winner !== team;

  const handleClick = () => {
    if (team) {
      onAdvance(team);
      return;
    }
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    onOpenPicker({ x: r.left, y: r.top, width: r.width, height: r.height });
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
        small={compact}
      />
    </div>
  );
}

function MatchCard({
  pair,
  winner,
  meta,
  round,
  idx,
  settings,
  compact,
  tight,
  onAdvance,
  openPicker,
  state,
}: {
  pair: [string | null, string | null];
  winner: string | null;
  meta: (typeof R32_META)[number] | null;
  round: number;
  idx: number;
  settings: BracketSettings;
  compact: boolean;
  tight: boolean;
  onAdvance: (team: string) => void;
  openPicker: OpenPicker;
  state: BracketState;
}) {
  const [a, b] = pair;
  const candidates = getSlotCandidates(round, idx);
  const title = `${ROUND_TITLES[round]} · Match ${idx + 1}`;
  const subtitle =
    a && b
      ? `${TEAMS[a].name} vs ${TEAMS[b].name}`
      : a
        ? `${TEAMS[a].name} vs —`
        : b
          ? `— vs ${TEAMS[b].name}`
          : "Pick a winner";

  const openFromRow = (anchor: PickerAnchor) => {
    openPicker(anchor, round, idx, candidates, state.picks[round][idx], title, subtitle);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {meta && !tight && (
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 8.5,
            letterSpacing: "0.06em",
            color: "var(--ink-muted)",
            textTransform: "uppercase",
            display: "flex",
            justifyContent: "space-between",
            gap: 4,
            marginBottom: 2,
            padding: "0 2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <span style={{ flex: "0 0 auto" }}>
            {meta.date} · {meta.time}
          </span>
          <span
            style={{
              opacity: 0.7,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {meta.venue}
          </span>
        </div>
      )}
      <div
        style={{
          background: "var(--match-bg)",
          border: "1px solid var(--match-border)",
          borderRadius: 5,
          padding: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flex: 1,
        }}
      >
        <SlotRow
          team={a}
          winner={winner}
          settings={settings}
          compact={compact}
          onAdvance={onAdvance}
          onOpenPicker={openFromRow}
        />
        <SlotRow
          team={b}
          winner={winner}
          settings={settings}
          compact={compact}
          onAdvance={onAdvance}
          onOpenPicker={openFromRow}
        />
      </div>
    </div>
  );
}

function LabelPair({ title, sub, big }: { title: string; sub?: string; big?: boolean }) {
  return (
    <>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: big ? 11 : 9.5,
          letterSpacing: "0.18em",
          color: "var(--ink)",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 8.5,
            letterSpacing: "0.06em",
            color: "var(--ink-muted)",
            marginTop: 3,
            textTransform: "uppercase",
          }}
        >
          {sub}
        </div>
      )}
    </>
  );
}

function RoundLabels({ compact, colW, colWMid, gap }: { compact: boolean; colW: number; colWMid: number; gap: number }) {
  const labels: [string, string][] = [
    ["Round of 32", "Jun 18 – 21"],
    ["Round of 16", "Jun 24 – 26"],
    ["Quarterfinals", "Jun 30 – Jul 1"],
    ["Semifinals", "Jul 4"],
    ["Final", "Jul 12 · MetLife"],
    ["Semifinals", "Jul 5"],
    ["Quarterfinals", "Jul 2 – 3"],
    ["Round of 16", "Jun 27 – 29"],
    ["Round of 32", "Jun 22 – 25"],
  ];
  return (
    <div style={{ display: "flex", justifyContent: "center", gap, marginBottom: compact ? 8 : 14 }}>
      <div style={{ display: "flex", gap }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={`L${i}`} style={{ width: colW, textAlign: "center" }}>
            <LabelPair title={labels[i][0]} sub={labels[i][1]} />
          </div>
        ))}
      </div>
      <div style={{ width: colWMid, textAlign: "center" }}>
        <LabelPair title={labels[4][0]} sub={labels[4][1]} big />
      </div>
      <div style={{ display: "flex", gap }}>
        {[5, 6, 7, 8].map((i) => (
          <div key={`R${i}`} style={{ width: colW, textAlign: "center" }}>
            <LabelPair title={labels[i][0]} sub={labels[i][1]} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Connectors({
  round,
  tops,
  H,
  dir,
  side = "L",
  gap,
}: {
  round: number;
  tops: number[][];
  H: number;
  dir: "left" | "right";
  side?: "L" | "R";
  gap: number;
}) {
  const W = gap;
  const feeders: [number, number][] = [];
  const n = tops[round].length;
  const sideStart = side === "L" ? 0 : n / 2;
  const sideEnd = side === "L" ? n / 2 : n;
  for (let i = sideStart; i < sideEnd; i += 2) feeders.push([i, i + 1]);

  const stroke = "var(--bracket-line, var(--rule))";
  const sw = 1.25;
  return (
    <svg
      width={W}
      height={tops[0][tops[0].length - 1] + H}
      style={{ flex: "0 0 auto", pointerEvents: "none", overflow: "visible" }}
    >
      {feeders.map(([i, j], k) => {
        const y1 = tops[round][i] + H / 2;
        const y2 = tops[round][j] + H / 2;
        const yMid = (y1 + y2) / 2;
        if (dir === "right") {
          return (
            <g key={k}>
              <line x1={0} y1={y1} x2={W / 2} y2={y1} stroke={stroke} strokeWidth={sw} />
              <line x1={0} y1={y2} x2={W / 2} y2={y2} stroke={stroke} strokeWidth={sw} />
              <line x1={W / 2} y1={y1} x2={W / 2} y2={y2} stroke={stroke} strokeWidth={sw} />
              <line x1={W / 2} y1={yMid} x2={W} y2={yMid} stroke={stroke} strokeWidth={sw} />
            </g>
          );
        }
        return (
          <g key={k}>
            <line x1={W} y1={y1} x2={W / 2} y2={y1} stroke={stroke} strokeWidth={sw} />
            <line x1={W} y1={y2} x2={W / 2} y2={y2} stroke={stroke} strokeWidth={sw} />
            <line x1={W / 2} y1={y1} x2={W / 2} y2={y2} stroke={stroke} strokeWidth={sw} />
            <line x1={W / 2} y1={yMid} x2={0} y2={yMid} stroke={stroke} strokeWidth={sw} />
          </g>
        );
      })}
    </svg>
  );
}

function FinalColumn({
  a,
  b,
  winner,
  champ,
  onAdvance,
  openPicker,
  state,
  settings,
  totalH,
  compact,
  width,
}: {
  a: string | null;
  b: string | null;
  winner: string | null;
  champ: ReturnType<typeof getChamp>;
  onAdvance: (team: string) => void;
  openPicker: OpenPicker;
  state: BracketState;
  settings: BracketSettings;
  totalH: number;
  compact: boolean;
  width: number;
}) {
  const champRef = useRef<HTMLDivElement>(null);
  const allCandidates = getSlotCandidates(4, 0);

  const openChamp = () => {
    if (!champRef.current) return;
    const r = champRef.current.getBoundingClientRect();
    openPicker(
      { x: r.left, y: r.top, width: r.width, height: r.height },
      4,
      0,
      allCandidates,
      state.picks[4][0],
      "Final · Champion",
      "Pick the team lifting the trophy",
    );
  };

  const openFinalRow = (anchor: PickerAnchor) => {
    openPicker(
      anchor,
      4,
      0,
      allCandidates,
      state.picks[4][0],
      "Final · Champion",
      a && b ? `${TEAMS[a].name} vs ${TEAMS[b].name}` : "Pick the winner of the final",
    );
  };

  return (
    <div
      style={{
        width,
        flex: "0 0 auto",
        height: totalH,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <div
        ref={champRef}
        onClick={openChamp}
        style={{
          width: "100%",
          textAlign: "center",
          padding: "16px 12px",
          background: champ ? "var(--champion-bg)" : "transparent",
          border: champ ? "1px solid var(--accent)" : "1px dashed var(--match-border)",
          borderRadius: 8,
          cursor: "pointer",
          transition: "background 120ms, border-color 120ms",
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
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
            <div style={{ fontFamily: "var(--serif)", fontSize: 24, fontStyle: "italic", fontWeight: 500, lineHeight: 1.05 }}>
              {champ.name}
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9,
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

      <div style={{ width: "100%" }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: "0.14em",
            color: "var(--ink-muted)",
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          Jul 12 · MetLife Stadium
        </div>
        <div
          style={{
            background: "var(--match-bg)",
            border: "1px solid var(--match-border)",
            borderRadius: 6,
            padding: 4,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <SlotRow team={a} winner={winner} settings={settings} compact={compact} onAdvance={onAdvance} onOpenPicker={openFinalRow} />
          <SlotRow team={b} winner={winner} settings={settings} compact={compact} onAdvance={onAdvance} onOpenPicker={openFinalRow} />
        </div>
      </div>
    </div>
  );
}

function getChamp(code: string | null) {
  return code ? TEAMS[code] : null;
}

function ThirdPlace({
  state,
  onPick,
  openPicker,
  settings,
  compact,
}: {
  state: BracketState;
  onPick: OnPick;
  openPicker: OpenPicker;
  settings: BracketSettings;
  compact: boolean;
}) {
  const [a, b] = getThirdPlaceMatchup(state);
  const winner = state.thirdPlace;
  const candidates = [a, b].filter((x): x is string => !!x);

  const open = (anchor: PickerAnchor) => {
    openPicker(
      anchor,
      "tp",
      0,
      candidates,
      state.thirdPlace,
      "Third-Place Match",
      a && b ? `${TEAMS[a].name} vs ${TEAMS[b].name}` : "Fill both semifinals first",
    );
  };

  const onAdvanceTp = (t: string) => onPick("tp", 0, t);

  return (
    <div style={{ marginTop: compact ? 20 : 32, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 340,
          padding: "12px 14px",
          border: "1px dashed var(--match-border)",
          borderRadius: 6,
          background: "var(--match-bg)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.14em",
              color: "var(--ink-muted)",
              textTransform: "uppercase",
            }}
          >
            Third-Place Match
          </span>
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              color: "var(--ink-faint)",
              textTransform: "uppercase",
            }}
          >
            Jul 11 · Miami
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <SlotRow team={a} winner={winner} settings={settings} compact={compact} onAdvance={onAdvanceTp} onOpenPicker={open} />
          <SlotRow team={b} winner={winner} settings={settings} compact={compact} onAdvance={onAdvanceTp} onOpenPicker={open} />
        </div>
      </div>
    </div>
  );
}

export function Bracket({
  state,
  onPick,
  onClear,
  settings,
  themeStyle,
  compact = true,
}: {
  state: BracketState;
  onPick: OnPick;
  onClear: OnClear;
  settings: BracketSettings;
  themeStyle?: CSSProperties;
  compact?: boolean;
}) {
  const { tops, totalH, H } = layout(compact);

  const COL_W = compact ? 138 : 150;
  const GAP = compact ? 20 : 26;
  const COL_W_MID = compact ? 180 : 200;

  const [picker, setPicker] = useState<{
    open: boolean;
    anchor: PickerAnchor | null;
    round: number | "tp";
    idx: number;
    candidates: string[];
    current: string | null;
    title: string;
    subtitle?: string;
  }>({
    open: false,
    anchor: null,
    round: 0,
    idx: 0,
    candidates: [],
    current: null,
    title: "",
  });

  const openPicker: OpenPicker = (anchor, round, idx, candidates, current, title, subtitle) => {
    setPicker({ open: true, anchor, round, idx, candidates, current, title, subtitle });
  };

  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [outerHeight, setOuterHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!outerRef.current || !innerRef.current) return;
    const outer = outerRef.current;
    const inner = innerRef.current;
    const recompute = () => {
      const avail = outer.clientWidth;
      const iw = inner.scrollWidth;
      const ih = inner.scrollHeight;
      if (!avail || !iw) return;
      const s = Math.min(1, avail / iw);
      setScale(s);
      setOuterHeight(ih * s);
    };
    const ro = new ResizeObserver(recompute);
    ro.observe(outer);
    ro.observe(inner);
    recompute();
    return () => ro.disconnect();
  }, [compact]);

  useEffect(() => {
    if (!picker.open) return;
    const onResize = () => setPicker((p) => ({ ...p, open: false, anchor: null }));
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [picker.open]);

  const advanceFn = (round: number, idx: number) => (t: string) => onPick(round, idx, t);

  const renderColumn = (round: number, side: "L" | "R") => {
    const n = state.picks[round].length;
    const perSide = n / 2;
    const indices =
      side === "L"
        ? Array.from({ length: perSide }, (_, i) => i)
        : Array.from({ length: perSide }, (_, i) => perSide + i);

    return (
      <div style={{ position: "relative", height: totalH, flex: "0 0 auto", width: COL_W }}>
        {indices.map((idx) => {
          const [a, b] = getMatchup(state.picks, round, idx);
          const winner = state.picks[round][idx];
          const top = tops[round][idx];
          const labelSpace = round === 0 ? 12 : 0;
          return (
            <div
              key={`${round}-${idx}`}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: top - labelSpace,
                height: H + labelSpace,
              }}
            >
              <MatchCard
                pair={[a, b]}
                winner={winner}
                meta={round === 0 ? R32_META[idx] : null}
                round={round}
                idx={idx}
                settings={settings}
                compact={compact}
                tight={round !== 0}
                onAdvance={advanceFn(round, idx)}
                openPicker={openPicker}
                state={state}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const finalWinner = state.picks[4][0];
  const [fa, fb] = getMatchup(state.picks, 4, 0);
  const champ = getChamp(finalWinner);
  const advanceFinal = (t: string) => onPick(4, 0, t);

  return (
    <div
      ref={outerRef}
      style={{
        width: "100%",
        overflow: "hidden",
        height: outerHeight ?? undefined,
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: "max-content",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <RoundLabels compact={compact} colW={COL_W} colWMid={COL_W_MID} gap={GAP} />

        <div style={{ display: "flex", justifyContent: "center", gap: GAP, position: "relative" }}>
          <div style={{ display: "flex", gap: GAP, flex: "0 0 auto" }}>
            {renderColumn(0, "L")}
            <Connectors round={0} tops={tops} H={H} dir="right" gap={GAP} />
            {renderColumn(1, "L")}
            <Connectors round={1} tops={tops} H={H} dir="right" gap={GAP} />
            {renderColumn(2, "L")}
            <Connectors round={2} tops={tops} H={H} dir="right" gap={GAP} />
            {renderColumn(3, "L")}
          </div>

          <FinalColumn
            a={fa}
            b={fb}
            winner={finalWinner}
            champ={champ}
            onAdvance={advanceFinal}
            openPicker={openPicker}
            state={state}
            settings={settings}
            totalH={totalH}
            compact={compact}
            width={COL_W_MID}
          />

          <div style={{ display: "flex", gap: GAP, flex: "0 0 auto" }}>
            {renderColumn(3, "R")}
            <Connectors round={2} tops={tops} H={H} dir="left" side="R" gap={GAP} />
            {renderColumn(2, "R")}
            <Connectors round={1} tops={tops} H={H} dir="left" side="R" gap={GAP} />
            {renderColumn(1, "R")}
            <Connectors round={0} tops={tops} H={H} dir="left" side="R" gap={GAP} />
            {renderColumn(0, "R")}
          </div>
        </div>

        <ThirdPlace state={state} onPick={onPick} openPicker={openPicker} settings={settings} compact={compact} />
      </div>

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
