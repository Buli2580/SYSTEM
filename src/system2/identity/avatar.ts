import { Directory, File, Paths } from 'expo-file-system';
const directory = () => new Directory(Paths.document, 'system2-avatars');
export function persistAvatar(sourceUri: string): string {
  if (!/^(file|content):\/\//.test(sourceUri)) throw new Error('Nieprawidłowy lokalny obraz.');
  const dir = directory();
  dir.create({ idempotent: true, intermediates: true });
  const extension = sourceUri.match(/\.(jpg|jpeg|png|webp|heic)$/i)?.[0] ?? '.jpg';
  const file = new File(dir, `avatar-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
  new File(sourceUri).copy(file);
  if (!file.exists) throw new Error('Nie udało się zachować avatara.');
  return file.uri;
}
export function removeOwnedAvatar(uri?: string) {
  const dir = directory();
  // Never delete a gallery original or a file outside SYSTEM's own directory.
  const prefix = dir.uri.replace(/\/$/, '') + '/';
  if (!uri || !uri.startsWith(prefix) || uri.slice(prefix.length).includes('/')) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}
export function removeAllAvatars() {
  const dir = directory();
  if (dir.exists) dir.delete();
}
