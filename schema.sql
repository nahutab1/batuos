-- BatuOS Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Core setup: update trigger for timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- 1. Tasks Module
create table if not exists tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text not null default 'todo', -- todo, in_progress, done
  priority integer not null default 0, -- AI computed priority (0-100)
  due_date timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create trigger update_tasks_updated_at
before update on tasks
for each row execute function update_updated_at_column();

-- 2. Notes Module
create table if not exists notes (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  tags text[] default '{}',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create trigger update_notes_updated_at
before update on notes
for each row execute function update_updated_at_column();

-- 3. Memory Module
create table if not exists memories (
  id uuid default uuid_generate_v4() primary key,
  fact text not null,
  context text,
  source text default 'manual', -- manual, telegram, ai_extracted
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create trigger update_memories_updated_at
before update on memories
for each row execute function update_updated_at_column();

-- 4. Goals Module
create table if not exists goals (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  target_date timestamp with time zone,
  progress integer default 0, -- 0-100
  status text not null default 'active', -- active, completed, abandoned
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create trigger update_goals_updated_at
before update on goals
for each row execute function update_updated_at_column();

-- 5. Calendar Module
create table if not exists events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  is_all_day boolean default false,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create trigger update_events_updated_at
before update on events
for each row execute function update_updated_at_column();

-- 6. Startup Discovery Module
create table if not exists startup_ideas (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  source text not null,
  source_urls text[] default '{}',
  problem_solved text,
  target_audience text,
  business_model text,
  why_noteworthy text,
  first_seen_at timestamp with time zone default now(),
  age_label text default 'new',
  engagement_score integer default 0,
  metadata jsonb default '{}',
  duplicate_hash text unique,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create trigger update_startup_ideas_updated_at
before update on startup_ideas
for each row execute function update_updated_at_column();

-- 7. Discovery Discussions
create table if not exists discovery_discussions (
  id uuid default uuid_generate_v4() primary key,
  startup_id uuid references startup_ideas(id) on delete cascade not null,
  messages jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create trigger update_discovery_discussions_updated_at
before update on discovery_discussions
for each row execute function update_updated_at_column();

-- 8. Nutrition / Food Logs Module
create table if not exists food_logs (
  id uuid default uuid_generate_v4() primary key,
  meal_type text not null default 'snack',          -- breakfast, lunch, dinner, snack
  food_name text not null,
  calories integer not null default 0,
  protein_g numeric(6,1) default 0,
  carbs_g numeric(6,1) default 0,
  fat_g numeric(6,1) default 0,
  image_url text,
  notes text,
  logged_at timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create trigger update_food_logs_updated_at
before update on food_logs
for each row execute function update_updated_at_column();

alter table food_logs enable row level security;
create policy "Allow all operations for authenticated users" on food_logs for all using (auth.role() = 'authenticated');

-- Enable Row Level Security (RLS) on all tables
-- Assuming single-tenant personal use for now, but good practice
alter table tasks enable row level security;
alter table notes enable row level security;
alter table memories enable row level security;
alter table goals enable row level security;
alter table events enable row level security;

-- Create permissive policies for service role / authenticated user
create policy "Allow all operations for authenticated users" on tasks for all using (auth.role() = 'authenticated');
create policy "Allow all operations for authenticated users" on notes for all using (auth.role() = 'authenticated');
create policy "Allow all operations for authenticated users" on memories for all using (auth.role() = 'authenticated');
create policy "Allow all operations for authenticated users" on goals for all using (auth.role() = 'authenticated');
create policy "Allow all operations for authenticated users" on events for all using (auth.role() = 'authenticated');
