import { NextResponse } from "next/server";
import { getTeamByCode } from "@/lib/bracket-logic";
import { simulateMatch } from "@/lib/statchance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const homeCode = searchParams.get("home");
  const awayCode = searchParams.get("away");
  const knockout = searchParams.get("knockout") === "true";
  const sims = Number(searchParams.get("sims") ?? 10_000);

  if (!homeCode || !awayCode) {
    return NextResponse.json({ error: "home and away query params required" }, { status: 400 });
  }
  const home = getTeamByCode(homeCode);
  const away = getTeamByCode(awayCode);
  if (!home || !away) {
    return NextResponse.json({ error: "unknown team code" }, { status: 404 });
  }

  const result = simulateMatch(home, away, {
    simulations: sims,
    neutralSite: true,
    knockout,
  });

  return NextResponse.json({
    home: { code: home.code, name: home.name },
    away: { code: away.code, name: away.name },
    result,
  });
}
