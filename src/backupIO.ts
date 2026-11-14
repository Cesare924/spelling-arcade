// Moving backup files in and out of the phone.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { today } from './logic/state.ts';

/** Writes the backup to a file and opens the phone's share sheet (save to Files/Drive, email, etc.). */
export async function shareBackupFile(text: string): Promise<boolean> {
  const file = new File(Paths.cache, `spelling-arcade-backup-${today()}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(text);
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save Spelling Arcade backup', UTI: 'public.json' });
  return true;
}
export async function copyBackup(text: string) { await Clipboard.setStringAsync(text); }
export async function pasteText(): Promise<string> { return (await Clipboard.getStringAsync()) || ''; }

/** Lets the grown-up pick a backup file. Returns its text, or null if cancelled. */
export async function pickBackupFile(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true, multiple: false });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  if (a.size && a.size > 5e6) throw new Error('too big');
  return await new File(a.uri).text();
}
