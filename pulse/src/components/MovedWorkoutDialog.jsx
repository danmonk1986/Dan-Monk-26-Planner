import React, { useState, useEffect, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TimerIcon from '@mui/icons-material/Timer';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CloseIcon from '@mui/icons-material/Close';
import { tokens } from '../theme';

const DAY_SHORT = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

function dayShort(dateStr, dateToDayOfWeek) {
  return DAY_SHORT[dateToDayOfWeek(dateStr)] || '';
}

export default function MovedWorkoutDialog({ planner }) {
  const {
    pendingMoves,
    acceptMove,
    moveWorkout,
    getWeekDates,
    dateToDayOfWeek,
    formatDate,
    availability,
    schedule,
    todayStr,
  } = planner;

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [showPickDay, setShowPickDay] = useState(false);

  // Open dialog when there are unresponded moves
  useEffect(() => {
    if (pendingMoves.length > 0) {
      setOpen(true);
      setIndex(0);
      setShowPickDay(false);
    }
  }, [pendingMoves.length]);

  // Close when all resolved
  useEffect(() => {
    if (pendingMoves.length === 0) {
      setOpen(false);
    }
  }, [pendingMoves.length]);

  // Clamp index if moves were resolved
  useEffect(() => {
    if (index >= pendingMoves.length && pendingMoves.length > 0) {
      setIndex(0);
      setShowPickDay(false);
    }
  }, [index, pendingMoves.length]);

  const currentMove = pendingMoves[index] || null;

  const validDays = useMemo(() => {
    if (!currentMove) return [];
    const thisWeek = getWeekDates(0);
    return thisWeek.filter((d) => {
      if (d === currentMove.scheduled_date) return false;
      if (d < todayStr) return false;
      const dow = dateToDayOfWeek(d);
      const isAvail = availability[dow] ?? false;
      const hasEntry = schedule.some((s) => s.scheduled_date === d && s.id !== currentMove.id);
      return isAvail && !hasEntry;
    });
  }, [currentMove, getWeekDates, todayStr, dateToDayOfWeek, availability, schedule]);

  if (!currentMove) return null;

  const workout = planner.workouts.find((w) => w.id === currentMove.workout_id);
  const newDayName = dateToDayOfWeek(currentMove.scheduled_date);
  const fromDayShort = dayShort(currentMove.moved_from_date, dateToDayOfWeek);
  const toDayShort = dayShort(currentMove.scheduled_date, dateToDayOfWeek);

  const handleKeep = () => {
    acceptMove(currentMove.id);
    // Advance to next or close
    if (index + 1 < pendingMoves.length) {
      setIndex(index + 1);
      setShowPickDay(false);
    } else {
      setOpen(false);
    }
  };

  const handlePickDay = (dateStr) => {
    moveWorkout(currentMove.id, dateStr);
    if (index + 1 < pendingMoves.length) {
      setIndex(index + 1);
      setShowPickDay(false);
    } else {
      setOpen(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="sm"
      fullWidth
      id="moved-workout-dialog"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SwapHorizIcon sx={{ color: 'primary.light' }} />
          <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>Rescheduled Workout</Typography>
        </Box>
        <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.5, mb: 2 }}>
          Your workout's been rescheduled. Keep it there, or pick another available day.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <FitnessCenterIcon sx={{ fontSize: 20, color: 'primary.light' }} />
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }}>{workout?.name}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TimerIcon sx={{ fontSize: 14 }} /> {workout?.length} min
          </Typography>
        </Box>

        <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 1 }}>
          Moved from <strong>{fromDayShort}, {formatDate(currentMove.moved_from_date)}</strong> to <strong>{toDayShort}, {formatDate(currentMove.scheduled_date)}</strong>
        </Typography>

        {showPickDay && (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: '0.75rem', fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: tokens.violetBright, mb: 1 }}>
              Pick another day
            </Typography>
            {validDays.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                No other available days this week. Keep it where it is, or wait for next week.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {validDays.map((dateStr) => (
                  <Button
                    key={dateStr}
                    variant="outlined"
                    size="small"
                    onClick={() => handlePickDay(dateStr)}
                    id={`dialog-pick-day-${dateStr}`}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {dayShort(dateStr, dateToDayOfWeek)}, {formatDate(dateStr)}
                  </Button>
                ))}
              </Box>
            )}
          </Box>
        )}

        {pendingMoves.length > 1 && (
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 2 }}>
            {index + 1} of {pendingMoves.length} moved workouts to review
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        {!showPickDay ? (
          <>
            <Button variant="outlined" onClick={() => setShowPickDay(true)} id="dialog-pick-another-day" sx={{ fontSize: '0.8rem' }}>
              Pick another day
            </Button>
            <Button variant="contained" onClick={handleKeep} id="dialog-keep-move" sx={{ fontSize: '0.8rem' }}>
              Keep {newDayName}
            </Button>
          </>
        ) : (
          <Button variant="outlined" onClick={() => setShowPickDay(false)} id="dialog-back-to-keep" sx={{ fontSize: '0.8rem' }}>
            Back
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
