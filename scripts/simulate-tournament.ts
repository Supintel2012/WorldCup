/**
 * Full-tournament Monte Carlo — simulates the group stage + knockout tree
 * N times and writes championship probabilities to public.champion_probs.
 *
 *   N=10000 pnpm simulate
 */

import { createClient } from "@supabase/supabase-js";
import { simulateGroup, simulateMatch } from "../lib/statchance";
import { getGroups, getGroupTeams, getTeams, getTeamByCode } from "../lib/bracket-logic";
import type { Team } from "../types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const N = Number(process.env.N ?? 5000);

function drawKnockout(winners: Team[]): Team {
  // Single-elimination; neutral-site knockouts
  let bracket = [...winners];
  while (bracket.length > 1) {
    const next: Team[] = [];
    for (let i = 0; i < bracket.length; i += 2) {
      const a = bracket[i];
      const b = bracket[i + 1];
      const { pWin } = simulateMatch(a, b, {
        simulations: 1,
        neutralSite: true,
        knockout: true,
      });
      next.push(Math.random() < pWin ? a : b);
    }
    bracket = next;
  }
  return bracket[0];
}

function runOne(): { champion: Team; semifinalists: Team[]; finalists: Team[] } {
  const advancers: Team[] = [];
  const thirds: { team: Team; score: number }[] = [];

  for (const g of getGroups()) {
    const teams = getGroupTeams(g.code);
    const sim = simulateGroup(teams, 1); // single-trial sampling
    const sorted = sim.sort(
      (a, b) => b.finishProb.first - a.finishProb.first
    );
    const [first, second, third] = sorted;
    const firstTeam = teams.find((t) => t.code === first.code)!;
    const secondTeam = teams.find((t) => t.code === second.code)!;
    const thirdTeam = teams.find((t) => t.code === third.code)!;
    advancers.push(firstTeam, secondTeam);
    thirds.push({ team: thirdTeam, score: thirdTeam.fifa });
  }

  thirds.sort((a, b) => b.score - a.score);
  advancers.push(...thirds.slice(0, 8).map((t) => t.team));

  // Shuffle advancers to create an R32 bracket
  for (let i = advancers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [advancers[i], advancers[j]] = [advancers[j], advancers[i]];
  }

  const champion = drawKnockout(advancers);
  return { champion, semifinalists: [], finalists: [] };
}

async function main() {
  if (!URL || !KEY) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(URL, KEY, { auth: { persistSession: false } });
  const teams = getTeams();
  const championCount = new Map<string, number>();

  console.log(`Running ${N} full-tournament simulations...`);
  const start = Date.now();
  for (let i = 0; i < N; i++) {
    const { champion } = runOne();
    championCount.set(champion.code, (championCount.get(champion.code) ?? 0) + 1);
    if ((i + 1) % 500 === 0) {
      const pct = (((i + 1) / N) * 100).toFixed(0);
      console.log(`  ${pct}% · ${((Date.now() - start) / 1000).toFixed(1)}s elapsed`);
    }
  }

  const rows = teams.map((t) => ({
    team_code: t.code,
    p_champion: (championCount.get(t.code) ?? 0) / N,
    simulations: N,
    computed_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("champion_probs")
    .upsert(rows, { onConflict: "team_code" });
  if (error) throw error;

  console.log(`✓ wrote ${rows.length} champion probabilities`);
  console.log("\nTop 10:");
  rows
    .sort((a, b) => b.p_champion - a.p_champion)
    .slice(0, 10)
    .forEach((r, i) => {
      const name = getTeamByCode(r.team_code)?.name ?? r.team_code;
      console.log(`  ${i + 1}. ${name.padEnd(16)} ${(r.p_champion * 100).toFixed(2)}%`);
    });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
