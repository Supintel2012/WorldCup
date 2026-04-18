-- SmartBracket WC26 · initial schema
-- Run in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------
-- TEAMS
-- ------------------------------------------------------------------
create table if not exists public.teams (
    code            char(3) primary key,
    name            text not null,
    confederation   text not null check (confederation in ('UEFA','CONMEBOL','CONCACAF','AFC','CAF','OFC')),
    fifa            int not null,
    spi_off         numeric(5,2) not null,
    spi_def         numeric(5,2) not null,
    pot             int not null check (pot between 1 and 4),
    host            boolean default false,
    play_in         boolean default false,
    created_at      timestamptz default now()
);

-- ------------------------------------------------------------------
-- GROUPS
-- ------------------------------------------------------------------
create table if not exists public.groups (
    code            char(1) primary key,
    venue           text not null,
    team_codes      char(3)[] not null,
    created_at      timestamptz default now()
);

-- ------------------------------------------------------------------
-- MATCHES (group stage + knockouts)
-- ------------------------------------------------------------------
create table if not exists public.matches (
    id              uuid primary key default gen_random_uuid(),
    stage           text not null check (stage in ('group','round32','round16','quarterfinal','semifinal','final')),
    group_code      char(1) references public.groups(code),
    home_code       char(3) references public.teams(code),
    away_code       char(3) references public.teams(code),
    kickoff         timestamptz,
    score_home      int,
    score_away      int,
    winner_code     char(3) references public.teams(code),
    -- projected outputs
    p_win           numeric(5,4),
    p_draw          numeric(5,4),
    p_loss          numeric(5,4),
    exp_goals_home  numeric(5,3),
    exp_goals_away  numeric(5,3),
    simulations     int,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);
create index if not exists matches_stage_idx on public.matches(stage);
create index if not exists matches_group_idx on public.matches(group_code);

-- ------------------------------------------------------------------
-- BRACKETS — a user's full prediction set
-- ------------------------------------------------------------------
create table if not exists public.brackets (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid,
    display_name    text,
    champion_code   char(3) references public.teams(code),
    picks           jsonb not null,   -- [{matchId, winnerCode, confidence}, ...]
    pickchance_ev   numeric(6,3),
    created_at      timestamptz default now()
);
create index if not exists brackets_user_idx on public.brackets(user_id);

-- ------------------------------------------------------------------
-- PICKS — denormalized pick table, one row per (bracket, match)
-- ------------------------------------------------------------------
create table if not exists public.picks (
    id              uuid primary key default gen_random_uuid(),
    bracket_id      uuid not null references public.brackets(id) on delete cascade,
    match_id        text not null,    -- e.g. "R32-1", "QF-2"
    winner_code     char(3) references public.teams(code),
    confidence      numeric(4,3),
    awarded_points  numeric(6,2) default 0
);
create index if not exists picks_bracket_idx on public.picks(bracket_id);

-- ------------------------------------------------------------------
-- LEADERBOARD — snapshot of pool standings
-- ------------------------------------------------------------------
create table if not exists public.leaderboard (
    id              uuid primary key default gen_random_uuid(),
    bracket_id      uuid references public.brackets(id) on delete cascade,
    user_id         uuid,
    display_name    text,
    points          numeric(8,2) not null default 0,
    correct_picks   int default 0,
    champion_prob   numeric(5,4),
    rank            int,
    updated_at      timestamptz default now()
);
create index if not exists leaderboard_points_idx on public.leaderboard(points desc);

-- ------------------------------------------------------------------
-- CHAMPION_PROBS — nightly Monte Carlo output per team
-- ------------------------------------------------------------------
create table if not exists public.champion_probs (
    team_code       char(3) primary key references public.teams(code),
    p_champion      numeric(6,5) not null,
    p_final         numeric(6,5),
    p_semi          numeric(6,5),
    p_quarter       numeric(6,5),
    p_round16       numeric(6,5),
    p_advance       numeric(6,5),
    simulations     int,
    computed_at     timestamptz default now()
);

-- ------------------------------------------------------------------
-- RLS — public read on reference tables, authenticated write on user data
-- ------------------------------------------------------------------
alter table public.teams           enable row level security;
alter table public.groups          enable row level security;
alter table public.matches         enable row level security;
alter table public.brackets        enable row level security;
alter table public.picks           enable row level security;
alter table public.leaderboard     enable row level security;
alter table public.champion_probs  enable row level security;

create policy "public read teams"          on public.teams          for select using (true);
create policy "public read groups"         on public.groups         for select using (true);
create policy "public read matches"        on public.matches        for select using (true);
create policy "public read leaderboard"    on public.leaderboard    for select using (true);
create policy "public read champion_probs" on public.champion_probs for select using (true);

create policy "anyone insert brackets" on public.brackets for insert with check (true);
create policy "public read brackets"   on public.brackets for select using (true);

create policy "anyone insert picks" on public.picks for insert with check (true);
create policy "public read picks"   on public.picks for select using (true);
