/**
 * Statchance — probabilistic match outcome model.
 *
 * Approach (Nate Silver SPI-style):
 *   • Each team carries (spi_off, spi_def) ratings interpreted as expected
 *     goals-for and goals-against per 90 minutes against a league-average side.
 *   • Expected goals in a given match:
 *       lambda_home = HOME_ADV * (spi_off_home / spi_def_away) * LEAGUE_AVG
 *       lambda_away =             (spi_off_away / spi_def_home) * LEAGUE_AVG
 *   • Goal distribution is Poisson; match is simulated N times.
 *   • Knockout ties go to a coin-flip weighted by expected goals (shootouts
 *     regress ~55/45 toward the stronger side per FiveThirtyEight calibration).
 *
 * This lets us generate P(win/draw/loss) for every possible match in the
 * tournament, and chain them into group-stage simulations and knockout paths.
 */

import type { Team, MonteCarloResult } from "@/types";

const LEAGUE_AVG = 1.27;   // average goals per team per match at World Cup
const HOME_ADV = 1.12;     // mild boost for neutral-site "home" designation
const PENALTY_REGRESSION = 0.55;

function poisson(lambda: number): number {
  // Knuth's algorithm — fine for lambdas < 10 which always holds here
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

export interface StatchanceOptions {
  simulations?: number;
  neutralSite?: boolean;
  knockout?: boolean;
}

export function simulateMatch(
  home: Team,
  away: Team,
  opts: StatchanceOptions = {}
): MonteCarloResult {
  const N = opts.simulations ?? 10_000;
  const homeAdv = opts.neutralSite ? 1.0 : HOME_ADV;

  const lambdaHome = homeAdv * (home.spi_off / Math.max(0.5, away.spi_def)) * LEAGUE_AVG;
  const lambdaAway = (away.spi_off / Math.max(0.5, home.spi_def)) * LEAGUE_AVG;

  let wins = 0, draws = 0, losses = 0;
  for (let i = 0; i < N; i++) {
    const gh = poisson(lambdaHome);
    const ga = poisson(lambdaAway);
    if (gh > ga) wins++;
    else if (gh === ga) {
      if (opts.knockout) {
        // Extra time is a 30-minute mini-match; if still tied, shootout
        const ghET = poisson(lambdaHome / 3);
        const gaET = poisson(lambdaAway / 3);
        if (ghET > gaET) wins++;
        else if (ghET < gaET) losses++;
        else {
          // shootout — weighted toward stronger side
          const edge = (home.spi_off - away.spi_off) * 0.15;
          Math.random() < PENALTY_REGRESSION + edge ? wins++ : losses++;
        }
      } else {
        draws++;
      }
    } else losses++;
  }

  return {
    homeCode: home.code,
    awayCode: away.code,
    pWin: wins / N,
    pDraw: draws / N,
    pLoss: losses / N,
    expGoalsHome: lambdaHome,
    expGoalsAway: lambdaAway,
    simulations: N,
  };
}

/**
 * Simulate a full group (round-robin of 6 matches) many times and return the
 * per-team probability of finishing 1st, 2nd, 3rd, 4th.
 */
export function simulateGroup(teams: Team[], simulations = 5000) {
  if (teams.length !== 4) throw new Error("Group must have exactly 4 teams");

  const stats = new Map<string, { first: number; second: number; third: number; fourth: number }>();
  for (const t of teams) stats.set(t.code, { first: 0, second: 0, third: 0, fourth: 0 });

  const pairs: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3],
  ];

  for (let s = 0; s < simulations; s++) {
    const table = teams.map((t) => ({ code: t.code, pts: 0, gd: 0, gf: 0 }));
    for (const [i, j] of pairs) {
      const th = teams[i], ta = teams[j];
      const lambdaH = (th.spi_off / Math.max(0.5, ta.spi_def)) * LEAGUE_AVG;
      const lambdaA = (ta.spi_off / Math.max(0.5, th.spi_def)) * LEAGUE_AVG;
      const gh = poisson(lambdaH);
      const ga = poisson(lambdaA);
      if (gh > ga) { table[i].pts += 3; }
      else if (gh < ga) { table[j].pts += 3; }
      else { table[i].pts += 1; table[j].pts += 1; }
      table[i].gd += gh - ga; table[i].gf += gh;
      table[j].gd += ga - gh; table[j].gf += ga;
    }
    table.sort((a, b) =>
      b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || (Math.random() - 0.5)
    );
    stats.get(table[0].code)!.first++;
    stats.get(table[1].code)!.second++;
    stats.get(table[2].code)!.third++;
    stats.get(table[3].code)!.fourth++;
  }

  return teams.map((t) => {
    const s = stats.get(t.code)!;
    return {
      code: t.code,
      finishProb: {
        first:  s.first  / simulations,
        second: s.second / simulations,
        third:  s.third  / simulations,
        fourth: s.fourth / simulations,
      },
      advanceProb: (s.first + s.second) / simulations,
      // Best-third analog: approximate as half of third-place prob
      thirdAdvanceProb: (s.third / simulations) * 0.66,
    };
  });
}

export function winProbabilityMatrix(teams: Team[]) {
  const n = teams.length;
  const M: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const r = simulateMatch(teams[i], teams[j], { simulations: 2000, neutralSite: true, knockout: true });
      M[i][j] = r.pWin;
    }
  }
  return M;
}
