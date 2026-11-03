import { ArrowLeft, ArrowRight, CalendarDays, Wrench } from 'lucide-react';
import { useRef, useState } from 'react';
import { dateBR } from '../lib/data';
import {
  stageOfAppointment,
  stageOfOrder,
  workflowStages,
} from '../lib/workflow';

export default function Workflow({
  appointments,
  orders,
  onMove,
  onNavigate,
  query,
}) {
  const [movingId, setMovingId] = useState(null);
  const boardRef = useRef(null);
  const linkedAppointments = new Set(
    orders.map((order) => order.appointmentId).filter(Boolean),
  );
  const appointmentById = new Map(
    appointments.map((appointment) => [appointment.id, appointment]),
  );
  const items = [
    ...appointments
      .filter((appointment) => !linkedAppointments.has(appointment.id))
      .map((appointment) => ({
        ...appointment,
        kind: 'appointment',
        stage: stageOfAppointment(appointment),
        record: appointment,
      })),
    ...orders.map((order) => {
      const appointment = appointmentById.get(order.appointmentId);
      return {
        ...order,
        kind: 'order',
        stage: stageOfOrder(order),
        record: order,
        date: appointment?.date || order.date,
        time: appointment?.time || order.time,
      };
    }),
  ];
  const term = query.trim().toLowerCase();
  const visible = items.filter(
    (item) =>
      item.stage !== 'Cancelado' &&
      [item.client, item.vehicle, item.service].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(term),
      ),
  );

  async function move(item, target) {
    setMovingId(item.id);
    await onMove(item, target);
    setMovingId(null);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Fluxo de serviços</h1>
          <p>Acompanhe cada veículo da confirmação até a entrega.</p>
        </div>
        <div className="heading-actions">
          <button
            className="button secondary"
            onClick={() => onNavigate('agenda')}
          >
            <CalendarDays size={17} /> Agenda
          </button>
          <button
            className="button primary"
            onClick={() => onNavigate('orders')}
          >
            <Wrench size={17} /> Ordens de serviço
          </button>
        </div>
      </div>
      <div className="workflow-overview" aria-label="Ir para etapa do serviço">
        {workflowStages.map((stage, index) => (
          <button
            key={stage}
            type="button"
            onClick={() => boardRef.current?.scrollTo({ left: index * 257, behavior: 'smooth' })}
          >
            <b>{visible.filter((item) => item.stage === stage).length}</b>
            <span>{stage}</span>
          </button>
        ))}
      </div>
      <div className="workflow-board" ref={boardRef}>
        {workflowStages.map((stage, index) => {
          const cards = visible
            .filter((item) => item.stage === stage)
            .sort((a, b) =>
              `${a.date || ''} ${a.time || ''}`.localeCompare(
                `${b.date || ''} ${b.time || ''}`,
              ),
            );
          return (
            <section className="workflow-column" key={stage}>
              <div className="workflow-column-head">
                <span className={`workflow-dot stage-${index}`} />
                <h2>{stage}</h2>
                <b>{cards.length}</b>
              </div>
              <div className="workflow-column-body">
                {cards.map((item) => (
                  <article
                    className="workflow-card"
                    key={`${item.kind}-${item.id}`}
                  >
                    <div className="workflow-card-top">
                      <span>
                        {item.kind === 'appointment' ? (
                          <CalendarDays size={16} />
                        ) : (
                          <Wrench size={16} />
                        )}
                        {item.kind === 'appointment'
                          ? 'Agendamento'
                          : 'Ordem de serviço'}
                      </span>
                      <small>{item.time || ''}</small>
                    </div>
                    <h3>{item.client}</h3>
                    <p>{item.service}</p>
                    {item.vehicle && (
                      <small className="workflow-vehicle">{item.vehicle}</small>
                    )}
                    <div className="workflow-card-foot">
                      <span>{dateBR(item.date)}</span>
                      <button
                        onClick={() =>
                          onNavigate(
                            item.kind === 'appointment' ? 'agenda' : 'orders',
                            item.client,
                            item.date,
                          )
                        }
                      >
                        Abrir <ArrowRight size={14} />
                      </button>
                    </div>
                    <div className="workflow-moves">
                      {index > 0 && (
                        <button
                          disabled={movingId === item.id}
                          onClick={() => move(item, workflowStages[index - 1])}
                        >
                          <ArrowLeft size={14} /> Voltar
                        </button>
                      )}
                      {index < workflowStages.length - 1 && (
                        <button
                          disabled={movingId === item.id}
                          onClick={() => move(item, workflowStages[index + 1])}
                        >
                          Avançar <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
                {!cards.length && (
                  <p className="workflow-empty">Nenhum serviço nesta etapa</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
