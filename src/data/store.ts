import { useEffect, useState } from 'react';
import type { ApiData, WeekPlan, MuscleGroup } from '../types';

const LS_API = 'apiData';
const LS_CATALOG = 'userCatalog';
const LS_PLAN = 'weekPlan';

// Compare semantic version strings ("1.2.3")
function semverCompare(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

export function useApiData() {
  const [api, setApi] = useState<ApiData | null>(null);
  const [catalog, setCatalog] = useState<MuscleGroup[]>([]);

  useEffect(() => {
    const boot = async () => {
      let cachedApi: ApiData | null = null;
      const cachedApiStr = localStorage.getItem(LS_API);
      if (cachedApiStr) {
        try {
          cachedApi = JSON.parse(cachedApiStr);
          setApi(cachedApi);
          setCatalog(cachedApi.catalog.muscleGroups);
        } catch {}
      }

      try {
        const res = await fetch('/data/api.json', { cache: 'no-cache' });
        const json: ApiData = await res.json();

        // Update localStorage and state if no cache or newer version
        if (
          !cachedApi ||
          semverCompare(json.version, cachedApi.version) > 0
        ) {
          setApi(json);
          setCatalog(json.catalog.muscleGroups);
          localStorage.setItem(LS_API, JSON.stringify(json));
          if (!localStorage.getItem(LS_CATALOG)) {
            localStorage.setItem(LS_CATALOG, JSON.stringify(json.catalog.muscleGroups));
          }
        }
      } catch {
        // Could not fetch fresh data, fallback to cache is already set
      }
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
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    Sat: [],
    Sun: []
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
