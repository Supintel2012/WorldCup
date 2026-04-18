/**
 * Bracket assembly + simulation for the 48-team / 32-slot knockout.
 *
 * FIFA 2026 format:
 *   - 12 groups (A–L) of 4 teams
 *   - Top 2 from each group advance (24 teams)
 *   - 8 best third-placed teams advance (our "Play-In" analog — SI calls
 *     this conceptually like the NCAA First Four but it's a statistical
 *     cutoff, not additional games)
 *   - Round of 32 → 16 → Quarters → Semis → Final
 */

import type { Team } from "@/types";
import teamsData from "@/data/teams.json";
import groupsData from "@/data/groups.json";
import { simulateGroup, simulateMatch } from "./statchance";

export function getTeams(): Team[] {
  return teamsData.teams as Team[];
}

export function getTeamByCode(code: string): Team | undefined {
  return getTeams().find((t) => t.code === code);
}

export function getGroups() {
  return groupsData.groups;
}

export function getGroupTeams(groupCode: string): Team[] {
  const group = groupsData.groups.find((g) => g.code === groupCode);
  if (!group) return [];
  return group.teams
    .map((code) => getTeamByCode(code))
    .filter((t): t is Team => !!t);
}

/**
 * Run group-stage simulation for every group and select the 8 best third-
 * placed teams by finishProb.third × advanceProb.
 */
export function simulateAllGroups(sims = 3000) {
  const allResults: Record<string, ReturnType<typeof simulateGroup>> = {};
  for (const g of getGroups()) {
    allResults[g.code] = simulateGroup(getGroupTeams(g.code), sims);
  }

  // Rank third-place candidates by "path strength"
  const thirdPlaceCandidates = Object.entries(allResults).flatMap(
    ([groupCode, teams]) =>
      teams.map((t) => ({
        groupCode,
        teamCode: t.code,
        thirdProb: t.finishProb.third,
        advanceProb: t.advanceProb,
      }))
  );
  thirdPlaceCandidates.sort((a, b) => b.thirdProb - a.thirdProb);
  const playInAdvancers = thirdPlaceCandidates.slice(0, 8);

  return { allResults, playInAdvancers };
}

/**
 * Build the Round of 32 bracket by pairing group winners/runners-up with
 * best third-placed advancers. Returns match-by-match win probabilities.
 */
export function buildKnockoutPath(groupResults: ReturnType<typeof simulateAllGroups>) {
  // Simplified pairing: 1st of group N vs. 2nd of group N+6 (mod 12),
  // with third-placed advancers slotted into the matches per FIFA's draw.
  const groups = getGroups();
  const first: Team[] = [];
  const second: Team[] = [];

  for (const g of groups) {
    const teams = getGroupTeams(g.code);
    const res = groupResults.allResults[g.code];
    const sorted = [...res].sort(
      (a, b) => b.finishProb.first - a.finishProb.first
    );
    const firstCode = sorted[0].code;
    const secondCode = [...res]
      .sort((a, b) => b.finishProb.second - a.finishProb.second)
      .find((r) => r.code !== firstCode)?.code;
    const f = teams.find((t) => t.code === firstCode);
    const s = teams.find((t) => t.code === secondCode);
    if (f) first.push(f);
    if (s) second.push(s);
  }

  const playIn = groupResults.playInAdvancers
    .map((p) => getTeamByCode(p.teamCode))
    .filter((t): t is Team => !!t);

  // Construct Round of 32 pairings (stylized, not the exact FIFA draw)
  const r32: Array<{ id: string; home: Team; away: Team }> = [];
  for (let i = 0; i < 12; i++) {
    const opp = i < 4 ? playIn[i] : second[(i + 6) % 12];
    r32.push({
      id: `R32-${i + 1}`,
      home: first[i],
      away: opp,
    });
  }
  // Remaining 4 R32 matches pair runners-up vs. best thirds
  for (let i = 0; i < 4; i++) {
    r32.push({
      id: `R32-${13 + i}`,
      home: second[8 + i] ?? second[i],
      away: playIn[4 + i],
    });
  }

  return r32.filter((m) => m.home && m.away).map((m) => {
    const result = simulateMatch(m.home, m.away, {
      neutralSite: true,
      knockout: true,
      simulations: 2000,
    });
    return { ...m, ...result };
  });
}
