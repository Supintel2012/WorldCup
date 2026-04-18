/**
 * Pickchance — public pick popularity model.
 *
 * In a bracket pool, picking the favorite is not the same as picking the
 * optimal bracket. If everyone else picks Brazil, then picking Brazil earns
 * you points when Brazil wins but doesn't differentiate you from the pool.
 * The optimal strategy (see Metrick 1996, Breiter & Carlin 1997) is to pick
 * teams whose win probability is high *relative to* their public pick rate.
 *
 *   leverage  = winProb / pickPct
 *   EV(pool)  = winProb × (1 - pickPct)^(N-1) × pointValue
 *
 * We model pickPct as a softmax over team "mindshare" (FIFA ranking + host
 * bias + star-power). Until we have a real pool of users, we approximate it
 * from FIFA rankings + confederation bias (CONMEBOL/UEFA dominance in public
 * consciousness) + host-country inflation.
 */

import type { Team, PickValue } from "@/types";

interface PickchanceOptions {
  contrarian?: number;   // 0 = honest pickPct; 1 = maximum contrarian weighting
  poolSize?: number;     // used for EV calibration
}

const CONFED_MINDSHARE: Record<string, number> = {
  UEFA: 1.0,
  CONMEBOL: 1.15,     // Argentina/Brazil star-power inflation
  CONCACAF: 0.85,
  AFC: 0.75,
  CAF: 0.80,
  OFC: 0.50,
};

function softmax(values: number[], temperature = 1): number[] {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp((v - max) / temperature));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function computePickDistribution(teams: Team[]): Map<string, number> {
  const mindshare = teams.map((t) => {
    const base = t.fifa / 100;
    const confed = CONFED_MINDSHARE[t.confederation] ?? 0.9;
    const hostBoost = t.host ? 1.12 : 1.0;
    return base * confed * hostBoost;
  });
  const probs = softmax(mindshare, 3.5);  // temperature calibrated to spread
  return new Map(teams.map((t, i) => [t.code, probs[i]]));
}

export function pickValues(
  teams: Team[],
  winProbs: Map<string, number>,
  opts: PickchanceOptions = {}
): PickValue[] {
  const contrarian = opts.contrarian ?? 0.35;
  const poolSize = opts.poolSize ?? 50;
  const pickDist = computePickDistribution(teams);

  return teams.map((t) => {
    const winProb = winProbs.get(t.code) ?? 0;
    const pickPct = pickDist.get(t.code) ?? 1 / teams.length;
    const leverage = winProb / Math.max(0.001, pickPct);

    // Expected pool-winning contribution: you only win the pool if no one
    // else in your pool made the same pick (approximation, ignoring ties)
    const uniqueness = Math.pow(1 - pickPct, Math.max(1, poolSize - 1));
    const ev = winProb * (1 - contrarian + contrarian * uniqueness);

    return {
      teamCode: t.code,
      winProb,
      pickPct,
      expectedValue: ev,
      leverage,
    };
  }).sort((a, b) => b.expectedValue - a.expectedValue);
}

/**
 * Given a set of candidate winners at a given round, recommend a pick that
 * balances expected points vs. pool differentiation.
 */
export function recommendPick(
  teams: Team[],
  winProbs: Map<string, number>,
  opts: PickchanceOptions = {}
): PickValue {
  const values = pickValues(teams, winProbs, opts);
  return values[0];
}
