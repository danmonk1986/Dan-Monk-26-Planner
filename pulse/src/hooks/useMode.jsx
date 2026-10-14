import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * App-wide mode: where I am (HQ = home, MWD = at work) and, at MWD, which
 * shift (days or nights). Saved on this device.
 */
const MODE_KEY = 'monk.mode';
const OLD_KEY = 'monk.dailyGoalsMode'; // earlier HQ/MWD-only toggle

function loadMode() {
  try {
    const saved = JSON.parse(localStorage.getItem(MODE_KEY) || 'null');
    if (saved && (saved.place === 'hq' || saved.place === 'mwd')) {
      return { place: saved.place, shift: saved.shift === 'nights' ? 'nights' : 'days' };
    }
    const old = localStorage.getItem(OLD_KEY);
    if (old === 'mwd') return { place: 'mwd', shift: 'days' };
  } catch { /* ignore */ }
  return { place: 'hq', shift: 'days' };
}

const ModeContext = createContext(null);

export function ModeProvider({ children }) {
  const [mode, setModeState] = useState(loadMode);

  const setMode = useCallback((patch) => {
    setModeState((cur) => {
      const next = { ...cur, ...patch };
      try { localStorage.setItem(MODE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export default function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used inside <ModeProvider>');
  return ctx;
}
