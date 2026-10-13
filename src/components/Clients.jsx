import { Car, FileText, MessageCircle, Search, Users } from 'lucide-react';
import { money, phoneDigits } from '../lib/data';

const totalOf = (quote) => quote.services.reduce((sum, item) => sum + (Number(item.cents) || 0), 0);

export default function Clients({ clients, quotes, query, onQuery, onEdit }) {
  const term = query.trim().toLowerCase();
  const filtered = clients.filter((client) => [client.name, client.phone, ...(client.vehicles || []).flatMap((v) => [v.model, v.plate])].some((value) => String(value || '').toLowerCase().includes(term)));
  const openWhatsapp = (client) => {
    const phone = phoneDigits(client.phone);
    if (phone) window.open(`https://wa.me/${phone.startsWith('55') ? phone : `55${phone}`}`, '_blank', 'noopener,noreferrer');
  };
  return <>
    <div className="page-heading"><div><h1>Clientes</h1><p>Cadastros criados automaticamente a partir dos orçamentos salvos.</p></div></div>
    <section className="panel list-panel"><div className="list-toolbar"><label className="list-search"><Search size={18}/><input value={query} onChange={(e)=>onQuery(e.target.value)} placeholder="Buscar cliente, telefone, veículo ou placa"/></label><span>{filtered.length} clientes</span></div>
      <div className="client-grid">{filtered.map((client)=>{const history=quotes.filter((q)=>phoneDigits(q.client.phone) && phoneDigits(q.client.phone)===phoneDigits(client.phone));return <article className="client-card" key={client.phone || client.name}><div className="client-card-head"><span className="client-initials">{client.name.split(' ').slice(0,2).map((p)=>p[0]).join('')}</span><div><h3>{client.name}</h3><p>{client.phone || 'Telefone não informado'}</p></div><button disabled={!client.phone} onClick={()=>openWhatsapp(client)} title="Abrir WhatsApp"><MessageCircle size={18}/></button></div><div className="client-meta"><span><Car size={16}/>{client.vehicles?.length || 0} veículos</span><span><FileText size={16}/>{history.length} orçamentos</span><b>{money(history.reduce((sum,q)=>sum+totalOf(q),0))}</b></div>{client.vehicles?.map((v)=><div className="client-vehicle" key={`${v.model}-${v.plate}`}><span>{v.model || 'Veículo'}</span><b>{v.plate || 'Sem placa'}</b><small>{v.color}</small></div>)}{history.slice(0,2).map((q)=><button className="history-item" key={q.id} onClick={()=>onEdit(q.id)}><span>ORC-{String(q.number).padStart(4,'0')}</span><b>{money(totalOf(q))}</b></button>)}</article>})}
      {!filtered.length&&<div className="empty-state wide"><Users size={34}/><h3>Nenhum cliente encontrado</h3><p>Clientes aparecem aqui depois que um orçamento é salvo com nome e telefone.</p></div>}</div>
    </section>
  </>;
}
