const STORAGE_KEY = 'gran-detail-studio-v1';
export const todayLocal = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

const seed = { quotes: [], appointments: [], clients: [], vehicles: [], orders: [], payments: [] };

export function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored?.quotes)) return {
      ...seed, ...stored,
      appointments: (stored.appointments || []).filter((item) => item.id && item.date),
    };
  } catch (_) {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function nextQuoteNumber(quotes) {
  return Math.max(0, ...quotes.map((quote) => Number(quote.number) || 0)) + 1;
}

export function emptyQuote(number) {
  return {
    id: `orc-${String(number).padStart(4, '0')}`,
    number,
    issueDate: todayLocal(),
    validUntil: '', status: 'Rascunho',
    client: { name: '', phone: '' },
    vehicle: { model: '', plate: '', color: '' },
    services: [{ id: crypto.randomUUID(), description: '', cents: 0 }],
    payments: {
      pix: { enabled: true, cents: 0 },
      debit: { enabled: false, cents: 0 },
      credit: { enabled: false, cents: 0, installments: 1 },
    },
    notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

export const money = (cents = 0) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL',
}).format((Number(cents) || 0) / 100);

export const dateBR = (date) => date
  ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
  : '—';

export function parseMoney(value) {
  return Number(String(value ?? '').replace(/\D/g, '') || 0);
}

export function phoneDigits(phone = '') {
  return String(phone).replace(/\D/g, '');
}

export function whatsappNumber(phone) {
  const digits = phoneDigits(phone);
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) return digits;
  return '';
}

export function returnCandidates(appointments, orders) {
  const latest = new Map();
  const completed = [
    ...appointments.filter((item) => item.status === 'Concluído'),
    ...orders.filter((item) => item.status === 'Concluído')
      .map((item) => ({ ...item, date: item.completedDate || item.date })),
  ];
  for (const item of completed) {
    if (!item.client || !item.date) continue;
    const key = phoneDigits(item.phone) || item.client.trim().toLowerCase();
    if (!key || (latest.get(key)?.date || '') >= item.date) continue;
    latest.set(key, item);
  }
  const cutoff = new Date(`${todayLocal()}T12:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 30);
  return [...latest.values()]
    .filter((item) => item.date < cutoff.toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function slugify(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
