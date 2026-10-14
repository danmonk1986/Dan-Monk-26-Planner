import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import TrendChart from './TrendChart';
import { tokens } from '../theme';

import { LOG_TYPE_MAP } from '../data/logTypes';


/**
 * Dashboard metric card: today's total, mini trend chart, and quick-add button.
 */
// "L today · 2 glasses · 1 bottle"
function waterLine(list) {
  const glasses = list.filter((e) => e.value < 750).length;
  const bottles = list.filter((e) => e.value >= 750).length;
  const parts = [];
  if (glasses) parts.push(`${glasses} glass${glasses > 1 ? 'es' : ''}`);
  if (bottles) parts.push(`${bottles} bottle${bottles > 1 ? 's' : ''}`);
  return ['L today', ...parts].join(' · ');
}

// These cards list today's entries (value + note) instead of a trend graph
const LIST_TYPES = ['productivity', 'vices'];

export default function MetricCard({ type, todayTotal, trendData, onQuickAdd, extra = null, todayEntries = [] }) {
  const config = LOG_TYPE_MAP[type];
  const Icon = config.icon;

  return (
    <Card id={`metric-card-${type}`} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, pb: 0 }}>
        {/* Header row: icon + label + quick-add */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon sx={{ color: 'primary.light', fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontSize: '0.8rem' }}>
              {config.label}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onQuickAdd}
            aria-label={`Quick add ${config.label}`}
            sx={{
              color: 'primary.light',
              border: `1px solid ${tokens.borderViolet}`,
              width: 30,
              height: 30,
              '&:hover': {
                backgroundColor: tokens.accentDim12,
                borderColor: 'primary.main',
              },
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Today's total */}
        <Typography
          variant="h3"
          sx={{
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: 'text.primary',
            mb: 0.5,
          }}
        >
          {type === 'water'
            ? (todayTotal / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })
            : typeof todayTotal === 'number' ? todayTotal.toLocaleString() : '—'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {type === 'water' ? waterLine(todayEntries) : type === 'vices' ? 'today' : `${config.unit} today`}{extra ? ` · ${extra}` : ''}
        </Typography>

        {LIST_TYPES.includes(type) ? (
          /* Today's notes */
          <Box sx={{ mt: 1, pb: 1.5 }} id={`metric-notes-${type}`}>
            {todayEntries.length === 0 ? (
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontStyle: 'italic' }}>Nothing logged yet today</Typography>
            ) : (
              todayEntries.slice(0, 5).map((e) => (
                <Box key={e.id} sx={{ display: 'flex', gap: 1, alignItems: 'baseline', py: 0.4, borderTop: `1px solid ${tokens.accentDim12}` }}>
                  {type !== 'vices' && (
                    <Typography sx={{ fontSize: '0.75rem', color: 'primary.light', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {e.value.toLocaleString()}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: '0.8rem', color: e.note ? 'text.primary' : 'text.secondary', fontStyle: e.note ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {e.note || 'no note'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    {new Date(e.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Typography>
                </Box>
              ))
            )}
            {todayEntries.length > 5 && (
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.5 }}>+{todayEntries.length - 5} more in History</Typography>
            )}
          </Box>
        ) : (
          /* Mini trend chart (last 14 days) */
          <Box sx={{ mx: -1, mb: -1 }}>
            <TrendChart data={trendData} mini />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
