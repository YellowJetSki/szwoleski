import * as React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, TextField, Button, Box, Stack, Autocomplete, Chip
} from '@mui/material';
import type { MuscleGroup, Workout, DayEntry } from '../types';

type Option = Workout & { group: string };

type Props = {
  open: boolean;
  onClose: () => void;
  muscleGroups: MuscleGroup[];
  onAdd: (entry: DayEntry) => void;
  onAddCustom: (workout: Workout, groupName: string) => void;
};

export default function AddWorkoutModal({
  open,
  onClose,
  muscleGroups,
  onAdd,
  onAddCustom,
}: Props) {
  const [tab, setTab] = React.useState(0);

  const allWorkouts = React.useMemo(() => {
    return muscleGroups.flatMap((group) =>
      group.workouts.map((workout) => ({ ...workout, group: group.group }))
    );
  }, [muscleGroups]);

  const [selected, setSelected] = React.useState<Option | null>(null);

  const [catalogSets, setCatalogSets] = React.useState('');
  const [catalogReps, setCatalogReps] = React.useState('');
  const [catalogRest, setCatalogRest] = React.useState('');
  const [catalogDesc, setCatalogDesc] = React.useState('');

  React.useEffect(() => {
    if (selected) {
      setCatalogSets(String(selected.sets ?? ''));
      setCatalogReps(selected.recommendedReps ?? '');
      setCatalogRest(selected.recommendedRest ?? '');
      setCatalogDesc(selected.description ?? '');
    } else {
      setCatalogSets('');
      setCatalogReps('');
      setCatalogRest('');
      setCatalogDesc('');
    }
  }, [selected]);

  const handleAdd = () => {
    if (!selected) return;

    const entry: DayEntry = {
      name: selected.name,
      sets: catalogSets || String(selected.sets),
      reps: catalogReps,
      rest: catalogRest,
      equipment: selected.equipment,
      primaryMuscles: selected.primaryMuscles,
      secondaryMuscles: selected.secondaryMuscles,
      description: catalogDesc,
      completedSets: 0,
    };

    onAdd(entry);
    onClose();
  };

  const [customGroup, setCustomGroup] = React.useState('');
  const [customWorkout, setCustomWorkout] = React.useState<
    Workout & { description?: string }
  >({
    name: '',
    equipment: 'bodyweight',
    sets: 3,
    recommendedReps: '',
    recommendedRest: '',
    primaryMuscles: [],
    secondaryMuscles: [],
    description: '',
  });

  const handleAddCustom = () => {
    if (!customGroup || !customWorkout.name) return;

    onAddCustom(customWorkout, customGroup);

    onAdd({
      name: customWorkout.name,
      sets: String(customWorkout.sets),
      reps: customWorkout.recommendedReps,
      rest: customWorkout.recommendedRest,
      equipment: customWorkout.equipment,
      primaryMuscles: customWorkout.primaryMuscles,
      secondaryMuscles: customWorkout.secondaryMuscles,
      description: customWorkout.description || '',
      completedSets: 0,
    });

    onClose();
  };

  React.useEffect(() => {
    if (!open) {
      setSelected(null);
      setCatalogSets('');
      setCatalogReps('');
      setCatalogRest('');
      setCatalogDesc('');
      setCustomGroup('');
      setCustomWorkout({
        name: '',
        equipment: 'bodyweight',
        sets: 3,
        recommendedReps: '',
        recommendedRest: '',
        primaryMuscles: [],
        secondaryMuscles: [],
        description: '',
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Workout</DialogTitle>
      <Tabs
        value={tab}
        onChange={(_, newValue) => setTab(newValue)}
        sx={{ px: 2 }}
      >
        <Tab label="From Catalog" />
        <Tab label="Custom" />
      </Tabs>

      <DialogContent>
        {tab === 0 && (
          <Stack spacing={2} sx={{ pt: 2 }}>
            <Autocomplete
              options={allWorkouts}
              value={selected}
              onChange={(_, value) => setSelected(value)}
              getOptionLabel={(option) =>
                `${option.name} • ${option.group} • ${option.equipment}`
              }
              isOptionEqualToValue={(option, value) => option === value}
              renderInput={(params) => (
                <TextField {...params} label="Select Workout" />
              )}
            />
            <TextField
              label="Sets"
              value={catalogSets}
              onChange={(e) => setCatalogSets(e.target.value)}
              type="text"
            />
            <TextField
              label="Reps"
              value={catalogReps}
              onChange={(e) => setCatalogReps(e.target.value)}
              type="text"
            />
            <TextField
              label="Rest"
              value={catalogRest}
              onChange={(e) => setCatalogRest(e.target.value)}
              type="text"
            />
            <TextField
              key={catalogDesc}
              label="Description"
              multiline
              minRows={3}
              value={catalogDesc || ''}
              onChange={(e) => setCatalogDesc(e.target.value)}
              inputProps={{ 'aria-label': 'Workout description' }}
            />
            {selected && (
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={`Primary: ${selected.primaryMuscles.join(', ')}`}
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  label={`Secondary: ${selected.secondaryMuscles.join(', ')}`}
                  sx={{ mb: 1 }}
                />
              </Box>
            )}
          </Stack>
        )}

        {tab === 1 && (
          <Stack spacing={2} sx={{ pt: 2 }}>
            <TextField
              label="Muscle Group"
              value={customGroup}
              onChange={(e) => setCustomGroup(e.target.value)}
            />
            <TextField
              label="Name"
              value={customWorkout.name}
              onChange={(e) =>
                setCustomWorkout((c) => ({ ...c, name: e.target.value }))
              }
            />
            <TextField
              label="Equipment"
              value={customWorkout.equipment}
              onChange={(e) =>
                setCustomWorkout((c) => ({
                  ...c,
                  equipment: e.target.value as Workout['equipment'],
                }))
              }
            />
            <TextField
              label="Sets"
              value={String(customWorkout.sets)}
              type="number"
              onChange={(e) =>
                setCustomWorkout((c) => ({ ...c, sets: Number(e.target.value) }))
              }
            />
            <TextField
              label="Reps"
              value={customWorkout.recommendedReps}
              onChange={(e) =>
                setCustomWorkout((c) => ({ ...c, recommendedReps: e.target.value }))
              }
            />
            <TextField
              label="Rest"
              value={customWorkout.recommendedRest}
              onChange={(e) =>
                setCustomWorkout((c) => ({ ...c, recommendedRest: e.target.value }))
              }
            />
            <TextField
              label="Description"
              value={customWorkout.description || ''}
              multiline
              minRows={3}
              onChange={(e) =>
                setCustomWorkout((c) => ({ ...c, description: e.target.value }))
              }
            />
            <TextField
              label="Primary Muscles (comma-separated)"
              value={customWorkout.primaryMuscles.join(', ')}
              onChange={(e) =>
                setCustomWorkout((c) => ({
                  ...c,
                  primaryMuscles: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
            />
            <TextField
              label="Secondary Muscles (comma-separated)"
              value={customWorkout.secondaryMuscles.join(', ')}
              onChange={(e) =>
                setCustomWorkout((c) => ({
                  ...c,
                  secondaryMuscles: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {tab === 0 ? (
          <Button onClick={handleAdd} disabled={!selected}>
            Add
          </Button>
        ) : (
          <Button
            onClick={handleAddCustom}
            disabled={!customGroup || !customWorkout.name}
          >
            Save & Add
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
