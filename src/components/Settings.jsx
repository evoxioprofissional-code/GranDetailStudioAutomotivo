import { LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Settings({ email, onSignOut }) {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function updatePassword(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error)
      return setMessage('Não foi possível atualizar a senha. Tente novamente.');
    setPassword('');
    setMessage('Senha atualizada com sucesso.');
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Configurações</h1>
          <p>Gerencie o acesso à sua conta.</p>
        </div>
      </div>
      <div className="operations-layout">
        <section className="panel operations-form">
          <div className="operations-form-head">
            <h2>
              <SettingsIcon size={20} /> Conta
            </h2>
          </div>
          <p>
            Conectado como <strong>{email || 'Usuário local'}</strong>
          </p>
          {supabase && (
            <form onSubmit={updatePassword}>
              <label>
                Nova senha
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength="8"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                />
              </label>
              <button className="button primary" disabled={busy}>
                {busy ? 'Salvando…' : 'Alterar senha'}
              </button>
            </form>
          )}
          {message && <p role="status">{message}</p>}
          {onSignOut && (
            <button className="button secondary" onClick={onSignOut}>
              <LogOut size={17} /> Sair da conta
            </button>
          )}
        </section>
      </div>
    </>
  );
}
