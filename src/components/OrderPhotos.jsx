import { Camera, ImagePlus, Maximize2, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  checkPhoto,
  removePhotoFiles,
  signedPhotoUrls,
  uploadOrderPhoto,
} from '../lib/orderPhotos';
import { supabase } from '../lib/supabase';

const phases = [
  { id: 'before', title: 'Antes', caption: 'Registre a condição na chegada.' },
  { id: 'after', title: 'Depois', caption: 'Mostre o resultado do serviço.' },
];

export default function OrderPhotos({ order, userId, onSave, onUpdated }) {
  const photos = order.photos || [];
  const pathKey = photos.map((photo) => photo.path).join('|');
  const [urls, setUrls] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [split, setSplit] = useState(50);

  useEffect(() => {
    let active = true;
    if (!photos.length) {
      setUrls({});
      return undefined;
    }
    signedPhotoUrls(photos).then(
      (signed) => {
        if (active) {
          setUrls(signed);
          setError('');
        }
      },
      () => {
        if (active)
          setError(
            'Não foi possível abrir as fotos agora. Tente recarregar a página.',
          );
      },
    );
    return () => {
      active = false;
    };
  }, [order.id, pathKey]);

  async function upload(phase, files) {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    const uploaded = [];
    try {
      selected.forEach(checkPhoto);
      setBusy(true);
      setError('');
      for (const file of selected)
        uploaded.push(await uploadOrderPhoto(userId, order.id, phase, file));
      const saved = await onSave('order', {
        ...order,
        photos: [...photos, ...uploaded],
      });
      if (!saved)
        throw new Error(
          'Não foi possível vincular as fotos à ordem. Tente novamente.',
        );
      onUpdated(saved);
    } catch (failure) {
      if (uploaded.length) await removePhotoFiles(uploaded).catch(() => {});
      setError(failure.message || 'Não foi possível enviar as fotos.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(photo) {
    if (!window.confirm('Excluir esta foto da ordem de serviço?')) return;
    setBusy(true);
    setError('');
    const saved = await onSave('order', {
      ...order,
      photos: photos.filter((item) => item.id !== photo.id),
    });
    if (!saved) {
      setError('Não foi possível excluir a foto. Tente novamente.');
      setBusy(false);
      return;
    }
    onUpdated(saved);
    if (preview?.id === photo.id) setPreview(null);
    try {
      await removePhotoFiles([photo]);
    } catch {
      setError('A foto saiu da ordem, mas o arquivo não pôde ser removido.');
    }
    setBusy(false);
  }

  const before = photos.filter((photo) => photo.phase === 'before').at(-1);
  const after = photos.filter((photo) => photo.phase === 'after').at(-1);

  return (
    <section
      id="order-photos"
      className="order-photos-panel panel"
      aria-label="Fotos de antes e depois"
    >
      <div className="order-photos-heading">
        <span className="order-photo-heading-icon">
          <Camera size={20} />
        </span>
        <div>
          <h2>Antes e depois</h2>
          <p>Fotos deste serviço ficam organizadas na ordem.</p>
        </div>
        <span className="order-photo-total">
          {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
        </span>
      </div>
      {!supabase && (
        <p className="order-photo-message">
          Conecte o Supabase para guardar fotos nesta ordem.
        </p>
      )}
      <div className="order-photo-columns">
        {phases.map((phase) => {
          const items = photos.filter((photo) => photo.phase === phase.id);
          return (
            <div className="order-photo-phase" key={phase.id}>
              <div className="order-photo-phase-head">
                <div>
                  <span>{phase.title.toUpperCase()}</span>
                  <h3>{phase.title}</h3>
                  <p>{phase.caption}</p>
                </div>
                <b>{items.length}</b>
              </div>
              <div className="order-photo-grid">
                {items.map((photo) => (
                  <div className="order-photo-item" key={photo.id}>
                    <button
                      type="button"
                      className="order-photo-open"
                      onClick={() => setPreview(photo)}
                      aria-label={`Abrir ${photo.name}`}
                    >
                      {urls[photo.path] ? (
                        <img
                          src={urls[photo.path]}
                          alt={`${phase.title}: ${photo.name}`}
                        />
                      ) : (
                        <span>Carregando foto…</span>
                      )}
                      <Maximize2 size={16} />
                    </button>
                    <div className="order-photo-item-foot">
                      <span title={photo.name}>{photo.name}</span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => remove(photo)}
                        aria-label={`Excluir ${photo.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
                {!items.length && (
                  <div className="order-photo-empty">
                    <ImagePlus size={27} />
                    <span>Nenhuma foto de {phase.title.toLowerCase()}</span>
                  </div>
                )}
              </div>
              <label
                className={`order-photo-upload ${busy || !supabase ? 'disabled' : ''}`}
              >
                <ImagePlus size={17} />{' '}
                {busy
                  ? 'Enviando…'
                  : `Adicionar fotos de ${phase.title.toLowerCase()}`}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  multiple
                  disabled={busy || !supabase}
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    event.target.value = '';
                    upload(phase.id, files);
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>
      <p className="order-photo-hint">
        JPG, PNG, WebP ou HEIC · até 15 MB por foto. As fotos são salvas ao
        enviar.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {before && after && urls[before.path] && urls[after.path] && (
        <div className="order-photo-compare">
          <div>
            <span>RESULTADO</span>
            <h3>Compare o antes e depois</h3>
          </div>
          <div className="order-photo-compare-frame">
            <img src={urls[after.path]} alt="Depois do serviço" />
            <img
              className="order-photo-compare-before"
              src={urls[before.path]}
              alt="Antes do serviço"
              style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
            />
            <span
              className="order-photo-compare-line"
              style={{ left: `${split}%` }}
            />
            <span className="order-photo-compare-tag before">ANTES</span>
            <span className="order-photo-compare-tag after">DEPOIS</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={split}
            onChange={(event) => setSplit(Number(event.target.value))}
            aria-label="Comparar antes e depois"
          />
        </div>
      )}
      {preview && (
        <div
          className="order-photo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={preview.name}
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            aria-label="Fechar foto"
            onClick={() => setPreview(null)}
          >
            <X size={22} />
          </button>
          {urls[preview.path] && (
            <img
              src={urls[preview.path]}
              alt={preview.name}
              onClick={(event) => event.stopPropagation()}
            />
          )}
          <span>
            {preview.phase === 'before' ? 'ANTES' : 'DEPOIS'} · {preview.name}
          </span>
        </div>
      )}
    </section>
  );
}
