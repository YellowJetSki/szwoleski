import { useEffect, useState } from 'react';
import type { ApiData, WeekPlan, MuscleGroup } from '../types';

const LS_API = 'apiData';
const LS_CATALOG = 'userCatalog';
const LS_PLAN = 'weekPlan';

export function useApiData() {
  const [api, setApi] = useState<ApiData|null>(null);
  const [catalog, setCatalog] = useState<MuscleGroup[]>([]);

  useEffect(() => {
    const boot = async () => {
      const cachedApi = localStorage.getItem(LS_API);
      if (cachedApi) {
        const parsed: ApiData = JSON.parse(cachedApi);
        setApi(parsed);
        setCatalog(parsed.catalog.muscleGroups);
      }
      try {
        const res = await fetch('/data/api.json', { cache: 'no-cache' });
        const json: ApiData = await res.json();
        setApi(json);
        setCatalog(json.catalog.muscleGroups);
        localStorage.setItem(LS_API, JSON.stringify(json));
        if (!localStorage.getItem(LS_CATALOG)) {
          localStorage.setItem(LS_CATALOG, JSON.stringify(json.catalog.muscleGroups));
        }
      } catch {}
      const uc = localStorage.getItem(LS_CATALOG);
      if (uc) setCatalog(JSON.parse(uc));
    };
    boot();
  }, []);

  const saveCatalog = (groups: MuscleGroup[]) => {
    setCatalog(groups);
    localStorage.setItem(LS_CATALOG, JSON.stringify(groups));
  };

  return { api, catalog, setCatalog: saveCatalog };
}

export function useWeekPlan() {
  const [plan, setPlan] = useState<WeekPlan>({
    Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
  });

  useEffect(() => {
    const cached = localStorage.getItem(LS_PLAN);
    if (cached) setPlan(JSON.parse(cached));
  }, []);

  const save = (next: WeekPlan) => {
    setPlan(next);
    localStorage.setItem(LS_PLAN, JSON.stringify(next));
  };

  return { plan, setPlan: save };
}
