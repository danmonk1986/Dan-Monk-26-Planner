import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendChart from './TrendChart';
import { tokens } from '../theme';
import { LOG_TYPES, isShownType } from '../data/logTypes';

const TYPE_ICONS = Object.fromEntries(LOG_TYPES.map((t) => [t.value, t.icon]));
const TYPE_LABELS = Object.fromEntries(LOG_TYPES.map((t) => [t.value, t.label]));
const TYPE_UNITS = Object.fromEntries(LOG_TYPES.map((t) => [t.value, t.unit]));

/**
 * History screen: filterable entry list with edit/delete, plus full per-metric chart.
 */
export default function History({ entries: allEntries, onEdit, onDelete }) {
  // Retired types (e.g. old Steps entries) are hidden
  const entries = useMemo(() => allEntries.filter((e) => isShownType(e.type)), [allEntries]);
  const [filter, setFilter] = useState('all');
  const [chartType, setChartType] = useState('food');

  // Filter entries
  const filtered = useMemo(() => {
    const list = filter === 'all' ? entries : entries.filter((e) => e.type === filter);
    return [...list].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [entries, filter]);

  // Aggregate data for the full chart (sum per day, or hours for sleep)
  const chartData = useMemo(() => {
    const byDay = {};
    entries
      .filter((e) => e.type === chartType)
      .forEach((e) => {
        const day = new Date(e.timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD
        byDay[day] = (byDay[day] || 0) + e.value;
      });

    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.round(value * 10) / 10,
      }));
  }, [entries, chartType]);

  function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
        <TimelineIcon sx={{ fontSize: 64, color: 'primary.light', opacity: 0.4, mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 1, fontSize: '1.1rem' }}>
          Start tracking to see your history
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Log your first entry and it will appear here with charts showing your trends over time.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, py: 3 }}>
      {/* Per-metric chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '0.85rem' }}>
              Trends
            </Typography>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={(_, v) => v && setChartType(v)}
              size="small"
              aria-label="Chart metric type"
            >
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <ToggleButton
                  key={key}
                  value={key}
                  id={`chart-type-${key}`}
                  sx={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontFamily: '"Space Grotesk", sans-serif',
                    px: 1.5,
                    '&.Mui-selected': {
                      backgroundColor: tokens.accentDim15,
                      color: tokens.violetBright,
                    },
                  }}
                >
                  {label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <TrendChart
            data={chartData}
            label={TYPE_UNITS[chartType]}
          />
        </CardContent>
      </Card>

      {/* Filter bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '0.85rem' }}>
          All Entries
        </Typography>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, v) => v && setFilter(v)}
          size="small"
          aria-label="Filter entries by type"
        >
          <ToggleButton value="all" id="filter-all" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: '"Space Grotesk", sans-serif', px: 1.5, '&.Mui-selected': { backgroundColor: tokens.accentDim15, color: tokens.violetBright } }}>
            All
          </ToggleButton>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <ToggleButton key={key} value={key} id={`filter-${key}`} sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: '"Space Grotesk", sans-serif', px: 1.5, '&.Mui-selected': { backgroundColor: tokens.accentDim15, color: tokens.violetBright } }}>
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Entry list */}
      <Card>
        <List disablePadding>
          {filtered.map((entry, idx) => {
            const Icon = TYPE_ICONS[entry.type];
            return (
              <React.Fragment key={entry.id}>
                {idx > 0 && <Divider sx={{ borderColor: tokens.accentDim12 }} />}
                <ListItem
                  id={`entry-${entry.id}`}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => onEdit(entry)}
                        aria-label={`Edit ${TYPE_LABELS[entry.type]} entry`}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => onDelete(entry.id)}
                        aria-label={`Delete ${TYPE_LABELS[entry.type]} entry`}
                        sx={{ color: 'text.secondary', '&:hover': { color: '#ef4444' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  sx={{ py: 1.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Icon sx={{ color: 'primary.light', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {entry.value.toLocaleString()} {entry.unit}
                        </Typography>
                        {entry.note && (
                          <Chip
                            label={entry.note}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.7rem',
                              height: 22,
                              borderColor: tokens.borderViolet,
                              color: 'text.secondary',
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={formatTime(entry.timestamp)}
                    secondaryTypographyProps={{ color: 'text.secondary', fontSize: '0.75rem' }}
                  />
                </ListItem>
              </React.Fragment>
            );
          })}
        </List>
      </Card>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
        {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
      </Typography>
    </Box>
  );
}
