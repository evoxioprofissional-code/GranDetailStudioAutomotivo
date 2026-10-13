const STORAGE_KEY = 'gran-detail-studio-v1';
const today = new Date().toISOString().slice(0, 10);

const seed = {
  quotes: [
    {
      id: 'orc-0048', number: 48, issueDate: today, validUntil: '', status: 'Enviado',
      client: { name: 'Pedro Oliveira', phone: '' },
      vehicle: { model: 'VW Nivus', plate: 'GKL6C73', color: 'Cinza' },
      services: [{ id: 's1', description: 'Polimento técnico', cents: 120000 }],
      payments: { pix: { enabled: true, cents: 114000 }, debit: { enabled: true, cents: 120000 }, credit: { enabled: true, cents: 120000, installments: 3 } },
      notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'orc-0047', number: 47, issueDate: today, validUntil: '', status: 'Aprovado',
      client: { name: 'Ana Souza', phone: '' },
      vehicle: { model: 'Honda HR-V', plate: 'FGT8J42', color: 'Branco' },
      services: [{ id: 's2', description: 'Lavagem técnica', cents: 45000 }],
      payments: { pix: { enabled: true, cents: 45000 }, debit: { enabled: true, cents: 45000 }, credit: { enabled: false, cents: 45000, installments: 1 } },
      notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'orc-0046', number: 46, issueDate: today, validUntil: '', status: 'Rascunho',
      client: { name: 'Lucas Lima', phone: '' },
      vehicle: { model: 'Honda Civic', plate: 'RNI4B08', color: 'Preto' },
      services: [{ id: 's3', description: 'Higienização interna', cents: 98000 }],
      payments: { pix: { enabled: true, cents: 93000 }, debit: { enabled: true, cents: 98000 }, credit: { enabled: true, cents: 98000, installments: 2 } },
      notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ],
  clients: [],
  appointments: [
    { time: '09:00', client: 'Carlos Mendes', vehicle: 'Toyota Corolla • BRA2E19', service: 'Higienização interna', status: 'Concluído' },
    { time: '11:00', client: 'Ana Souza', vehicle: 'Honda HR-V • FGT8J42', service: 'Lavagem técnica', status: 'Em andamento' },
    { time: '14:00', client: 'Lucas Lima', vehicle: 'Honda Civic • RNI4B08', service: 'Polimento técnico', status: 'Confirmado' },
    { time: '16:30', client: 'Pedro Oliveira', vehicle: 'VW Nivus • GKL6C73', service: 'Avaliação', status: '' },
  ],
};

export function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.quotes) return stored;
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
    issueDate: new Date().toISOString().slice(0, 10),
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
  return phone.replace(/\D/g, '');
}

export function slugify(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
