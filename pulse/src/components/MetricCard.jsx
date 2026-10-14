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
export default function MetricCard({ type, todayTotal, trendData, onQuickAdd }) {
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
          {typeof todayTotal === 'number' ? todayTotal.toLocaleString() : '—'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {config.unit} today
        </Typography>

        {/* Mini trend chart (last 7–14 days) */}
        <Box sx={{ mx: -1, mb: -1 }}>
          <TrendChart data={trendData} mini />
        </Box>
      </CardContent>
    </Card>
  );
}
