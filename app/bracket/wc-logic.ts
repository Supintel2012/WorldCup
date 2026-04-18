import { KNOCKOUT_SEEDING, R32_META, TEAMS } from "./wc-data";

// Rounds: R32 (16) → R16 (8) → QF (4) → SF (2) → Final (1)
export const NUM_ROUNDS = 5;
export const R32_COUNT = 16;

export type BracketState = {
  picks: [
    (string | null)[], // R32 — 16
    (string | null)[], // R16 — 8
    (string | null)[], // QF  — 4
    (string | null)[], // SF  — 2
    (string | null)[], // F   — 1
  ];
  thirdPlace: string | null;
};

export function makeEmptyPicks(): BracketState {
  return {
    picks: [
      Array(16).fill(null),
      Array(8).fill(null),
      Array(4).fill(null),
      Array(2).fill(null),
      Array(1).fill(null),
    ],
    thirdPlace: null,
  };
}

export function getMatchup(
  picks: BracketState["picks"],
  round: number,
  idx: number,
): [string | null, string | null] {
  if (round === 0) return KNOCKOUT_SEEDING[idx];
  const prev = picks[round - 1];
  return [prev[idx * 2], prev[idx * 2 + 1]];
}

export function findR32Index(team: string): number {
  for (let i = 0; i < KNOCKOUT_SEEDING.length; i++) {
    if (KNOCKOUT_SEEDING[i].includes(team)) return i;
  }
  return -1;
}

export function advanceTeam(
  state: BracketState,
  round: number,
  idx: number,
  team: string,
): BracketState {
  const next: BracketState = {
    picks: state.picks.map((r) => r.slice()) as BracketState["picks"],
    thirdPlace: state.thirdPlace,
  };

  const r32Idx = findR32Index(team);
  if (r32Idx === -1) return state;

  const pathSlotAtRound = (r: number) => Math.floor(r32Idx / Math.pow(2, r));
  if (pathSlotAtRound(round) !== idx) return state;

  for (let r = 0; r <= round; r++) {
    next.picks[r][pathSlotAtRound(r)] = team;
  }

  for (let r = round + 1; r < next.picks.length; r++) {
    const slot = Math.floor(idx / Math.pow(2, r - round));
    const occupant = next.picks[r][slot];
    if (occupant && occupant !== team) {
      const occR32 = findR32Index(occupant);
      if (occR32 !== -1 && Math.floor(occR32 / Math.pow(2, round)) === idx) {
        next.picks[r][slot] = null;
      }
    }
  }

  if (round <= 3) next.thirdPlace = null;

  return next;
}

export function getThirdPlaceMatchup(state: BracketState): [string | null, string | null] {
  const sfLoser = (i: number) => {
    const [a, b] = getMatchup(state.picks, 3, i);
    const winner = state.picks[3][i];
    if (!winner || !a || !b) return null;
    return a === winner ? b : a;
  };
  return [sfLoser(0), sfLoser(1)];
}

const winBySeed = (a: string | null, b: string | null): string | null => {
  if (!a) return b;
  if (!b) return a;
  const sa = TEAMS[a].seed, sb = TEAMS[b].seed;
  if (sa !== sb) return sa < sb ? a : b;
  return a < b ? a : b;
};

export function autoFillBySeed(): BracketState {
  const state = makeEmptyPicks();
  for (let i = 0; i < R32_COUNT; i++) {
    const [a, b] = KNOCKOUT_SEEDING[i];
    state.picks[0][i] = winBySeed(a, b);
  }
  for (let r = 1; r < NUM_ROUNDS; r++) {
    for (let i = 0; i < state.picks[r].length; i++) {
      state.picks[r][i] = winBySeed(state.picks[r - 1][i * 2], state.picks[r - 1][i * 2 + 1]);
    }
  }
  const [tpA, tpB] = getThirdPlaceMatchup(state);
  state.thirdPlace = winBySeed(tpA, tpB);
  return state;
}

export type QuizAnswers = {
  champion: string;
  darkHorse: string;
  upsetTolerance: "low" | "med" | "high";
};

export function autoFillFromQuiz(q: QuizAnswers): BracketState {
  const state = makeEmptyPicks();
  const upset = { low: 0.1, med: 0.35, high: 0.6 }[q.upsetTolerance ?? "med"];

  const seedInit = (q.champion + q.darkHorse + q.upsetTolerance)
    .split("")
    .reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  let s = seedInit || 1;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };

  const pref = (code: string) => {
    if (code === q.champion) return -3;
    if (code === q.darkHorse) return -1.5;
    return TEAMS[code].seed;
  };

  const winner = (a: string | null, b: string | null): string | null => {
    if (!a) return b;
    if (!b) return a;
    let pa = pref(a), pb = pref(b);
    if (rnd() < upset) [pa, pb] = [pb, pa];
    return pa <= pb ? a : b;
  };

  for (let i = 0; i < R32_COUNT; i++) {
    const [a, b] = KNOCKOUT_SEEDING[i];
    state.picks[0][i] = winner(a, b);
  }
  const champIdx = findR32Index(q.champion);
  if (champIdx !== -1) state.picks[0][champIdx] = q.champion;

  for (let r = 1; r < NUM_ROUNDS; r++) {
    for (let i = 0; i < state.picks[r].length; i++) {
      state.picks[r][i] = winner(state.picks[r - 1][i * 2], state.picks[r - 1][i * 2 + 1]);
    }
    if (champIdx !== -1) {
      const slot = Math.floor(champIdx / Math.pow(2, r));
      state.picks[r][slot] = q.champion;
    }
  }
  const [tpA, tpB] = getThirdPlaceMatchup(state);
  state.thirdPlace = winner(tpA, tpB);
  return state;
}

export function getSlotCandidates(round: number, idx: number): string[] {
  const span = Math.pow(2, round);
  const start = idx * span;
  const end = start + span;
  const out: string[] = [];
  for (let i = start; i < end; i++) {
    const [a, b] = KNOCKOUT_SEEDING[i];
    out.push(a, b);
  }
  return out;
}

export function clearSlot(state: BracketState, round: number, idx: number): BracketState {
  const team = state.picks[round][idx];
  if (!team) return state;
  const next: BracketState = {
    picks: state.picks.map((r) => r.slice()) as BracketState["picks"],
    thirdPlace: state.thirdPlace,
  };
  next.picks[round][idx] = null;
  for (let r = round + 1; r < next.picks.length; r++) {
    const slot = Math.floor(idx / Math.pow(2, r - round));
    if (next.picks[r][slot] === team) next.picks[r][slot] = null;
  }
  if (round <= 3 && next.thirdPlace === team) next.thirdPlace = null;
  return next;
}

export function countPicks(state: BracketState) {
  let done = 0, total = 0;
  state.picks.forEach((r) => r.forEach((p) => { total++; if (p) done++; }));
  total += 1; if (state.thirdPlace) done += 1;
  return { done, total };
}

export function isComplete(state: BracketState) {
  const { done, total } = countPicks(state);
  return done === total;
}

export { KNOCKOUT_SEEDING, R32_META, TEAMS };
