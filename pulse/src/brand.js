/**
 * Brand configuration for the app.
 *
 * `pulse` is the DEFAULT and must stay the standard look for the book and the
 * deployed site (gorvis.github.io/book-pm-management/pulse/). `yorku` is an
 * opt-in classroom variant selected at build time with Vite mode `yorku`:
 *
 *   npm run dev:yorku      npm run build:yorku
 *
 * which loads `.env.yorku` (VITE_BRAND=yorku). A plain `npm run dev` / `build`
 * has no VITE_BRAND set and therefore renders Pulse, unchanged.
 *
 * Only branding differs between the two — colors and the product name. There
 * are no feature or data differences. The localStorage key is intentionally
 * shared (see useEntries.js) and is NOT branded.
 */

const BRANDS = {
  pulse: {
    name: 'Pulse',
    accent: '#8B5CF6',        // violet
    accentBright: '#A855F7',  // brighter violet
    accentRGB: '139,92,246',
    accentBrightRGB: '168,85,247',
    surfaceRaised: '#1C1B27',
  },
  yorku: {
    name: 'York U Fitness',
    accent: '#E31837',        // York Red (PMS 186)
    accentBright: '#FF3B54',  // brighter York red for glows/highlights on dark
    accentRGB: '227,24,55',
    accentBrightRGB: '255,59,84',
    surfaceRaised: '#1C1B27',
  },
  // Dan Monk 26 Planner: personal build (Bolt). Dan Monk palette:
  // purple accent, teal highlights (matches the logo shadow), grey panels.
  monk: {
    name: 'UNDENIABLE IN 2026',
    title: 'Dan Monk 2026 Planner', // browser tab + footer credit
    accent: '#8169AF',        // purple
    accentBright: '#76CABA',  // teal
    accentRGB: '129,105,175',
    accentBrightRGB: '118,202,186',
    surfaceRaised: '#454343', // grey
  },
};

const key = ['yorku', 'monk'].includes(import.meta.env.VITE_BRAND)
  ? import.meta.env.VITE_BRAND
  : 'pulse';

export const brand = BRANDS[key];
export default brand;
