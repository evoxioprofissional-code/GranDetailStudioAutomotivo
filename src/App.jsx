import { useMemo, useState } from 'react';
import { Construction } from 'lucide-react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import QuoteList from './components/QuoteList';
import QuoteEditor from './components/QuoteEditor';
import Clients from './components/Clients';
import { emptyQuote, loadData, nextQuoteNumber, phoneDigits, saveData } from './lib/data';

function clientsFromQuotes(quotes) {
  const records = new Map();
  quotes.forEach((quote) => {
    const phone = phoneDigits(quote.client.phone);
    const key = phone || quote.client.name.trim().toLowerCase();
    if (!key || !quote.client.name.trim()) return;
    const current = records.get(key) || { name: quote.client.name, phone: quote.client.phone, vehicles: [] };
    const vehicleKey = `${quote.vehicle.model}|${quote.vehicle.plate}`;
    if ((quote.vehicle.model || quote.vehicle.plate) && !current.vehicles.some((v) => `${v.model}|${v.plate}` === vehicleKey)) current.vehicles.push({ ...quote.vehicle });
    records.set(key, current);
  });
  return [...records.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [page, setPage] = useState('dashboard');
  const [activeQuote, setActiveQuote] = useState(null);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const clients = useMemo(() => clientsFromQuotes(data.quotes), [data.quotes]);

  const navigate = (target) => {
    setQuery('');
    if (target === 'new-quote') {
      setActiveQuote(emptyQuote(nextQuoteNumber(data.quotes)));
      setPage('quote-edit');
    } else setPage(target);
  };
  const openQuote = (id, readOnly = false) => {
    const quote = data.quotes.find((item) => item.id === id);
    if (!quote) return;
    setActiveQuote(structuredClone(quote));
    setPage(readOnly ? 'quote-view' : 'quote-edit');
  };
  const saveQuote = (quote) => {
    const exists = data.quotes.some((item) => item.id === quote.id);
    const next = { ...data, quotes: exists ? data.quotes.map((item) => item.id === quote.id ? quote : item) : [quote, ...data.quotes] };
    setData(next); saveData(next); setToast('Orçamento salvo com sucesso.'); setPage('quotes');
    setTimeout(() => setToast(''), 3200);
  };
  const duplicateQuote = (id) => {
    const source = data.quotes.find((item) => item.id === id);
    if (!source) return;
    const number = nextQuoteNumber(data.quotes);
    const copy = { ...structuredClone(source), id: `orc-${String(number).padStart(4,'0')}-${crypto.randomUUID().slice(0,6)}`, number, status: 'Rascunho', issueDate: new Date().toISOString().slice(0,10), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), services: source.services.map((s)=>({...s,id:crypto.randomUUID()})) };
    const next = { ...data, quotes: [copy, ...data.quotes] }; setData(next); saveData(next); setToast('Orçamento duplicado como rascunho.'); setTimeout(()=>setToast(''),3200);
  };

  const content = () => {
    if (page === 'dashboard') return <Dashboard data={data} onNavigate={navigate} onEdit={(id)=>openQuote(id,true)}/>;
    if (page === 'quotes') return <QuoteList quotes={data.quotes} query={query} onQuery={setQuery} onNew={()=>navigate('new-quote')} onEdit={(id)=>openQuote(id)} onView={(id)=>openQuote(id,true)} onDuplicate={duplicateQuote}/>;
    if (page === 'quote-edit' || page === 'quote-view') return <QuoteEditor initialQuote={activeQuote} clients={clients} readOnly={page==='quote-view'} onSave={saveQuote} onCancel={()=>setPage('quotes')}/>;
    if (page === 'clients') return <Clients clients={clients} quotes={data.quotes} query={query} onQuery={setQuery} onEdit={(id)=>openQuote(id,true)}/>;
    return <div className="placeholder"><Construction size={42}/><h1>Área em preparação</h1><p>O fluxo de orçamentos está disponível e funcional. Esta área complementar pode ser conectada na próxima etapa.</p><button className="button primary" onClick={()=>navigate('quotes')}>Ir para orçamentos</button></div>;
  };

  return <Layout page={page} onNavigate={navigate} query={query} onQuery={setQuery} quoteCount={data.quotes.filter((q)=>!['Aprovado','Recusado'].includes(q.status)).length}>{toast&&<div className="toast">{toast}</div>}{content()}</Layout>;
}
