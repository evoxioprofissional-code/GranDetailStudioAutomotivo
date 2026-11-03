import { createClient } from '@supabase/supabase-js';

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key } = import.meta.env;
export const supabase = url && key ? createClient(url, key) : null;

export async function loadQuotes() {
  const quotes = [];
  const pageSize = 500;
  let before;

  while (true) {
    let query = supabase.from('quotes').select('id, number, payload')
      .order('number', { ascending: false }).limit(pageSize);
    if (before !== undefined) query = query.lt('number', before);
    const { data, error } = await query;
    if (error) throw error;
    if (!data.length) return { quotes, appointments: [] };
    quotes.push(...data.map(unpack));
    before = data.at(-1).number;
  }
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

