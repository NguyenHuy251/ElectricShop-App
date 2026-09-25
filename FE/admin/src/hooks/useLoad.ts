import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../utils/errors';

export function useLoad<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true); setError('');
    try { const value = await loader(); if (generation.current === current) setData(value); }
    catch (e) { if (generation.current === current) setError(errorMessage(e)); }
    finally { if (generation.current === current) setLoading(false); }
  }, [loader]);
  useEffect(() => { void reload(); return () => { generation.current++; }; }, [reload]);
  return { data, loading, error, reload };
}
