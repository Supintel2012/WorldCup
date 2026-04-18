import { NextResponse } from "next/server";
import { getGroups, getGroupTeams, simulateAllGroups } from "@/lib/bracket-logic";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sims = Number(searchParams.get("sims") ?? 2000);
  const include = searchParams.get("include") ?? "";
  const withSims = include.includes("simulations");

  const groups = getGroups().map((g) => ({
    ...g,
    rosters: getGroupTeams(g.code),
  }));

  if (!withSims) return NextResponse.json({ groups });

  const results = simulateAllGroups(sims);
  return NextResponse.json({ groups, simulations: results });
}
