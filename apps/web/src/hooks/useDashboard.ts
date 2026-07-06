import { useState, useEffect, useCallback } from 'react';
import { getDashboardDataAggregated, type DashboardData } from '../api/dashboard';

interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDashboardDataAggregated();
      setData(result);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || '数据加载失败';
      console.error('[Dashboard]', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
