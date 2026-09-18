import { Directory, File, Paths } from 'expo-file-system';
const directory = () => new Directory(Paths.document, 'system2-avatars');
export async function persistAvatar(sourceUri: string): Promise<string> {
  let destination: File | undefined;
  let stage = 'validate';
  try {
    if (!/^(file|content):\/\//.test(sourceUri)) throw new Error('Nieprawidłowy lokalny obraz.');
    stage = 'create-directory';
    const dir = directory();
    dir.create({ idempotent: true, intermediates: true });
    const extension = sourceUri.match(/\.(jpg|jpeg|png|webp|heic)$/i)?.[0] ?? '.jpg';
    destination = new File(dir, `avatar-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
    stage = 'copy';
    // SDK 57 File.copy returns Promise<void>, including on Android.
    // Check and persist the document URI only AFTER native copying finishes.
    await new File(sourceUri).copy(destination);
    stage = 'verify-copy';
    if (!destination.exists) throw new Error('Kopiowanie zakończyło się bez pliku docelowego.');
    return destination.uri;
  } catch (cause) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.error('[SYSTEM avatar] Persistence failed', { stage }, cause);
    // This is a fresh destination, not yet saved to SQLite. Never delete the source.
    if (destination) {
      try { removeOwnedAvatar(destination.uri); }
      catch (cleanupCause) { if (typeof __DEV__ !== 'undefined' && __DEV__) console.error('[SYSTEM avatar] Partial-copy cleanup failed', cleanupCause); }
    }
    throw new Error('Nie udało się zachować avatara.', { cause });
  }
}
export function isOwnedAvatar(uri: string | undefined, directoryUri: string): uri is string {
  if (!uri) return false;
  const prefix = directoryUri.replace(/\/$/, '') + '/';
  if (!uri.startsWith(prefix)) return false;
  // Own generated filenames only: reject traversal, encoded separators and subfolders.
  return /^avatar-[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp|heic)$/i.test(uri.slice(prefix.length));
}
export function removeOwnedAvatar(uri?: string) {
  const dir = directory();
  // Never delete a gallery original or a file outside SYSTEM's own directory.
  if (!isOwnedAvatar(uri, dir.uri)) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}
export function removeAllAvatars() {
  const dir = directory();
  if (dir.exists) dir.delete();
}
