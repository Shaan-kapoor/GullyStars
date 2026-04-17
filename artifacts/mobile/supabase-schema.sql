-- Gully Stars — Supabase Schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists users (
  id text primary key,
  name text not null,
  role text not null,
  sport text not null,
  avatar text,
  team_id text,
  created_at timestamptz default now()
);

create table if not exists teams (
  id text primary key,
  name text not null,
  sport text not null,
  captain_id text not null,
  is_public boolean default true,
  description text default '',
  members jsonb default '[]',
  join_requests jsonb default '[]',
  location jsonb,
  created_at timestamptz default now()
);

create table if not exists feed_posts (
  id text primary key,
  team_id text not null,
  team_name text not null,
  author_id text not null,
  author_name text not null,
  content text not null default '',
  image_url text,
  sport text not null,
  likes jsonb default '[]',
  type text not null default 'general',
  created_at timestamptz default now()
);

create table if not exists training_sessions (
  id text primary key,
  team_id text not null,
  title text not null,
  date text not null,
  time text not null,
  location text not null,
  created_by text not null,
  responses jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists matches (
  id text primary key,
  team_id text not null,
  opponent text not null,
  date text not null,
  time text not null,
  location text not null,
  sport text not null,
  status text not null default 'upcoming',
  rsvps jsonb default '{}',
  score jsonb,
  result text,
  tournament_id text,
  created_at timestamptz default now()
);

create table if not exists tournaments (
  id text primary key,
  name text not null,
  sport text not null,
  organiser_id text not null,
  format text not null default 'round-robin',
  status text not null default 'registration',
  teams jsonb default '[]',
  fixtures jsonb default '[]',
  standings jsonb default '[]',
  location jsonb,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS) with permissive policies for anon access
alter table users enable row level security;
alter table teams enable row level security;
alter table feed_posts enable row level security;
alter table training_sessions enable row level security;
alter table matches enable row level security;
alter table tournaments enable row level security;

-- Allow all operations for anon users (public app, identity via UUID in AsyncStorage)
create policy "allow_all_users" on users for all using (true) with check (true);
create policy "allow_all_teams" on teams for all using (true) with check (true);
create policy "allow_all_feed_posts" on feed_posts for all using (true) with check (true);
create policy "allow_all_training" on training_sessions for all using (true) with check (true);
create policy "allow_all_matches" on matches for all using (true) with check (true);
create policy "allow_all_tournaments" on tournaments for all using (true) with check (true);

-- Storage bucket: create a bucket named 'feed-images' in Supabase Storage
-- Dashboard → Storage → New bucket → Name: feed-images → Public: YES
-- Then add this policy in Storage → feed-images → Policies:
-- Policy name: allow_public_uploads
-- Allowed operations: SELECT, INSERT
-- Policy definition: true
