grant delete on public.quotes to authenticated;

create policy "Delete own quotes" on public.quotes
  for delete to authenticated using (owner_id = (select auth.uid()));
