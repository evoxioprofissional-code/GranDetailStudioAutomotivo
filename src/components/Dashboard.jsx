import { ArrowUp, CalendarDays, ChevronDown, ExternalLink, Plus } from 'lucide-react';
import { money } from '../lib/data';
import StatusBadge from './StatusBadge';

function totalOf(quote) { return quote.services.reduce((sum, item) => sum + (Number(item.cents) || 0), 0); }

export default function Dashboard({ data, onNavigate, onEdit }) {
  const approved = data.quotes.filter((q) => q.status === 'Aprovado').reduce((sum, q) => sum + totalOf(q), 0);
  const pending = data.quotes.filter((q) => ['Enviado', 'Rascunho'].includes(q.status)).reduce((sum, q) => sum + totalOf(q), 0);
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
  return (
    <>
      <div className="page-heading dashboard-heading">
        <div><h1>Visão geral</h1><p className="capitalize">{weekday}</p></div>
        <div className="heading-actions"><button className="button secondary"><CalendarDays size={18} /> Este mês <ChevronDown size={17} /></button><button className="button primary" onClick={() => onNavigate('new-quote')}><Plus size={18} /> Novo orçamento</button></div>
      </div>
      <section className="stats-grid">
        <div className="stat"><span>Receita recebida</span><strong>{money(approved)}</strong><small className="positive"><ArrowUp size={16} /> orçamentos aprovados</small></div>
        <div className="stat"><span>A receber</span><strong>{money(pending)}</strong><small>{data.quotes.filter((q) => q.status === 'Enviado').length} pagamentos pendentes</small></div>
        <div className="stat"><span>Serviços concluídos</span><strong>47</strong><small>Ticket médio {money(approved ? Math.round(approved / Math.max(1, data.quotes.filter((q) => q.status === 'Aprovado').length)) : 0)}</small></div>
        <div className="stat"><span>Orçamentos abertos</span><strong>{data.quotes.filter((q) => !['Aprovado', 'Recusado'].includes(q.status)).length}</strong><small>{money(pending)} em propostas</small></div>
      </section>
      <div className="dashboard-grid">
        <section className="panel revenue-panel">
          <div className="panel-head"><div><h2>Receita no período</h2><div className="tabs"><b>Receita</b><span>Serviços</span></div></div><strong>{money(approved)}</strong></div>
          <div className="chart-wrap">
            <div className="chart-labels"><span>2.000</span><span>1.500</span><span>1.000</span><span>500</span><span>0</span></div>
            <svg viewBox="0 0 640 180" preserveAspectRatio="none" role="img" aria-label="Gráfico de receita no período">
              <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#111" stopOpacity=".12"/><stop offset="1" stopColor="#111" stopOpacity=".01"/></linearGradient></defs>
              {[0,1,2,3,4].map((i) => <line key={i} x1="0" y1={i*42+5} x2="640" y2={i*42+5} stroke="#e4e6e9" strokeWidth="1" />)}
              <path d="M0 155 L48 128 L100 128 L178 90 L226 118 L274 136 L322 112 L385 72 L420 90 L488 80 L548 38 L590 62 L640 50 L640 175 L0 175 Z" fill="url(#area)" />
              <path d="M0 155 L48 128 L100 128 L178 90 L226 118 L274 136 L322 112 L385 72 L420 90 L488 80 L548 38 L590 62 L640 50" fill="none" stroke="#101214" strokeWidth="2.2" />
            </svg>
            <div className="chart-dates"><span>01 out</span><span>05 out</span><span>09 out</span><span>13 out</span></div>
          </div>
        </section>
        <section className="panel agenda-panel">
          <div className="panel-head"><h2>Agenda de hoje</h2><button className="text-button">Abrir agenda <ExternalLink size={15} /></button></div>
          <div className="agenda-list">{data.appointments.map((a) => <div className="agenda-row" key={a.time}><b>{a.time}</b><span><strong>{a.client}</strong><small>{a.vehicle}</small></span><span>{a.service}</span><StatusBadge status={a.status} /></div>)}</div>
        </section>
        <section className="panel returns-panel">
          <div className="panel-head"><div><h2>Retorno de clientes</h2><p>3 clientes há mais de 30 dias sem atendimento</p></div><button className="button secondary compact">30 dias ou mais <ChevronDown size={15}/></button></div>
          <div className="simple-table"><div className="simple-table-head"><span>Cliente</span><span>Veículo</span><span>Última visita</span><span>Serviço</span></div>{[['RA','Roberto Alves','Jeep Compass','38 dias','Lavagem técnica'],['MC','Mariana Costa','VW T-Cross','45 dias','Higienização'],['FS','Felipe Santos','Honda Civic','32 dias','Polimento']].map((r)=><div className="simple-table-row" key={r[1]}><span><i>{r[0]}</i>{r[1]}</span><span>{r[2]}</span><span className="overdue">{r[3]}</span><span>{r[4]}</span></div>)}</div>
        </section>
        <section className="panel recent-panel">
          <div className="panel-head"><h2>Orçamentos recentes</h2><button className="text-button" onClick={() => onNavigate('quotes')}>Ver todos <ExternalLink size={15} /></button></div>
          <div className="quote-mini-head"><span>Nº</span><span>Cliente</span><span>Valor</span><span>Status</span></div>
          {data.quotes.slice(0, 3).map((q) => <button className="quote-mini-row" key={q.id} onClick={() => onEdit(q.id)}><b>ORC-{String(q.number).padStart(4,'0')}</b><span>{q.client.name}</span><b>{money(totalOf(q))}</b><StatusBadge status={q.status} /></button>)}
        </section>
      </div>
    </>
  );
}
