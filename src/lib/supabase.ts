import { createClient } from '@supabase/supabase-js';

export const SUPABASE_PROJECT_ID = 'eaciiyujejuhenhxmpgw';
export const SUPABASE_URL =
  (import.meta.env?.VITE_SUPABASE_URL as string) ||
  `https://${SUPABASE_PROJECT_ID}.supabase.co`;

export const SUPABASE_ANON_KEY =
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) ||
  'sb_publishable_JemtsuTcnYNisPvxynnxtg_cooSwwsT';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SUPABASE_SQL_SCHEMA = `-- Nextgenn HR - Supabase Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql)

-- 1. Create sessions table (scheduled webinars, clinics, instant interview rooms)
create table if not exists public.sessions (
  id text primary key,
  title text not null,
  type text not null check (type in ('webinar', 'clinic', 'interview')),
  category text not null,
  host text not null,
  start bigint not null,
  duration_min integer not null default 60,
  instant boolean default false,
  pin text,
  candidate text,
  role text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create category pins table
create table if not exists public.category_pins (
  category text primary key,
  pin text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create live participants table (realtime tracking for admin)
create table if not exists public.participants (
  id text primary key,
  session_id text not null,
  session_title text not null,
  name text not null,
  email text,
  role text not null default 'Attendee',
  category text,
  status text not null default 'in_call' check (status in ('lobby', 'in_call', 'sharing', 'hand_raised')),
  joined_at bigint not null,
  last_seen bigint not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.sessions enable row level security;
alter table public.category_pins enable row level security;
alter table public.participants enable row level security;

-- 5. Open public access policies (allows clients with the publishable/anon key to read & write)
drop policy if exists "Public read sessions" on public.sessions;
create policy "Public read sessions" on public.sessions for select using (true);

drop policy if exists "Public insert sessions" on public.sessions;
create policy "Public insert sessions" on public.sessions for insert with check (true);

drop policy if exists "Public update sessions" on public.sessions;
create policy "Public update sessions" on public.sessions for update using (true);

drop policy if exists "Public delete sessions" on public.sessions;
create policy "Public delete sessions" on public.sessions for delete using (true);

drop policy if exists "Public read pins" on public.category_pins;
create policy "Public read pins" on public.category_pins for select using (true);

drop policy if exists "Public upsert pins" on public.category_pins;
create policy "Public upsert pins" on public.category_pins for all using (true);

drop policy if exists "Public read participants" on public.participants;
create policy "Public read participants" on public.participants for select using (true);

drop policy if exists "Public write participants" on public.participants;
create policy "Public write participants" on public.participants for all using (true);

-- 6. Enable Realtime on participants table
alter publication supabase_realtime add table public.participants;
alter publication supabase_realtime add table public.sessions;
`;
