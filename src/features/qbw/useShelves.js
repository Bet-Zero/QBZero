import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { fetchShelves, saveShelves } from '@/firebase/qbwShelfHelpers';
import { normalizeShelves } from '@/utils/qbw/shelves';

/** The Crystal Ball shelves, and a way to save edited ones. */
const useShelves = () => {
  const [shelves, setShelves] = useState(() => normalizeShelves(null));

  useEffect(() => {
    let cancelled = false;
    fetchShelves()
      .then((saved) => {
        if (!cancelled && saved) setShelves(normalizeShelves(saved));
      })
      .catch((error) => {
        console.error('Error loading crystal ball shelves:', error);
        toast.error('Failed to load the crystal ball shelves');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Resolves true once saved; the page keeps showing the old shelves if not.
  const save = useCallback(async (next) => {
    const cleaned = normalizeShelves(next);
    try {
      await saveShelves(cleaned);
      setShelves(cleaned);
      toast.success('Shelves saved');
      return true;
    } catch (error) {
      console.error('Error saving crystal ball shelves:', error);
      toast.error(
        error?.code === 'permission-denied'
          ? "Couldn't save: the database rules don't allow shelf edits yet"
          : 'Failed to save the shelves'
      );
      return false;
    }
  }, []);

  return { shelves, save };
};

export default useShelves;
