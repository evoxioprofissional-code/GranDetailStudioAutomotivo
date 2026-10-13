import { Copy, Download, Edit3, Eye, FileText, MoreHorizontal, Plus, Search } from 'lucide-react';
import { dateBR, money } from '../lib/data';
import { createQuotePdf } from '../lib/pdf';
import StatusBadge from './StatusBadge';

const totalOf = (quote) => quote.services.reduce((sum, item) => sum + (Number(item.cents) || 0), 0);

export default function QuoteList({ quotes, query, onQuery, onNew, onEdit, onDuplicate, onView }) {
  const term = query.trim().toLowerCase();
  const filtered = quotes.filter((quote) => [
    quote.client.name, quote.client.phone, quote.vehicle.plate, quote.vehicle.model,
    `orc-${String(quote.number).padStart(4, '0')}`, String(quote.number),
  ].some((value) => String(value || '').toLowerCase().includes(term)));

  return (
    <>
      <div className="page-heading"><div><h1>Orçamentos</h1><p>Crie, acompanhe e envie propostas aos seus clientes.</p></div><button className="button primary" onClick={onNew}><Plus size={18} /> Novo orçamento</button></div>
      <section className="panel list-panel">
        <div className="list-toolbar">
          <label className="list-search"><Search size={18}/><input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Buscar cliente, telefone, placa ou número" /></label>
          <span>{filtered.length} {filtered.length === 1 ? 'orçamento' : 'orçamentos'}</span>
        </div>
        <div className="quotes-table">
          <div className="quotes-head"><span>Número</span><span>Cliente</span><span>Veículo</span><span>Data</span><span>Valor</span><span>Status</span><span>Ações</span></div>
          {filtered.map((quote) => (
            <div className="quotes-row" key={quote.id}>
              <button className="quote-number" onClick={() => onView(quote.id)}><FileText size={16}/> ORC-{String(quote.number).padStart(4, '0')}</button>
              <span><b>{quote.client.name || 'Cliente não informado'}</b><small>{quote.client.phone || 'Sem telefone'}</small></span>
              <span><b>{quote.vehicle.model || 'Veículo não informado'}</b><small>{quote.vehicle.plate || 'Sem placa'}</small></span>
              <span>{dateBR(quote.issueDate)}</span><b>{money(totalOf(quote))}</b><StatusBadge status={quote.status} />
              <div className="row-actions">
                <button title="Visualizar" onClick={() => onView(quote.id)}><Eye size={17}/></button>
                <button title="Editar" onClick={() => onEdit(quote.id)}><Edit3 size={17}/></button>
                <button title="Duplicar" onClick={() => onDuplicate(quote.id)}><Copy size={17}/></button>
                <button title="Baixar PDF" onClick={() => createQuotePdf(quote)}><Download size={17}/></button>
                <button title="Mais ações"><MoreHorizontal size={17}/></button>
              </div>
            </div>
          ))}
          {!filtered.length && <div className="empty-state"><FileText size={34}/><h3>Nenhum orçamento encontrado</h3><p>Ajuste a busca ou crie um novo orçamento.</p><button className="button primary" onClick={onNew}><Plus size={18}/> Novo orçamento</button></div>}
        </div>
      </section>
    </>
  );
}
