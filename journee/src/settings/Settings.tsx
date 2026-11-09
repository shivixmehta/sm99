import { useRef, useState, type ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { setSetting, useSetting, type ThemePref } from '../db/settings';
import { exportBackup, parseBackup, restoreBackup, type Backup } from './backup';

const TABLE_LABELS: Record<string, string> = {
  profile: 'Profile',
  memories: 'Memories',
  activityLog: 'Activity log',
  habits: 'Habits',
  habitChecks: 'Habit check-ins',
  journal: 'Journal entries',
  flashcards: 'Flashcards',
  chats: 'Chat messages',
  customSections: 'Your Sections',
  savedCards: 'Saved cards',
  settings: 'Settings',
};

export function Settings() {
  const theme = useSetting('theme');
  const memoryPaused = useSetting('memoryPaused');
  const savedPasscode = useSetting('passcode');
  const memoryCount = useLiveQuery(() => db.memories.count(), [], 0);

  const [passcode, setPasscode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [pcStatus, setPcStatus] = useState<string>('');
  const [pending, setPending] = useState<{ backup: Backup; counts: Record<string, number> } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function onExport() {
    setStatus('');
    try {
      const how = await exportBackup();
      setStatus(how === 'shared' ? 'Backup ready to save.' : 'Backup downloaded.');
    } catch (e) {
      if ((e as DOMException).name !== 'AbortError') setStatus('Export failed: ' + (e as Error).message);
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const parsed = parseBackup(await file.text());
    if (!parsed.ok) {
      setPending(null);
      setStatus(parsed.error);
      return;
    }
    setStatus('');
    setPending({ backup: parsed.backup, counts: parsed.counts });
  }

  async function onConfirmImport() {
    if (!pending) return;
    try {
      await restoreBackup(pending.backup);
      setStatus('Backup restored.');
    } catch (e) {
      setStatus('Restore failed; nothing was changed. ' + (e as Error).message);
    }
    setPending(null);
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Settings</h1>
      </header>

      <section className="card">
        <h2>Appearance</h2>
        <div className="segmented" role="radiogroup" aria-label="Theme">
          {(['system', 'light', 'dark'] as ThemePref[]).map((t) => (
            <button key={t} role="radio" aria-checked={theme === t} className={theme === t ? 'on' : ''}
              onClick={() => setSetting('theme', t)}>
              {t === 'system' ? 'Auto' : t === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Your data</h2>
        <p className="muted small">
          Everything lives on this device. A backup is one JSON file you can keep anywhere. Your passcode is never
          included.
        </p>
        <div className="row">
          <button className="btn" onClick={onExport}>Export backup</button>
          <button className="btn btn--ghost" onClick={() => fileInput.current?.click()}>Import backup…</button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onFile} />
        </div>

        {pending && (
          <div className="confirm" role="alertdialog" aria-label="Confirm import">
            <p><strong>Replace everything on this device with this backup?</strong></p>
            <p className="muted small">From {new Date(pending.backup.exportedAt).toLocaleString()}</p>
            <ul className="counts">
              {Object.entries(pending.counts).map(([k, n]) => (
                <li key={k}><span>{TABLE_LABELS[k] ?? k}</span><span>{n}</span></li>
              ))}
            </ul>
            <div className="row">
              <button className="btn btn--danger" onClick={onConfirmImport}>Replace my data</button>
              <button className="btn btn--ghost" onClick={() => setPending(null)}>Cancel</button>
            </div>
          </div>
        )}
        {status && <p className="status" role="status">{status}</p>}
      </section>

      <section className="card">
        <h2>Memory</h2>
        <p className="muted small">
          {memoryCount} {memoryCount === 1 ? 'memory' : 'memories'} stored. The full “What you know about me”
          screen arrives with the memory system.
        </p>
        <label className="toggle">
          <input type="checkbox" checked={memoryPaused} onChange={(e) => setSetting('memoryPaused', e.target.checked)} />
          <span>Pause memory (don’t save anything new)</span>
        </label>
      </section>

      <section className="card">
        <h2>AI passcode</h2>
        <p className="muted small">
          Unlocks your private AI function so nobody else can use your credits. Stored only on this device.
        </p>
        <div className="row">
          <input className="input" type="password" autoComplete="off" placeholder={savedPasscode ? '••••••' : 'Passcode'}
            value={passcode ?? ''} onChange={(e) => setPasscode(e.target.value)} />
          <button className="btn" disabled={passcode === null}
            onClick={async () => { await setSetting('passcode', passcode ?? ''); setPasscode(null); setPcStatus('Passcode saved.'); }}>
            Save
          </button>
        </div>
        <p className="muted small" role="status">{pcStatus || (savedPasscode ? 'A passcode is saved.' : 'No passcode saved yet.')}</p>
      </section>

      <p className="muted small center">Journée · v0.1 · Phase 1</p>
    </div>
  );
}
