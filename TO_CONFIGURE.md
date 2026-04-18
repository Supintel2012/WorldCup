# TO_CONFIGURE

A running list of content or jobs that are still hard-coded (or absent) and
should be wired up before the app is considered production-ready. Delete an
entry once it's covered by code + data.

## Data wiring

### 1. Reference seed (teams + groups)
- **Status:** done in dev. `teams` (48 rows) and `groups` (12 rows) upserted
  via service-role REST from `data/teams.json` + `data/groups.json`.
- **Migration file:** `supabase/migrations/003_seed_reference.sql` (also
  runs idempotent upserts).
- **Todo:** before launch, swap the JSON-derived ratings for the live
  Opta / SPI feed. The fifa / spi_off / spi_def columns should be refreshed
  at least weekly.

### 2. Nightly Monte Carlo → `public.champion_probs`
- **Status:** table exists, nothing writes to it. `app/predictions/page.tsx`
  falls back to a FIFA-rating softmax when the table is empty — the kicker
  on the page says "showing FIFA-softmax approximation" so you can tell.
- **What's needed:**
  - Cron job (Supabase Edge Function or external worker) that runs
    `scripts/simulate-tournament.ts` (~10k–30k sims), aggregates per-team
    advancement probabilities, and upserts into `public.champion_probs`.
  - Recommended cadence: every 24h during group stage, every 6h during
    knockouts.
- **Schema:** one row per team, populated across p_champion / p_final /
  p_semi / p_quarter / p_round16 / p_advance.

### 3. Match schedule → `public.matches`
- **Status:** table exists, no rows. Schedule is currently hard-coded in
  `app/bracket/wc-data.ts::R32_META` (venue + date + time strings per R32
  match) and the round labels in `app/bracket/Bracket.tsx::RoundLabels`
  ("Jul 12 · MetLife", "Jul 4", etc).
- **What's needed:**
  - Ingest the official FIFA schedule into `public.matches` with `stage`,
    `kickoff`, `home_code`, `away_code`, venue. Right now we only have the
    R32 meta embedded in TS.
  - Once populated, replace `R32_META` with a server-side fetch on the
    bracket route, and derive the RoundLabels kickers from the earliest
    kickoff per stage.
- **Why it matters:** today the bracket shows placeholder kickoff times
  (e.g., "JUN 20 · 18:00 · PHILADELPHIA") that are guesses, not the actual
  FIFA draw. The *venues* in `wc-data.ts` are canonical but the dates are
  drafted.

### 4. Leaderboard scoring job → `public.leaderboard`
- **Status:** table exists, no rows. `app/leaderboard/page.tsx` now reads
  from the table and shows a proper empty state instead of the old
  PLACEHOLDER array.
- **What's needed:**
  - Scoring cron: after each match is finalized (`public.matches.winner_code`
    set), walk every `public.brackets` row, compare its picks to actuals,
    award per-round points (1 / 2 / 4 / 8 / 16 / 32 × pickchance weight),
    and upsert the running total into `public.leaderboard`.
  - `champion_prob` column on leaderboard rows should be populated from the
    latest `public.champion_probs` row for the bracket's champion pick.

### 5. Bracket chat drawer — leaderboard mock (`FRIENDS` in `wc-data.ts`)
- **Status:** `app/bracket/wc-data.ts::FRIENDS` is a hand-written 8-person
  mock roster used by `app/bracket/SidePanels.tsx::Leaderboard` inside the
  Chat drawer. The message "Pool · Group Chat · 8 friends · Round of 32"
  is also hard-coded next to it.
- **What's needed:** swap this mini-leaderboard to read the live
  `public.chat_members` for the current pool (joined via ChatProvider) and
  their associated `public.brackets` + `public.leaderboard` rows. The
  "8 friends" count should be `chat_members.length` from the pool.
- **Important:** the chat DM flow relies on `onDMByName(displayName)`
  resolving against `chat_members.display_name` — the mock names in FRIENDS
  never match a real member, so DM clicks from the mini-leaderboard are
  no-ops today.

### 6. Hero strip on `/bracket`
- **Status:** `app/bracket/BracketClient.tsx::HeroStrip` has three
  hard-coded stat cards:
  - "First match · Arg · Hai · Jun 18 · 12:00 ET"
  - "Final · MetLife · Jul 12 · 15:00 ET"
  - "Round of 32 · 16 matches · Jun 18 – 21"
- **What's needed:** once `public.matches` is populated (see #3), derive
  these from the earliest group-stage match and the final row.

### 7. Group-stage dates on `/bracket`
- **Status:** `app/bracket/BracketClient.tsx` renders a SectionHeader kicker
  `"12 groups · June 11 – June 15"` — the dates are hard-coded.
- **What's needed:** derive from `public.matches` stage=group min/max
  kickoff once the schedule is ingested.

## Legacy code paths

### 8. `lib/bracket-logic.ts` still imports `data/*.json`
- The sync helpers `getTeams()` / `getGroups()` / `getGroupTeams()` /
  `simulateAllGroups()` / `buildKnockoutPath()` still read from the bundled
  JSON. Pages migrated to the DB (`/groups`, `/predictions`, `/leaderboard`)
  no longer call these, but the following do:
  - `app/page.tsx`
  - `app/api/teams/route.ts`
  - `app/api/groups/route.ts`
  - `app/api/matches/route.ts`
  - `app/api/pickchance/route.ts`
  - `app/api/statchance/route.ts`
  - `scripts/simulate-tournament.ts`
- **What's needed:** migrate these callers to `lib/db-data.ts` (new DB
  readers) and delete the JSON imports + the `data/*.json` files.

### 9. Duplicate team metadata in `app/bracket/wc-data.ts`
- `app/bracket/wc-data.ts::TEAMS` is a second copy of the team roster with
  flag-stripe colours and display seeds. It is NOT the same shape as
  `public.teams`, but it duplicates `name` / `seed`.
- **What's needed:** move the flag-stripe / display seed fields into a new
  `public.team_display` table (or columns on `public.teams`), then derive
  the bracket's TEAMS constant from the same source.

## Ops

### 10. Env + keys
- `.env.local` currently holds `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Before deploy: rotate the service role key out of any developer
  machines and into the host's secret store (Vercel env, etc).

### 11. RLS policies
- `chat_pools` / `chat_members` / `chat_messages` have permissive insert
  policies while identity is client-generated (see comment in
  `supabase/migrations/002_chat.sql`). Tighten to `auth.uid()::text =
  user_id` once Supabase auth is introduced.
- Same for `brackets` / `picks` — today anyone can insert. Post-auth, add
  `create policy "user owns bracket" ... using (auth.uid() = user_id)`.

### 12. Realtime publication coverage
- `chat_messages` and `chat_members` are in `supabase_realtime`. If the
  bracket starts reading live match results from `public.matches`, add that
  table to the publication too (there's a precedent pattern in
  `002_chat.sql`).
