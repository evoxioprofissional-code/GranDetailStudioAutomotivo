import { createClient } from '@supabase/supabase-js';

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key } = import.meta.env;
export const supabase = url && key ? createClient(url, key) : null;

export async function loadWorkspace() {
  const quotes = [];
  const pageSize = 500;
  let before;

  while (true) {
    let query = supabase.from('quotes').select('id, number, payload')
      .order('number', { ascending: false }).limit(pageSize);
    if (before !== undefined) query = query.lt('number', before);
    const { data, error } = await query;
    if (error) throw error;
    if (!data.length) break;
    quotes.push(...data.map(unpack));
    before = data.at(-1).number;
  }

  const records = { appointments: [], clients: [], vehicles: [], orders: [], payments: [] };
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.from('studio_records')
      .select('kind, id, payload').order('created_at').order('id').range(offset, offset + pageSize - 1);
    if (error) throw error;
    for (const row of data) records[`${row.kind}s`].push({ ...row.payload, id: row.id });
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return { quotes, ...records };
}

function unpack({ id, number, payload }) {
  return { ...payload, id, number };
}

export async function storeQuote(quote) {
  const { id, ...payload } = quote;
  const { data, error } = await supabase.from('quotes')
    .upsert({ id, payload }, { onConflict: 'owner_id,id' })
    .select('id, number, payload').single();
  if (error) throw error;
  return unpack(data);
}

export async function deleteQuote(id) {
  const { error } = await supabase.from('quotes').delete().eq('id', id);
  if (error) throw error;
}

export async function storeRecord(kind, record) {
  const { id, ...payload } = record;
  const { data, error } = await supabase.from('studio_records')
    .upsert({ kind, id, payload }, { onConflict: 'owner_id,kind,id' })
    .select('id, payload').single();
  if (error) throw error;
  return { ...data.payload, id: data.id };
}

export async function deleteRecord(kind, id) {
  const { error } = await supabase.from('studio_records').delete().eq('kind', kind).eq('id', id);
  if (error) throw error;
}
