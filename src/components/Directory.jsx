import { Car, MessageCircle, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { money, phoneDigits, whatsappNumber } from '../lib/data';
import { clientKey, vehicleBelongsToClient } from '../lib/catalog';

const totalOf = (quote) =>
  quote.services.reduce(
    (sum, service) => sum + (Number(service.cents) || 0),
    0,
  );

export function ClientsPage({
  clients,
  vehicles,
  quotes,
  query,
  onSave,
  onDelete,
}) {
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const term = query.trim().toLowerCase();
  const visible = clients.filter((client) =>
    [client.name, client.phone].some((value) =>
      String(value || '')
        .toLowerCase()
        .includes(term),
    ),
  );

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const saved = await onSave('client', {
      ...draft,
      id: draft.id || crypto.randomUUID(),
    });
    setBusy(false);
    if (saved) setDraft(null);
  }

  async function remove(client) {
    if (
      vehicles.some(
        (vehicle) =>
          vehicle.recordId && vehicleBelongsToClient(vehicle, client),
      )
    ) {
      window.alert(
        'Este cliente tem veículos vinculados. Exclua ou transfira os veículos antes.',
      );
      return;
    }
    if (!window.confirm(`Excluir o cadastro de ${client.name}?`)) return;
    setBusy(true);
    await onDelete('client', client.id);
    setBusy(false);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Clientes</h1>
          <p>Consulte o histórico e mantenha os contatos atualizados.</p>
        </div>
        <button
          className="button primary"
          onClick={() =>
            setDraft({ name: '', phone: '', email: '', notes: '' })
          }
        >
          <Plus size={18} /> Novo cliente
        </button>
      </div>
      <div className="operations-layout">
        <section className="panel operations-panel">
          <div className="operations-toolbar">
            <strong>
              {visible.length} {visible.length === 1 ? 'cliente' : 'clientes'}
            </strong>
          </div>
          {visible.map((client) => {
            const vehicleCount = vehicles.filter((vehicle) =>
              vehicleBelongsToClient(vehicle, client),
            ).length;
            const history = quotes.filter((quote) => {
              const phone = phoneDigits(client.phone);
              return phone
                ? phoneDigits(quote.client.phone) === phone
                : quote.client.name.trim().toLowerCase() ===
                    client.name.trim().toLowerCase();
            });
            return (
              <div className="operation-row" key={client.id || client.name}>
                <div className="operation-icon">
                  <Users size={20} />
                </div>
                <div className="operation-main">
                  <strong>{client.name}</strong>
                  <span>
                    {client.phone || 'Sem telefone'} · {vehicleCount}{' '}
                    {vehicleCount === 1 ? 'veículo' : 'veículos'} ·{' '}
                    {history.length}{' '}
                    {history.length === 1 ? 'orçamento' : 'orçamentos'}
                  </span>
                  <small>
                    {money(
                      history.reduce((sum, quote) => sum + totalOf(quote), 0),
                    )}{' '}
                    em propostas
                  </small>
                </div>
                <div className="operation-actions">
                  <button
                    title="WhatsApp"
                    disabled={!whatsappNumber(client.phone)}
                    onClick={() =>
                      window.open(
                        `https://wa.me/${whatsappNumber(client.phone)}`,
                        '_blank',
                        'noopener,noreferrer',
                      )
                    }
                  >
                    <MessageCircle size={17} />
                  </button>
                  <button
                    title="Editar"
                    onClick={() =>
                      setDraft({
                        name: client.name,
                        phone: client.phone || '',
                        email: client.email || '',
                        notes: client.notes || '',
                        id: client.recordId,
                      })
                    }
                  >
                    <Pencil size={17} />
                  </button>
                  {client.recordId && (
                    <button
                      title="Excluir cadastro"
                      disabled={busy}
                      onClick={() => remove({ ...client, id: client.recordId })}
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!visible.length && (
            <div className="empty-state">
              <Users size={34} />
              <h3>Nenhum cliente encontrado</h3>
              <p>Cadastre um cliente ou salve um orçamento.</p>
            </div>
          )}
        </section>
        {draft && (
          <form className="panel operations-form" onSubmit={submit}>
            <div className="operations-form-head">
              <h2>{draft.id ? 'Editar cliente' : 'Novo cliente'}</h2>
              <button type="button" onClick={() => setDraft(null)}>
                Fechar
              </button>
            </div>
            <label>
              Nome
              <input
                required
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </label>
            <label>
              Telefone
              <input
                value={draft.phone}
                onChange={(event) =>
                  setDraft({ ...draft, phone: event.target.value })
                }
              />
            </label>
            <label>
              E-mail
              <input
                type="email"
                value={draft.email}
                onChange={(event) =>
                  setDraft({ ...draft, email: event.target.value })
                }
              />
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
              {busy ? 'Salvando…' : 'Salvar cliente'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

export function VehiclesPage({
  vehicles,
  clients,
  query,
  onSave,
  onDelete,
  onNavigate,
}) {
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const term = query.trim().toLowerCase();
  const visible = vehicles.filter((vehicle) =>
    [vehicle.model, vehicle.plate, vehicle.color, vehicle.client].some(
      (value) =>
        String(value || '')
          .toLowerCase()
          .includes(term),
    ),
  );

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const { clientKey: _clientKey, ...record } = draft;
    const saved = await onSave('vehicle', {
      ...record,
      id: draft.id || crypto.randomUUID(),
    });
    setBusy(false);
    if (saved) setDraft(null);
  }

  async function remove(vehicle) {
    if (!window.confirm(`Excluir o veículo ${vehicle.model}?`)) return;
    setBusy(true);
    await onDelete('vehicle', vehicle.recordId);
    setBusy(false);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Veículos</h1>
          <p>Veículos cadastrados e vinculados aos orçamentos.</p>
        </div>
        <button
          className="button primary"
          onClick={() =>
            setDraft({
              model: '',
              plate: '',
              color: '',
              client: '',
              clientId: '',
              clientPhone: '',
              clientKey: '',
            })
          }
        >
          <Plus size={18} /> Novo veículo
        </button>
      </div>
      <div className="operations-layout">
        <section className="panel operations-panel">
          <div className="operations-toolbar">
            <strong>
              {visible.length} {visible.length === 1 ? 'veículo' : 'veículos'}
            </strong>
          </div>
          {visible.map((vehicle) => (
            <div
              className="operation-row"
              key={vehicle.recordId || `${vehicle.plate}-${vehicle.model}`}
            >
              <div className="operation-icon">
                <Car size={20} />
              </div>
              <div className="operation-main">
                <strong>{vehicle.model || 'Veículo'}</strong>
                <span>
                  {vehicle.plate || 'Sem placa'} ·{' '}
                  {vehicle.color || 'Cor não informada'}
                </span>
                <small>
                  {clients.find((client) =>
                    vehicleBelongsToClient(vehicle, client),
                  )?.name ||
                    vehicle.client ||
                    'Cliente não informado'}
                </small>
              </div>
              <div className="operation-actions">
                <button
                  title="Editar"
                  onClick={() => {
                    const owner = clients.find((client) =>
                      vehicleBelongsToClient(vehicle, client),
                    );
                    setDraft({
                      ...vehicle,
                      id: vehicle.recordId,
                      clientKey: owner ? clientKey(owner) : '',
                    });
                  }}
                >
                  <Pencil size={17} />
                </button>
                {vehicle.recordId && (
                  <button
                    title="Excluir"
                    disabled={busy}
                    onClick={() => remove(vehicle)}
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {!visible.length && (
            <div className="empty-state">
              <Car size={34} />
              <h3>Nenhum veículo encontrado</h3>
              <p>Cadastre um veículo ou salve um orçamento.</p>
            </div>
          )}
        </section>
        {draft && (
          <form className="panel operations-form" onSubmit={submit}>
            <div className="operations-form-head">
              <h2>{draft.id ? 'Editar veículo' : 'Novo veículo'}</h2>
              <button type="button" onClick={() => setDraft(null)}>
                Fechar
              </button>
            </div>
            <label>
              Modelo
              <input
                required
                value={draft.model}
                onChange={(event) =>
                  setDraft({ ...draft, model: event.target.value })
                }
              />
            </label>
            <label>
              Placa
              <input
                value={draft.plate}
                maxLength="7"
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    plate: event.target.value.toUpperCase(),
                  })
                }
              />
            </label>
            <label>
              Cor
              <input
                value={draft.color}
                onChange={(event) =>
                  setDraft({ ...draft, color: event.target.value })
                }
              />
            </label>
            <label>
              Cliente
              <select
                required
                value={draft.clientKey}
                onChange={(event) => {
                  const owner = clients.find(
                    (client) => clientKey(client) === event.target.value,
                  );
                  setDraft({
                    ...draft,
                    clientKey: event.target.value,
                    client: owner?.name || '',
                    clientId: owner?.recordId || '',
                    clientPhone: owner?.phone || '',
                  });
                }}
              >
                <option value="">Selecione o cliente</option>
                {clients.map((client) => (
                  <option key={clientKey(client)} value={clientKey(client)}>
                    {client.name}
                    {client.phone ? ` · ${client.phone}` : ''}
                  </option>
                ))}
              </select>
            </label>
            {!clients.length && (
              <p className="operations-hint">
                Cadastre um cliente antes de adicionar o veículo.{' '}
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => onNavigate('clients')}
                >
                  Abrir clientes
                </button>
              </p>
            )}
            <button className="button primary" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar veículo'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
