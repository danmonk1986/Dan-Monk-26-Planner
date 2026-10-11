import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import AutoRescheduleIcon from '@mui/icons-material/Autorenew';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import supabase from '../lib/supabaseClient';
import { tokens } from '../theme';

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday',
];

const DAY_SHORT = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

// Default supportive messages (also in the DB, but we keep a local copy
// so the UI works even if the messages table is empty)
const DEFAULT_MESSAGES = {
  missed_midweek: 'You missed a workout, but that happens. It\'s been moved to your next open day — no need to start over.',
  missed_no_room: 'No open days left this week for a moved workout. That\'s okay — next week starts fresh on Monday.',
  missed_sunday: 'A workout slipped past on Sunday. Nothing carries over — your new week starts fresh tomorrow.',
  moved_success: 'Your workout\'s been rescheduled. Tap accept to keep it there, or pick another available day.',
  plan_complete_early: 'All your workouts are done this week. Great work — enjoy the rest.',
  week_complete: 'That\'s a wrap on this week. Your next plan will be ready on Monday.',
  setup_welcome: 'Let\'s set up your week. Pick your available days and a weekly target, and we\'ll place your beginner plan for you.',
  fixed_group_missed: 'You missed a workout this week. That\'s okay — every week is a fresh start on Monday.',
};

function dateToDayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return DAYS_OF_WEEK[(d.getDay() + 6) % 7];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

function getWeekDates(weekOffset) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

// Check if there's a gym entry in the entries array for a given date
function hasGymEntryForDate(entries, dateStr) {
  return entries.some((e) => {
    if (e.type !== 'gym') return false;
    const entryDate = new Date(e.timestamp).toISOString().split('T')[0];
    return entryDate === dateStr;
  });
}

// Count distinct days with gym entries in a list of dates
function countGymDays(entries, dates) {
  const dateSet = new Set();
  entries.forEach((e) => {
    if (e.type !== 'gym') return;
    const d = new Date(e.timestamp).toISOString().split('T')[0];
    if (dates.includes(d)) dateSet.add(d);
  });
  return dateSet.size;
}

