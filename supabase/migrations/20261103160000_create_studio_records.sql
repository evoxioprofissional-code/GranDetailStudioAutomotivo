create table public.studio_records (
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('appointment', 'client', 'vehicle', 'order', 'payment')),
  id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, kind, id)
);

create index studio_records_owner_kind on public.studio_records (owner_id, kind);

alter table public.studio_records enable row level security;
revoke all on public.studio_records from anon, authenticated;
grant select, insert (kind, id, payload), update (kind, id, payload), delete on public.studio_records to authenticated;

create policy "Read own studio records" on public.studio_records
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "Create own studio records" on public.studio_records
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Update own studio records" on public.studio_records
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Delete own studio records" on public.studio_records
  for delete to authenticated using (owner_id = (select auth.uid()));
