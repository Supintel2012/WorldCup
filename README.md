# SmartBracket · FIFA World Cup 2026

Probabilistic bracket prediction engine for the 48-team 2026 World Cup,
hosted across the US/Canada/Mexico. Built on Next.js 14 App Router +
Supabase, designed for one-click Vercel deployment.

Two core models ship with the repo:

| Model        | Purpose                                                                  |
|--------------|--------------------------------------------------------------------------|
| **Statchance**  | Poisson goal-expectancy match simulator (Silver/SPI-style). Produces `P(win/draw/loss)` and expected goals for every possible matchup. |
| **Pickchance**  | Pool-aware public pick popularity model. Blends FIFA rating × confederation mindshare × host bias into a softmax `pickPct`, then surfaces `leverage = winProb / pickPct` for contrarian picks. |

"Play-In" slots map to FIFA 2026's 8-best-third-place rule — conceptually
analogous to the NCAA First Four that SI's March Madness product already
models.

---

## Quickstart

```bash
git clone git@github.com:Supintel2012/WorldCup.git
cd WorldCup
pnpm install            # or: npm install / yarn

cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY

pnpm dev                # http://localhost:3000
```

### Supabase setup

1. Create a new project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql).
3. Seed reference tables:
   ```bash
   pnpm seed
   ```
4. (Optional) Run nightly Monte Carlo:
   ```bash
   N=10000 pnpm simulate
   ```

### Deploy to Vercel

```bash
pnpm dlx vercel link
pnpm dlx vercel env pull
pnpm dlx vercel deploy --prod
```

Required env vars on Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

---

## Project structure

```
app/
  page.tsx               · Landing / hero
  groups/page.tsx        · 12 group cards with advance probabilities
  bracket/page.tsx       · Round of 32 win-probability bars
  predictions/page.tsx   · Statchance × Pickchance leverage table
  leaderboard/page.tsx   · Pool standings (hooks into public.leaderboard)
  api/
    teams/               · GET /api/teams?confederation=UEFA&pot=2
    groups/              · GET /api/groups?include=simulations&sims=2000
    matches/             · GET /api/matches?home=USA&away=MEX&knockout=true
    statchance/          · GET /api/statchance?sims=2000
    pickchance/          · GET /api/pickchance?contrarian=0.35&poolSize=50
    brackets/            · GET / POST user bracket submissions

components/              · TeamChip, GroupCard, MatchBar, Header, Footer
data/                    · teams.json (48), groups.json (12)
lib/
  statchance.ts          · Poisson match simulator + group simulator
  pickchance.ts          · Softmax pick distribution + EV ranking
  bracket-logic.ts       · Group → Round of 32 assembly
  supabase.ts            · Browser + SSR + service-role clients
scripts/
  seed.ts                · Upsert data/*.json into Supabase
  simulate-tournament.ts · Full-tournament MC → champion_probs
supabase/migrations/     · 001_init.sql
```

---

## Models

### Statchance — expected goals via SPI

Each team carries `(spi_off, spi_def)` ratings calibrated to "goals scored
per 90 against a league-average opponent." Match lambdas:

```
λ_home = HOME_ADV · (spi_off_home / spi_def_away) · LEAGUE_AVG
λ_away =            (spi_off_away / spi_def_home) · LEAGUE_AVG
```

Goals are sampled Poisson. Knockouts use a mini-match for extra time and a
shootout skewed 55/45 toward the stronger side per FiveThirtyEight
calibration.

### Pickchance — pool leverage

Bracket pools reward differentiation. A team's EV in the pool is roughly:

```
EV ≈ winProb × (1 − pickPct)^(N−1)   for pool size N
```

Pickchance models `pickPct` as a mindshare softmax:

```
mindshare_t = (fifa_t / 100) · confed_weight · host_boost
pickPct_t   = softmax(mindshare, T=3.5)
```

Confederation weights fold in public-consciousness bias (CONMEBOL inflated
for Argentina/Brazil star-power; AFC/OFC deflated). Output is a combined
table of `winProb`, `pickPct`, `leverage`, and `expectedValue`.

---

## Roadmap

- Live match ingestion via FIFA API (replace simulated scores)
- User auth via Supabase magic links
- Pool scoring worker (round multipliers 1/2/4/8/16/32)
- Real nightly champion_probs with 100k+ simulations
- Export bracket → ESPN / Yahoo formats

---

© 2012–2026 Supported Intelligence, LLC · SmartBracket™
Patents 9,798,700 · 10,460,249 · 10,546,248