export default function Planner({ entries, onQuickGym }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availability, setAvailability] = useState({});
  const [workouts, setWorkouts] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [settings, setSettings] = useState(null);
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [weekOffset, setWeekOffset] = useState(0);
  const [setupOpen, setSetupOpen] = useState(false);
  const [tempAvail, setTempAvail] = useState({});
  const [tempTarget, setTempTarget] = useState(3);
  const [activeMessage, setActiveMessage] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [moveTargetEntry, setMoveTargetEntry] = useState(null);

  const todayStr = getTodayStr();
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: availData, error: availErr } = await supabase
        .from('planner_availability').select('*');
      if (availErr) throw availErr;

      const { data: workoutData, error: workoutErr } = await supabase
        .from('planner_workouts').select('*').order('order_index');
      if (workoutErr) throw workoutErr;

      const { data: schedData, error: schedErr } = await supabase
        .from('planner_schedule').select('*');
      if (schedErr) throw schedErr;

      const { data: settingsData, error: settingsErr } = await supabase
        .from('planner_settings').select('*').limit(1).maybeSingle();
      if (settingsErr) throw settingsErr;

      const { data: msgData, error: msgErr } = await supabase
        .from('planner_messages').select('*');
      if (msgErr) throw msgErr;

      const availMap = {};
      (availData || []).forEach((a) => { availMap[a.day_of_week] = a.is_available; });
      setAvailability(availMap);
      setWorkouts(workoutData || []);
      setSchedule(schedData || []);
      setSettings(settingsData || { group_assignment: 'adaptive', weekly_target: 3, setup_complete: false });
      if (msgData && msgData.length > 0) {
        const msgMap = {};
        msgData.forEach((m) => { msgMap[m.message_key] = m.message_text; });
        setMessages({ ...DEFAULT_MESSAGES, ...msgMap });
      }
    } catch (err) {
      setError(err.message || 'Failed to load planner data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Schedule by date lookup
  const scheduleByDate = useMemo(() => {
    const map = {};
    schedule.forEach((s) => {
      const workout = workouts.find((w) => w.id === s.workout_id);
      map[s.scheduled_date] = { ...s, workout };
    });
    return map;
  }, [schedule, workouts]);

  // Week availability
  const weekAvailability = useMemo(() => {
    return weekDates.map((dateStr) => {
      const dow = dateToDayOfWeek(dateStr);
      return { dateStr, dayOfWeek: dow, available: availability[dow] ?? false };
    });
  }, [weekDates, availability]);

  // Non-rest workouts only (for scheduling)
  const activeWorkouts = useMemo(
    () => [...workouts].filter((w) => !w.is_rest_day).sort((a, b) => a.order_index - b.order_index),
    [workouts]
  );

  // Generate the weekly schedule for a set of dates.
  // Assigns workouts from the rotation to available days, capped at weekly target.
  // Only creates entries for dates that don't already have one.
  const generateWeek = useCallback(async (dates) => {
    if (!settings || activeWorkouts.length === 0) return;

    const existingDates = new Set(schedule.map((s) => s.scheduled_date));
    const toGenerate = dates.filter((d) => !existingDates.has(d));
    if (toGenerate.length === 0) return;

    // Count how many workouts are already scheduled this week (non-rest, any status except missed)
    const weekWorkoutCount = dates.filter((d) => {
      const entry = scheduleByDate[d];
      return entry && !entry.workout?.is_rest_day && entry.status !== 'missed';
    }).length;

    // Find the last workout's order_index to continue rotation
    const allSchedDates = [...schedule].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
    let lastWorkoutIdx = -1;
    if (allSchedDates.length > 0) {
      const lastEntry = allSchedDates[allSchedDates.length - 1];
      const lastW = workouts.find((w) => w.id === lastEntry.workout_id);
      if (lastW && !lastW.is_rest_day) lastWorkoutIdx = lastW.order_index;
    }

    const target = settings.weekly_target;
    const inserts = [];
    let scheduled = weekWorkoutCount;
    let wIdx = lastWorkoutIdx;

    for (const dateStr of toGenerate) {
      if (scheduled >= target) break;
      const dow = dateToDayOfWeek(dateStr);
      const isAvailable = availability[dow] ?? false;
      if (isAvailable) {
        wIdx = (wIdx + 1) % activeWorkouts.length;
        inserts.push({
          scheduled_date: dateStr,
          workout_id: activeWorkouts[wIdx].id,
          status: 'pending',
          is_moved: false,
        });
        scheduled++;
      }
    }

    if (inserts.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from('planner_schedule').insert(inserts).select('*');
      if (insertErr) throw insertErr;
      setSchedule((prev) => [...prev, ...(inserted || [])]);
    }
  }, [settings, activeWorkouts, availability, schedule, scheduleByDate, workouts]);

  // Auto-reschedule: runs when the app opens and detects missed workouts.
  // For adaptive group: marks missed, moves to next available day this week.
  // For fixed group: marks missed, no rescheduling.
  const autoReschedule = useCallback(async () => {
    if (!settings) return;
    const today = getTodayStr();
    const thisWeekDates = getWeekDates(0);

    const missed = schedule.filter(
      (s) => s.scheduled_date < today && s.status === 'pending' &&
      !s.workout_id || (s.workout_id && workouts.find((w) => w.id === s.workout_id)?.is_rest_day === false)
    );
    if (missed.length === 0) return;

    const isAdaptive = settings.group_assignment === 'adaptive';

    // Mark all missed as 'missed'
    for (const m of missed) {
      await supabase
        .from('planner_schedule')
        .update({ status: 'missed', updated_at: new Date().toISOString() })
        .eq('id', m.id);
    }

    let msgKey = 'missed_midweek';
    let rescheduleInserts = [];

    if (isAdaptive) {
      const existingDates = new Set(schedule.map((s) => s.scheduled_date));
      const remainingWeekDates = thisWeekDates.filter((d) => d >= today);

      // Find available open slots in the remaining week
      const openSlots = [];
      for (const dateStr of remainingWeekDates) {
        const dow = dateToDayOfWeek(dateStr);
        const isAvailable = availability[dow] ?? false;
        if (isAvailable && !existingDates.has(dateStr)) {
          openSlots.push(dateStr);
        }
      }

      let missedQueue = [...missed];
      for (const dateStr of openSlots) {
        if (missedQueue.length === 0) break;
        const m = missedQueue.shift();
        rescheduleInserts.push({
          scheduled_date: dateStr,
          workout_id: m.workout_id,
          status: 'pending',
          is_moved: true,
          moved_from_date: m.scheduled_date,
          moved_accepted: null,
        });
        existingDates.add(dateStr);
      }

      if (missedQueue.length > 0) {
        msgKey = 'missed_no_room';
      } else if (rescheduleInserts.length > 0) {
        msgKey = 'missed_midweek';
      }

      // Check for Sunday miss specifically
      const sundayMissed = missed.some((m) => {
        const dow = dateToDayOfWeek(m.scheduled_date);
        return dow === 'Sunday';
      });
      if (sundayMissed && rescheduleInserts.length === 0) {
        msgKey = 'missed_sunday';
      }
    } else {
      msgKey = 'fixed_group_missed';
    }

    if (rescheduleInserts.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from('planner_schedule').insert(rescheduleInserts).select('*');
      if (insertErr) throw insertErr;

      setSchedule((prev) => {
        const updated = prev.map((s) => {
          const found = missed.find((m) => m.id === s.id);
          return found ? { ...s, status: 'missed' } : s;
        });
        return [...updated, ...(inserted || [])];
      });
    } else {
      setSchedule((prev) => prev.map((s) => {
        const found = missed.find((m) => m.id === s.id);
        return found ? { ...s, status: 'missed' } : s;
      }));
    }

    setActiveMessage(msgKey);
  }, [settings, schedule, availability, workouts]);

  // On load: generate current week, then auto-reschedule
  useEffect(() => {
    if (!loading && settings && workouts.length > 0 && Object.keys(availability).length > 0) {
      (async () => {
        await generateWeek(weekDates);
        await autoReschedule();
      })();
    }
  }, [loading, settings, workouts, availability]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync schedule with gym entries: if there's a gym log for a scheduled date,
  // mark the schedule entry as completed. T3: double check-in counts as one.
  const syncWithGymEntries = useCallback(async () => {
    if (!entries || entries.length === 0) return;
    const thisWeek = getWeekDates(0);

    for (const dateStr of thisWeek) {
      const entry = scheduleByDate[dateStr];
      if (entry && entry.status === 'pending' && !entry.workout?.is_rest_day) {
        if (hasGymEntryForDate(entries, dateStr)) {
          const now = new Date().toISOString();
          await supabase
            .from('planner_schedule')
            .update({ status: 'completed', completed_at: now, updated_at: now })
            .eq('id', entry.id);
          setSchedule((prev) => prev.map((s) =>
            s.id === entry.id ? { ...s, status: 'completed', completed_at: now } : s
          ));
        }
      }
    }
  }, [entries, scheduleByDate]);

  useEffect(() => {
    if (!loading && schedule.length > 0) {
      syncWithGymEntries();
    }
  }, [entries, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate future weeks when navigated to
  useEffect(() => {
    if (!loading && settings && weekOffset !== 0) {
      generateWeek(weekDates);
    }
  }, [weekOffset, loading, settings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark a workout as completed (check-in)
  const handleComplete = useCallback(async (schedId) => {
    const now = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from('planner_schedule')
      .update({ status: 'completed', completed_at: now, updated_at: now })
      .eq('id', schedId);
    if (updateErr) { setError(updateErr.message); return; }
    setSchedule((prev) => prev.map((s) =>
      s.id === schedId ? { ...s, status: 'completed', completed_at: now } : s
    ));
    // Also fire the gym check-in so it appears in the dashboard
    if (onQuickGym) onQuickGym();
  }, [onQuickGym]);

  // Accept a moved workout
  const handleAcceptMove = useCallback(async (schedId) => {
    await supabase
      .from('planner_schedule')
      .update({ moved_accepted: true, updated_at: new Date().toISOString() })
      .eq('id', schedId);
    setSchedule((prev) => prev.map((s) =>
      s.id === schedId ? { ...s, moved_accepted: true } : s
    ));
  }, []);

  // Decline a moved workout and open day picker
  const handleDeclineMove = useCallback((entry, event) => {
    setMoveTargetEntry(entry);
    setAnchorEl(event.currentTarget);
  }, []);

  // Pick a different day for a moved workout (T7)
  const handlePickDay = useCallback(async (dateStr) => {
    if (!moveTargetEntry) return;
    setAnchorEl(null);

    // Validate: must be available and not already scheduled
    const dow = dateToDayOfWeek(dateStr);
    if (!(availability[dow] ?? false)) return;
    if (schedule.some((s) => s.scheduled_date === dateStr && s.id !== moveTargetEntry.id)) return;

    // Delete the moved entry and create a new one on the picked day
    await supabase
      .from('planner_schedule')
      .delete()
      .eq('id', moveTargetEntry.id);

    const { data: newEntry, error: insertErr } = await supabase
      .from('planner_schedule')
      .insert({
        scheduled_date: dateStr,
        workout_id: moveTargetEntry.workout_id,
        status: 'pending',
        is_moved: true,
        moved_from_date: moveTargetEntry.moved_from_date,
        moved_accepted: true,
      })
      .select('*')
      .single();

    if (insertErr) { setError(insertErr.message); return; }

    setSchedule((prev) => {
      const filtered = prev.filter((s) => s.id !== moveTargetEntry.id);
      return [...filtered, newEntry];
    });
    setMoveTargetEntry(null);
  }, [moveTargetEntry, availability, schedule]);

  // Open setup dialog
  const handleOpenSetup = useCallback(() => {
    setTempAvail({ ...availability });
    setTempTarget(settings?.weekly_target ?? 3);
    setSetupOpen(true);
  }, [availability, settings]);

  // Save setup: update availability, settings, then regenerate week
  const handleSaveSetup = useCallback(async () => {
    try {
      const isAdaptive = settings?.group_assignment === 'adaptive';

      for (const day of DAYS_OF_WEEK) {
        const isAvail = tempAvail[day] ?? false;
        await supabase
          .from('planner_availability')
          .update({ is_available: isAvail, updated_at: new Date().toISOString() })
          .eq('day_of_week', day);
      }

      // Update settings: mark setup complete, set target
      // Random group assignment only on first setup
      const updates = { weekly_target: tempTarget, setup_complete: true, updated_at: new Date().toISOString() };
      if (!settings?.setup_complete) {
        updates.group_assignment = Math.random() < 0.5 ? 'adaptive' : 'fixed';
      }

      const { data: updatedSettings, error: settingsErr } = await supabase
        .from('planner_settings')
        .update(updates)
        .eq('id', settings?.id)
        .select('*')
        .maybeSingle();

      if (settingsErr) throw settingsErr;

      setAvailability({ ...tempAvail });
      setSettings(updatedSettings || { ...settings, ...updates });

      // T4: availability change midweek — clear and regenerate this week's pending workouts
      const thisWeek = getWeekDates(0);
      const toDelete = schedule.filter((s) => {
        if (!thisWeek.includes(s.scheduled_date)) return false;
        if (s.status === 'completed') return false; // keep completed
        const dow = dateToDayOfWeek(s.scheduled_date);
        return !(tempAvail[dow] ?? false); // delete from now-unavailable days
      });

      if (toDelete.length > 0) {
        await supabase
          .from('planner_schedule')
          .delete()
          .in('id', toDelete.map((s) => s.id));
        setSchedule((prev) => prev.filter((s) => !toDelete.find((d) => d.id === s.id)));
      }

      setSetupOpen(false);

      // Regenerate the week with new availability
      setTimeout(() => generateWeek(thisWeek), 100);
    } catch (err) {
      setError(err.message || 'Failed to save setup');
    }
  }, [tempAvail, tempTarget, settings, schedule, generateWeek]);

  const handleToggleDay = useCallback((day) => {
    setTempAvail((prev) => ({ ...prev, [day]: !prev[day] }));
  }, []);

  // Week stats
  const weekStats = useMemo(() => {
    const weekEntries = weekDates.map((d) => scheduleByDate[d]).filter(Boolean);
    const completed = weekEntries.filter((s) => s.status === 'completed').length;
    const pending = weekEntries.filter((s) => s.status === 'pending').length;
    const missed = weekEntries.filter((s) => s.status === 'missed').length;
    const total = weekEntries.filter((s) => !s.workout?.is_rest_day).length;
    return { completed, pending, missed, total };
  }, [weekDates, scheduleByDate]);

  // Available open slots in the remaining week (for move-day picker)
  const openSlotsThisWeek = useMemo(() => {
    if (!moveTargetEntry) return [];
    const thisWeek = getWeekDates(0);
    return thisWeek.filter((d) => {
      if (d === moveTargetEntry.scheduled_date) return false;
      const dow = dateToDayOfWeek(d);
      const isAvail = availability[dow] ?? false;
      const hasEntry = schedule.some((s) => s.scheduled_date === d && s.id !== moveTargetEntry.id);
      return isAvail && !hasEntry;
    });
  }, [moveTargetEntry, availability, schedule]);

  // Check if all workouts are done early (T5)
  const allDoneEarly = useMemo(() => {
    if (!settings) return false;
    const thisWeek = getWeekDates(0);
    const activeCount = thisWeek.filter((d) => {
      const e = scheduleByDate[d];
      return e && !e.workout?.is_rest_day;
    }).length;
    const completedCount = thisWeek.filter((d) => {
      const e = scheduleByDate[d];
      return e && e.status === 'completed' && !e.workout?.is_rest_day;
    }).length;
    return activeCount > 0 && completedCount === activeCount;
  }, [settings, scheduleByDate]);

  useEffect(() => {
    if (allDoneEarly) {
      setActiveMessage('plan_complete_early');
    }
  }, [allDoneEarly]);

  const isAdaptive = settings?.group_assignment === 'adaptive';

  if (loading) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
        <Typography variant="h5" sx={{ fontSize: '1.2rem', mb: 3 }}>Workout Planner</Typography>
        <LinearProgress sx={{ maxWidth: 300 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading your plan…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" onClick={fetchData}>Try again</Button>
      </Box>
    );
  }

  // Show onboarding if setup not complete
  if (!settings?.setup_complete) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontSize: '1.2rem', mb: 0.5 }}>Workout Planner</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            {messages.setup_welcome}
          </Typography>
        </Box>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                Which days can you work out?
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {DAYS_OF_WEEK.map((day) => (
                  <Chip
                    key={day}
                    label={DAY_SHORT[day]}
                    onClick={() => handleToggleDay(day)}
                    color={tempAvail[day] ? 'primary' : 'default'}
                    variant={tempAvail[day] ? 'filled' : 'outlined'}
                    id={`setup-avail-${day}`}
                    sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                Weekly target: {tempTarget} workout{tempTarget === 1 ? '' : 's'}
              </Typography>
              <ToggleButtonGroup
                value={String(tempTarget)}
                exclusive
                onChange={(_, v) => v && setTempTarget(parseInt(v, 10))}
                size="small"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <ToggleButton key={n} value={String(n)} id={`setup-target-${n}`} sx={{ fontSize: '0.75rem', fontFamily: '"Space Grotesk", sans-serif' }}>
                    {n}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
            <Button variant="contained" onClick={handleSaveSetup} id="setup-complete-button" size="large">
              Start my plan
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontSize: '1.2rem', mb: 0.5 }}>Workout Planner</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          {isAdaptive
            ? 'Your plan adapts to your week. Missed workouts move to your next open day.'
            : 'Your weekly plan is set. Miss a day and it stays missed — next week starts fresh.'}
        </Typography>
      </Box>

      {/* Group badge + setup button */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Chip
          label={isAdaptive ? 'Adaptive group' : 'Fixed plan group'}
          size="small"
          sx={{
            fontSize: '0.7rem',
            fontFamily: '"Space Grotesk", sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: isAdaptive ? tokens.violetBright : '#8E8EA0',
            border: '1px solid',
            borderColor: isAdaptive ? tokens.accentBorder40 : tokens.borderViolet,
            backgroundColor: isAdaptive ? tokens.accentDim08 : 'transparent',
          }}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<CalendarTodayIcon />}
          onClick={handleOpenSetup}
          id="planner-setup-button"
        >
          Edit availability
        </Button>
      </Box>

      {/* Supportive message banner */}
      {activeMessage && messages[activeMessage] && (
        <Alert
          severity="info"
          sx={{ mb: 2, '& .MuiAlert-message': { fontSize: '0.85rem' } }}
          onClose={() => setActiveMessage(null)}
          icon={<AutoRescheduleIcon fontSize="small" />}
        >
          {messages[activeMessage]}
        </Alert>
      )}

      {/* Week navigation + stats */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week" id="planner-prev-week">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontSize: '0.85rem' }}>
            {weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Next Week' : `${weekOffset > 0 ? '+' : ''}${weekOffset} w`}
          </Typography>
          <IconButton size="small" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week" id="planner-next-week">
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={`${weekStats.completed}/${settings?.weekly_target ?? 3} done`} size="small"
            sx={{ fontSize: '0.7rem', borderColor: tokens.borderViolet, color: '#4ADE80', border: '1px solid', backgroundColor: 'transparent' }} />
          {weekStats.missed > 0 && (
            <Chip label={`${weekStats.missed} missed`} size="small"
              sx={{ fontSize: '0.7rem', borderColor: tokens.borderViolet, color: '#FBBF24', border: '1px solid', backgroundColor: 'transparent' }} />
          )}
        </Box>
      </Box>

      {/* Week grid */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {weekAvailability.map(({ dateStr, dayOfWeek, available }) => {
          const entry = scheduleByDate[dateStr];
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;
          const isFuture = dateStr > todayStr;
          const isRestDay = entry?.workout?.is_rest_day;
          const hasGymLog = hasGymEntryForDate(entries, dateStr);

          return (
            <Box key={dateStr} sx={{ flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 calc(33.333% - 10px)', md: '1 1 calc(14.285% - 13px)' }, minWidth: { xs: 140, md: 100 } }}>
              <Card id={`planner-day-${dateStr}`} sx={{
                height: '100%',
                borderColor: isToday ? tokens.accentBorder40 : tokens.borderViolet,
                borderWidth: isToday ? 2 : 1,
                opacity: !available && !entry ? 0.5 : 1,
              }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography sx={{ fontSize: '0.65rem', fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary', mb: 0.25 }}>
                    {DAY_SHORT[dayOfWeek]}
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 1, color: isToday ? tokens.violetBright : 'text.primary' }}>
                    {formatDate(dateStr)}
                  </Typography>

                  {!available && !entry && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 48 }}>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Off day</Typography>
                    </Box>
                  )}

                  {available && !entry && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 48 }}>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Open</Typography>
                    </Box>
                  )}

                  {entry && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        {isRestDay ? (
                          <SelfImprovementIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        ) : (
                          <FitnessCenterIcon sx={{ fontSize: 16, color: 'primary.light' }} />
                        )}
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.2 }}>
                          {entry.workout?.name || 'Workout'}
                        </Typography>
                      </Box>

                      {/* Moved indicator */}
                      {entry.is_moved && entry.moved_accepted === null && (
                        <Chip
                          icon={<SwapHorizIcon sx={{ fontSize: 13 }} />}
                          label={`Moved from ${formatDate(entry.moved_from_date)}`}
                          size="small"
                          sx={{
                            fontSize: '0.6rem', height: 20, mb: 0.5,
                            color: tokens.violetBright,
                            border: '1px solid', borderColor: tokens.accentBorder40,
                            backgroundColor: tokens.accentDim08,
                          }}
                        />
                      )}

                      {/* Status chips */}
                      {entry.status === 'completed' && (
                        <Chip icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} label="Done" size="small"
                          sx={{ fontSize: '0.65rem', height: 22, color: '#4ADE80', border: '1px solid', borderColor: 'rgba(74,222,128,0.3)', backgroundColor: 'rgba(74,222,128,0.08)' }} />
                      )}
                      {entry.status === 'missed' && (
                        <Chip icon={<EventBusyIcon sx={{ fontSize: 14 }} />} label="Missed" size="small"
                          sx={{ fontSize: '0.65rem', height: 22, color: '#FBBF24', border: '1px solid', borderColor: 'rgba(251,191,36,0.3)', backgroundColor: 'rgba(251,191,36,0.08)' }} />
                      )}
                      {entry.status === 'pending' && isPast && !isRestDay && (
                        <Chip label="Overdue" size="small"
                          sx={{ fontSize: '0.65rem', height: 22, color: '#F87171', border: '1px solid', borderColor: 'rgba(248,113,113,0.3)', backgroundColor: 'rgba(248,113,113,0.08)' }} />
                      )}
                      {entry.status === 'pending' && isRestDay && (
                        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>Rest</Typography>
                      )}

                      {/* Check-in button for pending, non-rest, today or future */}
                      {entry.status === 'pending' && !isRestDay && !isPast && (
                        <Button size="small" variant="outlined" fullWidth
                          onClick={() => handleComplete(entry.id)}
                          id={`complete-button-${entry.id}`}
                          sx={{ fontSize: '0.65rem', mt: 0.5, py: 0.25 }}>
                          Check in
                        </Button>
                      )}

                      {/* Moved workout accept/decline (adaptive only) */}
                      {entry.is_moved && entry.moved_accepted === null && entry.status === 'pending' && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          <Button size="small" variant="contained" fullWidth
                            onClick={() => handleAcceptMove(entry.id)}
                            id={`accept-move-${entry.id}`}
                            sx={{ fontSize: '0.6rem', py: 0.2 }}>
                            Accept
                          </Button>
                          <Button size="small" variant="outlined" fullWidth
                            onClick={(e) => handleDeclineMove(entry, e)}
                            id={`decline-move-${entry.id}`}
                            sx={{ fontSize: '0.6rem', py: 0.2 }}>
                            Move
                          </Button>
                        </Box>
                      )}

                      {/* Gym log indicator */}
                      {hasGymLog && entry.status === 'completed' && (
                        <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mt: 0.5 }}>
                          Logged via check-in
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Box>

      {/* Plan reference */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Your Beginner Plan
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {activeWorkouts.map((w) => (
            <Card key={w.id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 11px)' } }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <FitnessCenterIcon sx={{ fontSize: 20, color: 'primary.light' }} />
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{w.name}</Typography>
                </Box>
                {w.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', lineHeight: 1.4 }}>
                    {w.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Availability edit dialog */}
      <Dialog open={setupOpen} onClose={() => setSetupOpen(false)} maxWidth="xs" fullWidth id="planner-setup-dialog">
        <DialogTitle sx={{ fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '1rem' }}>
          Edit Availability
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem' }}>
            Tap the days you can work out. The planner will update your schedule to match.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {DAYS_OF_WEEK.map((day) => (
              <Chip
                key={day}
                label={DAY_SHORT[day]}
                onClick={() => handleToggleDay(day)}
                color={tempAvail[day] ? 'primary' : 'default'}
                variant={tempAvail[day] ? 'filled' : 'outlined'}
                id={`edit-avail-${day}`}
                sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, fontSize: '0.75rem' }}
              />
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
            Weekly target: {tempTarget}
          </Typography>
          <ToggleButtonGroup value={String(tempTarget)} exclusive onChange={(_, v) => v && setTempTarget(parseInt(v, 10))} size="small">
            {[1, 2, 3, 4, 5].map((n) => (
              <ToggleButton key={n} value={String(n)} id={`edit-target-${n}`} sx={{ fontSize: '0.75rem', fontFamily: '"Space Grotesk", sans-serif' }}>
                {n}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSetupOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSetup} id="planner-setup-save">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Move-day picker menu (T7) */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => { setAnchorEl(null); setMoveTargetEntry(null); }}
        id="move-day-picker"
      >
        {openSlotsThisWeek.length === 0 ? (
          <MenuItem disabled>No open days available</MenuItem>
        ) : (
          openSlotsThisWeek.map((dateStr) => (
            <MenuItem key={dateStr} onClick={() => handlePickDay(dateStr)} id={`pick-day-${dateStr}`}>
              {formatDate(dateStr)} ({DAY_SHORT[dateToDayOfWeek(dateStr)]})
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
}
