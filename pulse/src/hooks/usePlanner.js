import { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'pulse.planner';

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday',
];

const WORKOUTS = [
  {
    id: 'workout-a',
    name: 'Full-body strength',
    length: 30,
    order_index: 0,
    warmup: 'Easy bike or brisk walk, then 10 bodyweight squats and arm circles (5 min).',
    main: '3 rounds, 60 s rest between rounds: goblet squat x10, dumbbell bench press or push-ups x10, seated cable row x10, glute bridge x12, plank 30 s (20 min).',
    cooldown: 'Easy walk, then hamstring, chest and hip stretches (5 min).',
  },
  {
    id: 'workout-b',
    name: 'Full-body circuit',
    length: 30,
    order_index: 1,
    warmup: 'Easy rower or bike, then leg swings and arm circles (5 min).',
    main: '4 rounds of 40 s on, 20 s rest: step-ups on a low box, incline push-ups on a bench, dumbbell Romanian deadlift, rower or bike at a steady pace, dead bug (20 min).',
    cooldown: 'Easy pace, then quad, hip and shoulder stretches (5 min).',
  },
  {
    id: 'workout-c',
    name: 'Full-body and core',
    length: 30,
    order_index: 2,
    warmup: 'Easy bike or walk, then bodyweight lunges and torso twists (5 min).',
    main: '3 rounds, 60 s rest between rounds: reverse lunges x8 per leg, lat pulldown x10, dumbbell shoulder press x10, leg press x12, side plank 20 s per side (20 min).',
    cooldown: 'Easy walk, then lat, hip flexor and glute stretches (5 min).',
  },
];

const MESSAGES = {
  missed_midweek: "You missed a workout, but that happens. It's been moved to your next available day — no need to start over.",
  missed_no_room: 'No available days left this week for a moved workout. That\'s okay — next week starts fresh on Monday.',
  missed_sunday: "A workout slipped past on Sunday. Nothing carries over — your new week starts fresh tomorrow.",
  moved_success: "Your workout's been rescheduled. Keep it there, or pick another available day.",
  plan_complete_early: 'All your workouts are done this week. Great work — enjoy the rest.',
  week_complete: "That's a wrap on this week. Your next plan will be ready on Monday.",
  setup_welcome: "Let's set up your week. Pick your available days and a weekly target, and we'll place your beginner plan for you.",
  fixed_group_missed: "You missed a workout this week. That's okay — every week is a fresh start on Monday.",
};

const DEFAULT_SETTINGS = {
  group_assignment: 'adaptive',
  weekly_target: 3,
  setup_complete: false,
  demo_today: null,
};

// ── Local-date utilities (never UTC) ──────────────────────────────

function localDateStr(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-CA');
}

function getTodayStr(demoToday) {
  if (demoToday) return demoToday;
  return localDateStr(new Date());
}

function dateToDayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return DAYS_OF_WEEK[(d.getDay() + 6) % 7];
}

function getWeekDates(weekOffset, demoToday) {
  const base = demoToday ? new Date(demoToday + 'T12:00:00') : new Date();
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((base.getDay() + 6) % 7) + weekOffset * 7);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(localDateStr(d));
  }
  return dates;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

// ── Gym-entry helpers ─────────────────────────────────────────────

function getGymEntryDates(entries) {
  const set = new Set();
  if (!entries) return set;
  for (const e of entries) {
    if (e.type !== 'gym') continue;
    set.add(localDateStr(e.timestamp));
  }
  return set;
}

function isWorkoutDone(entries, dateStr) {
  return getGymEntryDates(entries).has(dateStr);
}

// ── Hook ──────────────────────────────────────────────────────────

