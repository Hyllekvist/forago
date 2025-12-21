-- Forago core schema (MVP)
create extension if not exists "uuid-ossp";

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  display_name text,
  bio text,
  role text,
  created_at timestamptz not null default now()
);

-- species
create table if not exists public.species (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  default_name text not null,
  safety_level text not null default 'warn', -- good|warn|bad
  created_at timestamptz not null default now()
);

-- translations
create table if not exists public.species_translations (
  species_id uuid not null references public.species(id) on delete cascade,
  locale text not null,
  name text not null,
  description text,
  traits jsonb,
  lookalikes jsonb,
  how_to_use jsonb,
  primary key (species_id, locale)
);

-- seasonality per country/region
create table if not exists public.seasonality (
  id uuid primary key default uuid_generate_v4(),
  species_id uuid not null references public.species(id) on delete cascade,
  country text not null,  -- 'dk', 'se'...
  region text,            -- optional
  month_from int not null check (month_from between 1 and 12),
  month_to int not null check (month_to between 1 and 12),
  confidence int not null default 3 check (confidence between 1 and 5),
  notes text
);

-- posts
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  locale text not null,
  type text not null,
  title text not null,
  body text,
  species_id uuid references public.species(id),
  created_at timestamptz not null default now()
);

create table if not exists public.post_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.post_votes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value int not null default 1 check (value in (1)),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- finds (privacy-first)
create table if not exists public.finds (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  species_id uuid references public.species(id),
  observed_at date not null default current_date,
  quality int not null default 3 check (quality between 1 and 5),
  notes text,
  cell_id text not null,              -- coarse cell only
  precision_level int not null default 2 check (precision_level between 0 and 4),
  created_at timestamptz not null default now()
);

-- aggregated cells (public)
create table if not exists public.geo_cells (
  cell_id text primary key,
  country text,
  region text,
  find_count int not null default 0,
  updated_at timestamptz not null default now()
);
