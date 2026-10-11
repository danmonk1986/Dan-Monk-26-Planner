import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import MetricCard from './MetricCard';
import supabase from '../lib/supabaseClient';
import { tokens } from '../theme';

const METRIC_TYPES = ['food', 'steps', 'water', 'sleep', 'gym'];

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Dashboard screen: five metric cards showing today's totals with mini trends,
 * plus quick-add shortcuts and today's planned workout from the planner.
 */
export default function Dashboard({ entries, onQuickAdd, onQuickWater, onQuickGym, onNavigatePlanner }) {
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [plannedToday, setPlannedToday] = useState(null);

  const fetchPlannedToday = useCallback(async () => {
    const today = getTodayStr();
    const { data: schedData, error: schedErr } = await supabase
      .from('planner_schedule')
      .select('*')
      .eq('scheduled_date', today)
      .maybeSingle();
    if (schedErr || !schedData) return;

    const { data: workoutData, error: workoutErr } = await supabase
      .from('planner_workouts')
      .select('*')
      .eq('id', schedData.workout_id)
      .maybeSingle();
    if (workoutErr || !workoutData) return;

    setPlannedToday({ ...schedData, workout: workoutData });
  }, []);

  useEffect(() => {
    fetchPlannedToday();
  }, [fetchPlannedToday, entries]);

  const metrics = useMemo(() => {
    return METRIC_TYPES.map((type) => {
      const typeEntries = entries.filter((e) => e.type === type);
      const todayEntries = typeEntries.filter(
        (e) => new Date(e.timestamp).toLocaleDateString('en-CA') === todayStr
      );
      const todayTotal = todayEntries.reduce((sum, e) => sum + e.value, 0);
      const byDay = {};
      typeEntries.forEach((e) => {
        const day = new Date(e.timestamp).toLocaleDateString('en-CA');
        byDay[day] = (byDay[day] || 0) + e.value;
      });
      const trendData = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString('en-CA');
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        trendData.push({
          date: label,
          value: byDay[dayStr] ? Math.round(byDay[dayStr] * 10) / 10 : 0,
        });
      }
      return {
        type,
        todayTotal: Math.round(todayTotal * 10) / 10,
        trendData,
      };
    });
  }, [entries, todayStr]);

  const isRestDay = plannedToday?.workout?.is_rest_day;
  const isCompleted = plannedToday?.status === 'completed';
  const isMissed = plannedToday?.status === 'missed';
  const isPending = plannedToday?.status === 'pending';

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
      {/* Welcome message */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontSize: '1.2rem', mb: 0.5 }}>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          Here's your wellness snapshot for today. Log a meal, a walk, some water, or last night's sleep to keep your streak going.
        </Typography>
      </Box>

      {/* Today's planned workout card */}
      {plannedToday && !isRestDay && (
        <Card id="dashboard-planned-workout" sx={{ mb: 3, borderColor: isPending ? tokens.accentBorder40 : tokens.borderViolet }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <FitnessCenterIcon sx={{ color: 'primary.light', fontSize: 28 }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.65rem', fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary' }}>
                Today's Workout
              </Typography>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                {plannedToday.workout?.name}
              </Typography>
            </Box>
            {isCompleted && (
              <Chip icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} label="Done" size="small"
                sx={{ fontSize: '0.7rem', color: '#4ADE80', border: '1px solid', borderColor: 'rgba(74,222,128,0.3)', backgroundColor: 'rgba(74,222,128,0.08)' }} />
            )}
            {isPending && (
              <Button size="small" variant="outlined" onClick={onQuickGym} id="dashboard-checkin-button" sx={{ fontSize: '0.7rem' }}>
                Check in
              </Button>
            )}
            {isMissed && (
              <Chip icon={<EventBusyIcon sx={{ fontSize: 14 }} />} label="Missed" size="small"
                sx={{ fontSize: '0.7rem', color: '#FBBF24', border: '1px solid', borderColor: 'rgba(251,191,36,0.3)', backgroundColor: 'rgba(251,191,36,0.08)' }} />
            )}
          </CardContent>
        </Card>
      )}
      {plannedToday && isRestDay && (
        <Card id="dashboard-rest-day" sx={{ mb: 3 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <SelfImprovementIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.65rem', fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary' }}>
                Today
              </Typography>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: 'text.secondary' }}>
                Rest day — recover and recharge
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ fontSize: '1.2rem' }}>Today</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small" startIcon={<FitnessCenterIcon />} onClick={onQuickGym} id="quick-gym-button" sx={{ fontSize: '0.75rem' }}>
            Gym check-in
          </Button>
          <Button variant="outlined" size="small" startIcon={<WaterDropIcon />} onClick={onQuickWater} id="quick-water-button" sx={{ fontSize: '0.75rem' }}>
            +250 ml
          </Button>
        </Box>
      </Box>

      {/* Metric cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {metrics.map((m) => (
          <Box key={m.type} sx={{ flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 calc(33.333% - 11px)', md: '1 1 calc(20% - 13px)' } }}>
            <MetricCard type={m.type} todayTotal={m.todayTotal} trendData={m.trendData} onQuickAdd={() => onQuickAdd(m.type)} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
