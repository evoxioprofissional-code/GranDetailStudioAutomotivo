import { supabase } from './supabase';

export const photoBucket = 'service-photos';
const maxFileSize = 15 * 1024 * 1024;
const mimeByExtension = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};
const extensionByMime = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

export function checkPhoto(file) {
  const extension = file.name.split('.').at(-1)?.toLowerCase();
  const mime = file.type || mimeByExtension[extension];
  if (!extensionByMime[mime])
    throw new Error('Use fotos JPG, PNG, WebP ou HEIC.');
  if (file.size > maxFileSize) throw new Error('Cada foto pode ter até 15 MB.');
  return { mime, extension: extensionByMime[mime] };
}

export async function uploadOrderPhoto(userId, orderId, phase, file) {
  if (!supabase || !userId)
    throw new Error('Conecte o Supabase para guardar as fotos.');
  const { mime, extension } = checkPhoto(file);
  const id = crypto.randomUUID();
  const path = `${userId}/${orderId}/${phase}/${id}.${extension}`;
  const { error } = await supabase.storage
    .from(photoBucket)
    .upload(path, file, {
      contentType: mime,
      cacheControl: '3600',
      upsert: false,
    });
  if (error)
    throw new Error('Não foi possível enviar a foto. Tente novamente.');
  return {
    id,
    path,
    phase,
    name: file.name,
    uploadedAt: new Date().toISOString(),
  };
}

export async function signedPhotoUrls(photos) {
  if (!supabase || !photos.length) return {};
  const { data, error } = await supabase.storage
    .from(photoBucket)
    .createSignedUrls(
      photos.map((photo) => photo.path),
      60 * 60 * 6,
    );
  if (error) throw error;
  return Object.fromEntries(
    data.map((item, index) => [photos[index].path, item.signedUrl]),
  );
}

export async function removePhotoFiles(photos) {
  if (!supabase || !photos.length) return;
  const { error } = await supabase.storage
    .from(photoBucket)
    .remove(photos.map((photo) => photo.path));
  if (error) throw error;
}
