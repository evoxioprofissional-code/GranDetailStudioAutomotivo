create table if not exists public.studio_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role = 'admin'),
  created_at timestamptz not null default now(),
  check (user_id <> owner_id)
);

alter table public.studio_memberships enable row level security;
revoke all on public.studio_memberships from anon, authenticated;

create or replace function public.studio_owner_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select membership.owner_id
     from public.studio_memberships as membership
     where membership.user_id = (select auth.uid())),
    (select auth.uid())
  );
$$;

revoke execute on function public.studio_owner_id() from public, anon, authenticated;
grant execute on function public.studio_owner_id() to authenticated;

alter table public.quotes alter column owner_id set default public.studio_owner_id();
alter table public.studio_records alter column owner_id set default public.studio_owner_id();

drop policy if exists "Read own quotes" on public.quotes;
drop policy if exists "Create own quotes" on public.quotes;
drop policy if exists "Update own quotes" on public.quotes;
drop policy if exists "Delete own quotes" on public.quotes;

create policy "Read studio quotes" on public.quotes
  for select to authenticated using (owner_id = (select public.studio_owner_id()));
create policy "Create studio quotes" on public.quotes
  for insert to authenticated with check (owner_id = (select public.studio_owner_id()));
create policy "Update studio quotes" on public.quotes
  for update to authenticated using (owner_id = (select public.studio_owner_id()))
  with check (owner_id = (select public.studio_owner_id()));
create policy "Delete studio quotes" on public.quotes
  for delete to authenticated using (owner_id = (select public.studio_owner_id()));

drop policy if exists "Read own studio records" on public.studio_records;
drop policy if exists "Create own studio records" on public.studio_records;
drop policy if exists "Update own studio records" on public.studio_records;
drop policy if exists "Delete own studio records" on public.studio_records;

create policy "Read studio records" on public.studio_records
  for select to authenticated using (owner_id = (select public.studio_owner_id()));
create policy "Create studio records" on public.studio_records
  for insert to authenticated with check (owner_id = (select public.studio_owner_id()));
create policy "Update studio records" on public.studio_records
  for update to authenticated using (owner_id = (select public.studio_owner_id()))
  with check (owner_id = (select public.studio_owner_id()));
create policy "Delete studio records" on public.studio_records
  for delete to authenticated using (owner_id = (select public.studio_owner_id()));

drop policy if exists "Studio photo read" on storage.objects;
drop policy if exists "Studio photo upload" on storage.objects;
drop policy if exists "Studio photo delete" on storage.objects;

create policy "Studio photo read" on storage.objects
  for select to authenticated
  using (bucket_id = 'service-photos' and (storage.foldername(name))[1] = (select public.studio_owner_id()::text));
create policy "Studio photo upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'service-photos' and (storage.foldername(name))[1] = (select public.studio_owner_id()::text));
create policy "Studio photo delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'service-photos' and (storage.foldername(name))[1] = (select public.studio_owner_id()::text));
