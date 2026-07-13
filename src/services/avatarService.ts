import { supabase } from '@/lib/supabase';

const BUCKET = 'avatars';
/** Formatos aceptados (JPG/JPEG comparten tipo MIME). */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
/** Tamaño máximo del archivo original antes de procesar. */
const MAX_SOURCE_BYTES = 5 * 1024 * 1024; // 5 MB
/** Lado del cuadrado final tras redimensionar. */
const OUTPUT_SIZE = 256;
/** Calidad WebP de salida. */
const OUTPUT_QUALITY = 0.85;

export class AvatarError extends Error {}

/** Carga un File en un HTMLImageElement (revoca el object URL al terminar). */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new AvatarError('No se pudo leer la imagen.'));
    };
    image.src = url;
  });
}

/**
 * Redimensiona a un cuadrado OUTPUT_SIZE (recorte centrado tipo "cover") y
 * comprime a WebP. Reduce mucho el peso y unifica el formato de salida.
 */
async function processImage(file: File): Promise<Blob> {
  const image = await loadImage(file);
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const sx = (image.naturalWidth - side) / 2;
  const sy = (image.naturalHeight - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new AvatarError('No se pudo procesar la imagen.');
  ctx.drawImage(image, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', OUTPUT_QUALITY),
  );
  if (!blob) throw new AvatarError('No se pudo comprimir la imagen.');
  return blob;
}

/** Borra todos los archivos de la carpeta del usuario salvo `keepPath`. */
async function cleanupFolder(userId: string, keepPath?: string): Promise<void> {
  const { data: files } = await supabase.storage.from(BUCKET).list(userId);
  if (!files || files.length === 0) return;
  const paths = files
    .map((file) => `${userId}/${file.name}`)
    .filter((path) => path !== keepPath);
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }
}

/**
 * Sube (o sustituye) la foto de perfil del usuario y devuelve su URL pública.
 * Garantiza un único archivo por usuario: sube el nuevo y limpia los antiguos.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AvatarError('Formato no admitido. Usa JPG, PNG o WebP.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new AvatarError('La imagen es demasiado grande (máximo 5 MB).');
  }

  const blob = await processImage(file);
  const path = `${userId}/${crypto.randomUUID()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/webp', upsert: false });
  if (uploadError) throw new AvatarError(uploadError.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Elimina cualquier archivo anterior para no dejar huérfanos ni duplicados.
  await cleanupFolder(userId, path);
  return data.publicUrl;
}

/** Elimina la foto de perfil del almacenamiento (la referencia en BD la borra el llamante). */
export async function deleteAvatar(userId: string): Promise<void> {
  await cleanupFolder(userId);
}
