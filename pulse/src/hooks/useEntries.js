import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import generateSeedData from '../data/seed';

const STORAGE_KEY = 'pulse.entries';

/**
 * Custom hook for managing health entries in localStorage.
 * Auto-loads seed data on first run (empty storage).
 */
export default function useEntries() {
  const [entries, setEntries] = useState([]);

  // Load entries from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch {
        // Corrupted data — start fresh with seed
        const seed = generateSeedData();
        setEntries(seed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      }
    } else {
      // First run — load sample data
      const seed = generateSeedData();
      setEntries(seed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    }
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

  /** Remove all entries matching a note string. */
  const removeByNote = useCallback((note) => {
    persist((prev) => {
      const next = prev.filter((e) => e.note !== note);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [persist]);

  /** Reload sample data (replaces current entries). */
  const loadSampleData = useCallback(() => {
    const seed = generateSeedData();
    persist(seed);
  }, [persist]);

  return { entries, add, update, remove, clearAll, removeByNote, loadSampleData };
}
