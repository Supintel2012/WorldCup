-- SmartBracket WC26 · chat schema
-- Pools (invite-link scope) → members (lightweight profiles) → messages
-- (group + DM). Identity is a client-generated UUID in localStorage today;
-- swap to auth.uid() once real auth lands.

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------
-- CHAT POOLS — one per invite link
-- ------------------------------------------------------------------
create table if not exists public.chat_pools (
    id            uuid primary key default gen_random_uuid(),
    slug          text unique not null,
    name          text,
    created_at    timestamptz default now()
);
create index if not exists chat_pools_slug_idx on public.chat_pools(slug);

-- ------------------------------------------------------------------
-- CHAT MEMBERS — one row per (pool, user); no FK to auth.users (yet)
-- ------------------------------------------------------------------
create table if not exists public.chat_members (
    id            uuid primary key default gen_random_uuid(),
    pool_id       uuid not null references public.chat_pools(id) on delete cascade,
    user_id       text not null,
    display_name  text not null,
    avatar        text,
    accent        int  not null default 1 check (accent between 1 and 4),
    last_seen     timestamptz default now(),
    created_at    timestamptz default now(),
    unique (pool_id, user_id)
);
create index if not exists chat_members_pool_idx on public.chat_members(pool_id);

-- ------------------------------------------------------------------
-- CHAT MESSAGES — group (recipient_id null) or DM (recipient_id set)
-- ------------------------------------------------------------------
create table if not exists public.chat_messages (
    id            uuid primary key default gen_random_uuid(),
    pool_id       uuid not null references public.chat_pools(id) on delete cascade,
    author_id     text not null,
    recipient_id  text,
    body          text not null check (char_length(body) between 1 and 2000),
    created_at    timestamptz default now()
);
create index if not exists chat_messages_pool_created_idx
    on public.chat_messages(pool_id, created_at desc);
create index if not exists chat_messages_thread_idx
    on public.chat_messages(pool_id, author_id, recipient_id);

-- ------------------------------------------------------------------
-- RLS — permissive while identity is client-side. Tighten to
-- `auth.uid()::text = user_id` once Supabase auth is wired.
-- ------------------------------------------------------------------
alter table public.chat_pools    enable row level security;
alter table public.chat_members  enable row level security;
alter table public.chat_messages enable row level security;

create policy "chat_pools read"   on public.chat_pools   for select using (true);
create policy "chat_pools insert" on public.chat_pools   for insert with check (true);

create policy "chat_members read"   on public.chat_members for select using (true);
create policy "chat_members insert" on public.chat_members for insert with check (true);
create policy "chat_members update" on public.chat_members for update using (true);

create policy "chat_messages read"  on public.chat_messages for select using (true);
create policy "chat_messages write" on public.chat_messages for insert with check (true);

-- ------------------------------------------------------------------
-- Realtime — broadcast inserts on messages + member joins
-- ------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'chat_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.chat_messages';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'chat_members'
  ) then
    execute 'alter publication supabase_realtime add table public.chat_members';
  end if;
end $$;
