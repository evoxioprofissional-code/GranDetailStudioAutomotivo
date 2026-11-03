import { useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import App from './App';
import { loadQuotes, supabase } from './lib/supabase';

function AuthScreen({ title, description, children, error }) {
  return <main className="auth-shell">
    <section className="auth-brand" aria-label="Gran Detail Studio Automotivo">
      <div className="auth-brand-top"><span className="auth-mark">GD</span><span>STUDIO AUTOMOTIVO</span></div>
      <div className="auth-brand-center">
        <div className="auth-logo-frame"><img src="/logo-gran-detail.png" alt="Gran Detail" /></div>
        <span className="auth-brand-line" />
        <p>Gestão do studio em um só lugar.</p>
      </div>
      <span className="auth-brand-foot">GRAN DETAIL · ÁREA INTERNA</span>
    </section>
    <section className="auth-content">
      <div className="auth-content-inner">
        <div className="auth-eyebrow"><LockKeyhole size={15} strokeWidth={1.8} /> ACESSO À EQUIPE</div>
        <h1>{title}</h1>
        <p className="auth-description">{description}</p>
        {children}
        {error && <p className="auth-error" role="alert">{error}</p>}
      </div>
      <p className="auth-content-foot">Gran Detail Studio Automotivo</p>
    </section>
  </main>;
}

export default function Workspace() {
  const [session, setSession] = useState(undefined);
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [needsPassword, setNeedsPassword] = useState(() => /(?:^|[&#])type=(?:invite|recovery)(?:&|$)/.test(window.location.hash));
  const userId = session?.user.id;

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, current) => setSession(current));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    loadQuotes().then(
      (data) => { if (active) setWorkspace({ userId, data }); },
      () => { if (active) setError('Não foi possível carregar os orçamentos do Supabase.'); },
    );
    return () => { active = false; };
  }, [userId, attempt]);

  async function signIn(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const { error: failure } = await supabase.auth.signInWithPassword({
        email: fields.get('email'),
        password: fields.get('password'),
      });
      if (failure) throw failure;
    } catch {
      setError('Não foi possível entrar. Confira seu e-mail e sua senha.');
    } finally {
      setBusy(false);
    }
  }

  async function setPassword(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const password = new FormData(event.currentTarget).get('password');
    const { error: failure } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (failure) return setError('Não foi possível definir a senha. Tente outra senha.');
    setNeedsPassword(false);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  if (!supabase) return <App />;
  if (userId && needsPassword) return <AuthScreen title="Defina sua senha" description="Crie uma senha para acessar seu espaço de trabalho." error={error}>
    <form className="auth-form" onSubmit={setPassword}>
      <label htmlFor="new-password">Nova senha</label>
      <input id="new-password" name="password" type="password" autoComplete="new-password" minLength="8" placeholder="Mínimo de 8 caracteres" required />
      <button className="auth-submit" disabled={busy}>Salvar senha <ArrowRight size={19} /></button>
    </form>
  </AuthScreen>;
  if (userId && workspace?.userId === userId) {
    return <App key={userId} initialData={workspace.data} onSignOut={async () => {
      const { error: failure } = await supabase.auth.signOut();
      if (failure) return false;
      setWorkspace(null);
      return true;
    }} />;
  }
  return <AuthScreen title={session === null ? 'Bem-vindo de volta.' : 'Preparando seu espaço.'} description={session === null ? 'Entre com suas credenciais para continuar.' : 'Carregando seus orçamentos e informações.'} error={error}>
    {session === null && <form className="auth-form" onSubmit={signIn}>
      <label htmlFor="auth-email">E-mail</label>
      <input id="auth-email" name="email" type="email" autoComplete="username" placeholder="seuemail@exemplo.com" required />
      <label htmlFor="auth-password">Senha</label>
      <input id="auth-password" name="password" type="password" autoComplete="current-password" placeholder="Digite sua senha" required />
      <button className="auth-submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar no studio'} <ArrowRight size={19} /></button>
    </form>}
    {session !== null && !error && <div className="auth-loading" role="status"><span /> Carregando…</div>}
    {userId && error && <button className="auth-submit" onClick={() => {
      setError('');
      setAttempt(attempt + 1);
    }}>Tentar novamente</button>}
  </AuthScreen>;
}
