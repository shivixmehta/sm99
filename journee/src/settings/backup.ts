import { db, TABLE_NAMES } from '../db/schema';
import { BACKUP_FORMAT } from '../config';
import { dayKey } from '../lib/time';

/** Settings keys that never leave the device in a backup file. */
const PRIVATE_SETTING_KEYS = new Set(['passcode']);

export interface Backup {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  tables: Record<string, unknown[]>;
}

export async function createBackup(): Promise<Backup> {
  const tables: Record<string, unknown[]> = {};
  await db.transaction('r', db.tables, async () => {
    for (const t of db.tables) {
      let rows = await t.toArray();
      if (t.name === 'settings') rows = rows.filter((r) => !PRIVATE_SETTING_KEYS.has((r as { key: string }).key));
      tables[t.name] = rows;
    }
  });
  return { format: BACKUP_FORMAT, schemaVersion: db.verno, exportedAt: new Date().toISOString(), tables };
}

export function backupFileName(): string {
  return `journee-backup-${dayKey()}.json`;
}

/** Saves the backup: share sheet on phones that support it, otherwise a normal download. */
export async function exportBackup(): Promise<'shared' | 'downloaded'> {
  const backup = await createBackup();
  const json = JSON.stringify(backup, null, 2);
  const name = backupFileName();
  const file = new File([json], name, { type: 'application/json' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') throw e; // user closed the sheet
      // otherwise fall through to download
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}

export type ParsedBackup = { ok: true; backup: Backup; counts: Record<string, number> } | { ok: false; error: string };

/** Validates a backup file's contents without touching the database. */
export function parseBackup(text: string): ParsedBackup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file isn’t valid JSON.' };
  }
  const b = data as Partial<Backup>;
  if (!b || b.format !== BACKUP_FORMAT) return { ok: false, error: 'This doesn’t look like a Journée backup.' };
  if (typeof b.schemaVersion !== 'number' || b.schemaVersion > db.verno) {
    return { ok: false, error: 'This backup comes from a newer version of Journée. Update the app first.' };
  }
  if (!b.tables || typeof b.tables !== 'object') return { ok: false, error: 'The backup has no data.' };

  const counts: Record<string, number> = {};
  for (const [name, rows] of Object.entries(b.tables)) {
    if (!TABLE_NAMES.includes(name)) return { ok: false, error: `Unknown table “${name}” in backup.` };
    if (!Array.isArray(rows) || !rows.every((r) => r && typeof r === 'object')) {
      return { ok: false, error: `Table “${name}” is malformed.` };
    }
    counts[name] = rows.length;
  }
  return { ok: true, backup: b as Backup, counts };
}

/** Replaces all data with the backup's contents, in one transaction (all or nothing). Keeps the device passcode. */
export async function restoreBackup(backup: Backup): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    const kept = await db.settings.bulkGet([...PRIVATE_SETTING_KEYS]);
    for (const t of db.tables) {
      await t.clear();
      const rows = backup.tables[t.name];
      if (rows?.length) await t.bulkPut(rows as never[]);
    }
    for (const row of kept) if (row) await db.settings.put(row);
  });
}
