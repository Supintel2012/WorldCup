import { NextResponse } from "next/server";
import { getTeams } from "@/lib/bracket-logic";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const confed = searchParams.get("confederation");
  const pot = searchParams.get("pot");

  let teams = getTeams();
  if (confed) teams = teams.filter((t) => t.confederation === confed);
  if (pot) teams = teams.filter((t) => String(t.pot) === pot);

  return NextResponse.json({ teams, count: teams.length });
}
