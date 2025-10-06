import * as React from 'react';
import {
  Button,
  Snackbar,
  Alert,
  Stack,
  Typography,
  Box,
  Chip,
  Paper,
  Fab,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import AddIcon from '@mui/icons-material/Add';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import type { DayEntry } from '../types';
import AddWorkoutModal from './AddWorkoutModal';
import { useApiData, useWeekPlan } from '../data/store';
import { acquireWakeLock, releaseWakeLock } from '../utils/wakeLock';

import './DayScreen.css';

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

type Props = { dayLabel: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun' };

export default function DayScreen({ dayLabel }: Props) {
  const { catalog } = useApiData();
  const { plan, setPlan } = useWeekPlan();

  const [dayCompleted, setDayCompleted] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = React.useState(false);
  const [removeIndex, setRemoveIndex] = React.useState<number | null>(null);

  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [restLeft, setRestLeft] = React.useState<number | null>(null);
  const [restPaused, setRestPaused] = React.useState(false);
  const restTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const manage = async () => {
      if (restLeft !== null && restLeft > 0 && !restPaused) await acquireWakeLock();
      else await releaseWakeLock();
    };
    manage();
    return () => { releaseWakeLock(); };
  }, [restLeft, restPaused]);

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

  const handleAddEntry = (entry: DayEntry) => {
    const day = dayLabel;
    const list = [...plan[day]];
    const item = { ...entry, completedSets: 0 } as any;
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

  const plannedSetsToNumberSafe = (ex: DayEntry) => {
    const n = plannedSetsToNumber(ex.sets);
    return n > 0 ? n : 3;
  };

  const entries = plan[dayLabel];

  return (
    <>
      <Box className="dayscreen-container">
        <Box className="dayscreen-header">
          <Typography variant="subtitle1" className="dayscreen-header-title">
            {dayCompleted ? 'All exercises complete' : 'Exercises'}
          </Typography>
          <Button
            startIcon={<DoneAllIcon />}
            variant={dayCompleted ? 'contained' : 'outlined'}
            color={dayCompleted ? 'success' : 'inherit'}
            onClick={toggleDayComplete}
            disabled={dayCompleted}
            className="dayscreen-mark-complete-btn"
          >
            {dayCompleted ? 'Day complete' : 'Mark complete'}
          </Button>
        </Box>

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

        <Stack spacing={2}>
          {entries.map((ex: any, i) => {
            const total = plannedSetsToNumberSafe(ex);
            const done = ex.completedSets ?? 0;
            const complete = total > 0 && done >= total;
            const pct = Math.min(100, Math.round((done / Math.max(1, total)) * 100));

            const status =
              done === 0
                ? 'notStarted'
                : done > 0 && done < total
                ? 'inProgress'
                : 'completed';

            return (
              <Paper
                key={`${ex.name}-${i}`}
                elevation={1}
                className={`dayscreen-exercise-card ${status}`}
              >
                {complete && (
                  <Box className="dayscreen-exercise-complete-icon">
                    <CheckCircleIcon fontSize="large" />
                  </Box>
                )}

                <Typography variant="h6" className="dayscreen-exercise-name" title={ex.description}>
                  {ex.name}
                </Typography>

                {ex.description && (
                  <Typography variant="body2" className="dayscreen-exercise-desc">
                    {ex.description}
                  </Typography>
                )}

                <Typography variant="subtitle1" className="dayscreen-exercise-completed-sets">
                  Completed sets: {done}/{total}
                </Typography>

                <Stack direction="row" spacing={1} className="dayscreen-exercise-chip-row" flexWrap="wrap">
                  <Chip label={`Reps: ${ex.reps}`} color="primary" size="medium" />
                  <Chip label={`Rest: ${ex.rest}`} color="primary" size="medium" />
                  {ex.primaryMuscles?.length > 0 && (
                    <Chip label={`Primary: ${ex.primaryMuscles.join(', ')}`} size="medium" />
                  )}
                  {ex.secondaryMuscles?.length > 0 && (
                    <Chip label={`Secondary: ${ex.secondaryMuscles.join(', ')}`} size="medium" />
                  )}
                  {ex.equipment && <Chip label={ex.equipment} size="medium" />}
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={pct}
                  className={`dayscreen-progress-bar ${status}`}
                />

                <Stack direction="row" spacing={1} className="dayscreen-exercise-btn-row" flexWrap="wrap">
                  <Button size="small" variant="outlined" color="primary" onClick={() => decrementSet(i)}>
                    - Set
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color={complete ? 'success' : 'primary'}
                    onClick={() => incrementSet(i)}
                    disabled={complete}
                  >
                    {complete ? 'Done' : 'Done set'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteForeverIcon />}
                    onClick={() => requestRemove(i)}
                  >
                    Remove
                  </Button>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Box>

      {!open && (
        <Tooltip title="Add workout">
          <Fab
            color="primary"
            className="dayscreen-fab-add"
            onClick={() => setOpen(true)}
            aria-label="Add workout"
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}

      <AddWorkoutModal open={open} onClose={() => setOpen(false)} muscleGroups={catalog} onAdd={handleAddEntry} onAddCustom={() => {}} />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Reset today’s tracking?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will set completed sets to 0 for all exercises scheduled today. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button color="warning" variant="contained" onClick={resetDayConfirmed}>
            Reset
          </Button>
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
          <Button onClick={() => setConfirmRemoveOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmRemove}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toastOpen} onClose={() => setToastOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
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
                <Button color="inherit" size="small" onClick={() => setToastOpen(false)}>
                  OK
                </Button>
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
