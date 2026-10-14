import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'pulse.entries';
const PURGE_KEY = 'monk.sampleDataRemoved';

// Matches entries made by the old sample-data generator (now removed)
const SAMPLE_MEALS = new Set([
  'Oatmeal with berries', 'Grilled chicken salad', 'Salmon with rice', 'Yogurt parfait',
  'Turkey sandwich', 'Pasta with vegetables', 'Eggs and toast', 'Stir-fry tofu bowl',
  'Smoothie bowl', 'Chicken wrap', 'Lentil soup', 'Avocado toast',
]);
export function isSampleEntry(e) {
  if (e.type === 'food') return e.unit === 'kcal' && SAMPLE_MEALS.has(e.note);
  if (e.type === 'steps') return e.unit === 'steps' && !e.note && /T21:00:00\.000Z$/.test(e.timestamp);
  if (e.type === 'sleep') return !e.note && /T07:00:00\.000Z$/.test(e.timestamp);
  if (e.type === 'gym') return e.unit === 'minutes' && !e.note;
  if (e.type === 'water') return e.unit === 'ml' && !e.note && [250, 350, 500].includes(e.value) && /:00\.000Z$/.test(e.timestamp);
  return false;
}

/**
 * Custom hook for managing health entries in localStorage.
 * Starts empty (no sample data).
 */
export default function useEntries() {
  const [entries, setEntries] = useState([]);

  // Load entries from localStorage on mount. No sample data: this is a real
  // log, so it starts empty. Old sample entries are removed once.
  useEffect(() => {
    let list = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      list = Array.isArray(parsed) ? parsed : [];
    } catch { list = []; }
    if (localStorage.getItem(PURGE_KEY) !== '1') {
      list = list.filter((e) => !isSampleEntry(e));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      localStorage.setItem(PURGE_KEY, '1');
    }
    setEntries(list);
  }, []);

  // Persist to localStorage whenever entries change (skip initial empty state)
  const persist = useCallback((next) => {
    setEntries(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  /** Add a new entry. Returns the created entry. */
  const add = useCallback((entry) => {
    const newEntry = {
      ...entry,
      id: entry.id || uuidv4(),
      timestamp: entry.timestamp || new Date().toISOString(),
    };
    persist((prev) => {
      const next = [...prev, newEntry];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    return newEntry;
  }, [persist]);

  /** Update an existing entry by id. */
  const update = useCallback((id, changes) => {
    persist((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...changes } : e));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [persist]);

  /** Remove an entry by id. */
  const remove = useCallback((id) => {
    persist((prev) => {
      const next = prev.filter((e) => e.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [persist]);

  /** Clear all entries. */
  const clearAll = useCallback(() => {
    persist([]);
    localStorage.removeItem(STORAGE_KEY);
  }, [persist]);

  return { entries, add, update, remove, clearAll };
}
