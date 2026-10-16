import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import theme from './theme';
import brand from './brand';
import App from './App';
import { ModeProvider } from './hooks/useMode';

// Tab title follows the active brand (Pulse by default).
document.title = brand.title || brand.name;

// The routines feature was removed; clear anything it saved in this browser.
try { localStorage.removeItem('monk.routines'); } catch { /* ignore */ }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ModeProvider>
        <App />
      </ModeProvider>
    </ThemeProvider>
  </React.StrictMode>
);
