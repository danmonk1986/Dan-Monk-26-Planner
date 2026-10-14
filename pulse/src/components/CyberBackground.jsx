import React from 'react';
import Box from '@mui/material/Box';
import { tokens } from '../theme';

/**
 * Fixed retro-synthwave backdrop: starry night sky, a glow on the horizon
 * and a neon grid floor in perspective. Pure CSS, sits behind all content.
 * Colors come from the active brand (accent = horizon glow, accentBright =
 * horizon line and grid).
 */

const ACCENT = tokens.accentRGB;          // purple
const BRIGHT = tokens.accentBrightRGB;    // teal

// Scattered stars built from small radial gradients.
const STARS = Array.from({ length: 60 }, (_, i) => {
  const x = (i * 37.7) % 100;
  const y = (i * 23.3 + (i % 7) * 9) % 62;
  const size = i % 9 === 0 ? 1.6 : 0.9;
  const alpha = 0.35 + ((i * 13) % 50) / 100;
  return `radial-gradient(${size}px ${size}px at ${x.toFixed(1)}% ${y.toFixed(1)}%, rgba(255,255,255,${alpha.toFixed(2)}), transparent)`;
}).join(',');

const HORIZON = '66%';

// Grid geometry (SVG units: 1000 wide x 340 tall below the horizon)
const VERTICALS = Array.from({ length: 31 }, (_, i) => i - 15);
const ROWS = Array.from({ length: 10 }, (_, k) => Math.round(340 * ((k + 1) / 10) ** 2));

export default function CyberBackground() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        pointerEvents: 'none',
        // Sky: deep navy fading to a purple glow at the horizon, dark floor below
        background: `
          ${STARS},
          linear-gradient(180deg, #05040F 0%, #0B0A26 35%, #1E1640 56%, rgba(${ACCENT},0.85) ${HORIZON}, #05060D calc(${HORIZON} + 0.2%), #05060D 100%)
        `,
        // Faint CRT scanlines across the sky
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(180deg, rgba(${ACCENT},0.08) 0px, rgba(${ACCENT},0.08) 1px, transparent 1px, transparent 4px)`,
          maskImage: `linear-gradient(180deg, transparent 0%, black 30%, black ${HORIZON}, transparent calc(${HORIZON} + 0.2%))`,
          WebkitMaskImage: `linear-gradient(180deg, transparent 0%, black 30%, black ${HORIZON}, transparent calc(${HORIZON} + 0.2%))`,
        },
        // Glowing horizon line
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          top: HORIZON,
          height: '2px',
          background: `rgb(${BRIGHT})`,
          boxShadow: `0 0 12px 2px rgba(${BRIGHT},0.9), 0 0 60px 12px rgba(${ACCENT},0.55)`,
        },
      }}
    >
      {/* Neon grid floor: drawn as flat lines in perspective, so nothing
          ever rises above the horizon */}
      <Box
        component="svg"
        viewBox="0 0 1000 340"
        preserveAspectRatio="none"
        sx={{ position: 'absolute', left: 0, top: HORIZON, width: '100%', height: `calc(100% - ${HORIZON})` }}
      >
        <defs>
          <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
            <stop offset="0.45" stopColor="#fff" stopOpacity="1" />
          </linearGradient>
          <mask id="gridMask">
            <rect width="1000" height="340" fill="url(#gridFade)" />
          </mask>
        </defs>
        <g mask="url(#gridMask)">
          {/* Lines running to the vanishing point */}
          {VERTICALS.map((i) => (
            <line key={`v${i}`} x1={500 + i * 22} y1="0" x2={500 + i * 160} y2="340"
              stroke={`rgba(${BRIGHT},0.75)`} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          ))}
          {/* Cross lines, closer together near the horizon */}
          {ROWS.map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="1000" y2={y}
              stroke={`rgba(${ACCENT},0.8)`} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </Box>
    </Box>
  );
}
