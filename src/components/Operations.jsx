import {
  CircleDollarSign,
  Copy,
  MessageCircle,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  dateBR,
  money,
  parseMoney,
  returnCandidates,
  todayLocal,
  whatsappNumber,
} from '../lib/data';
import { orderAtStage, stageOfOrder, workflowStages } from '../lib/workflow';
import StatusBadge from './StatusBadge';

const totalOf = (quote) =>
  quote.services.reduce(
    (sum, service) => sum + (Number(service.cents) || 0),
    0,
  );

export function OrdersPage({
  orders,
  appointments,
  quotes,
  clients,
  payments,
  onSave,
  onDelete,
  query,
}) {
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const term = query.trim().toLowerCase();
  const visible = orders.filter((order) =>
    [order.client, order.vehicle, order.service, stageOfOrder(order)].some(
      (value) =>
        String(value || '')
          .toLowerCase()
          .includes(term),
    ),
  );

  async function submit(event) {
    event.preventDefault();
    const normalized = orderAtStage(draft, stageOfOrder(draft), todayLocal());
    const paid = payments
      .filter((payment) => payment.orderId === draft.id)
      .reduce((sum, payment) => sum + Number(payment.cents || 0), 0);
    if (
      paid &&
      (normalized.status === 'Cancelado' || normalized.cents < paid)
    ) {
      setError(
        'A ordem tem recebimentos vinculados. O valor deve cobri-los e a situação não pode ser Cancelado.',
      );
      return;
    }
    setError('');
    setBusy(true);
    const saved = await onSave('order', {
      ...normalized,
      id: draft.id || crypto.randomUUID(),
    });
    setBusy(false);
    if (saved) setDraft(null);
  }

  async function remove(order) {
    if (payments.some((payment) => payment.orderId === order.id)) {
      window.alert(
        'Esta ordem possui recebimentos vinculados. Exclua ou desvincule os recebimentos antes.',
      );
      return;
    }
    if (!window.confirm(`Excluir a ordem de serviço de ${order.client}?`))
      return;
    setBusy(true);
    await onDelete('order', order.id);
    setBusy(false);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Ordens de serviço</h1>
          <p>Acompanhe a execução dos serviços aprovados.</p>
        </div>
        <button
          className="button primary"
          onClick={() =>
            setDraft({
              date: todayLocal(),
              client: '',
              phone: '',
              vehicle: '',
              service: '',
              cents: 0,
              stage: 'Recebido',
              status: 'Pendente',
              notes: '',
              quoteId: '',
            })
          }
        >
          <Plus size={18} /> Nova ordem
        </button>
      </div>
      <div className="operations-layout">
        <section className="panel operations-panel">
          <div className="operations-toolbar">
            <strong>
              {visible.length} {visible.length === 1 ? 'ordem' : 'ordens'}
            </strong>
          </div>
          {visible.map((order) => (
            <div className="operation-row" key={order.id}>
              <div className="operation-icon">
                <Wrench size={20} />
              </div>
              <div className="operation-main">
                <strong>{order.client}</strong>
                <span>
                  {order.service} · {order.vehicle || 'Sem veículo'}
                </span>
                <small>
                  {dateBR(
                    appointments.find((item) => item.id === order.appointmentId)
                      ?.date || order.date,
                  )}{' '}
                  · {money(order.cents)}
                </small>
              </div>
              <StatusBadge status={stageOfOrder(order)} />
              <div className="operation-actions">
                <button onClick={() => setDraft({ ...order })}>Editar</button>
                <button
                  title="Excluir"
                  disabled={busy}
                  onClick={() => remove(order)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
          {!visible.length && (
            <div className="empty-state">
              <Wrench size={34} />
              <h3>Nenhuma ordem de serviço</h3>
              <p>
                Crie uma ordem manualmente ou a partir de um orçamento aprovado.
              </p>
            </div>
          )}
        </section>
        {draft && (
          <form className="panel operations-form" onSubmit={submit}>
            <div className="operations-form-head">
              <h2>{draft.id ? 'Editar ordem' : 'Nova ordem'}</h2>
              <button type="button" onClick={() => setDraft(null)}>
                Fechar
              </button>
            </div>
            {draft.appointmentId && (
              <p className="operations-hint">
                Esta ordem veio da agenda. Altere data e horário no agendamento
                correspondente.
              </p>
            )}
            {!draft.id && (
              <label>
                Orçamento aprovado (opcional)
                <select
                  value={draft.quoteId}
                  onChange={(event) => {
                    const quote = quotes.find(
                      (item) => item.id === event.target.value,
                    );
                    setDraft(
                      quote
                        ? {
                            ...draft,
                            quoteId: quote.id,
                            client: quote.client.name,
                            phone: quote.client.phone,
                            vehicle:
                              `${quote.vehicle.model} ${quote.vehicle.plate}`.trim(),
                            service: quote.services
                              .map((item) => item.description)
                              .join(', '),
                            cents: totalOf(quote),
                          }
                        : { ...draft, quoteId: '' },
                    );
                  }}
                >
                  <option value="">Selecionar orçamento</option>
                  {quotes
                    .filter(
                      (quote) =>
                        quote.status === 'Aprovado' &&
                        !orders.some((order) => order.quoteId === quote.id),
                    )
                    .map((quote) => (
                      <option key={quote.id} value={quote.id}>
                        ORC-{String(quote.number).padStart(4, '0')} ·{' '}
                        {quote.client.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <label>
              Cliente
              <input
                required
                list="order-clients"
                value={draft.client}
                onChange={(event) => {
                  const client = clients.find(
                    (item) => item.name === event.target.value,
                  );
                  setDraft({
                    ...draft,
                    client: event.target.value,
                    phone: client?.phone || draft.phone,
                  });
                }}
              />
              <datalist id="order-clients">
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
              />
            </label>
            <label>
              Veículo
              <input
                value={draft.vehicle}
                onChange={(event) =>
                  setDraft({ ...draft, vehicle: event.target.value })
                }
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
            <div className="operations-fields two">
              <label>
                Data
                <input
                  type="date"
                  required
                  disabled={Boolean(draft.appointmentId)}
                  value={draft.date}
                  onChange={(event) =>
                    setDraft({ ...draft, date: event.target.value })
                  }
                />
              </label>
              <label>
                Valor (R$)
                <input
                  inputMode="decimal"
                  value={(draft.cents / 100).toFixed(2).replace('.', ',')}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      cents: parseMoney(event.target.value),
                    })
                  }
                />
              </label>
            </div>
            <label>
              Etapa do serviço
              <select
                value={stageOfOrder(draft)}
                onChange={(event) =>
                  setDraft(
                    orderAtStage(draft, event.target.value, todayLocal()),
                  )
                }
              >
                {workflowStages.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
                <option>Cancelado</option>
              </select>
            </label>
            {stageOfOrder(draft) === 'Entregue' && (
              <label>
                Data de entrega
                <input
                  type="date"
                  required
                  value={draft.completedDate || draft.date}
                  onChange={(event) =>
                    setDraft({ ...draft, completedDate: event.target.value })
                  }
                />
              </label>
            )}
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
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar ordem'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

export function FinancePage({ payments, orders, onSave, onDelete, query }) {
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const received = payments.reduce(
    (sum, payment) => sum + Number(payment.cents || 0),
    0,
  );
  const committed = orders
    .filter((order) => order.status !== 'Cancelado')
    .reduce((sum, order) => sum + Number(order.cents || 0), 0);
  const visible = payments
    .filter((payment) =>
      [payment.client, payment.description, payment.method].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  async function submit(event) {
    event.preventDefault();
    if (!draft.cents) return;
    const order = orders.find((item) => item.id === draft.orderId);
    if (order) {
      const paid = payments
        .filter((item) => item.orderId === order.id && item.id !== draft.id)
        .reduce((sum, item) => sum + Number(item.cents || 0), 0);
      if (draft.cents > order.cents - paid) {
        setError('O valor excede o saldo desta ordem.');
        return;
      }
    }
    setError('');
    setBusy(true);
    const saved = await onSave('payment', {
      ...draft,
      id: draft.id || crypto.randomUUID(),
    });
    setBusy(false);
    if (saved) setDraft(null);
  }

  async function remove(payment) {
    if (!window.confirm(`Excluir o recebimento de ${money(payment.cents)}?`))
      return;
    setBusy(true);
    await onDelete('payment', payment.id);
    setBusy(false);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Financeiro</h1>
          <p>Registre recebimentos e acompanhe os valores das ordens.</p>
        </div>
        <button
          className="button primary"
          onClick={() =>
            setDraft({
              date: todayLocal(),
              client: '',
              description: '',
              cents: 0,
              method: 'Pix',
              orderId: '',
            })
          }
        >
          <Plus size={18} /> Registrar recebimento
        </button>
      </div>
      <div className="operations-stats">
        <div>
          <span>Recebido</span>
          <strong>{money(received)}</strong>
        </div>
        <div>
          <span>Em ordens ativas</span>
          <strong>{money(committed)}</strong>
        </div>
        <div>
          <span>Saldo das ordens</span>
          <strong>
            {money(
              Math.max(
                0,
                committed -
                  payments
                    .filter((item) => item.orderId)
                    .reduce((sum, item) => sum + Number(item.cents || 0), 0),
              ),
            )}
          </strong>
        </div>
      </div>
      <div className="operations-layout">
        <section className="panel operations-panel">
          <div className="operations-toolbar">
            <strong>
              {visible.length}{' '}
              {visible.length === 1 ? 'recebimento' : 'recebimentos'}
            </strong>
          </div>
          {visible.map((payment) => (
            <div className="operation-row" key={payment.id}>
              <div className="operation-icon">
                <CircleDollarSign size={20} />
              </div>
              <div className="operation-main">
                <strong>{payment.client || payment.description}</strong>
                <span>
                  {payment.description} · {payment.method}
                </span>
                <small>{dateBR(payment.date)}</small>
              </div>
              <b className="operation-value">{money(payment.cents)}</b>
              <div className="operation-actions">
                <button onClick={() => setDraft({ ...payment })}>Editar</button>
                <button
                  title="Excluir"
                  disabled={busy}
                  onClick={() => remove(payment)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
          {!visible.length && (
            <div className="empty-state">
              <CircleDollarSign size={34} />
              <h3>Nenhum recebimento</h3>
              <p>Registre um pagamento para começar o controle financeiro.</p>
            </div>
          )}
        </section>
        {draft && (
          <form className="panel operations-form" onSubmit={submit}>
            <div className="operations-form-head">
              <h2>
                {draft.id ? 'Editar recebimento' : 'Registrar recebimento'}
              </h2>
              <button type="button" onClick={() => setDraft(null)}>
                Fechar
              </button>
            </div>
            <label>
              Ordem de serviço (opcional)
              <select
                value={draft.orderId}
                onChange={(event) => {
                  const order = orders.find(
                    (item) => item.id === event.target.value,
                  );
                  setDraft({
                    ...draft,
                    orderId: event.target.value,
                    client: order?.client || draft.client,
                    description: order?.service || draft.description,
                    cents: order
                      ? Math.max(
                          0,
                          Number(order.cents || 0) -
                            payments
                              .filter(
                                (item) =>
                                  item.orderId === order.id &&
                                  item.id !== draft.id,
                              )
                              .reduce(
                                (sum, item) => sum + Number(item.cents || 0),
                                0,
                              ),
                        )
                      : draft.cents,
                  });
                }}
              >
                <option value="">Sem vínculo</option>
                {orders
                  .filter((order) => order.status !== 'Cancelado')
                  .map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.client} · {order.service}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Cliente
              <input
                value={draft.client}
                onChange={(event) =>
                  setDraft({ ...draft, client: event.target.value })
                }
              />
            </label>
            <label>
              Descrição
              <input
                required
                value={draft.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
              />
            </label>
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
                Valor (R$)
                <input
                  required
                  inputMode="decimal"
                  value={(draft.cents / 100).toFixed(2).replace('.', ',')}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      cents: parseMoney(event.target.value),
                    })
                  }
                />
              </label>
            </div>
            <label>
              Forma de pagamento
              <select
                value={draft.method}
                onChange={(event) =>
                  setDraft({ ...draft, method: event.target.value })
                }
              >
                <option>Pix</option>
                <option>Débito</option>
                <option>Crédito</option>
                <option>Dinheiro</option>
                <option>Transferência</option>
                <option>Outro</option>
              </select>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary" disabled={busy || !draft.cents}>
              {busy ? 'Salvando…' : 'Salvar recebimento'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

export function ReturnsPage({ appointments, orders, query }) {
  const visible = returnCandidates(appointments, orders).filter((item) =>
    item.client.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Retorno de clientes</h1>
          <p>Clientes com último atendimento concluído há mais de 30 dias.</p>
        </div>
      </div>
      <section className="panel operations-panel">
        <div className="operations-toolbar">
          <strong>
            {visible.length}{' '}
            {visible.length === 1
              ? 'cliente para contato'
              : 'clientes para contato'}
          </strong>
        </div>
        {visible.map((item) => (
          <div className="operation-row" key={item.phone || item.client}>
            <div className="operation-icon">
              <MessageCircle size={20} />
            </div>
            <div className="operation-main">
              <strong>{item.client}</strong>
              <span>{item.vehicle || item.service}</span>
              <small>Último atendimento em {dateBR(item.date)}</small>
            </div>
            <button
              className="button secondary compact"
              disabled={!whatsappNumber(item.phone)}
              onClick={() =>
                window.open(
                  `https://wa.me/${whatsappNumber(item.phone)}?text=${encodeURIComponent(`Olá, ${item.client}! Tudo bem? Aqui é da Gran Detail. Gostaria de agendar um novo cuidado para o seu veículo?`)}`,
                  '_blank',
                  'noopener,noreferrer',
                )
              }
            >
              WhatsApp
            </button>
          </div>
        ))}
        {!visible.length && (
          <div className="empty-state">
            <MessageCircle size={34} />
            <h3>Nenhum retorno pendente</h3>
            <p>
              Os clientes aparecem aqui após um atendimento concluído completar
              30 dias.
            </p>
          </div>
        )}
      </section>
    </>
  );
}

export function MessagesPage({ clients }) {
  const [clientName, setClientName] = useState('');
  const [message, setMessage] = useState(
    'Olá! Aqui é da Gran Detail Studio Automotivo. Como podemos ajudar?',
  );
  const [copied, setCopied] = useState(false);
  const client = useMemo(
    () => clients.find((item) => item.name === clientName),
    [clients, clientName],
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Mensagens</h1>
          <p>Prepare uma mensagem e abra a conversa no WhatsApp.</p>
        </div>
      </div>
      <div className="operations-layout">
        <section className="panel operations-form">
          <label>
            Cliente
            <select
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
            >
              <option value="">Selecionar cliente</option>
              {clients.map((item) => (
                <option key={item.id || item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mensagem
            <textarea
              rows="7"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setCopied(false);
              }}
            />
          </label>
          <div className="operations-buttons">
            <button
              className="button secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(message);
                setCopied(true);
              }}
            >
              <Copy size={17} /> Copiar
            </button>
            <button
              className="button primary"
              disabled={!whatsappNumber(client?.phone) || !message.trim()}
              onClick={() =>
                window.open(
                  `https://wa.me/${whatsappNumber(client.phone)}?text=${encodeURIComponent(message)}`,
                  '_blank',
                  'noopener,noreferrer',
                )
              }
            >
              <MessageCircle size={17} /> Abrir WhatsApp
            </button>
          </div>
          {copied && (
            <p className="operations-hint" role="status">
              Mensagem copiada.
            </p>
          )}
          <p className="operations-hint">
            O envio acontece no WhatsApp após você confirmar a mensagem.
          </p>
        </section>
      </div>
    </>
  );
}
