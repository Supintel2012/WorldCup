import { createServerSupabase } from "./supabase";
import type { Group, Team } from "@/types";

type TeamRow = {
  code: string;
  name: string;
  confederation: Team["confederation"];
  fifa: number;
  spi_off: number;
  spi_def: number;
  pot: 1 | 2 | 3 | 4;
  host: boolean;
  play_in: boolean;
};

type GroupRow = { code: string; venue: string; team_codes: string[] };

export type ChampionProb = {
  team_code: string;
  p_champion: number;
  p_final: number | null;
  p_semi: number | null;
  p_quarter: number | null;
  p_round16: number | null;
  p_advance: number | null;
  simulations: number | null;
  computed_at: string | null;
};

export type LeaderboardRow = {
  id: string;
  bracket_id: string | null;
  user_id: string | null;
  display_name: string | null;
  points: number;
  correct_picks: number | null;
  champion_prob: number | null;
  rank: number | null;
  updated_at: string;
};

export async function fetchTeams(): Promise<Team[]> {
  const sb = createServerSupabase();
  const { data, error } = await sb
    .from("teams")
    .select("code, name, confederation, fifa, spi_off, spi_def, pot, host, play_in")
    .order("fifa", { ascending: false });
  if (error) throw new Error(`fetchTeams: ${error.message}`);
  return (data as TeamRow[]).map((r) => ({
    code: r.code,
    name: r.name,
    confederation: r.confederation,
    fifa: r.fifa,
    spi_off: Number(r.spi_off),
    spi_def: Number(r.spi_def),
    pot: r.pot,
    host: r.host,
    playIn: r.play_in,
  }));
}

export async function fetchGroups(): Promise<Group[]> {
  const sb = createServerSupabase();
  const { data, error } = await sb
    .from("groups")
    .select("code, venue, team_codes")
    .order("code", { ascending: true });
  if (error) throw new Error(`fetchGroups: ${error.message}`);
  return (data as GroupRow[]).map((r) => ({ code: r.code, venue: r.venue, teams: r.team_codes }));
}

export async function fetchChampionProbs(): Promise<ChampionProb[]> {
  const sb = createServerSupabase();
  const { data, error } = await sb
    .from("champion_probs")
    .select("*")
    .order("p_champion", { ascending: false });
  if (error) throw new Error(`fetchChampionProbs: ${error.message}`);
  return (data as ChampionProb[]) ?? [];
}

export async function fetchLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const sb = createServerSupabase();
  const { data, error } = await sb
    .from("leaderboard")
    .select("*")
    .order("points", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`fetchLeaderboard: ${error.message}`);
  return (data as LeaderboardRow[]) ?? [];
}
