import { NextResponse } from "next/server";
import { getTeams, simulateAllGroups, buildKnockoutPath } from "@/lib/bracket-logic";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sims = Number(searchParams.get("sims") ?? 2000);

  const teams = getTeams();
  const groupResults = simulateAllGroups(sims);
  const r32 = buildKnockoutPath(groupResults);

  return NextResponse.json({
    teams: teams.length,
    groups: Object.keys(groupResults.allResults).length,
    simulations: sims,
    playInAdvancers: groupResults.playInAdvancers,
    roundOf32: r32.map((m) => ({
      id: m.id,
      home: m.home.code,
      away: m.away.code,
      pWin: m.pWin,
      pLoss: m.pLoss,
      expGoalsHome: m.expGoalsHome,
      expGoalsAway: m.expGoalsAway,
    })),
  });
}
