/**
 * Backup and restore. Everything the app stores lives in this browser under
 * keys starting with "pulse." or "monk.", so a backup is every such key.
 * New features are covered automatically as long as they use those prefixes.
 */
const PREFIXES = ['pulse.', 'monk.'];
const APP_ID = 'dan-monk-2026-planner';
const LAST_BACKUP_KEY = 'monk.lastBackup';

const ownKeys = () => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && PREFIXES.some((p) => k.startsWith(p))) keys.push(k);
  }
  return keys.sort();
};

export function downloadBackup() {
  const data = {};
  ownKeys().forEach((k) => { data[k] = localStorage.getItem(k); });
  const now = new Date();
  const payload = { app: APP_ID, version: 1, exportedAt: now.toISOString(), data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dan-monk-planner-backup-${now.toLocaleDateString('en-CA')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  try { localStorage.setItem(LAST_BACKUP_KEY, now.toISOString()); } catch { /* ignore */ }
}

// Read + check a backup file. Resolves to { payload, entries } or rejects with a message.
export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        if (payload?.app !== APP_ID || typeof payload.data !== 'object') {
          reject(new Error("That file isn't a Dan Monk Planner backup."));
          return;
        }
        let entries = 0;
        try { entries = JSON.parse(payload.data['pulse.entries'] || '[]').length; } catch { /* ignore */ }
        resolve({ payload, entries });
      } catch {
        reject(new Error("That file isn't valid backup data."));
      }
    };
    reader.readAsText(file);
  });
}

// Replace everything with the backup, then reload so every screen re-reads it
export function restoreBackup(payload) {
  ownKeys().forEach((k) => localStorage.removeItem(k));
  Object.entries(payload.data).forEach(([k, v]) => {
    if (PREFIXES.some((p) => k.startsWith(p)) && typeof v === 'string') localStorage.setItem(k, v);
  });
  // Restored data is already clean; don't run the one-time sample cleanup on it
  localStorage.setItem('monk.sampleDataRemoved', '1');
  window.location.reload();
}

export function lastBackup() {
  try { return localStorage.getItem(LAST_BACKUP_KEY); } catch { return null; }
}
