-- MyPMAgent schema — runs once in Supabase SQL editor.
-- All tables are in the 'mypmagent' schema to avoid touching the existing 'public' schema.
-- Auth (auth.users) is shared with the existing app — DO NOT modify auth schema.

-- 1. Create the namespace
create schema if not exists mypmagent;

-- 2. Tables

create table mypmagent.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text,
  raw_idea text not null,
  transcript text,
  state text not null default 'clarify',   -- clarify | plan | draft | tickets | done
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table mypmagent.clarifications (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references mypmagent.sessions on delete cascade,
  question text not null,
  why_it_matters text,
  answer text,
  optional boolean default false,
  order_index int
);

create table mypmagent.prd_sections (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references mypmagent.sessions on delete cascade,
  spec_number text not null,
  title text not null,
  content_md text,
  order_index int,
  approved boolean default false
);

create table mypmagent.tickets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references mypmagent.sessions on delete cascade,
  ticket_id text not null,
  title text not null,
  description text,
  acceptance_criteria text[],
  priority text check (priority in ('P0','P1','P2')),
  estimate text check (estimate in ('S','M','L')),
  labels text[],
  order_index int
);

-- 3. Enable RLS on every table
alter table mypmagent.sessions enable row level security;
alter table mypmagent.clarifications enable row level security;
alter table mypmagent.prd_sections enable row level security;
alter table mypmagent.tickets enable row level security;

-- 4. Policies
create policy "users see own sessions" on mypmagent.sessions
  for all using (auth.uid() = user_id);

create policy "users see own clarifications" on mypmagent.clarifications
  for all using (
    exists (
      select 1 from mypmagent.sessions s
      where s.id = clarifications.session_id and s.user_id = auth.uid()
    )
  );

create policy "users see own prd_sections" on mypmagent.prd_sections
  for all using (
    exists (
      select 1 from mypmagent.sessions s
      where s.id = prd_sections.session_id and s.user_id = auth.uid()
    )
  );

create policy "users see own tickets" on mypmagent.tickets
  for all using (
    exists (
      select 1 from mypmagent.sessions s
      where s.id = tickets.session_id and s.user_id = auth.uid()
    )
  );

-- 5. Grant access to authenticated role
grant usage on schema mypmagent to authenticated, anon;
grant all on all tables in schema mypmagent to authenticated;
grant all on all sequences in schema mypmagent to authenticated;
alter default privileges in schema mypmagent grant all on tables to authenticated;
alter default privileges in schema mypmagent grant all on sequences to authenticated;
