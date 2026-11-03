export const workflowStages = [
  'Agendado',
  'Recebido',
  'Em execução',
  'Pronto',
  'Entregue',
];

export function stageOfOrder(order) {
  if (order.status === 'Cancelado') return 'Cancelado';
  if (workflowStages.includes(order.stage)) return order.stage;
  if (order.status === 'Concluído') return 'Entregue';
  if (order.status === 'Em andamento') return 'Em execução';
  return 'Recebido';
}

export function stageOfAppointment(appointment) {
  if (appointment.status === 'Cancelado') return 'Cancelado';
  if (workflowStages.includes(appointment.stage)) return appointment.stage;
  if (appointment.status === 'Concluído') return 'Entregue';
  if (appointment.status === 'Em andamento') return 'Em execução';
  return 'Agendado';
}

export function statusForStage(stage) {
  if (stage === 'Entregue') return 'Concluído';
  if (stage === 'Em execução' || stage === 'Pronto') return 'Em andamento';
  if (stage === 'Cancelado') return 'Cancelado';
  return 'Pendente';
}

export function orderAtStage(order, stage, today) {
  return {
    ...order,
    stage,
    status: statusForStage(stage),
    completedDate: stage === 'Entregue' ? order.completedDate || today : '',
  };
}
