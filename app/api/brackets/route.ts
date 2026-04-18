import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PickSchema = z.object({
  matchId: z.string(),
  winnerCode: z.string().length(3),
  confidence: z.number().min(0).max(1).optional(),
});

const BracketSchema = z.object({
  userId: z.string().uuid().optional(),
  displayName: z.string().min(1).max(60).optional(),
  championCode: z.string().length(3),
  picks: z.array(PickSchema).min(1),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const supabase = createServerSupabase();
  let query = supabase
    .from("brackets")
    .select("id, user_id, display_name, champion_code, picks, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ brackets: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = BracketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("brackets")
    .insert({
      user_id: parsed.data.userId ?? null,
      display_name: parsed.data.displayName ?? null,
      champion_code: parsed.data.championCode,
      picks: parsed.data.picks,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ bracket: data }, { status: 201 });
}
