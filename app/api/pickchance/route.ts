import { NextResponse } from "next/server";
import { getTeams } from "@/lib/bracket-logic";
import { computePickDistribution, pickValues, recommendPick } from "@/lib/pickchance";

export const dynamic = "force-dynamic";

/**
 * Approximate championship win-prob from FIFA rating until the nightly
 * simulate-tournament script populates `leaderboard.champion_probs`.
 */
function approximateWinProbs(teams: ReturnType<typeof getTeams>) {
  const max = Math.max(...teams.map((t) => t.fifa));
  const weights = teams.map((t) => Math.exp((t.fifa - max) / 60));
  const sum = weights.reduce((a, b) => a + b, 0);
  return new Map(teams.map((t, i) => [t.code, weights[i] / sum]));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const contrarian = Number(searchParams.get("contrarian") ?? 0.35);
  const poolSize = Number(searchParams.get("poolSize") ?? 50);
  const topOnly = searchParams.get("recommend") === "true";

  const teams = getTeams();
  const winProbs = approximateWinProbs(teams);
  const distribution = computePickDistribution(teams);
  const values = pickValues(teams, winProbs, { contrarian, poolSize });

  if (topOnly) {
    const pick = recommendPick(teams, winProbs, { contrarian, poolSize });
    return NextResponse.json({ recommendation: pick });
  }

  return NextResponse.json({
    contrarian,
    poolSize,
    distribution: Object.fromEntries(distribution),
    values,
  });
}
