export type Confederation = "UEFA" | "CONMEBOL" | "CONCACAF" | "AFC" | "CAF" | "OFC";

export interface Team {
  code: string;
  name: string;
  confederation: Confederation;
  fifa: number;
  spi_off: number;
  spi_def: number;
  pot: 1 | 2 | 3 | 4;
  host: boolean;
  playIn?: boolean;
}

export interface Group {
  code: string;
  venue: string;
  teams: string[];
}

export type Stage =
  | "group"
  | "round32"
  | "round16"
  | "quarterfinal"
  | "semifinal"
  | "final";

export interface MatchOutcome {
  homeCode: string;
  awayCode: string;
  pWin: number;
  pDraw: number;
  pLoss: number;
  expGoalsHome: number;
  expGoalsAway: number;
}

export interface MonteCarloResult extends MatchOutcome {
  simulations: number;
}

export interface GroupStanding {
  code: string;
  played: number;
  points: number;
  gd: number;
  gf: number;
  ga: number;
  finishProb: { first: number; second: number; third: number; fourth: number };
}

export interface BracketPick {
  matchId: string;
  winnerCode: string;
  confidence: number;
}

export interface PickValue {
  teamCode: string;
  winProb: number;     // statchance
  pickPct: number;     // pickchance (public popularity)
  expectedValue: number; // winProb adjusted for popularity
  leverage: number;    // winProb / pickPct — contrarian signal
}
