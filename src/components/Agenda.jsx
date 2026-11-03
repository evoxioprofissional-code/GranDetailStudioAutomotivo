import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { dateBR, todayLocal } from '../lib/data';
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
  clients,
  onSave,
  onDelete,
  query,
}) {
  const [date, setDate] = useState(todayLocal());
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const term = query.trim().toLowerCase();
  const visible = appointments
    .filter(
      (item) =>
        item.date === date &&
        [item.client, item.vehicle, item.service].some((value) =>
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
                <strong>{item.client}</strong>
                <span>
                  {item.vehicle || 'Veículo não informado'} · {item.service}
                </span>
                {item.notes && <small>{item.notes}</small>}
              </div>
              <StatusBadge status={item.status} />
              <div className="operation-actions">
                <button title="Editar" onClick={() => setDraft({ ...item })}>
                  <Pencil size={17} />
                </button>
                <button
                  title="Excluir"
                  disabled={busy}
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
