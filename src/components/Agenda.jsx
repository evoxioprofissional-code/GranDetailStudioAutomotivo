import {
  ArrowRight,
  CalendarDays,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  clientKey,
  vehicleBelongsToClient,
  vehicleKey,
  vehicleLabel,
} from '../lib/catalog';
import { dateBR, phoneDigits, todayLocal } from '../lib/data';
import { stageOfAppointment, stageOfOrder } from '../lib/workflow';
import StatusBadge from './StatusBadge';

const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const blank = (date) => ({
  date,
  time: '09:00',
  client: '',
  clientId: '',
  clientKey: '',
  phone: '',
  vehicle: '',
  vehicleId: '',
  vehicleKey: '',
  service: '',
  status: 'Confirmado',
  notes: '',
});
const asDate = (iso) => new Date(`${iso}T12:00:00Z`);
const isoDate = (date) => date.toISOString().slice(0, 10);
const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const monthName = (iso) =>
  capitalize(
    new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(asDate(iso)),
  );
const dayName = (iso) =>
  capitalize(
    new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(asDate(iso)),
  );

function monthCells(iso) {
  const date = asDate(iso);
  const first = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12),
  );
  first.setUTCDate(first.getUTCDate() - ((first.getUTCDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(first);
    day.setUTCDate(first.getUTCDate() + index);
    return isoDate(day);
  });
}

function adjacentMonth(iso, direction) {
  const date = asDate(iso);
  return isoDate(
    new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + direction, 1, 12),
    ),
  );
}

function toneOf(stage) {
  if (stage === 'Cancelado') return 'cancelled';
  if (stage === 'Entregue') return 'delivered';
  if (stage === 'Pronto') return 'ready';
  if (stage === 'Em execução') return 'active';
  if (stage === 'Recebido') return 'received';
  return 'booked';
}

