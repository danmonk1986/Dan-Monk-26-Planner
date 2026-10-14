import React, { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import { downloadBackup, readBackupFile, restoreBackup, lastBackup } from '../lib/backup';

const heading = { fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em' };

function sinceText(iso) {
  if (!iso) return 'No backup yet';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'Last backup: today';
  return `Last backup: ${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * Backup: download all my data as a file, or restore from one.
 * Data lives only in this browser until there's a database.
 */
export default function BackupCard() {
  const fileRef = useRef(null);
  const [last, setLast] = useState(lastBackup);
  const [pending, setPending] = useState(null); // { payload, entries }
  const [error, setError] = useState('');

  const handleDownload = () => { downloadBackup(); setLast(lastBackup()); };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try { setPending(await readBackupFile(file)); } catch (err) { setError(err.message); }
  };

  const stale = !last || Date.now() - new Date(last).getTime() > 7 * 86400000;

  return (
    <Card id="backup-card" sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography sx={{ ...heading, fontSize: '0.85rem', fontWeight: 700 }}>Backup</Typography>
            <Typography variant="body2" sx={{ color: stale ? 'primary.main' : 'text.secondary' }} id="backup-last">
              {sinceText(last)}{stale ? ' · your data lives only in this browser' : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload} id="backup-download">
              Download backup
            </Button>
            <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => fileRef.current?.click()} id="backup-restore">
              Restore
            </Button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={handleFile} id="backup-file" />
          </Box>
        </Box>
        {error && <Typography variant="body2" sx={{ color: '#FBBF24', mt: 1.5 }} id="backup-error">{error}</Typography>}
      </CardContent>

      {/* Restore replaces everything, so confirm first */}
      <Dialog open={!!pending} onClose={() => setPending(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem' }}>Restore this backup?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            From {pending ? new Date(pending.payload.exportedAt).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
            {' '}· {pending?.entries ?? 0} log entries.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This replaces everything currently in the app on this device: logs, Non-Negotiables, quotes and settings. Download a backup of the current data first if you might want it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => restoreBackup(pending.payload)} id="backup-confirm-restore">Replace and restore</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
