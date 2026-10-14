import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Pulse (default) deploys at /book-pm-management/pulse/ on GitHub Pages.
// The "bolt" mode builds with base "/" so Bolt can serve at the root.
// The York U Fitness class variant (mode "yorku") deploys to a /yorku/
// subpath alongside it, so both ship from the same GitHub Pages site.
export default defineConfig(({ mode }) => {
  const isYorku = mode === 'yorku';
  const isDev = mode === 'development';
  const isBolt = mode === 'bolt';
  const base = (isDev || isBolt)
    ? '/'
    : isYorku
      ? '/book-pm-management/pulse/yorku/'
      : '/book-pm-management/pulse/';
  return {
    plugins: [react()],
    base,
    define: isBolt ? { 'import.meta.env.VITE_BRAND': JSON.stringify('monk') } : {},
    build: {
      outDir: isYorku ? 'dist/pulse/yorku' : (isBolt ? '../dist' : 'dist/pulse'),
      emptyOutDir: true,
    },
  };
});