export default function Agenda({
  appointments,
  initialDate,
  orders,
  clients,
  vehicles,
  onSave,
  onDelete,
  onNavigate,
  query,
}) {
  const [date, setDate] = useState(initialDate || todayLocal());
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const today = todayLocal();
  const linkedOrders = useMemo(
    () =>
      new Map(
        orders
          .filter((order) => order.appointmentId)
          .map((order) => [order.appointmentId, order]),
      ),
    [orders],
  );
  const draftOrder = draft?.id ? linkedOrders.get(draft.id) : null;

  const events = useMemo(() => {
    const term = query.trim().toLowerCase();
    return appointments
      .map((appointment) => {
        const order = linkedOrders.get(appointment.id);
        const registeredClient =
          appointment.clientId &&
          clients.find((client) => client.recordId === appointment.clientId);
        const registeredVehicle =
          appointment.vehicleId &&
          vehicles.find(
            (vehicle) => vehicle.recordId === appointment.vehicleId,
          );
        const client =
          order?.client || registeredClient?.name || appointment.client;
        const vehicle =
          order?.vehicle ||
          (registeredVehicle && vehicleLabel(registeredVehicle)) ||
          appointment.vehicle;
        const service = order?.service || appointment.service;
        const stage = order
          ? stageOfOrder(order)
          : stageOfAppointment(appointment);
        return {
          ...appointment,
          client,
          vehicle,
          service,
          stage,
          tone: toneOf(stage),
          order,
        };
      })
      .filter((item) =>
        [item.client, item.vehicle, item.service].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(term),
        ),
      );
  }, [appointments, clients, vehicles, linkedOrders, query]);

  const byDate = useMemo(() => {
    const days = new Map();
    for (const item of events) {
      if (!days.has(item.date)) days.set(item.date, []);
      days.get(item.date).push(item);
    }
    for (const items of days.values())
      items.sort((a, b) => a.time.localeCompare(b.time));
    return days;
  }, [events]);
  const selectedEvents = byDate.get(date) || [];
  const monthCount = events.filter(
    (item) => item.date?.slice(0, 7) === date.slice(0, 7),
  ).length;
  const cells = useMemo(() => monthCells(date), [date]);
  const selectedClient =
    draft && clients.find((client) => clientKey(client) === draft.clientKey);
  const clientVehicles = selectedClient
    ? vehicles.filter((vehicle) =>
        vehicleBelongsToClient(vehicle, selectedClient),
      )
    : [];
  const legacyVehicle = draft?.vehicleKey?.startsWith('legacy:')
    ? draft.vehicle
    : '';

  useEffect(() => {
    if (!draft) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !busy) setDraft(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [draft, busy]);

  function openEdit(item) {
    const owner =
      clients.find(
        (client) => item.clientId && client.recordId === item.clientId,
      ) ||
      clients.find(
        (client) =>
          phoneDigits(client.phone) &&
          phoneDigits(client.phone) === phoneDigits(item.phone),
      ) ||
      clients.find(
        (client) =>
          client.name.trim().toLowerCase() === item.client.trim().toLowerCase(),
      );
    const ownedVehicles = owner
      ? vehicles.filter((vehicle) => vehicleBelongsToClient(vehicle, owner))
      : [];
    const car =
      ownedVehicles.find(
        (vehicle) => item.vehicleId && vehicle.recordId === item.vehicleId,
      ) ||
      ownedVehicles.find(
        (vehicle) =>
          vehicleLabel(vehicle).toLowerCase() ===
          String(item.vehicle || '').toLowerCase(),
      ) ||
      ownedVehicles.find(
        (vehicle) =>
          vehicle.plate &&
          String(item.vehicle || '')
            .toUpperCase()
            .includes(vehicle.plate.toUpperCase()),
      );
    setDraft({
      ...item,
      clientKey: owner ? clientKey(owner) : '',
      vehicleKey: car
        ? vehicleKey(car)
        : item.vehicle
          ? `legacy:${item.vehicle}`
          : '',
    });
  }

  async function submit(event) {
    event.preventDefault();
    const {
      clientKey: selectedClientKey,
      vehicleKey: selectedVehicleKey,
      order: _order,
      stage: _stage,
      tone: _tone,
      ...record
    } = draft;
    const owner = clients.find(
      (client) => clientKey(client) === selectedClientKey,
    );
    const car = clientVehicles.find(
      (vehicle) => vehicleKey(vehicle) === selectedVehicleKey,
    );
    if (!draftOrder && (!owner || (!car && !legacyVehicle))) return;
    const prepared = draftOrder
      ? record
      : {
          ...record,
          clientId: owner.recordId || '',
          client: owner.name,
          phone: owner.phone || '',
          vehicleId: car?.recordId || '',
          vehicle: car ? vehicleLabel(car) : legacyVehicle,
        };
    setBusy(true);
    const saved = await onSave('appointment', {
      ...prepared,
      id: prepared.id || crypto.randomUUID(),
    });
    setBusy(false);
    if (saved) {
      setDate(saved.date);
      setDraft(null);
    }
  }

  async function remove(item) {
    if (linkedOrders.has(item.id)) return;
    if (!window.confirm(`Excluir o agendamento de ${item.client}?`)) return;
    setBusy(true);
    const deleted = await onDelete('appointment', item.id);
    setBusy(false);
    if (deleted) setDraft(null);
  }

  return (
    <div className="studio-agenda">
      <div className="agenda-heading">
        <div>
          <span className="agenda-eyebrow">
            <CalendarDays size={16} /> PLANEJAMENTO DO STUDIO
          </span>
          <h1>Agenda</h1>
          <p>
            Encontre os horários, selecione o cliente e escolha o carro certo.
          </p>
        </div>
        <button
          className="button primary"
          onClick={() => setDraft(blank(date))}
        >
          <Plus size={18} /> Novo agendamento
        </button>
      </div>

      <div className="agenda-toolbar">
        <div className="agenda-month-nav">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => setDate(adjacentMonth(date, -1))}
          >
            <ChevronLeft size={19} />
          </button>
          <h2>{monthName(date)}</h2>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => setDate(adjacentMonth(date, 1))}
          >
            <ChevronRight size={19} />
          </button>
        </div>
        <button className="agenda-today" onClick={() => setDate(today)}>
          Hoje
        </button>
        <span className="agenda-month-count">
          <span /> {monthCount}{' '}
          {monthCount === 1 ? 'agendamento' : 'agendamentos'} no mês
        </span>
      </div>

      <div className="agenda-layout">
        <section
          className="agenda-calendar"
          aria-label={`Calendário de ${monthName(date)}`}
        >
          <div className="agenda-weekdays">
            {weekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="agenda-days">
            {cells.map((day) => {
              const entries = byDate.get(day) || [];
              const outside = day.slice(0, 7) !== date.slice(0, 7);
              return (
                <button
                  type="button"
                  key={day}
                  className={`agenda-date ${day === date ? 'selected' : ''} ${day === today ? 'today' : ''} ${outside ? 'outside' : ''}`}
                  onClick={() => setDate(day)}
                  aria-label={`${dateBR(day)}, ${entries.length} ${entries.length === 1 ? 'agendamento' : 'agendamentos'}`}
                  aria-pressed={day === date}
                >
                  <span className="agenda-date-number">
                    {Number(day.slice(8))}
                  </span>
                  <span className="agenda-date-events">
                    {entries.slice(0, 2).map((item) => (
                      <span
                        className={`agenda-date-event ${item.tone}`}
                        key={item.id}
                      >
                        <i /> <b>{item.time}</b> {item.client}
                      </span>
                    ))}
                    {entries.length > 2 && (
                      <small>+{entries.length - 2} atendimento(s)</small>
                    )}
                  </span>
                  {entries.length > 0 && (
                    <span className="agenda-date-mobile-count">
                      {entries.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="agenda-day-panel">
          <div className="agenda-day-head">
            <span className="agenda-day-label">DIA SELECIONADO</span>
            <div>
              <strong>{Number(date.slice(8))}</strong>
              <span>{dayName(date)}</span>
            </div>
            <p>
              {selectedEvents.length}{' '}
              {selectedEvents.length === 1
                ? 'atendimento agendado'
                : 'atendimentos agendados'}
            </p>
          </div>
          <div className="agenda-day-list">
            {selectedEvents.map((item) => (
              <button
                className={`agenda-day-event ${item.tone}`}
                key={item.id}
                onClick={() => openEdit(item)}
              >
                <span className="agenda-event-time">
                  <Clock3 size={14} /> {item.time}
                </span>
                <strong>{item.client}</strong>
                <span className="agenda-event-service">{item.service}</span>
                <span className="agenda-event-vehicle">
                  <Car size={13} /> {item.vehicle || 'Veículo não informado'}
                </span>
                <span className="agenda-event-bottom">
                  <StatusBadge status={item.stage} />
                  <Pencil size={15} />
                </span>
              </button>
            ))}
            {!selectedEvents.length && (
              <div className="agenda-day-empty">
                <CalendarDays size={27} />
                <strong>Dia livre na agenda</strong>
                <p>Escolha um horário para o próximo atendimento.</p>
                <button onClick={() => setDraft(blank(date))}>
                  Agendar neste dia <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {draft && (
        <div
          className="agenda-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setDraft(null);
          }}
        >
          <form
            className="agenda-modal"
            role="dialog"
            aria-modal="true"
            aria-label={draft.id ? 'Editar agendamento' : 'Novo agendamento'}
            onSubmit={submit}
          >
            <div className="agenda-modal-head">
              <div>
                <span className="agenda-eyebrow">ATENDIMENTO</span>
                <h2>{draft.id ? 'Editar agendamento' : 'Novo agendamento'}</h2>
                <p>Escolha o cliente, o veículo e o horário.</p>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setDraft(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="agenda-modal-body">
              {draftOrder && (
                <div className="agenda-linked-note">
                  Este serviço já tem uma ordem. Altere os detalhes e a etapa na{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('orders', draftOrder.client)}
                  >
                    ordem de serviço
                  </button>
                  .
                </div>
              )}
              <div className="agenda-form-section">
                <span>01 · QUEM VEM AO STUDIO</span>
                <label>
                  Cliente
                  <select
                    aria-label="Cliente"
                    required
                    disabled={Boolean(draftOrder)}
                    value={draft.clientKey}
                    onChange={(event) => {
                      const owner = clients.find(
                        (client) => clientKey(client) === event.target.value,
                      );
                      setDraft({
                        ...draft,
                        clientKey: event.target.value,
                        clientId: owner?.recordId || '',
                        client: owner?.name || '',
                        phone: owner?.phone || '',
                        vehicleKey: '',
                        vehicleId: '',
                        vehicle: '',
                      });
                    }}
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => (
                      <option key={clientKey(client)} value={clientKey(client)}>
                        {client.name}
                        {client.phone ? ` · ${client.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedClient && (
                  <div className="agenda-selection">
                    <UserRound size={16} />
                    <span>
                      <strong>{selectedClient.name}</strong>
                      <small>
                        {selectedClient.phone || 'Sem telefone cadastrado'}
                      </small>
                    </span>
                  </div>
                )}
                {!clients.length && (
                  <p className="agenda-form-help">
                    Ainda não há clientes.{' '}
                    <button type="button" onClick={() => onNavigate('clients')}>
                      Cadastrar cliente <ArrowRight size={13} />
                    </button>
                  </p>
                )}
                <label>
                  Veículo
                  <select
                    aria-label="Veículo"
                    required
                    disabled={!selectedClient || Boolean(draftOrder)}
                    value={draft.vehicleKey}
                    onChange={(event) => {
                      const car = clientVehicles.find(
                        (vehicle) => vehicleKey(vehicle) === event.target.value,
                      );
                      setDraft({
                        ...draft,
                        vehicleKey: event.target.value,
                        vehicleId: car?.recordId || '',
                        vehicle: car ? vehicleLabel(car) : '',
                      });
                    }}
                  >
                    <option value="">
                      {selectedClient
                        ? 'Selecione um veículo'
                        : 'Selecione o cliente primeiro'}
                    </option>
                    {legacyVehicle && (
                      <option value={draft.vehicleKey}>
                        {legacyVehicle} · registro antigo
                      </option>
                    )}
                    {clientVehicles.map((vehicle) => (
                      <option
                        key={vehicleKey(vehicle)}
                        value={vehicleKey(vehicle)}
                      >
                        {vehicleLabel(vehicle)}
                        {vehicle.color ? ` · ${vehicle.color}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedClient &&
                  !clientVehicles.length &&
                  !legacyVehicle &&
                  !draftOrder && (
                    <p className="agenda-form-help">
                      Este cliente ainda não tem carro cadastrado.{' '}
                      <button
                        type="button"
                        onClick={() => onNavigate('vehicles')}
                      >
                        Cadastrar veículo <ArrowRight size={13} />
                      </button>
                    </p>
                  )}
              </div>
              <div className="agenda-form-section">
                <span>02 · SERVIÇO E HORÁRIO</span>
                <label>
                  Serviço
                  <input
                    aria-label="Serviço"
                    required
                    disabled={Boolean(draftOrder)}
                    value={draft.service}
                    onChange={(event) =>
                      setDraft({ ...draft, service: event.target.value })
                    }
                    placeholder="Ex.: Higienização interna"
                  />
                </label>
                <div className="agenda-form-row">
                  <label>
                    Data
                    <input
                      aria-label="Data"
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
                      aria-label="Horário"
                      type="time"
                      required
                      value={draft.time}
                      onChange={(event) =>
                        setDraft({ ...draft, time: event.target.value })
                      }
                    />
                  </label>
                </div>
                {draft.id && !draftOrder && (
                  <label>
                    Situação
                    <select
                      aria-label="Situação"
                      value={draft.status}
                      onChange={(event) =>
                        setDraft({ ...draft, status: event.target.value })
                      }
                    >
                      <option>Confirmado</option>
                      {['Em andamento', 'Concluído'].includes(draft.status) && (
                        <option>{draft.status}</option>
                      )}
                      <option>Cancelado</option>
                    </select>
                  </label>
                )}
                <label>
                  Observações
                  <textarea
                    aria-label="Observações"
                    rows="3"
                    value={draft.notes}
                    onChange={(event) =>
                      setDraft({ ...draft, notes: event.target.value })
                    }
                    placeholder="Informações importantes para a equipe"
                  />
                </label>
              </div>
            </div>
            <div className="agenda-modal-foot">
              {draft.id && !draftOrder && (
                <button
                  className="agenda-delete"
                  type="button"
                  disabled={busy}
                  onClick={() => remove(draft)}
                >
                  <Trash2 size={16} /> Excluir
                </button>
              )}
              <button
                type="button"
                className="button secondary"
                onClick={() => setDraft(null)}
              >
                Cancelar
              </button>
              <button className="button primary" disabled={busy}>
                {busy ? 'Salvando…' : 'Salvar agendamento'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
