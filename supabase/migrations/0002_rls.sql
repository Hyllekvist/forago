-- Enable RLS
alter table public.profiles enable row level security;
alter table public.species enable row level security;
alter table public.species_translations enable row level security;
alter table public.seasonality enable row level security;
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_votes enable row level security;
alter table public.finds enable row level security;
alter table public.geo_cells enable row level security;

-- profiles: user can manage own
create policy "profiles_read_public" on public.profiles for select using (true);
create policy "profiles_write_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- species + translations + seasonality: public read
create policy "species_read_public" on public.species for select using (true);
create policy "species_trans_read_public" on public.species_translations for select using (true);
create policy "seasonality_read_public" on public.seasonality for select using (true);

-- posts: public read; authenticated write own
create policy "posts_read_public" on public.posts for select using (true);
create policy "posts_insert_auth" on public.posts for insert with check (auth.uid() = user_id);
create policy "posts_update_own" on public.posts for update using (auth.uid() = user_id);

create policy "comments_read_public" on public.post_comments for select using (true);
create policy "comments_insert_auth" on public.post_comments for insert with check (auth.uid() = user_id);
create policy "comments_update_own" on public.post_comments for update using (auth.uid() = user_id);

create policy "votes_read_public" on public.post_votes for select using (true);
create policy "votes_upsert_own" on public.post_votes for insert with check (auth.uid() = user_id);

-- finds: only owner can read/write their own rows
create policy "finds_read_own" on public.finds for select using (auth.uid() = user_id);
create policy "finds_insert_own" on public.finds for insert with check (auth.uid() = user_id);
create policy "finds_update_own" on public.finds for update using (auth.uid() = user_id);

-- geo_cells: public read only (aggregation writes via service role)
create policy "geo_cells_read_public" on public.geo_cells for select using (true);
