/**
 * Seed Supabase with teams + groups from `data/*.json`.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm seed
 */

import { createClient } from "@supabase/supabase-js";
import teamsData from "../data/teams.json";
import groupsData from "../data/groups.json";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

async function seedTeams() {
  const rows = teamsData.teams.map((t: any) => ({
    code: t.code,
    name: t.name,
    confederation: t.confederation,
    fifa: t.fifa,
    spi_off: t.spi_off,
    spi_def: t.spi_def,
    pot: t.pot,
    host: !!t.host,
    play_in: !!t.playIn,
  }));
  const { error } = await supabase.from("teams").upsert(rows, { onConflict: "code" });
  if (error) throw error;
  console.log(`✓ upserted ${rows.length} teams`);
}

async function seedGroups() {
  const rows = groupsData.groups.map((g: any) => ({
    code: g.code,
    venue: g.venue,
    team_codes: g.teams,
  }));
  const { error } = await supabase.from("groups").upsert(rows, { onConflict: "code" });
  if (error) throw error;
  console.log(`✓ upserted ${rows.length} groups`);
}

async function main() {
  console.log("Seeding SmartBracket WC26...");
  await seedTeams();
  await seedGroups();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
