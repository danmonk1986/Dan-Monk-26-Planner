import React from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InsightsIcon from '@mui/icons-material/Insights';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BiotechIcon from '@mui/icons-material/Biotech';
import logo from '../assets/dan-monk-logo.png';
import tagline from '../assets/tagline.png';
import { tokens } from '../theme';
import brand from '../brand';

const TESTING_VIEW = -1;

/**
 * App header with the Dan Monk logo and responsive navigation.
 * Mobile (≤600px): BottomNavigation fixed to bottom.
 * Desktop: Tabs in the header.
 */
export default function Nav({ view, onChangeView, onOpenTesting }) {
  const isMobile = useMediaQuery('(max-width:600px)');
  // Log (1) and History (2) are reached from Dashboard / Summary, not the menu,
  // so nothing is highlighted while they're open.
  const tabValue = [0, 3, 4].includes(view) ? view : false;

  const handleChange = (_, v) => {
    if (v === TESTING_VIEW) {
      onOpenTesting();
    } else {
      onChangeView(v);
    }
  };

  return (
    <>
      {/* App header */}
      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, sm: 3 },
          py: 1.5,
          borderBottom: `1px solid ${tokens.borderViolet}`,
          backgroundColor: 'rgba(20,20,28,0.85)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src={logo}
            alt="Dan Monk"
            sx={{ height: { xs: 40, sm: 48 }, width: 'auto', display: 'block' }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '0.95rem', sm: '1.3rem' },
                fontWeight: 700,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                background: `linear-gradient(135deg, ${tokens.violet} 0%, ${tokens.violetBright} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {brand.name}
            </Typography>
            <Box
              component="img"
              src={tagline}
              alt="search. create. evolve."
              sx={{ width: 0, minWidth: '100%', height: 'auto', display: 'block', mt: 0.5 }}
            />
          </Box>
        </Box>

        {/* Desktop tabs */}
        {!isMobile && (
          <Tabs
            value={tabValue}
            onChange={handleChange}
            aria-label="Main navigation"
          >
            <Tab icon={<DashboardIcon />} iconPosition="start" label="Dashboard" value={0} id="nav-dashboard" />
            <Tab icon={<InsightsIcon />} iconPosition="start" label="Summary" value={3} id="nav-summary" />
            <Tab icon={<CalendarMonthIcon />} iconPosition="start" label="Workout Planner" value={4} id="nav-planner" />
            <Tab icon={<BiotechIcon />} iconPosition="start" label="Testing" value={TESTING_VIEW} id="nav-testing" />
          </Tabs>
        )}
      </Box>

      {/* Mobile bottom navigation */}
      {isMobile && (
        <BottomNavigation
          value={tabValue}
          onChange={handleChange}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
          }}
        >
          <BottomNavigationAction label="Dashboard" icon={<DashboardIcon />} value={0} id="nav-mobile-dashboard" />
          <BottomNavigationAction label="Summary" icon={<InsightsIcon />} value={3} id="nav-mobile-summary" />
          <BottomNavigationAction label="Workouts" icon={<CalendarMonthIcon />} value={4} id="nav-mobile-planner" />
          <BottomNavigationAction label="Testing" icon={<BiotechIcon />} value={TESTING_VIEW} id="nav-mobile-testing" />
        </BottomNavigation>
      )}
    </>
  );
}
