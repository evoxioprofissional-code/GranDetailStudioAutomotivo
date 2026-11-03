import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { dateBR, todayLocal } from '../lib/data';
import { stageOfAppointment, stageOfOrder } from '../lib/workflow';
import StatusBadge from './StatusBadge';

const blank = (date) => ({
  date,
  time: '09:00',
  client: '',
  phone: '',
  vehicle: '',
  service: '',
  status: 'Confirmado',
  notes: '',
});

export default function Agenda({
  appointments,
  initialDate,
  orders,
  clients,
  onSave,
  onDelete,
  onNavigate,
  query,
}) {
  const [date, setDate] = useState(initialDate || todayLocal());
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const linkedOrders = new Map(
    orders
      .filter((order) => order.appointmentId)
      .map((order) => [order.appointmentId, order]),
  );
  const linkedOrder = (id) => linkedOrders.get(id);
  const detailsOf = (item) => {
    const order = linkedOrder(item.id);
    return order
      ? {
          ...item,
          client: order.client,
          phone: order.phone,
          vehicle: order.vehicle,
          service: order.service,
        }
      : item;
  };
  const draftOrder = draft?.id ? linkedOrder(draft.id) : null;
  const term = query.trim().toLowerCase();
  const visible = appointments
    .filter(
      (item) =>
        item.date === date &&
        [
          detailsOf(item).client,
          detailsOf(item).vehicle,
          detailsOf(item).service,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(term),
        ),
    )
    .sort((a, b) => a.time.localeCompare(b.time));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const saved = await onSave('appointment', {
      ...draft,
      id: draft.id || crypto.randomUUID(),
    });
    setBusy(false);
    if (saved) {
      setDate(saved.date);
      setDraft(null);
    }
  }

  async function remove(item) {
    if (linkedOrder(item.id)) {
      window.alert(
        'Este agendamento tem uma ordem vinculada. Exclua a ordem antes de excluir o agendamento.',
      );
      return;
    }
    if (!window.confirm(`Excluir o agendamento de ${item.client}?`)) return;
    setBusy(true);
    const deleted = await onDelete('appointment', item.id);
    setBusy(false);
    if (deleted && draft?.id === item.id) setDraft(null);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Agenda</h1>
          <p>Organize os atendimentos e acompanhe cada serviço.</p>
        </div>
        <button
          className="button primary"
          onClick={() => setDraft(blank(date))}
        >
          <Plus size={18} /> Novo agendamento
        </button>
      </div>
      <div className="operations-layout">
        <section className="panel operations-panel">
          <div className="operations-toolbar">
            <label>
              Data
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <strong>
              {visible.length}{' '}
              {visible.length === 1 ? 'atendimento' : 'atendimentos'}
            </strong>
          </div>
          {visible.map((item) => (
            <div className="operation-row" key={item.id}>
              <div className="operation-time">{item.time}</div>
              <div className="operation-main">
                <strong>{detailsOf(item).client}</strong>
                <span>
                  {detailsOf(item).vehicle || 'Veículo não informado'} ·{' '}
                  {detailsOf(item).service}
                </span>
                {item.notes && <small>{item.notes}</small>}
              </div>
              <StatusBadge
                status={
                  linkedOrder(item.id)
                    ? stageOfOrder(linkedOrder(item.id))
                    : stageOfAppointment(item)
                }
              />
              <div className="operation-actions">
                <button
                  title="Editar"
                  onClick={() => setDraft({ ...detailsOf(item) })}
                >
                  <Pencil size={17} />
                </button>
                <button
                  title="Excluir"
                  disabled={busy || Boolean(linkedOrder(item.id))}
                  onClick={() => remove(item)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
          {!visible.length && (
            <div className="empty-state">
              <CalendarDays size={34} />
              <h3>Sem agendamentos para {dateBR(date)}</h3>
              <p>Use “Novo agendamento” para adicionar um atendimento.</p>
            </div>
          )}
        </section>
        {draft && (
          <form className="panel operations-form" onSubmit={submit}>
            <div className="operations-form-head">
              <h2>{draft.id ? 'Editar agendamento' : 'Novo agendamento'}</h2>
              <button type="button" onClick={() => setDraft(null)}>
                Fechar
              </button>
            </div>
            {draftOrder && (
              <p className="operations-hint">
                Serviço vinculado a uma ordem. Edite os detalhes e a etapa pela{' '}
                <button
                  className="inline-link"
                  type="button"
                  onClick={() => onNavigate('orders', draftOrder.client)}
                >
                  ordem de serviço
                </button>
                .
              </p>
            )}
            <div className="operations-fields two">
              <label>
                Data
                <input
                  type="date"
                  required
                  value={draft.date}
                  onChange={(event) =>
                    setDraft({ ...draft, date: event.target.value })
                  }
                />
              </label>
              <label>
                Horário
                <input
                  type="time"
                  required
                  value={draft.time}
                  onChange={(event) =>
                    setDraft({ ...draft, time: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Cliente
              <input
                required
                disabled={Boolean(draftOrder)}
                list="agenda-clients"
                value={draft.client}
                onChange={(event) => {
                  const client = clients.find(
                    (entry) => entry.name === event.target.value,
                  );
                  setDraft({
                    ...draft,
                    client: event.target.value,
                    phone: client?.phone || draft.phone,
                  });
                }}
              />
              <datalist id="agenda-clients">
                {clients.map((client) => (
                  <option key={client.id || client.name} value={client.name} />
                ))}
              </datalist>
            </label>
            <label>
              Telefone
              <input
                disabled={Boolean(draftOrder)}
                value={draft.phone}
                onChange={(event) =>
                  setDraft({ ...draft, phone: event.target.value })
                }
                placeholder="(11) 99999-9999"
              />
            </label>
            <label>
              Veículo
              <input
                disabled={Boolean(draftOrder)}
                value={draft.vehicle}
                onChange={(event) =>
                  setDraft({ ...draft, vehicle: event.target.value })
                }
                placeholder="Modelo e placa"
              />
            </label>
            <label>
              Serviço
              <input
                required
                disabled={Boolean(draftOrder)}
                value={draft.service}
                onChange={(event) =>
                  setDraft({ ...draft, service: event.target.value })
                }
              />
            </label>
            <label>
              Situação
              <select
                value={draft.status}
                disabled={Boolean(draftOrder)}
                onChange={(event) =>
                  setDraft({ ...draft, status: event.target.value })
                }
              >
                <option>Confirmado</option>
                <option>Em andamento</option>
                <option>Concluído</option>
                <option>Cancelado</option>
              </select>
            </label>
            <label>
              Observações
              <textarea
                rows="3"
                value={draft.notes}
                onChange={(event) =>
                  setDraft({ ...draft, notes: event.target.value })
                }
              />
            </label>
            <button className="button primary" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar agendamento'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
