import * as React from 'react';
import {
  Button, Snackbar, Alert, Stack, Typography, Box, Chip, Paper, Fab, LinearProgress, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import type { DayEntry } from '../types';
import AddWorkoutModal from './AddWorkoutModal';
import { useApiData, useWeekPlan } from '../data/store';
import { acquireWakeLock, releaseWakeLock } from '../utils/wakeLock';

const parseRestToSec = (rest: string): number => {
  if (!rest) return 90;
  const s = rest.toLowerCase().replace(/\s/g, '');
  const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  if (s.includes('min')) {
    const nums = s.replace('min', '').split('–').map(n => parseFloat(n)).filter(n => !isNaN(n));
    return (nums.length ? avg(nums) : 2) * 60;
  }
  if (s.includes('s')) {
    const nums = s.replace('s', '').split('–').map(n => parseFloat(n)).filter(n => !isNaN(n));
    return nums.length ? avg(nums) : 90;
  }
  const n = parseFloat(s);
  return isNaN(n) ? 90 : Math.round(n);
};

type Props = { dayLabel: 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun' };

export default function DayScreen({ dayLabel }: Props) {
  const { catalog } = useApiData();
  const { plan, setPlan } = useWeekPlan();

  const [dayCompleted, setDayCompleted] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  // Confirm dialogs
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = React.useState(false);
  const [removeIndex, setRemoveIndex] = React.useState<number | null>(null);

  // Rest timer
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [restLeft, setRestLeft] = React.useState<number | null>(null);
  const [restPaused, setRestPaused] = React.useState(false);
  const restTimerRef = React.useRef<number | null>(null);

  // Wake lock
  React.useEffect(() => {
    const manage = async () => {
      if (restLeft !== null && restLeft > 0 && !restPaused) await acquireWakeLock();
      else await releaseWakeLock();
    };
    manage();
    return () => { releaseWakeLock(); };
  }, [restLeft, restPaused]);

  // Countdown
  React.useEffect(() => {
    if (restLeft === null || restPaused) return;
    if (restLeft <= 0) {
      setToastMsg('Rest complete — start next set');
      try { navigator.vibrate?.(200); } catch {}
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      restTimerRef.current = null;
      return;
    }
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    restTimerRef.current = window.setInterval(() => {
      setRestLeft(v => (v === null ? null : v - 1));
    }, 1000);
    return () => { if (restTimerRef.current) clearInterval(restTimerRef.current); };
  }, [restLeft, restPaused]);

  const startRest = (sec: number) => {
    setRestPaused(false);
    setRestLeft(sec);
    setToastMsg(`Rest ${sec}s`);
    setToastOpen(true);
  };

  const plannedSetsToNumber = (sets: number | string) => {
    if (typeof sets === 'number') return sets;
    const n = parseInt(String(sets).replace(/\D/g, ''), 10);
    return isNaN(n) ? 3 : n;
  };

  const isExerciseComplete = (ex: DayEntry) => {
    const goal = plannedSetsToNumber(ex.sets);
    const done = (ex as any).completedSets ?? 0;
    return done >= goal && goal > 0;
  };

  const computeDayComplete = (entries: DayEntry[]) => {
    return entries.length > 0 && entries.every(isExerciseComplete);
  };

  // Hydrate description from API if missing
  const hydrateDescription = (name: string, incoming?: string) => {
    if (incoming && incoming.trim().length > 0) return incoming;
    const match = catalog.flatMap(g => g.workouts).find(w => w.name === name);
    return (match as any)?.description || '';
  };

  // CRUD
  const handleAddEntry = (entry: DayEntry) => {
    const day = dayLabel;
    const list = [...plan[day]];
    const item = { ...entry, description: hydrateDescription(entry.name, (entry as any).description), completedSets: 0 } as any;
    list.push(item);
    const next = { ...plan, [day]: list };
    setPlan(next);
    setDayCompleted(computeDayComplete(list));
  };

  const incrementSet = (index: number) => {
    const day = dayLabel;
    const list = [...plan[day]];
    const item = { ...list[index] } as any;
    item.completedSets = (item.completedSets ?? 0) + 1;
    list[index] = item;
    const next = { ...plan, [day]: list };
    setPlan(next);
    const sec = parseRestToSec(item.rest || (item as any).recommendedRest || '90 s');
    startRest(sec);
    setDayCompleted(computeDayComplete(list));
  };

  const decrementSet = (index: number) => {
    const day = dayLabel;
    const list = [...plan[day]];
    const item = { ...list[index] } as any;
    item.completedSets = Math.max(0, (item.completedSets ?? 0) - 1);
    list[index] = item;
    const next = { ...plan, [day]: list };
    setPlan(next);
    setDayCompleted(computeDayComplete(list));
  };

  const requestRemove = (index: number) => {
    setRemoveIndex(index);
    setConfirmRemoveOpen(true);
  };

  const confirmRemove = () => {
    if (removeIndex === null) return;
    const day = dayLabel;
    const list = [...plan[day]];
    list.splice(removeIndex, 1);
    const next = { ...plan, [day]: list };
    setPlan(next);
    setDayCompleted(computeDayComplete(list));
    setConfirmRemoveOpen(false);
    setRemoveIndex(null);
  };

  const cancelRemove = () => {
    setConfirmRemoveOpen(false);
    setRemoveIndex(null);
  };

  // Day actions
  const resetDayConfirmed = () => {
    const day = dayLabel;
    const list = plan[day].map(ex => ({ ...ex, completedSets: 0 } as any));
    const next = { ...plan, [day]: list };
    setPlan(next);
    setDayCompleted(false);
    setConfirmOpen(false);
  };

  const toggleDayComplete = () => {
    if (dayCompleted) setDayCompleted(false);
    else setDayCompleted(computeDayComplete(plan[dayLabel]));
  };

  // Success border/icon only
  const rowPaperSx = (complete: boolean) => ({
    position: 'relative',
    padding: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
    color: (theme: any) => theme.palette.text.primary,
    borderRadius: 4,
    border: '1px solid',
    borderColor: complete ? ((theme: any) => theme.palette.success.main) : ((theme: any) => theme.palette.divider),
    boxShadow: 'none',
    width: '100%'
  });

  const overlayCheckSx = (theme: any) => ({
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    color: theme.palette.success.main
  });

  const textWrapSx = {
    whiteSpace: 'normal' as const,
    overflowWrap: 'anywhere' as const,
    wordBreak: 'break-word' as const,
    lineHeight: 1.4
  };

  const header = (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1, flexWrap: 'wrap' }}>
      <Typography variant="subtitle1" sx={{ ...textWrapSx, fontWeight: 600, flex: '1 1 auto', minWidth: 200 }}>
        {dayCompleted ? 'All exercises complete' : 'Exercises'}
      </Typography>
      <Button
        startIcon={<DoneAllIcon />}
        variant={dayCompleted ? 'contained' : 'outlined'}
        color={dayCompleted ? 'success' : 'inherit'}
        onClick={toggleDayComplete}
        disabled={dayCompleted}
        aria-disabled={dayCompleted}
        sx={{ flex: '0 0 auto' }}
      >
        {dayCompleted ? 'Day complete' : 'Mark complete'}
      </Button>
    </Box>
  );

  const entries = plan[dayLabel];

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {header}

        <Box sx={{ mb: 1 }}>
          <Button startIcon={<RestartAltIcon />} color="warning" variant="outlined" onClick={() => setConfirmOpen(true)}>
            Reset day
          </Button>
        </Box>

        {dayCompleted && entries.length > 0 && (
          <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ mb: 1 }}>
            All sets completed — excellent work.
          </Alert>
        )}

        {entries.length === 0 && (
          <Typography color="text.secondary" sx={{ mb: 1 }}>
            No exercises yet—tap the plus button to add one.
          </Typography>
        )}

        <Stack spacing={1}>
          {entries.map((ex: any, i) => {
            const total = plannedSetsToNumber(ex.sets);
            const done = ex.completedSets ?? 0;
            const complete = total > 0 && done >= total;
            const pct = Math.min(100, Math.round((done / Math.max(1, total)) * 100));
            const desc = hydrateDescription(ex.name, ex.description);

            return (
              <Paper key={`${ex.name}-${i}`} elevation={0} sx={rowPaperSx(complete)}>
                {complete && (
                  <Box sx={(theme) => overlayCheckSx(theme)}>
                    <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                  </Box>
                )}

                <Typography variant="subtitle1" sx={{ ...textWrapSx, fontWeight: 700, mb: 0.25 }}>
                  {ex.name}
                </Typography>

                {desc.trim().length > 0 && (
                  <Typography variant="body2" sx={{ ...textWrapSx, opacity: complete ? 0.95 : 0.92, mb: 0.5 }}>
                    {desc}
                  </Typography>
                )}

                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.9 }}>
                  Completed {done}/{total} sets
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    height: 6,
                    borderRadius: 4,
                    mb: 0.5,
                    bgcolor: (theme) => theme.palette.action.hover,
                    '& .MuiLinearProgress-bar': { bgcolor: (theme) => theme.palette.primary.main }
                  }}
                />

                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 0.5, mb: 0.75, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ ...textWrapSx }}>
                    Reps: {ex.reps}
                  </Typography>
                  <Chip size="small" variant="outlined" label={`Rest ${ex.rest}`} />
                  {ex.primaryMuscles?.length > 0 && (
                    <Chip size="small" variant="outlined" icon={<InfoOutlinedIcon />} label={`Primary: ${ex.primaryMuscles.join(', ')}`} />
                  )}
                  {ex.secondaryMuscles?.length > 0 && (
                    <Chip size="small" variant="outlined" label={`Secondary: ${ex.secondaryMuscles.join(', ')}`} />
                  )}
                  {ex.equipment && <Chip size="small" label={ex.equipment} />}
                </Stack>

                <Stack spacing={0.75} alignItems="stretch" sx={{ minWidth: 112 }}>
                  <Button
                    size="small"
                    variant={complete ? 'contained' : 'outlined'}
                    color={complete ? 'warning' : 'primary'}
                    onClick={() => decrementSet(i)}
                    sx={{ minHeight: 36 }}
                  >
                    Decrease
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color={complete ? 'success' : 'primary'}
                    onClick={() => incrementSet(i)}
                    disabled={complete}
                    sx={{ minHeight: 38, ...(complete ? { '&.Mui-disabled': { opacity: 0.9 } } : {}) }}
                  >
                    {complete ? 'Done' : 'Done set'}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteForeverIcon />}
                    onClick={() => requestRemove(i)}
                    sx={{ minHeight: 36 }}
                  >
                    Remove
                  </Button>
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        <Box sx={{ height: `calc(72px + env(safe-area-inset-bottom))` }} />
      </Box>

      {!open && (
        <Tooltip title="Add workout">
          <Fab
            color="primary"
            sx={(theme) => ({
              position: 'fixed',
              right: 16,
              bottom: `calc(88px + env(safe-area-inset-bottom))`,
              zIndex: theme.zIndex.tooltip
            })}
            onClick={() => setOpen(true)}
            aria-label="Add workout"
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}

      <AddWorkoutModal
        open={open}
        onClose={() => setOpen(false)}
        muscleGroups={catalog}
        onAdd={handleAddEntry}
        onAddCustomToCatalog={() => {}}
      />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Reset today’s tracking?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will set completed sets to 0 for all exercises scheduled today. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">Cancel</Button>
          <Button color="warning" variant="contained" onClick={resetDayConfirmed}>Reset</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmRemoveOpen} onClose={() => setConfirmRemoveOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Remove this exercise?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will remove the exercise from today’s plan. This action can’t be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemoveOpen(false)} color="inherit">Cancel</Button>
          <Button color="error" variant="contained" onClick={() => {
            if (removeIndex === null) return;
            const day = dayLabel;
            const list = [...plan[day]];
            list.splice(removeIndex, 1);
            const next = { ...plan, [day]: list };
            setPlan(next);
            setDayCompleted(computeDayComplete(list));
            setConfirmRemoveOpen(false);
            setRemoveIndex(null);
          }}>Remove</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity={restLeft && restLeft > 0 ? 'info' : 'success'}
          variant="filled"
          sx={{ width: '100%' }}
          action={
            <Stack direction="row" spacing={1}>
              {restLeft && restLeft > 0 ? (
                <>
                  <Button color="inherit" size="small" onClick={() => setRestPaused(p => !p)}>
                    {restPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button color="inherit" size="small" onClick={() => { setRestLeft(null); setToastMsg('Rest skipped'); }}>
                    Skip
                  </Button>
                </>
              ) : (
                <Button color="inherit" size="small" onClick={() => setToastOpen(false)}>OK</Button>
              )}
            </Stack>
          }
        >
          {restLeft && restLeft > 0 ? `Rest: ${restLeft}s` : toastMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
