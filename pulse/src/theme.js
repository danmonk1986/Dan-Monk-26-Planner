import { createTheme } from '@mui/material/styles';
import { brand } from './brand';

/**
 * Design tokens — a dark, single-accent theme inspired by the book cover.
 * "A quiet control panel at night." The accent color comes from the active
 * brand (Pulse violet by default; see brand.js).
 */

const VIOLET = brand.accent;
const VIOLET_BRIGHT = brand.accentBright;
const BORDER_VIOLET = `rgba(${brand.accentRGB},0.22)`;
const GLOW_VIOLET = `rgba(${brand.accentBrightRGB},0.30)`;

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0A0A0F',
      paper: '#14141C',
    },
    primary: {
      main: VIOLET,
      light: VIOLET_BRIGHT,
    },
    text: {
      primary: '#F5F5FA',
      secondary: '#8E8EA0',
    },
    divider: BORDER_VIOLET,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    h2: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    h3: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    h4: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    h5: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    h6: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    subtitle1: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 500,
      letterSpacing: '0.06em',
    },
    button: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      letterSpacing: '0.08em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#05040F',
          // Cyberpunk backdrop is drawn by <CyberBackground />
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(20,20,28,0.82)',
          backdropFilter: 'blur(6px)',
          border: `1px solid ${BORDER_VIOLET}`,
          borderRadius: 12,
          boxShadow: `0 0 24px rgba(${brand.accentBrightRGB},0.12)`,
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
          '&:hover': {
            boxShadow: `0 0 32px rgba(${brand.accentBrightRGB},0.20)`,
            borderColor: `rgba(${brand.accentRGB},0.40)`,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        },
        contained: {
          boxShadow: `0 0 16px rgba(${brand.accentBrightRGB},0.20)`,
          '&:hover': {
            boxShadow: `0 0 24px rgba(${brand.accentBrightRGB},0.35)`,
          },
        },
        outlined: {
          borderColor: BORDER_VIOLET,
          '&:hover': {
            borderColor: VIOLET,
            backgroundColor: `rgba(${brand.accentRGB},0.08)`,
          },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: '#14141C',
          borderTop: `1px solid ${BORDER_VIOLET}`,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#8E8EA0',
          '&.Mui-selected': {
            color: VIOLET_BRIGHT,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 600,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: '#8E8EA0',
          '&.Mui-selected': {
            color: VIOLET_BRIGHT,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: VIOLET_BRIGHT,
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: BORDER_VIOLET,
            },
            '&:hover fieldset': {
              borderColor: VIOLET,
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: brand.surfaceRaised,
          border: `1px solid ${BORDER_VIOLET}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: brand.surfaceRaised,
          border: `1px solid ${BORDER_VIOLET}`,
          color: '#F5F5FA',
        },
      },
    },
  },
});

// Export design tokens for use in components (e.g. Recharts)
export const tokens = {
  violet: VIOLET,
  violetBright: VIOLET_BRIGHT,
  borderViolet: BORDER_VIOLET,
  glowViolet: GLOW_VIOLET,
  accentRGB: brand.accentRGB,
  accentBrightRGB: brand.accentBrightRGB,
  accentDim08: `rgba(${brand.accentRGB},0.08)`,
  accentDim12: `rgba(${brand.accentRGB},0.12)`,
  accentDim15: `rgba(${brand.accentRGB},0.15)`,
  accentBorder40: `rgba(${brand.accentRGB},0.40)`,
  surfaceRaised: brand.surfaceRaised,
  chartGrid: 'rgba(255,255,255,0.05)',
  chartGradientStart: `rgba(${brand.accentBrightRGB},0.35)`,
  chartGradientEnd: `rgba(${brand.accentBrightRGB},0)`,
};

export default theme;
