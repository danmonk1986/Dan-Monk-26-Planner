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
      {/* Neon grid floor in perspective */}
      <Box
        sx={{
          position: 'absolute',
          left: '-50%',
          width: '200%',
          top: HORIZON,
          height: '70%',
          perspective: '300px',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            transformOrigin: 'top center',
            transform: 'rotateX(68deg)',
            backgroundImage: `
              linear-gradient(rgba(${ACCENT},0.8) 2px, transparent 2px),
              linear-gradient(90deg, rgba(${BRIGHT},0.75) 2px, transparent 2px)
            `,
            backgroundSize: '60px 60px',
            backgroundPosition: 'center top',
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, black 40%)',
            WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, black 40%)',
          }}
        />
      </Box>
    </Box>
  );
}
