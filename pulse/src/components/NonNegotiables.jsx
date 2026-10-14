import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { tokens } from '../theme';
import useMode from '../hooks/useMode';
import { shiftClock, dayAnchors } from '../lib/shiftTime';
import {
  SECTIONS, DEFAULT_ITEMS, loadItems, saveItems, loadTicks, saveTicks,
  routineDayKey, currentSection, itemsForDay, weeklyCount, titleCase,
  AUTO_RULES, totalsByDay, isItemDone,
} from '../data/nonNegotiables';

const heading = { fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em' };

/**
 * NON-NEGOTIABLES: the daily baseline, grouped by check-in.
 * Tap to tick. Ticks are saved per routine day. "Done, not on time."
 */
export default function NonNegotiables({ entries = [] }) {
  const { mode } = useMode();

  // Re-evaluate the day and the current section every minute
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const day = routineDayKey(mode, now);
  const active = currentSection(mode, now);
  const anchors = dayAnchors(mode);

  const [items, setItems] = useState(loadItems);
  const [ticks, setTicks] = useState(loadTicks);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState({}); // new-item text per section

  const todays = useMemo(() => itemsForDay(items, day), [items, day]);
  const dayTicks = ticks[day] || {};
  // Log entries that count toward auto-ticking items
  const totals = useMemo(() => totalsByDay(entries, mode), [entries, mode]);
  const isDone = (id) => isItemDone(id, day, ticks, totals);
  const done = todays.filter((i) => isDone(i.id)).length;

  const updateItems = (next) => { setItems(next); saveItems(next); };

  const toggle = (id) => {
    const nextDay = { ...dayTicks, [id]: !dayTicks[id] };
    const next = { ...ticks, [day]: nextDay };
    setTicks(next);
    saveTicks(next);
  };

  const rename = (id, label) => updateItems(items.map((i) => (i.id === id ? { ...i, label } : i)));
  // Remove from today onward; past days keep their ticks
  const remove = (id) => updateItems(items.map((i) => (i.id === id ? { ...i, removedOn: day } : i)));
  const add = (section) => {
    const label = (drafts[section] || '').trim();
    if (!label) return;
    updateItems([...items, { id: `custom-${Date.now()}`, label, section, addedOn: day }]);
    setDrafts({ ...drafts, [section]: '' });
  };
  const resetDefaults = () => {
    // Retire current items from today, bring the defaults back from today
    const retired = items.map((i) => (i.removedOn ? i : { ...i, removedOn: day }));
    const kept = retired.filter((i) => !DEFAULT_ITEMS.some((d) => d.id === i.id));
    updateItems([...kept, ...DEFAULT_ITEMS.map((d) => ({ ...d }))]);
  };

  const timeFor = (item) => {
    if (item.anchor) return anchors[item.anchor];
    if (item.time) return shiftClock(item.time, mode);
    return null;
  };

  return (
    <Card id="non-negotiables" sx={{ mb: 3 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontSize: '0.95rem' }}>Non-Negotiables</Typography>
            <Typography sx={{ ...heading, fontSize: '0.8rem', color: 'primary.light', fontWeight: 600 }} id="nn-total">
              {done}/{todays.length} today
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {editing && (
              <Button size="small" startIcon={<RestartAltIcon />} onClick={resetDefaults} id="nn-reset" sx={{ fontSize: '0.7rem' }}>
                Reset to defaults
              </Button>
            )}
            <Button
              size="small"
              variant={editing ? 'contained' : 'outlined'}
              startIcon={editing ? <CheckIcon /> : <EditIcon />}
              onClick={() => setEditing(!editing)}
              id="nn-edit"
              sx={{ fontSize: '0.7rem' }}
            >
              {editing ? 'Done' : 'Edit'}
            </Button>
          </Box>
        </Box>

        {/* Sections */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {SECTIONS.map((s) => {
            const list = todays.filter((i) => i.section === s.key);
            const sDone = list.filter((i) => isDone(i.id)).length;
            const isNow = s.key === active;
            return (
              <Box
                key={s.key}
                id={`nn-section-${s.key}`}
                sx={{
                  borderRadius: 2,
                  p: 1.5,
                  border: '1px solid',
                  borderColor: isNow ? tokens.accentBorder40 : tokens.borderViolet,
                  backgroundColor: isNow ? tokens.accentDim08 : 'transparent',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                  <Typography sx={{ ...heading, fontSize: '0.75rem', fontWeight: 700, color: isNow ? 'primary.light' : 'text.primary' }}>
                    {s.label}{isNow ? ' · now' : ''}
                  </Typography>
                  <Typography sx={{ ...heading, fontSize: '0.7rem', color: 'text.secondary' }}>
                    {sDone}/{list.length}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 1 }}>
                  Check-in {shiftClock(s.checkIn, mode)}
                </Typography>

                {list.map((item) => {
                  const t = timeFor(item);
                  const ticked = isDone(item.id);
                  const rule = AUTO_RULES[item.id];
                  const logged = rule ? Math.round((totals[day]?.[rule.type] || 0) * 100) / 100 : 0;
                  const autoDone = rule && logged >= rule.target;
                  return (
                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minHeight: 36 }}>
                      {editing ? (
                        <>
                          <TextField
                            value={item.label}
                            onChange={(e) => rename(item.id, e.target.value)}
                            size="small"
                            variant="standard"
                            fullWidth
                            inputProps={{ 'aria-label': `Rename ${item.label}` }}
                          />
                          <IconButton size="small" onClick={() => remove(item.id)} aria-label={`Remove ${item.label}`}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        <Box
                          component="label"
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, cursor: 'pointer' }}
                        >
                          <Checkbox
                            checked={ticked}
                            onChange={() => !autoDone && toggle(item.id)}
                            size="small"
                            id={`nn-${item.id}`}
                            sx={{ p: 0.5, color: tokens.borderViolet, '&.Mui-checked': { color: 'primary.light' } }}
                          />
                          <Typography sx={{ fontSize: '0.875rem', flex: 1, color: ticked ? 'text.secondary' : 'text.primary', textDecoration: ticked ? 'line-through' : 'none' }}>
                            {titleCase(item.label)}
                          </Typography>
                          {rule && (
                            <Typography sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap', color: autoDone ? 'primary.light' : 'text.secondary' }} id={`nn-progress-${item.id}`}>
                              {autoDone ? 'logged' : `${logged}/${rule.target} ${rule.unit}`}
                            </Typography>
                          )}
                          {item.weekly && (
                            <Typography sx={{ fontSize: '0.7rem', color: 'primary.light', whiteSpace: 'nowrap' }}>
                              {weeklyCount(ticks, item.id, day, totals)}/{item.weekly} wk
                            </Typography>
                          )}
                          {t && (
                            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{t}</Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  );
                })}

                {editing && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <TextField
                      value={drafts[s.key] || ''}
                      onChange={(e) => setDrafts({ ...drafts, [s.key]: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') add(s.key); }}
                      placeholder={`Add to ${s.label}`}
                      size="small"
                      variant="standard"
                      fullWidth
                      inputProps={{ 'aria-label': `Add item to ${s.label}` }}
                    />
                    <IconButton size="small" onClick={() => add(s.key)} aria-label={`Add to ${s.label}`} sx={{ color: 'primary.light' }}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
