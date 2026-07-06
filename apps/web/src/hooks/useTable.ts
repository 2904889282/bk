import { useState, useEffect, useRef, useCallback } from 'react';

interface TableState<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
  loading: boolean;
  selectedRowKeys: React.Key[];
  selectedRows: T[];
}

interface UseTableOptions<T extends object, P extends object> {
  fetchApi: (params: P & { pageNum: number; pageSize: number }) => Promise<{ records?: T[]; list?: T[]; total: number }>;
  defaultPageSize?: number;
  /** 筛选项，变化时自动重置到第一页 */
  filters?: P;
  /** 获取行唯一 key，默认 'id' */
  rowKey?: keyof T | ((record: T) => React.Key);
}

export function useTable<T extends object, P extends object = Record<string, never>>(
  options: UseTableOptions<T, P>
) {
  const { fetchApi, defaultPageSize = 15, filters = {} as P, rowKey = 'id' as keyof T } = options;

  const [state, setState] = useState<TableState<T>>({
    list: [], total: 0, pageNum: 1, pageSize: defaultPageSize,
    loading: false, selectedRowKeys: [], selectedRows: [],
  });

  const prevFiltersRef = useRef(JSON.stringify(filters));

  const loadData = useCallback(async (pn?: number, ps?: number) => {
    const pageNum = pn ?? state.pageNum;
    const pageSize = ps ?? state.pageSize;
    setState(s => ({ ...s, loading: true }));
    try {
      const res = await fetchApi({ ...filters, pageNum, pageSize } as P & { pageNum: number; pageSize: number });
      const list = res.records ?? res.list ?? [];
      setState(s => ({
        ...s, list, total: res.total ?? 0, pageNum, pageSize, loading: false,
        // 如果页数变了，清空跨页选择
        selectedRowKeys: pn !== undefined && pn !== s.pageNum ? s.selectedRowKeys : s.selectedRowKeys,
        selectedRows: pn !== undefined && pn !== s.pageNum ? s.selectedRows : s.selectedRows,
      }));
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [fetchApi, filters, state.pageNum, state.pageSize]);

  // 筛选条件变化 → 重置到第一页
  useEffect(() => {
    const currentFilters = JSON.stringify(filters);
    if (currentFilters !== prevFiltersRef.current) {
      prevFiltersRef.current = currentFilters;
      loadData(1, state.pageSize);
    }
  }, [JSON.stringify(filters)]);

  // 初始加载
  useEffect(() => { loadData(1, state.pageSize); }, []);

  const refresh = useCallback(() => loadData(state.pageNum, state.pageSize), [loadData, state.pageNum, state.pageSize]);

  const setPage = useCallback((pn: number, ps: number) => loadData(pn, ps), [loadData]);

  const setSelected = useCallback((keys: React.Key[], rows: T[]) => {
    setState(s => ({ ...s, selectedRowKeys: keys, selectedRows: rows }));
  }, []);

  const getRowKey = useCallback((record: T): React.Key => {
    if (typeof rowKey === 'function') return rowKey(record);
    return String(record[rowKey as keyof T] ?? '');
  }, [rowKey]);

  return {
    ...state, refresh, setPage, setSelected, getRowKey, loadData,
  };
}
