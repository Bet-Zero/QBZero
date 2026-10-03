import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { fetchAllTakes } from '@/firebase/takeHelpers';

/** Every take on the board, newest first, plus a way to re-read them. */
const useTakes = () => {
  const [takes, setTakes] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setTakes(await fetchAllTakes());
    } catch {
      toast.error('Failed to load takes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { takes, loading, reload };
};

export default useTakes;
