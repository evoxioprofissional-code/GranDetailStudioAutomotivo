import { ArrowUp, CalendarDays, ExternalLink, Plus } from 'lucide-react';
import { dateBR, money, returnCandidates, todayLocal } from '../lib/data';
import StatusBadge from './StatusBadge';

const totalOf = (quote) =>
  quote.services.reduce((sum, item) => sum + (Number(item.cents) || 0), 0);

export default function Dashboard({ data, onNavigate, onEdit }) {
  const received = data.payments.reduce(
    (sum, item) => sum + Number(item.cents || 0),
    0,
  );
  const orderTotal = data.orders
    .filter((item) => item.status !== 'Cancelado')
    .reduce((sum, item) => sum + Number(item.cents || 0), 0);
  const paidForOrders = data.payments
    .filter((item) => item.orderId)
    .reduce((sum, item) => sum + Number(item.cents || 0), 0);
  const outstanding = Math.max(0, orderTotal - paidForOrders);
  const completed = data.orders.filter(
    (item) => item.status === 'Concluído',
  ).length;
  const openQuotes = data.quotes.filter(
    (item) => !['Aprovado', 'Recusado'].includes(item.status),
  ).length;
  const today = todayLocal();
  const agenda = data.appointments
    .filter((item) => item.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));
  const returns = returnCandidates(data.appointments, data.orders);
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() - (5 - index));
    const key = date.toISOString().slice(0, 7);
    return {
      key,
      label: new Intl.DateTimeFormat('pt-BR', {
        month: 'short',
        timeZone: 'UTC',
      }).format(date),
      cents: data.payments
        .filter((item) => item.date?.startsWith(key))
        .reduce((sum, item) => sum + Number(item.cents || 0), 0),
    };
  });
  const maximum = Math.max(1, ...months.map((month) => month.cents));
  const recentReceived = months.reduce((sum, month) => sum + month.cents, 0);

  return (
    <>
      <div className="page-heading dashboard-heading">
        <div>
          <h1>Visão geral</h1>
          <p>{dateBR(today)}</p>
        </div>
        <div className="heading-actions">
          <button
            className="button secondary"
            onClick={() => onNavigate('agenda')}
          >
            <CalendarDays size={18} /> Abrir agenda
          </button>
          <button
            className="button primary"
            onClick={() => onNavigate('new-quote')}
          >
            <Plus size={18} /> Novo orçamento
          </button>
        </div>
      </div>
      <section className="stats-grid">
        <div className="stat">
          <span>Recebido</span>
          <strong>{money(received)}</strong>
          <small className="positive">
            <ArrowUp size={16} /> pagamentos registrados
          </small>
        </div>
        <div className="stat">
          <span>Saldo das ordens</span>
          <strong>{money(outstanding)}</strong>
          <small>Ordens ativas menos recebimentos vinculados</small>
        </div>
        <div className="stat">
          <span>Serviços concluídos</span>
          <strong>{completed}</strong>
          <small>Ordens finalizadas</small>
        </div>
        <div className="stat">
          <span>Orçamentos abertos</span>
          <strong>{openQuotes}</strong>
          <small>
            {money(
              data.quotes
                .filter(
                  (item) => !['Aprovado', 'Recusado'].includes(item.status),
                )
                .reduce((sum, item) => sum + totalOf(item), 0),
            )}{' '}
            em propostas
          </small>
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="panel revenue-panel">
          <div className="panel-head">
            <div>
              <h2>Recebimentos</h2>
              <p>Últimos seis meses</p>
            </div>
            <strong>{money(recentReceived)}</strong>
          </div>
          <div className="revenue-bars">
            {months.map((month) => (
              <div className="revenue-month" key={month.key}>
                <div
                  className="revenue-bar"
                  style={{
                    height: `${Math.max(4, (month.cents / maximum) * 100)}%`,
                  }}
                  title={`${month.label}: ${money(month.cents)}`}
                />
                <small>{month.label}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel agenda-panel">
          <div className="panel-head">
            <h2>Agenda de hoje</h2>
            <button
              className="text-button"
              onClick={() => onNavigate('agenda')}
            >
              Abrir agenda <ExternalLink size={15} />
            </button>
          </div>
          <div className="agenda-list">
            {agenda.map((item) => (
              <div className="agenda-row" key={item.id}>
                <b>{item.time}</b>
                <span>
                  <strong>{item.client}</strong>
                  <small>{item.vehicle}</small>
                </span>
                <span>{item.service}</span>
                <StatusBadge status={item.status} />
              </div>
            ))}
            {!agenda.length && (
              <p className="panel-empty">
                Nenhum atendimento agendado para hoje.
              </p>
            )}
          </div>
        </section>
        <section className="panel returns-panel">
          <div className="panel-head">
            <div>
              <h2>Retorno de clientes</h2>
              <p>
                {returns.length}{' '}
                {returns.length === 1
                  ? 'cliente aguardando contato'
                  : 'clientes aguardando contato'}
              </p>
            </div>
            <button
              className="text-button"
              onClick={() => onNavigate('returns')}
            >
              Ver retornos <ExternalLink size={15} />
            </button>
          </div>
          <p className="panel-empty">
            {returns.length
              ? `${returns[0].client} teve o último atendimento em ${dateBR(returns[0].date)}.`
              : 'Nenhum retorno pendente no momento.'}
          </p>
        </section>
        <section className="panel recent-panel">
          <div className="panel-head">
            <h2>Orçamentos recentes</h2>
            <button
              className="text-button"
              onClick={() => onNavigate('quotes')}
            >
              Ver todos <ExternalLink size={15} />
            </button>
          </div>
          <div className="quote-mini-head">
            <span>Nº</span>
            <span>Cliente</span>
            <span>Valor</span>
            <span>Status</span>
          </div>
          {data.quotes.slice(0, 3).map((quote) => (
            <button
              className="quote-mini-row"
              key={quote.id}
              onClick={() => onEdit(quote.id)}
            >
              <b>ORC-{String(quote.number).padStart(4, '0')}</b>
              <span>{quote.client.name}</span>
              <b>{money(totalOf(quote))}</b>
              <StatusBadge status={quote.status} />
            </button>
          ))}
          {!data.quotes.length && (
            <p className="panel-empty">Nenhum orçamento salvo ainda.</p>
          )}
        </section>
      </div>
    </>
  );
}
