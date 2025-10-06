import React from 'react';
import {
  CssBaseline, ThemeProvider, createTheme, Box, AppBar, Toolbar, Typography,
  BottomNavigation, BottomNavigationAction, Paper, Container
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TodayIcon from '@mui/icons-material/Today';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DayScreen from './components/DayScreen';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0f1115', paper: '#141821' },
    primary: { main: '#7cc5ff' },
    secondary: { main: '#a0e46b' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiBottomNavigationAction: {
      styleOverrides: { root: { paddingTop: 10, paddingBottom: 10, minWidth: 72 } }
    },
  },
  typography: {
    fontFamily: ['Inter','system-ui','Segoe UI','Roboto','Helvetica','Arial'].join(','),
  },
});

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as const;
type DayIndex = 0|1|2|3|4|5|6;

export default function App() {
  const todayIndex = ((new Date().getDay() + 6) % 7) as DayIndex;
  const [day, setDay] = React.useState<DayIndex>(todayIndex);

  const BOTTOM_NAV_H = 72;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AppBar position="fixed" color="transparent" elevation={0}>
        <Toolbar sx={{ gap: 1, pt: 'env(safe-area-inset-top)' }}>
          <FitnessCenterIcon color="primary" />
          <Typography variant="h6">Workout</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <TodayIcon color="primary" />
        </Toolbar>
      </AppBar>

      {/* Fluid, minimal-padding main to avoid squish */}
      <Box
        component="main"
        sx={{
          pt: `calc(56px + env(safe-area-inset-top))`,
          pb: `calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom))`,
          minHeight: '100svh',
          boxSizing: 'border-box',
          overflowX: 'hidden'
        }}
      >
        <Container maxWidth={false} disableGutters>
          <Box sx={{ px: 12/8, pb: 12/8 }}>
            <Box
              sx={{
                p: 16/8,
                borderRadius: 8/8,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" gutterBottom>
                {days[day]} plan
              </Typography>
              <DayScreen dayLabel={days[day]} />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Bottom nav with safe-area and horizontal scroll if needed */}
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          pb: 'env(safe-area-inset-bottom)'
        }}
      >
        <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <BottomNavigation
            value={day}
            onChange={(_e, v) => setDay(v as DayIndex)}
            showLabels
            sx={{ height: BOTTOM_NAV_H, minWidth: 500, px: 1 }}
          >
            {days.map((label) => (
              <BottomNavigationAction key={label} label={label} icon={<CalendarMonthIcon />} sx={{ minWidth: { xs: 72, sm: 80 } }} />
            ))}
          </BottomNavigation>
        </Box>
      </Paper>
    </ThemeProvider>
  );
}
