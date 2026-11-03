create table public.quotes (
  id text not null,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  number integer generated always as identity unique,
  payload jsonb not null,
  primary key (owner_id, id)
);
alter table public.quotes enable row level security;
revoke all on public.quotes from anon, authenticated;
grant select, insert (id, payload), update (id, payload) on public.quotes to authenticated;
create policy "Read own quotes" on public.quotes for select to authenticated using (owner_id = (select auth.uid()));
create policy "Create own quotes" on public.quotes for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Update own quotes" on public.quotes for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
