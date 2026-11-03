import { useEffect, useState } from 'react';
import App from './App';
import { loadQuotes, supabase } from './lib/supabase';

export default function Workspace() {
  const [session, setSession] = useState(undefined);
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
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

  if (!supabase) return <App />;
  if (userId && workspace?.userId === userId) {
    return <App key={userId} initialData={workspace.data} onSignOut={async () => {
      const { error: failure } = await supabase.auth.signOut();
      if (failure) return false;
      setWorkspace(null);
      return true;
    }} />;
  }
  return <main className="placeholder">
    <h1>Gran Detail</h1>
    {session === null && <form className="form-card" onSubmit={signIn}>
      <div className="form-grid">
        <label>E-mail<input name="email" type="email" autoComplete="username" required /></label>
        <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
        <button className="button primary" disabled={busy}>Entrar</button>
      </div>
    </form>}
    {error && <p role="alert">{error}</p>}
    {session !== null && !error && <p>Carregando…</p>}
    {userId && error && <button className="button primary" onClick={() => {
      setError('');
      setAttempt(attempt + 1);
    }}>Tentar novamente</button>}
  </main>;
}
