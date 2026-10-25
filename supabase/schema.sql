-- Run in Supabase SQL Editor. Saved records are private to signed-in owners.
create extension if not exists pgcrypto;

create table if not exists public.saved_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  trip jsonb not null,
  itinerary jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_saved_trip_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists saved_trips_updated_at on public.saved_trips;
create trigger saved_trips_updated_at before update on public.saved_trips
for each row execute function public.set_saved_trip_updated_at();

alter table public.saved_trips enable row level security;
revoke all on public.saved_trips from anon;
grant select, insert, update, delete on public.saved_trips to authenticated;

drop policy if exists "Owners can read their trips" on public.saved_trips;
create policy "Owners can read their trips" on public.saved_trips
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Owners can create their trips" on public.saved_trips;
create policy "Owners can create their trips" on public.saved_trips
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Owners can update their trips" on public.saved_trips;
create policy "Owners can update their trips" on public.saved_trips
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Owners can delete their trips" on public.saved_trips;
create policy "Owners can delete their trips" on public.saved_trips
  for delete to authenticated using (auth.uid() = user_id);
