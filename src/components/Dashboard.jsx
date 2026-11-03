import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  FileText,
  Plus,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { dateBR, money, returnCandidates, todayLocal } from '../lib/data';
import { stageOfAppointment, stageOfOrder } from '../lib/workflow';
import StatusBadge from './StatusBadge';

const totalOf = (quote) =>
  quote.services.reduce((sum, item) => sum + (Number(item.cents) || 0), 0);

export default function Dashboard({ data, onNavigate, onEdit }) {
  const today = todayLocal();
  const orderByAppointment = new Map(
    data.orders
      .filter((order) => order.appointmentId)
      .map((order) => [order.appointmentId, order]),
  );
  const agenda = data.appointments
    .filter(
      (item) =>
        item.date === today &&
        (orderByAppointment.has(item.id)
          ? stageOfOrder(orderByAppointment.get(item.id))
          : stageOfAppointment(item)) !== 'Cancelado',
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const activeOrders = data.orders.filter(
    (item) => stageOfOrder(item) === 'Em execução',
  );
  const linkedAppointments = new Set(
    data.orders.map((item) => item.appointmentId).filter(Boolean),
  );
  const inProgress = [
    ...activeOrders.map((item) => ({ ...item, source: 'orders' })),
    ...data.appointments
      .filter(
        (item) =>
          stageOfAppointment(item) === 'Em execução' &&
          !linkedAppointments.has(item.id),
      )
      .map((item) => ({ ...item, source: 'agenda' })),
  ];
  const sentQuotes = data.quotes
    .filter((item) => item.status === 'Enviado')
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  const dueOrders = data.orders
    .filter((item) => item.status !== 'Cancelado')
    .map((order) => ({
      ...order,
      due: Math.max(
        0,
        Number(order.cents || 0) -
          data.payments
            .filter((payment) => payment.orderId === order.id)
            .reduce((sum, payment) => sum + Number(payment.cents || 0), 0),
      ),
    }))
    .filter((order) => order.due > 0)
    .sort((a, b) => b.due - a.due);
  const received = data.payments.reduce(
    (sum, payment) => sum + Number(payment.cents || 0),
    0,
  );
  const dueTotal = dueOrders.reduce((sum, order) => sum + order.due, 0);
  const returns = returnCandidates(data.appointments, data.orders);

  return (
    <div className="studio-dashboard">
      <section className="studio-hero">
        <div className="studio-hero-copy">
          <span className="studio-eyebrow">
            <Sparkles size={15} /> GRAN DETAIL · VISÃO GERAL
          </span>
          <h1>Seu studio, em movimento.</h1>
          <p>
            {dateBR(today)} · {agenda.length}{' '}
            {agenda.length === 1 ? 'atendimento' : 'atendimentos'} na agenda de
            hoje
          </p>
          <div className="studio-hero-actions">
            <button
              className="studio-hero-primary"
              onClick={() => onNavigate('agenda')}
            >
              <CalendarDays size={18} /> Abrir agenda <ArrowRight size={17} />
            </button>
            <button
              className="studio-hero-secondary"
              onClick={() => onNavigate('new-quote')}
            >
              <Plus size={18} /> Novo orçamento
            </button>
          </div>
        </div>
        <div className="studio-hero-summary" aria-label="Resumo do studio">
          <div>
            <small>Recebido</small>
            <strong>{money(received)}</strong>
          </div>
          <div>
            <small>Em execução</small>
            <strong>{inProgress.length}</strong>
          </div>
          <div>
            <small>Saldo das ordens</small>
            <strong>{money(dueTotal)}</strong>
          </div>
        </div>
      </section>

      <div className="studio-attention">
        <button onClick={() => onNavigate('quotes', 'Enviado')}>
          <span className="attention-icon">
            <FileText size={20} />
          </span>
          <span>
            <small>AGUARDANDO RESPOSTA</small>
            <strong>
              {sentQuotes.length}{' '}
              {sentQuotes.length === 1 ? 'orçamento' : 'orçamentos'}
            </strong>
          </span>
          <ArrowRight size={18} />
        </button>
        <button onClick={() => onNavigate('finance')}>
          <span className="attention-icon">
            <CircleDollarSign size={20} />
          </span>
          <span>
            <small>A RECEBER NAS ORDENS</small>
            <strong>{money(dueTotal)}</strong>
          </span>
          <ArrowRight size={18} />
        </button>
        <button onClick={() => onNavigate('returns')}>
          <span className="attention-icon">
            <Clock3 size={20} />
          </span>
          <span>
            <small>RETORNO DE CLIENTES</small>
            <strong>
              {returns.length} {returns.length === 1 ? 'contato' : 'contatos'}
            </strong>
          </span>
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="studio-dashboard-grid">
        <section className="studio-panel studio-timeline">
          <div className="studio-panel-head">
            <div>
              <span className="studio-section-label">OPERAÇÃO</span>
              <h2>Agenda de hoje</h2>
            </div>
            <button onClick={() => onNavigate('agenda')}>
              Ver agenda <ArrowRight size={16} />
            </button>
          </div>
          {agenda.length ? (
            <div className="studio-timeline-list">
              {agenda.map((item) => (
                <button
                  className="studio-timeline-item"
                  key={item.id}
                  onClick={() =>
                    onNavigate(
                      'agenda',
                      orderByAppointment.get(item.id)?.client || item.client,
                    )
                  }
                >
                  <span className="studio-timeline-time">{item.time}</span>
                  <span className="studio-timeline-track">
                    <i />
                  </span>
                  <span className="studio-timeline-info">
                    <strong>
                      {orderByAppointment.get(item.id)?.client || item.client}
                    </strong>
                    <small>
                      {orderByAppointment.get(item.id)?.service || item.service}
                      {orderByAppointment.get(item.id)?.vehicle || item.vehicle
                        ? ` · ${orderByAppointment.get(item.id)?.vehicle || item.vehicle}`
                        : ''}
                    </small>
                  </span>
                  <StatusBadge
                    status={
                      orderByAppointment.has(item.id)
                        ? stageOfOrder(orderByAppointment.get(item.id))
                        : stageOfAppointment(item)
                    }
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="studio-empty">
              <CalendarDays size={26} />
              <strong>Dia livre na agenda</strong>
              <p>Adicione o próximo atendimento para organizar a rotina.</p>
              <button onClick={() => onNavigate('agenda')}>
                Criar agendamento <ArrowRight size={15} />
              </button>
            </div>
          )}
        </section>

        <div className="studio-side-stack">
          <section className="studio-panel">
            <div className="studio-panel-head">
              <div>
                <span className="studio-section-label">PRODUÇÃO</span>
                <h2>Em execução</h2>
              </div>
              <button onClick={() => onNavigate('workflow')}>
                Ver fluxo <ArrowRight size={16} />
              </button>
            </div>
            {inProgress.length ? (
              <div className="studio-compact-list">
                {inProgress.slice(0, 3).map((item) => (
                  <button
                    key={`${item.source}-${item.id}`}
                    onClick={() => onNavigate(item.source, item.client)}
                  >
                    <span className="studio-compact-icon">
                      {item.source === 'orders' ? (
                        <Wrench size={17} />
                      ) : (
                        <CalendarDays size={17} />
                      )}
                    </span>
                    <span>
                      <strong>{item.client}</strong>
                      <small>{item.service}</small>
                    </span>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="studio-empty compact">
                <Wrench size={24} />
                <p>Nenhum serviço em andamento.</p>
              </div>
            )}
          </section>
          <section className="studio-panel">
            <div className="studio-panel-head">
              <div>
                <span className="studio-section-label">COMERCIAL</span>
                <h2>Propostas enviadas</h2>
              </div>
              <button onClick={() => onNavigate('quotes')}>
                Ver todas <ArrowRight size={16} />
              </button>
            </div>
            {sentQuotes.length ? (
              <div className="studio-compact-list">
                {sentQuotes.slice(0, 3).map((quote) => (
                  <button key={quote.id} onClick={() => onEdit(quote.id)}>
                    <span className="studio-compact-icon">
                      <ClipboardList size={17} />
                    </span>
                    <span>
                      <strong>{quote.client.name}</strong>
                      <small>
                        ORC-{String(quote.number).padStart(4, '0')} ·{' '}
                        {money(totalOf(quote))}
                      </small>
                    </span>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="studio-empty compact">
                <FileText size={24} />
                <p>Nenhuma proposta aguardando resposta.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {dueOrders.length > 0 && (
        <section className="studio-panel studio-due">
          <div className="studio-panel-head">
            <div>
              <span className="studio-section-label">FINANCEIRO</span>
              <h2>Valores a receber</h2>
            </div>
            <button onClick={() => onNavigate('finance')}>
              Abrir financeiro <ArrowRight size={16} />
            </button>
          </div>
          <div className="studio-due-list">
            {dueOrders.slice(0, 3).map((order) => (
              <button
                key={order.id}
                onClick={() => onNavigate('orders', order.client)}
              >
                <span>
                  <strong>{order.client}</strong>
                  <small>{order.service}</small>
                </span>
                <b>{money(order.due)}</b>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
