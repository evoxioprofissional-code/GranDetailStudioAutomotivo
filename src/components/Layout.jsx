import {
  Bell, CalendarDays, Car, ChevronDown, CircleDollarSign, ClipboardList,
  FileText, Home, Menu, MessageSquare, Search, Settings, Users, Wrench, X,
} from 'lucide-react';
import { useState } from 'react';

const primary = [
  ['dashboard', 'Visão geral', Home], ['agenda', 'Agenda', CalendarDays], ['clients', 'Clientes', Users],
  ['vehicles', 'Veículos', Car], ['quotes', 'Orçamentos', FileText], ['orders', 'Ordens de serviço', Wrench],
  ['finance', 'Financeiro', CircleDollarSign],
];

export default function Layout({ page, onNavigate, children, query, onQuery, quoteCount = 0 }) {
  const [open, setOpen] = useState(false);
  const go = (target) => { onNavigate(target); setOpen(false); };
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={22} /></button>
        <div className="brand"><img src="/logo-gran-detail.jfif" alt="Gran Detail Studio Automotivo" /></div>
        <nav>
          <div className="nav-title">Gestão do studio</div>
          {primary.map(([id, label, Icon]) => (
            <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => go(id)}>
              <Icon size={20} strokeWidth={1.8} /><span>{label}</span>
              {id === 'quotes' && quoteCount > 0 && <b className="nav-count">{quoteCount}</b>}
            </button>
          ))}
          <div className="nav-divider" />
          <div className="nav-title">Relacionamento</div>
          <button className="nav-item" onClick={() => go('returns')}><Users size={20} strokeWidth={1.8} /><span>Retorno de clientes</span><b className="nav-count">3</b></button>
          <button className="nav-item" onClick={() => go('messages')}><MessageSquare size={20} strokeWidth={1.8} /><span>Mensagens</span></button>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => go('settings')}><Settings size={20} /><span>Configurações</span></button>
          <div className="user-card"><span className="avatar">GD</span><span><b>Administrador</b><small>Gran Detail</small></span><ChevronDown size={17} /></div>
        </div>
      </aside>
      {open && <button className="sidebar-backdrop" onClick={() => setOpen(false)} aria-label="Fechar menu" />}
      <main className="main-column">
        <header className="topbar">
          <button className="menu-button" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu size={22} /></button>
          <div className="breadcrumb">Studio <span>/</span> <b>{page === 'dashboard' ? 'Visão geral' : page === 'quotes' ? 'Orçamentos' : page === 'clients' ? 'Clientes' : 'Gestão'}</b></div>
          <label className="global-search"><Search size={18} /><input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Buscar cliente, placa ou orçamento" /></label>
          <button className="icon-button" aria-label="Notificações"><Bell size={20} /><i /></button>
          <span className="top-avatar">GD</span>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
