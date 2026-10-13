import { ArrowLeft, Download, Eye, MessageCircle, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { dateBR, money, parseMoney, phoneDigits } from '../lib/data';
import { createQuotePdf } from '../lib/pdf';

function MoneyInput({ value, onChange, disabled }) {
  return <div className="money-input"><span>R$</span><input disabled={disabled} inputMode="numeric" value={money(value).replace('R$', '').trim()} onChange={(e) => onChange(parseMoney(e.target.value))} /></div>;
}

function installmentText(cents, installments) {
  const parts = Math.max(1, Number(installments) || 1);
  const base = Math.floor((Number(cents) || 0) / parts);
  const remainder = (Number(cents) || 0) - base * parts;
  if (!remainder) return `${parts}x de ${money(base)}`;
  return `${parts - remainder}x de ${money(base)} + ${remainder}x de ${money(base + 1)}`;
}

function QuotePreview({ quote }) {
  const total = quote.services.reduce((sum, item) => sum + (Number(item.cents) || 0), 0);
  const credit = quote.payments.credit;
  return (
    <div className="document-preview">
      <div className="preview-header"><img src="/logo-gran-detail.png" alt="Gran Detail"/><div><h2>ORÇAMENTO</h2><p>Nº {String(quote.number).padStart(4, '0')} • {dateBR(quote.issueDate)}</p></div></div>
      <div className="preview-details"><div><small>CLIENTE</small><b>{quote.client.name || 'Nome do cliente'}</b><span>{quote.client.phone || 'Telefone / WhatsApp'}</span></div><div><small>VEÍCULO</small><b>{quote.vehicle.model || 'Modelo do veículo'}</b><span>{quote.vehicle.plate || 'Placa'}{quote.vehicle.color ? ` • ${quote.vehicle.color}` : ''}</span></div></div>
      <div className="preview-table"><div><b>Serviço</b><b>Valor</b></div>{quote.services.map((service) => <div key={service.id}><span>{service.description || 'Descrição do serviço'}</span><b>{money(service.cents)}</b></div>)}</div>
      <div className="preview-total"><span>Total dos serviços</span><b>{money(total)}</b></div>
      {[quote.payments.pix.enabled, quote.payments.debit.enabled, quote.payments.credit.enabled].some(Boolean) && <div className="preview-payments"><small>CONDIÇÕES DE PAGAMENTO</small>{quote.payments.pix.enabled && <p><b>Pix</b><span>{money(quote.payments.pix.cents)}</span></p>}{quote.payments.debit.enabled && <p><b>Cartão de débito</b><span>{money(quote.payments.debit.cents)}</span></p>}{quote.payments.credit.enabled && <p><b>Cartão de crédito</b><span>{money(quote.payments.credit.cents)} • {installmentText(credit.cents, credit.installments)} sem juros</span></p>}</div>}
      {quote.validUntil && <p className="preview-note"><b>Validade:</b> {dateBR(quote.validUntil)}</p>}
      {quote.notes && <div className="preview-notes"><small>OBSERVAÇÕES</small><p>{quote.notes}</p></div>}
      <footer>Gran Detail Studio Automotivo</footer>
    </div>
  );
}

export default function QuoteEditor({ initialQuote, clients, onSave, onCancel, readOnly = false }) {
  const [quote, setQuote] = useState(() => structuredClone(initialQuote));
  const [error, setError] = useState('');
  const total = useMemo(() => quote.services.reduce((sum, item) => sum + (Number(item.cents) || 0), 0), [quote.services]);
  const previousTotal = useRef(total);

  useEffect(() => {
    setQuote((current) => {
      const payments = structuredClone(current.payments);
      let changed = false;
      ['pix', 'debit', 'credit'].forEach((key) => {
        if (!payments[key].cents || payments[key].cents === previousTotal.current) {
          payments[key].cents = total;
          changed = true;
        }
      });
      previousTotal.current = total;
      return changed ? { ...current, payments } : current;
    });
  }, [total]);

  const setField = (section, field, value) => setQuote((q) => section ? { ...q, [section]: { ...q[section], [field]: value } } : { ...q, [field]: value });
  const setPayment = (key, field, value) => setQuote((q) => ({ ...q, payments: { ...q.payments, [key]: { ...q.payments[key], [field]: value } } }));
  const updateService = (id, field, value) => setQuote((q) => ({ ...q, services: q.services.map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  const addService = () => setQuote((q) => ({ ...q, services: [...q.services, { id: crypto.randomUUID(), description: '', cents: 0 }] }));
  const removeService = (id) => setQuote((q) => ({ ...q, services: q.services.length === 1 ? q.services : q.services.filter((item) => item.id !== id) }));
  const chooseClient = (name) => {
    setField('client', 'name', name);
    const found = clients.find((client) => client.name.toLowerCase() === name.toLowerCase());
    if (found) setQuote((q) => ({ ...q, client: { name: found.name, phone: found.phone }, vehicle: found.vehicles?.[0] || q.vehicle }));
  };
  const submit = () => {
    if (!quote.client.name.trim()) return setError('Informe o nome do cliente.');
    if (!quote.services.some((service) => service.description.trim())) return setError('Adicione ao menos um serviço com descrição.');
    setError('');
    onSave({ ...quote, updatedAt: new Date().toISOString() });
  };
  const whatsapp = () => {
    const phone = phoneDigits(quote.client.phone);
    if (!phone) return setError('Informe o telefone do cliente para abrir o WhatsApp.');
    const prefix = phone.startsWith('55') ? phone : `55${phone}`;
    const text = `Olá, ${quote.client.name}! Seu orçamento nº ${String(quote.number).padStart(4, '0')} da Gran Detail está pronto. Valor dos serviços: ${money(total)}. O PDF foi baixado e pode ser anexado nesta conversa.`;
    window.open(`https://wa.me/${prefix}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="editor-heading"><button className="back-button" onClick={onCancel}><ArrowLeft size={20}/></button><div><h1>{readOnly ? 'Visualizar orçamento' : quote.createdAt === quote.updatedAt ? 'Novo orçamento' : 'Editar orçamento'}</h1><p>ORC-{String(quote.number).padStart(4, '0')}</p></div><div className="editor-actions"><button className="button secondary" onClick={() => createQuotePdf(quote, 'preview')}><Eye size={17}/> Visualizar PDF</button><button className="button secondary" onClick={() => createQuotePdf(quote)}><Download size={17}/> Baixar PDF</button>{!readOnly && <button className="button primary" onClick={submit}><Save size={17}/> Salvar orçamento</button>}</div></div>
      {error && <div className="form-error">{error}</div>}
      <div className="editor-layout">
        <div className="form-stack">
          <section className="form-card"><div className="form-card-head"><span>01</span><div><h2>Cliente</h2><p>Dados para contato e identificação</p></div></div><div className="form-grid two"><label>Nome completo<input disabled={readOnly} list="clients-list" value={quote.client.name} onChange={(e) => chooseClient(e.target.value)} placeholder="Nome do cliente"/><datalist id="clients-list">{clients.map((c)=><option key={c.phone || c.name} value={c.name}/>)}</datalist></label><label>Telefone / WhatsApp<input disabled={readOnly} value={quote.client.phone} onChange={(e) => setField('client','phone',e.target.value)} placeholder="(00) 00000-0000"/></label></div></section>
          <section className="form-card"><div className="form-card-head"><span>02</span><div><h2>Veículo</h2><p>Informações do automóvel</p></div></div><div className="form-grid three"><label>Modelo<input disabled={readOnly} value={quote.vehicle.model} onChange={(e) => setField('vehicle','model',e.target.value)} placeholder="Ex.: Honda Civic"/></label><label>Placa<input disabled={readOnly} value={quote.vehicle.plate} onChange={(e) => setField('vehicle','plate',e.target.value.toUpperCase())} placeholder="ABC1D23" maxLength="8"/></label><label>Cor<input disabled={readOnly} value={quote.vehicle.color} onChange={(e) => setField('vehicle','color',e.target.value)} placeholder="Ex.: Preto"/></label></div></section>
          <section className="form-card"><div className="form-card-head"><span>03</span><div><h2>Orçamento</h2><p>Data, validade e situação</p></div></div><div className="form-grid three"><label>Número<input disabled value={`ORC-${String(quote.number).padStart(4,'0')}`}/></label><label>Data de emissão<input disabled={readOnly} type="date" value={quote.issueDate} onChange={(e) => setField(null,'issueDate',e.target.value)}/></label><label>Validade (opcional)<input disabled={readOnly} type="date" value={quote.validUntil} onChange={(e) => setField(null,'validUntil',e.target.value)}/></label><label>Status<select disabled={readOnly} value={quote.status} onChange={(e) => setField(null,'status',e.target.value)}><option>Rascunho</option><option>Enviado</option><option>Aprovado</option><option>Recusado</option></select></label></div></section>
          <section className="form-card"><div className="form-card-head service-head"><span>04</span><div><h2>Serviços</h2><p>Itens e valores do orçamento</p></div>{!readOnly && <button className="button secondary compact" onClick={addService}><Plus size={16}/> Adicionar serviço</button>}</div><div className="service-labels"><span>Descrição do serviço</span><span>Valor</span><span/></div>{quote.services.map((service,index)=><div className="service-row" key={service.id}><input disabled={readOnly} value={service.description} onChange={(e)=>updateService(service.id,'description',e.target.value)} placeholder={`Serviço ${index+1}`}/><MoneyInput disabled={readOnly} value={service.cents} onChange={(value)=>updateService(service.id,'cents',value)}/><button disabled={readOnly || quote.services.length === 1} onClick={()=>removeService(service.id)} aria-label="Remover serviço"><Trash2 size={18}/></button></div>)}<div className="services-total"><span>Total dos serviços</span><strong>{money(total)}</strong></div></section>
          <section className="form-card"><div className="form-card-head"><span>05</span><div><h2>Condições de pagamento</h2><p>Habilite as alternativas disponíveis</p></div></div><div className="payment-list">{[['pix','Pix'],['debit','Cartão de débito'],['credit','Cartão de crédito']].map(([key,label])=><div className={`payment-row ${quote.payments[key].enabled?'enabled':''}`} key={key}><label className="check"><input disabled={readOnly} type="checkbox" checked={quote.payments[key].enabled} onChange={(e)=>setPayment(key,'enabled',e.target.checked)}/><i/><span><b>{label}</b><small>Valor final</small></span></label><MoneyInput disabled={readOnly || !quote.payments[key].enabled} value={quote.payments[key].cents} onChange={(value)=>setPayment(key,'cents',value)}/>{key==='credit'&&<label className="installments">Parcelas<select disabled={readOnly || !quote.payments.credit.enabled} value={quote.payments.credit.installments} onChange={(e)=>setPayment('credit','installments',Number(e.target.value))}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}x</option>)}</select><small>{installmentText(quote.payments.credit.cents, quote.payments.credit.installments)}</small></label>}</div>)}</div></section>
          <section className="form-card"><div className="form-card-head"><span>06</span><div><h2>Observações</h2><p>Informações adicionais para o cliente</p></div></div><label>Observações opcionais<textarea disabled={readOnly} value={quote.notes} onChange={(e)=>setField(null,'notes',e.target.value)} placeholder="Prazo, recomendações ou outras condições..." rows="4"/></label></section>
        </div>
        <aside className="preview-column"><div className="preview-title"><span>Prévia do documento</span><small>Atualizada automaticamente</small></div><QuotePreview quote={quote}/><div className="preview-actions"><button className="button secondary" onClick={() => createQuotePdf(quote)}><Download size={17}/> Baixar PDF</button><button className="button whatsapp" onClick={whatsapp}><MessageCircle size={17}/> Abrir WhatsApp</button></div><p className="whatsapp-help">Baixe o PDF e anexe-o manualmente na conversa do WhatsApp.</p></aside>
      </div>
    </>
  );
}
