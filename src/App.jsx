import { useMemo, useRef, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import QuoteList from './components/QuoteList';
import QuoteEditor from './components/QuoteEditor';
import Agenda from './components/Agenda';
import Workflow from './components/Workflow';
import { ClientsPage, VehiclesPage } from './components/Directory';
import {
  FinancePage,
  MessagesPage,
  OrdersPage,
  ReturnsPage,
} from './components/Operations';
import Settings from './components/Settings';
import {
  emptyQuote,
  loadData,
  nextQuoteNumber,
  phoneDigits,
  saveData,
  todayLocal,
} from './lib/data';
import {
  deleteQuote,
  deleteRecord,
  storeQuote,
  storeRecord,
} from './lib/supabase';
import { orderAtStage } from './lib/workflow';

function clientsFromData(data) {
  const records = new Map();
  const add = (name, phone, vehicle) => {
    if (!name?.trim()) return;
    const key = phoneDigits(phone) || name.trim().toLowerCase();
    const current = records.get(key) || {
      name,
      phone: phone || '',
      vehicles: [],
    };
    if (vehicle?.model || vehicle?.plate) {
      const vehicleKey = `${vehicle.model}|${vehicle.plate}`;
      if (
        !current.vehicles.some(
          (item) => `${item.model}|${item.plate}` === vehicleKey,
        )
      )
        current.vehicles.push(vehicle);
    }
    records.set(key, current);
  };
  data.quotes.forEach((quote) =>
    add(quote.client.name, quote.client.phone, quote.vehicle),
  );
  data.appointments.forEach((item) => add(item.client, item.phone));
  data.orders.forEach((item) => add(item.client, item.phone));
  data.clients.forEach((client) => {
    const key = phoneDigits(client.phone) || client.name.trim().toLowerCase();
    const current = records.get(key) || { vehicles: [] };
    records.set(key, { ...current, ...client, recordId: client.id });
  });
  return [...records.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function vehiclesFromData(data) {
  const records = new Map();
  data.quotes.forEach((quote) => {
    const vehicle = quote.vehicle;
    if (!vehicle.model && !vehicle.plate) return;
    const key =
      vehicle.plate?.trim().toUpperCase() ||
      `${vehicle.model}|${quote.client.name}`.toLowerCase();
    records.set(key, { ...vehicle, client: quote.client.name });
  });
  data.vehicles.forEach((vehicle) => {
    const key =
      vehicle.plate?.trim().toUpperCase() ||
      `${vehicle.model}|${vehicle.client}`.toLowerCase();
    records.set(key, { ...records.get(key), ...vehicle, recordId: vehicle.id });
  });
  return [...records.values()].sort((a, b) => a.model.localeCompare(b.model));
}

export default function App({ initialData, onSignOut, userEmail }) {
  const [data, setData] = useState(() => initialData ?? loadData());
  const dataRef = useRef(data);
  const savingQuote = useRef(false);
  const [page, setPage] = useState('dashboard');
  const [agendaDate, setAgendaDate] = useState(todayLocal());
  const [activeQuote, setActiveQuote] = useState(null);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const clients = useMemo(() => clientsFromData(data), [data]);
  const vehicles = useMemo(() => vehiclesFromData(data), [data]);

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3500);
  };
  const updateData = (next) => {
    dataRef.current = next;
    setData(next);
    if (!initialData) saveData(next);
  };
  const navigate = (target, search = '', focusDate) => {
    setQuery(search);
    if (target === 'agenda') setAgendaDate(focusDate || todayLocal());
    if (target === 'new-quote') {
      const draft = emptyQuote(nextQuoteNumber(dataRef.current.quotes));
      setActiveQuote(
        initialData ? { ...draft, id: crypto.randomUUID() } : draft,
      );
      setPage('quote-edit');
    } else setPage(target);
  };
  const openQuote = (id, readOnly = false) => {
    const quote = dataRef.current.quotes.find((item) => item.id === id);
    if (!quote) return;
    setActiveQuote(structuredClone(quote));
    setPage(readOnly ? 'quote-view' : 'quote-edit');
  };
  const persistQuote = async (quote, message, closeEditor = false) => {
    if (savingQuote.current) return;
    savingQuote.current = true;
    try {
      const saved = initialData ? await storeQuote(quote) : quote;
      const current = dataRef.current;
      const exists = current.quotes.some((item) => item.id === saved.id);
      updateData({
        ...current,
        quotes: exists
          ? current.quotes.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current.quotes],
      });
      notify(message);
      if (closeEditor) setPage('quotes');
    } catch {
      notify('Não foi possível salvar o orçamento. Tente novamente.');
    } finally {
      savingQuote.current = false;
    }
  };
  const saveRecord = async (kind, record) => {
    try {
      const saved = initialData ? await storeRecord(kind, record) : record;
      const key = `${kind}s`;
      const current = dataRef.current;
      const exists = current[key].some((item) => item.id === saved.id);
      updateData({
        ...current,
        [key]: exists
          ? current[key].map((item) => (item.id === saved.id ? saved : item))
          : [...current[key], saved],
      });
      notify('Dados salvos com sucesso.');
      return saved;
    } catch {
      notify('Não foi possível salvar. Tente novamente.');
      return null;
    }
  };
  const removeRecord = async (kind, id) => {
    try {
      if (initialData) await deleteRecord(kind, id);
      const key = `${kind}s`;
      const current = dataRef.current;
      updateData({
        ...current,
        [key]: current[key].filter((item) => item.id !== id),
      });
      notify('Registro excluído.');
      return true;
    } catch {
      notify('Não foi possível excluir. Tente novamente.');
      return false;
    }
  };
  const moveService = async (item, stage) => {
    const today = todayLocal();
    if (item.kind === 'order') {
      return saveRecord('order', orderAtStage(item.record, stage, today));
    }
    if (stage === 'Agendado') {
      return saveRecord('appointment', {
        ...item.record,
        stage,
        status: 'Confirmado',
      });
    }
    const existingOrder = dataRef.current.orders.find(
      (order) => order.appointmentId === item.id,
    );
    if (existingOrder) {
      return saveRecord('order', orderAtStage(existingOrder, stage, today));
    }
    return saveRecord(
      'order',
      orderAtStage(
        {
          id: crypto.randomUUID(),
          appointmentId: item.id,
          date: item.date,
          client: item.client,
          phone: item.phone || '',
          vehicle: item.vehicle || '',
          service: item.service,
          cents: 0,
          notes: item.notes || '',
          quoteId: '',
        },
        stage,
        today,
      ),
    );
  };
  const duplicateQuote = (id) => {
    const source = dataRef.current.quotes.find((item) => item.id === id);
    if (!source) return;
    const number = nextQuoteNumber(dataRef.current.quotes);
    const copy = {
      ...structuredClone(source),
      id: crypto.randomUUID(),
      number,
      status: 'Rascunho',
      issueDate: todayLocal(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      services: source.services.map((service) => ({
        ...service,
        id: crypto.randomUUID(),
      })),
    };
    persistQuote(copy, 'Orçamento duplicado como rascunho.');
  };
  const removeQuote = async (quote) => {
    if (dataRef.current.orders.some((order) => order.quoteId === quote.id)) {
      notify(
        'Este orçamento possui uma ordem de serviço. Exclua a ordem antes.',
      );
      return;
    }
    if (
      !window.confirm(
        `Excluir o orçamento ORC-${String(quote.number).padStart(4, '0')}?`,
      )
    )
      return;
    try {
      if (initialData) await deleteQuote(quote.id);
      const current = dataRef.current;
      updateData({
        ...current,
        quotes: current.quotes.filter((item) => item.id !== quote.id),
      });
      notify('Orçamento excluído.');
    } catch {
      notify('Não foi possível excluir o orçamento.');
    }
  };

  const content = () => {
    if (page === 'dashboard')
      return (
        <Dashboard
          data={data}
          onNavigate={navigate}
          onEdit={(id) => openQuote(id, true)}
        />
      );
    if (page === 'agenda')
      return (
        <Agenda
          appointments={data.appointments}
          initialDate={agendaDate}
          orders={data.orders}
          clients={clients}
          query={query}
          onSave={saveRecord}
          onDelete={removeRecord}
          onNavigate={navigate}
        />
      );
    if (page === 'workflow')
      return (
        <Workflow
          appointments={data.appointments}
          orders={data.orders}
          onMove={moveService}
          onNavigate={navigate}
          query={query}
        />
      );
    if (page === 'quotes')
      return (
        <QuoteList
          quotes={data.quotes}
          query={query}
          onQuery={setQuery}
          onNew={() => navigate('new-quote')}
          onEdit={(id) => openQuote(id)}
          onView={(id) => openQuote(id, true)}
          onDuplicate={duplicateQuote}
          onDelete={removeQuote}
        />
      );
    if (page === 'quote-edit' || page === 'quote-view')
      return (
        <QuoteEditor
          initialQuote={activeQuote}
          clients={clients}
          readOnly={page === 'quote-view'}
          onSave={(quote) =>
            persistQuote(quote, 'Orçamento salvo com sucesso.', true)
          }
          onCancel={() => setPage('quotes')}
        />
      );
    if (page === 'clients')
      return (
        <ClientsPage
          clients={clients}
          quotes={data.quotes}
          query={query}
          onSave={saveRecord}
          onDelete={removeRecord}
        />
      );
    if (page === 'vehicles')
      return (
        <VehiclesPage
          vehicles={vehicles}
          clients={clients}
          query={query}
          onSave={saveRecord}
          onDelete={removeRecord}
        />
      );
    if (page === 'orders')
      return (
        <OrdersPage
          orders={data.orders}
          appointments={data.appointments}
          quotes={data.quotes}
          clients={clients}
          payments={data.payments}
          query={query}
          onSave={saveRecord}
          onDelete={removeRecord}
        />
      );
    if (page === 'finance')
      return (
        <FinancePage
          payments={data.payments}
          orders={data.orders}
          query={query}
          onSave={saveRecord}
          onDelete={removeRecord}
        />
      );
    if (page === 'returns')
      return (
        <ReturnsPage
          appointments={data.appointments}
          orders={data.orders}
          query={query}
        />
      );
    if (page === 'messages') return <MessagesPage clients={clients} />;
    if (page === 'settings')
      return (
        <Settings
          email={userEmail}
          onSignOut={
            onSignOut
              ? async () => {
                  if (!(await onSignOut()))
                    notify('Não foi possível sair. Tente novamente.');
                }
              : undefined
          }
        />
      );
    return null;
  };

  const openQuotes = data.quotes.filter(
    (quote) => !['Aprovado', 'Recusado'].includes(quote.status),
  ).length;
  return (
    <Layout
      page={page}
      onNavigate={navigate}
      query={query}
      onQuery={setQuery}
      quoteCount={openQuotes}
      userEmail={userEmail}
    >
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {content()}
    </Layout>
  );
}