export default function usePlanner(entries) {
  const [availability, setAvailability] = useState({});
  const [schedule, setSchedule] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [activeMessage, setActiveMessage] = useState(null);

  const demoToday = settings.demo_today || null;

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAvailability(parsed.availability || {});
        setSchedule(parsed.schedule || []);
        setSettings({ ...DEFAULT_SETTINGS, ...(parsed.settings || {}) });
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }
    setLoaded(true);
  }, []);

  // Persist helper
  const persist = useCallback((next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const writeState = useCallback((nextAvail, nextSched, nextSettings) => {
    setAvailability(nextAvail);
    setSchedule(nextSched);
    setSettings(nextSettings);
    persist({ availability: nextAvail, schedule: nextSched, settings: nextSettings });
  }, [persist]);

  // ── Derived data ───────────────────────────────────────────────

  const gymDates = useMemo(() => getGymEntryDates(entries), [entries]);

  const scheduleByDate = useMemo(() => {
    const map = {};
    for (const s of schedule) {
      const workout = WORKOUTS.find((w) => w.id === s.workout_id);
      map[s.scheduled_date] = { ...s, workout };
    }
    return map;
  }, [schedule]);

  // ── Mutations ──────────────────────────────────────────────────

  /** Save setup: availability + target + group assignment. */
  const saveSetup = useCallback((newAvail, newTarget) => {
    const nextSettings = {
      ...settings,
      weekly_target: newTarget,
      setup_complete: true,
    };
    if (!settings.setup_complete) {
      nextSettings.group_assignment = Math.random() < 0.5 ? 'adaptive' : 'fixed';
    }
    writeState(newAvail, schedule, nextSettings);
  }, [settings, schedule, writeState]);

  /** Generate (or top up) the schedule for a set of week dates.
   *  Places workouts A→B→C→A… on earliest available empty days from
   *  today onward, up to target. Past days are never populated, so
   *  setting up midweek never creates instant misses. */
  const generateWeek = useCallback((dates) => {
    if (!settings.setup_complete) return;

    const today = getTodayStr(demoToday);
    const existingDates = new Set(schedule.map((s) => s.scheduled_date));
    const toGenerate = dates.filter((d) => d >= today && !existingDates.has(d));
    if (toGenerate.length === 0) return;

    const weekSched = schedule.filter((s) => dates.includes(s.scheduled_date));
    const activeCount = weekSched.length;

    const target = settings.weekly_target;
    let scheduled = activeCount;
    let wIdx = 0;
    const inserts = [];

    for (const dateStr of toGenerate) {
      if (scheduled >= target) break;
      const dow = dateToDayOfWeek(dateStr);
      if (availability[dow]) {
        inserts.push({
          id: uuidv4(),
          scheduled_date: dateStr,
          workout_id: WORKOUTS[wIdx % WORKOUTS.length].id,
          status: 'pending',
          is_moved: false,
          moved_from_date: null,
          moved_accepted: null,
        });
        wIdx++;
        scheduled++;
      }
    }

    if (inserts.length > 0) {
      const nextSched = [...schedule, ...inserts];
      writeState(availability, nextSched, settings);
    }
  }, [settings, schedule, availability, writeState, demoToday]);

  /** Check in: creates a gym entry via the provided addEntry callback.
   *  Timestamp is noon local time on the demo (or real) today. */
  const checkIn = useCallback((addEntry) => {
    const todayDate = getTodayStr(demoToday);
    const timestamp = new Date(todayDate + 'T12:00:00').toISOString();
    addEntry({
      type: 'gym',
      value: 60,
      unit: 'minutes',
      note: 'Planner check-in',
      timestamp,
    });
  }, [demoToday]);

  /** Accept a moved workout (dismisses the "Rescheduled from" note). */
  const acceptMove = useCallback((schedId) => {
    const nextSched = schedule.map((s) =>
      s.id === schedId ? { ...s, moved_accepted: true } : s
    );
    writeState(availability, nextSched, settings);
  }, [schedule, availability, settings, writeState]);

  /** Move a workout to a different available, empty day this week. */
  const moveWorkout = useCallback((schedId, newDateStr) => {
    const dow = dateToDayOfWeek(newDateStr);
    if (!availability[dow]) return;
    if (schedule.some((s) => s.scheduled_date === newDateStr && s.id !== schedId)) return;

    const nextSched = schedule.map((s) =>
      s.id === schedId
        ? { ...s, scheduled_date: newDateStr, is_moved: true, moved_accepted: true }
        : s
    );
    writeState(availability, nextSched, settings);
  }, [schedule, availability, settings, writeState]);

  /** Update availability (and optionally target) midweek. */
  const updateAvailability = useCallback((newAvail, newTarget) => {
    const nextSettings = newTarget != null
      ? { ...settings, weekly_target: newTarget }
      : settings;
    const today = getTodayStr(demoToday);
    const thisWeek = getWeekDates(0, demoToday);

    const toMove = schedule.filter((s) => {
      if (!thisWeek.includes(s.scheduled_date)) return false;
      if (s.scheduled_date < today) return false;
      if (s.scheduled_date === today && gymDates.has(s.scheduled_date)) return false;
      if (s.status !== 'pending') return false;
      const dow = dateToDayOfWeek(s.scheduled_date);
      return !(newAvail[dow] ?? false);
    });

    let trimmedSched = schedule;
    if (newTarget != null) {
      const weekNonMissed = schedule.filter((s) =>
        thisWeek.includes(s.scheduled_date) && s.status !== 'missed'
      );
      const excess = weekNonMissed.length - newTarget;
      if (excess > 0) {
        const futurePending = weekNonMissed
          .filter((s) => s.scheduled_date > today && s.status === 'pending')
          .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date));
        const toRemove = new Set(futurePending.slice(0, excess).map((s) => s.id));
        trimmedSched = schedule.filter((s) => !toRemove.has(s.id));
      }
    }

    if (toMove.length === 0) {
      writeState(newAvail, trimmedSched, nextSettings);
      return;
    }

    const existingDates = new Set(
      trimmedSched.filter((s) => !toMove.includes(s)).map((s) => s.scheduled_date)
    );
    const openSlots = thisWeek
      .filter((d) => d >= today)
      .filter((d) => {
        const dow = dateToDayOfWeek(d);
        return newAvail[dow] && !existingDates.has(d);
      });

    const nextSched = [...trimmedSched];
    const movedIds = new Set();

    let slotIdx = 0;
    for (const m of toMove) {
      if (slotIdx >= openSlots.length) break;
      const newDate = openSlots[slotIdx++];
      const idx = nextSched.findIndex((s) => s.id === m.id);
      nextSched[idx] = {
        ...nextSched[idx],
        scheduled_date: newDate,
        is_moved: true,
        moved_from_date: m.scheduled_date,
        moved_accepted: true,
      };
      movedIds.add(m.id);
      existingDates.add(newDate);
    }

    // Remove workouts that couldn't be moved to an available day
    const finalSched = nextSched.filter((s) =>
      !toMove.some((m) => m.id === s.id) || movedIds.has(s.id)
    );

    writeState(newAvail, finalSched, nextSettings);
  }, [schedule, settings, writeState, demoToday]);

  /** Switch group assignment between adaptive and fixed. */
  const setGroup = useCallback((group) => {
    const nextSettings = { ...settings, group_assignment: group };
    writeState(availability, schedule, nextSettings);
  }, [settings, availability, schedule, writeState]);

  /** Set the demo "today" date (null = use real date). */
  const setDemoToday = useCallback((dateStr) => {
    const nextSettings = { ...settings, demo_today: dateStr };
    writeState(availability, schedule, nextSettings);
    setActiveMessage(null);
  }, [settings, availability, schedule, writeState]);

  /** Reset planner: clear all planner state, return to setup screen. */
  const resetPlanner = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAvailability({});
    setSchedule([]);
    setSettings(DEFAULT_SETTINGS);
    setActiveMessage(null);
  }, []);

  /** Start a clean test: empty plan, setup screen, demo date set — in one write. */
  const launchTest = useCallback((dateStr) => {
    localStorage.removeItem(STORAGE_KEY);
    setActiveMessage(null);
    writeState({}, [], { ...DEFAULT_SETTINGS, demo_today: dateStr });
  }, [writeState]);

  // ── Auto-reschedule: single sync-then-detect pass ────────────
  useEffect(() => {
    if (!loaded || !settings.setup_complete) return;

    const today = getTodayStr(demoToday);
    const thisWeekDates = getWeekDates(0, demoToday);
    const isAdaptive = settings.group_assignment === 'adaptive';

    const missed = schedule.filter(
      (s) => s.scheduled_date < today && s.status === 'pending' && !gymDates.has(s.scheduled_date) &&
      thisWeekDates.includes(s.scheduled_date)
    );
    const olderMissed = schedule.filter(
      (s) => s.scheduled_date < today && s.status === 'pending' && !gymDates.has(s.scheduled_date) &&
      !thisWeekDates.includes(s.scheduled_date)
    );
    if (olderMissed.length > 0 && missed.length === 0) {
      const nextSched = schedule.map((s) => {
        const found = olderMissed.find((m) => m.id === s.id);
        return found ? { ...s, status: 'missed' } : s;
      });
      writeState(availability, nextSched, settings);
      return;
    } else if (olderMissed.length > 0) {
      olderMissed.forEach((m) => missed.push(m));
    }
    if (missed.length === 0) {
      const weekEntries = thisWeekDates.map((d) => scheduleByDate[d]).filter(Boolean);
      const nonMissed = weekEntries.filter((s) => s.status !== 'missed');
      const completedCount = nonMissed.filter((s) => gymDates.has(s.scheduled_date)).length;
      if (nonMissed.length > 0 && completedCount === nonMissed.length && completedCount >= settings.weekly_target) {
        setActiveMessage((prev) => prev === 'plan_complete_early' ? prev : 'plan_complete_early');
      }
      return;
    }

    let nextSched = schedule.map((s) => {
      const found = missed.find((m) => m.id === s.id);
      return found ? { ...s, status: 'missed' } : s;
    });

    let msgKey = 'missed_midweek';

    if (isAdaptive) {
      const movableMissed = missed.filter((m) => thisWeekDates.includes(m.scheduled_date));
      // Skip missed workouts that already have a moved copy (same workout_id + moved_from_date)
      const alreadyMoved = new Set(
        nextSched
          .filter((s) => s.is_moved && s.moved_from_date)
          .map((s) => `${s.workout_id}:${s.moved_from_date}`)
      );
      const eligibleMissed = movableMissed.filter(
        (m) => !alreadyMoved.has(`${m.workout_id}:${m.scheduled_date}`)
      );
      const existingDates = new Set(nextSched.map((s) => s.scheduled_date));
      const remainingWeekDates = thisWeekDates.filter((d) => d >= today);

      const openSlots = [];
      for (const dateStr of remainingWeekDates) {
        const dow = dateToDayOfWeek(dateStr);
        const isAvailable = availability[dow] ?? false;
        if (isAvailable && !existingDates.has(dateStr)) {
          openSlots.push(dateStr);
        }
      }

      const missedQueue = [...eligibleMissed];
      const inserts = [];
      for (const dateStr of openSlots) {
        if (missedQueue.length === 0) break;
        const m = missedQueue.shift();
        inserts.push({
          id: uuidv4(),
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
      }

      const sundayMissed = eligibleMissed.some((m) => dateToDayOfWeek(m.scheduled_date) === 'Sunday');
      if (sundayMissed && inserts.length === 0) {
        msgKey = 'missed_sunday';
      }

      if (inserts.length > 0) {
        nextSched = [...nextSched, ...inserts];
      }
    } else {
      msgKey = 'fixed_group_missed';
    }

    writeState(availability, nextSched, settings);
    setActiveMessage(msgKey);
  }, [loaded, settings, schedule, availability, gymDates, scheduleByDate, writeState, demoToday]);

  const clearActiveMessage = useCallback(() => setActiveMessage(null), []);

  // ── Computed helpers exposed to UI ─────────────────────────────

  const todayStr = getTodayStr(demoToday);

  const isTodayDone = useMemo(
    () => gymDates.has(todayStr),
    [gymDates, todayStr]
  );

  const todayPlanned = useMemo(() => {
    const entry = scheduleByDate[todayStr];
    if (!entry) return null;
    return { ...entry, done: gymDates.has(todayStr) };
  }, [scheduleByDate, todayStr, gymDates]);

  const pendingMoves = useMemo(() => {
    const thisWeekDates = getWeekDates(0, demoToday);
    return schedule.filter((s) =>
      s.is_moved && s.moved_accepted === null && s.status === 'pending' &&
      thisWeekDates.includes(s.scheduled_date)
    );
  }, [schedule, demoToday]);

  // Bind getWeekDates to demo today for UI consumers
  const getWeekDatesBound = useCallback(
    (weekOffset) => getWeekDates(weekOffset, demoToday),
    [demoToday]
  );

  return {
    loaded,
    availability,
    schedule,
    settings,
    workouts: WORKOUTS,
    messages: MESSAGES,
    scheduleByDate,
    gymDates,
    todayStr,
    todayPlanned,
    isTodayDone,
    getWeekDates: getWeekDatesBound,
    dateToDayOfWeek,
    formatDate,
    isWorkoutDone: (dateStr) => gymDates.has(dateStr),
    activeMessage,
    clearActiveMessage,
    demoToday,
    pendingMoves,
    saveSetup,
    generateWeek,
    checkIn,
    acceptMove,
    moveWorkout,
    updateAvailability,
    setGroup,
    setDemoToday,
    resetPlanner,
    launchTest,
  };
}
