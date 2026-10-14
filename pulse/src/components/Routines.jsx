import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import { tokens } from '../theme';
import useMode from '../hooks/useMode';
import { formatClock, shiftClock } from '../lib/shiftTime';
import { loadRoutines, saveRoutines, newId, NAME_SUGGESTIONS, PLACES } from '../data/routines';

const heading = { fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em' };
const toggleSx = { '& .MuiToggleButton-root': { fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.75rem', letterSpacing: '0.08em', px: 1.75, '&.Mui-selected': { backgroundColor: tokens.accentDim15, color: tokens.violetBright } } };

const EMPTY = { kind: 'routine', name: '', place: 'both', start: '', end: '', description: '' };

/**
 * DM26 PLANNER: routines (with times) and rituals (no times), as small
 * rounded tiles. Tap a tile to expand it: description, steps, and + to add.
 */
export default function Routines() {
  const { mode } = useMode();
  const [list, setList] = useState(loadRoutines);
  const [kind, setKind] = useState('routine');
  const [placeFilter, setPlaceFilter] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState(null); // create/edit dialog state
  const [stepDraft, setStepDraft] = useState({ label: '', time: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const update = (next) => { setList(next); saveRoutines(next); };
  const openRoutine = list.find((r) => r.id === openId) || null;

  // MWD times flip on nights when I'm at MWD; everything else shows as entered
  const clock = (hhmm, place) => {
    if (!hhmm) return '';
    return place === 'mwd' && mode.place === 'mwd' ? shiftClock(hhmm, mode) : formatClock(hhmm);
  };

  const shown = useMemo(() => list.filter((r) => r.kind === kind
    && (placeFilter === 'all' || r.place === placeFilter || r.place === 'both')), [list, kind, placeFilter]);

  // ── create / edit ──
  const openNew = () => setForm({ ...EMPTY, kind });
  const openEdit = (r) => setForm({ ...r });
  const saveForm = () => {
    const name = form.name.trim();
    if (!name) return;
    const clean = {
      ...form,
      name,
      description: form.description.trim(),
      start: form.kind === 'routine' ? form.start : '',
      end: form.kind === 'routine' ? form.end : '',
    };
    if (form.id) {
      update(list.map((r) => (r.id === form.id ? { ...r, ...clean } : r)));
    } else {
      const created = { ...clean, id: newId('routine'), steps: [] };
      update([...list, created]);
      setKind(created.kind);
      setOpenId(created.id);
    }
    setForm(null);
  };
  const doDelete = () => {
    update(list.filter((r) => r.id !== confirmDelete.id));
    if (openId === confirmDelete.id) setOpenId(null);
    setConfirmDelete(null);
  };

  // ── steps ──
  const addStep = (r) => {
    const label = stepDraft.label.trim();
    if (!label) return;
    const step = { id: newId('step'), label, ...(r.kind === 'routine' && stepDraft.time ? { time: stepDraft.time } : {}) };
    update(list.map((x) => (x.id === r.id ? { ...x, steps: [...(x.steps || []), step] } : x)));
    setStepDraft({ label: '', time: '' });
  };
  const removeStep = (r, stepId) =>
    update(list.map((x) => (x.id === r.id ? { ...x, steps: x.steps.filter((s) => s.id !== stepId) } : x)));

  const sortedSteps = (r) => {
    const steps = [...(r.steps || [])];
    if (r.kind !== 'routine') return steps;
    return steps.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontSize: '1.2rem', mb: 0.5 }}>DM26 Planner</Typography>
        <Typography variant="body2" color="text.secondary">Make a plan. Stick to it.</Typography>
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <ToggleButtonGroup value={kind} exclusive onChange={(_, v) => { if (v) { setKind(v); setOpenId(null); } }} size="small" aria-label="Routines or rituals" id="routines-kind" sx={toggleSx}>
            <ToggleButton value="routine" id="routines-kind-routine" onClick={() => setOpenId(null)}>Routines</ToggleButton>
            <ToggleButton value="ritual" id="routines-kind-ritual" onClick={() => setOpenId(null)}>Rituals</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup value={placeFilter} exclusive onChange={(_, v) => v && setPlaceFilter(v)} size="small" aria-label="Filter by HQ or MWD" id="routines-place" sx={toggleSx}>
            <ToggleButton value="all" id="routines-place-all">All</ToggleButton>
            <ToggleButton value="hq" id="routines-place-hq">HQ</ToggleButton>
            <ToggleButton value="mwd" id="routines-place-mwd">MWD</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew} id="routines-new">
          New {kind === 'routine' ? 'routine' : 'ritual'}
        </Button>
      </Box>

      {/* One routine open: its own view, × to get back out */}
      {openRoutine ? (() => {
        const r = openRoutine;
        return (
          <Box
            id={`routine-${r.id}`}
            sx={{
              borderRadius: '10px',
              border: '2px solid',
              borderColor: 'primary.light',
              backgroundColor: 'rgba(20,20,28,0.82)',
              backdropFilter: 'blur(6px)',
              boxShadow: `0 0 24px rgba(${tokens.accentBrightRGB},0.15)`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25 }}>
              <Typography sx={{ ...heading, fontSize: '0.9rem', fontWeight: 700, color: 'primary.light', flex: 1 }}>
                {r.name}
              </Typography>
              <IconButton onClick={() => setOpenId(null)} aria-label="Close" id="routine-close" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ px: 2, pb: 2, borderTop: `1px solid ${tokens.borderViolet}`, pt: 1.5 }}>
              {r.description && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, whiteSpace: 'pre-line' }}>{r.description}</Typography>
              )}

              {sortedSteps(r).map((s) => (
                <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5, borderTop: `1px solid ${tokens.accentDim12}` }}>
                  {r.kind === 'routine' && (
                    <Typography sx={{ fontSize: '0.75rem', color: 'primary.light', minWidth: 64, fontFamily: '"Space Grotesk", sans-serif' }}>
                      {s.time ? clock(s.time, r.place) : ''}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: '0.875rem', flex: 1 }}>{s.label}</Typography>
                  <IconButton size="small" onClick={() => removeStep(r, s.id)} aria-label={`Remove ${s.label}`} sx={{ color: 'text.secondary' }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))}

              {/* + add a step */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                {r.kind === 'routine' && (
                  <TextField
                    type="time"
                    size="small"
                    variant="standard"
                    value={stepDraft.time}
                    onChange={(e) => setStepDraft({ ...stepDraft, time: e.target.value })}
                    inputProps={{ 'aria-label': 'Step time' }}
                    sx={{ width: 110 }}
                  />
                )}
                <TextField
                  size="small"
                  variant="standard"
                  placeholder="Add a step"
                  value={stepDraft.label}
                  onChange={(e) => setStepDraft({ ...stepDraft, label: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') addStep(r); }}
                  fullWidth
                  inputProps={{ 'aria-label': 'Step name' }}
                />
                <IconButton onClick={() => addStep(r)} aria-label="Add step" id={`routine-add-step-${r.id}`}
                  sx={{ color: 'primary.light', border: `1px solid ${tokens.borderViolet}`, width: 32, height: 32 }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                <Button size="small" startIcon={<DeleteOutlineIcon />} onClick={() => setConfirmDelete(r)} sx={{ color: 'text.secondary' }}>Delete</Button>
                <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEdit(r)}>Edit</Button>
              </Box>
            </Box>
          </Box>
        );
      })() : shown.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 4, textAlign: 'center' }}>
          No {kind === 'routine' ? 'routines' : 'rituals'} here yet. Tap New to make one.
        </Typography>
      ) : (
        /* The list: each one is a button the same size as + New routine */
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }} id="routines-list">
          {shown.map((r) => (
            <Button
              key={r.id}
              variant="outlined"
              onClick={() => setOpenId(r.id)}
              id={`routine-tile-${r.id}`}
              sx={{
                border: '2px solid',
                borderColor: 'primary.light',
                color: 'primary.light',
                '&:hover': { border: '2px solid', borderColor: 'primary.light', backgroundColor: tokens.accentDim12 },
              }}
            >
              {r.name}
            </Button>
          ))}
        </Box>
      )}

      {/* Create / edit */}
      <Dialog open={!!form} onClose={() => setForm(null)} fullWidth maxWidth="xs">
        {form && (
          <>
            <DialogTitle sx={{ fontSize: '1rem' }}>{form.id ? 'Edit' : 'New'} {form.kind}</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
              <ToggleButtonGroup value={form.kind} exclusive onChange={(_, v) => v && setForm({ ...form, kind: v })} size="small" fullWidth aria-label="Routine or ritual" sx={toggleSx}>
                <ToggleButton value="routine">Routine · has times</ToggleButton>
                <ToggleButton value="ritual">Ritual · no times</ToggleButton>
              </ToggleButtonGroup>

              <Box>
                <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth autoFocus id="routine-name" />
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
                  {NAME_SUGGESTIONS.map((n) => (
                    <Chip key={n} label={n} size="small" variant="outlined" onClick={() => setForm({ ...form, name: n })} sx={{ fontSize: '0.7rem', borderColor: tokens.borderViolet }} />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>Assign to</Typography>
                <ToggleButtonGroup value={form.place} exclusive onChange={(_, v) => v && setForm({ ...form, place: v })} size="small" fullWidth aria-label="Assign to HQ, MWD or both" sx={toggleSx}>
                  {PLACES.map((p) => <ToggleButton key={p.key} value={p.key}>{p.label}</ToggleButton>)}
                </ToggleButtonGroup>
              </Box>

              {form.kind === 'routine' && (
                <Box>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField label="Start" type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} id="routine-start" />
                    <TextField label="End" type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} id="routine-end" />
                  </Box>
                  {form.place === 'mwd' && (
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.75 }}>
                      Enter the day-shift times. On nights they flip automatically.
                    </Typography>
                  )}
                </Box>
              )}

              <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline minRows={2} fullWidth id="routine-description" />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setForm(null)}>Cancel</Button>
              <Button variant="contained" onClick={saveForm} disabled={!form.name.trim()} id="routine-save">Save</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem' }}>Delete {confirmDelete?.name}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">This removes it and all of its steps.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="contained" onClick={doDelete} id="routine-confirm-delete">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
