import * as React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, TextField, Button, Box, Stack, Autocomplete, Chip
} from '@mui/material';
import type { MuscleGroup, Workout, DayEntry } from '../types';

type Option = Workout & { group: string; description: string };

type Props = {
  open: boolean;
  onClose: () => void;
  muscleGroups: MuscleGroup[];
  onAdd: (entry: DayEntry) => void;
  onAddCustomToCatalog: (w: Workout, groupName: string) => void;
};

export default function AddWorkoutModal({ open, onClose, muscleGroups, onAdd, onAddCustomToCatalog }: Props) {
  const [tab, setTab] = React.useState(0);

  // Preserve API fields verbatim and add group; ensure description exists on Option
  const allWorkouts = React.useMemo<Option[]>(
    () =>
      muscleGroups.flatMap((g) =>
        g.workouts.map((w) => ({
          ...w,
          group: g.group,
          description: (w as any).description || ''
        }))
      ),
    [muscleGroups]
  ); // [web:574][web:683]

  // Catalog selection and controlled inputs (identical for all fields)
  const [selected, setSelected] = React.useState<Option | null>(null);
  const [catalogSets, setCatalogSets] = React.useState('');
  const [catalogReps, setCatalogReps] = React.useState('');
  const [catalogRest, setCatalogRest] = React.useState('');
  const [catalogDesc, setCatalogDesc] = React.useState('');

  React.useEffect(() => {
    if (!selected) {
      setCatalogSets('');
      setCatalogReps('');
      setCatalogRest('');
      setCatalogDesc('');
      return;
    }
    setCatalogSets(String(selected.sets));
    setCatalogReps(selected.recommendedReps || '');
    setCatalogRest(selected.recommendedRest || '');
    setCatalogDesc(selected.description || '');
  }, [selected]); // [web:574]

  const handleAddFromCatalog = () => {
    if (!selected) return;
    const entry: DayEntry = {
      name: selected.name,
      sets: catalogSets || String(selected.sets),
      reps: catalogReps || selected.recommendedReps,
      rest: catalogRest || selected.recommendedRest,
      equipment: selected.equipment,
      primaryMuscles: selected.primaryMuscles,
      secondaryMuscles: selected.secondaryMuscles,
      description: catalogDesc || selected.description || '',
      completedSets: 0
    };
    onAdd(entry);
    onClose();
  };

  // Custom entry: treat description exactly like other fields on the same object
  const [customGroup, setCustomGroup] = React.useState('');
  const [custom, setCustom] = React.useState<Workout & { description?: string }>({
    name: '',
    equipment: 'bodyweight',
    sets: 3,
    recommendedReps: '8–12',
    recommendedRest: '60–90 s',
    primaryMuscles: [],
    secondaryMuscles: [],
    description: ''
  });

  const handleAddCustom = () => {
    if (!custom.name || !customGroup) return;
    onAddCustomToCatalog({ ...custom }, customGroup);
    const entry: DayEntry = {
      name: custom.name,
      sets: String(custom.sets),
      reps: custom.recommendedReps,
      rest: custom.recommendedRest,
      equipment: custom.equipment,
      primaryMuscles: custom.primaryMuscles,
      secondaryMuscles: custom.secondaryMuscles,
      description: custom.description || '',
      completedSets: 0
    };
    onAdd(entry);
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
      setCustom({
        name: '',
        equipment: 'bodyweight',
        sets: 3,
        recommendedReps: '8–12',
        recommendedRest: '60–90 s',
        primaryMuscles: [],
        secondaryMuscles: [],
        description: ''
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add workout</DialogTitle>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
        <Tab label="From catalog" />
        <Tab label="Custom" />
      </Tabs>
      <DialogContent>
        {tab === 0 && (
          <Stack spacing={2} sx={{ pt: 2 }}>
            <Autocomplete<Option>
              options={allWorkouts}
              value={selected}
              onChange={(_, v) => setSelected(v)}
              getOptionLabel={(o) => (o ? `${o.name} • ${o.group} • ${o.equipment}` : '')}
              isOptionEqualToValue={(a, b) => a?.name === b?.name}
              renderInput={(params) => <TextField {...params} label="Search workouts" />}
            />
            <TextField label="Sets" value={catalogSets} onChange={(e) => setCatalogSets(e.target.value)} />
            <TextField label="Reps" value={catalogReps} onChange={(e) => setCatalogReps(e.target.value)} />
            <TextField label="Rest" value={catalogRest} onChange={(e) => setCatalogRest(e.target.value)} />
            <TextField label="Description" value={catalogDesc} onChange={(e) => setCatalogDesc(e.target.value)} multiline minRows={2} />
            {selected && (
              <Box>
                <Chip label={`Primary: ${selected.primaryMuscles.join(', ')}`} sx={{ mr: 1, mb: 1 }} />
                <Chip label={`Secondary: ${selected.secondaryMuscles.join(', ')}`} sx={{ mr: 1, mb: 1 }} />
              </Box>
            )}
          </Stack>
        )}
        {tab === 1 && (
          <Stack spacing={2} sx={{ pt: 2 }}>
            <TextField label="Muscle group" value={customGroup} onChange={(e) => setCustomGroup(e.target.value)} />
            <TextField label="Name" value={custom.name} onChange={(e) => setCustom((s) => ({ ...s, name: e.target.value }))} />
            <TextField label="Equipment" value={custom.equipment} onChange={(e) => setCustom((s) => ({ ...s, equipment: e.target.value as any }))} />
            <TextField label="Default sets" type="number" value={custom.sets} onChange={(e) => setCustom((s) => ({ ...s, sets: Number(e.target.value) }))} />
            <TextField label="Recommended reps" value={custom.recommendedReps} onChange={(e) => setCustom((s) => ({ ...s, recommendedReps: e.target.value }))} />
            <TextField label="Recommended rest" value={custom.recommendedRest} onChange={(e) => setCustom((s) => ({ ...s, recommendedRest: e.target.value }))} />
            <TextField label="Description" value={custom.description || ''} onChange={(e) => setCustom((s) => ({ ...s, description: e.target.value }))} multiline minRows={2} />
            <TextField
              label="Primary muscles (comma-separated)"
              value={custom.primaryMuscles.join(', ')}
              onChange={(e) =>
                setCustom((s) => ({ ...s, primaryMuscles: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) }))
              }
            />
            <TextField
              label="Secondary muscles (comma-separated)"
              value={custom.secondaryMuscles.join(', ')}
              onChange={(e) =>
                setCustom((s) => ({ ...s, secondaryMuscles: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) }))
              }
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        {tab === 0 ? (
          <Button onClick={handleAddFromCatalog} variant="contained" disabled={!selected}>Add</Button>
        ) : (
          <Button onClick={handleAddCustom} variant="contained" disabled={!custom.name || !customGroup}>Save & Add</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
