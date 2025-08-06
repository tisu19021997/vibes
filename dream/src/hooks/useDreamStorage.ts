import { useState, useEffect, useCallback } from 'react';
import { Dream } from '@/types/dream';

const STORAGE_KEY = 'oneiroi_dreams';

export const useDreamStorage = () => {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDreams = useCallback(() => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored);
        const parsedDreams = parsedData.map((dream: any) => ({
          ...dream,
          createdAt: new Date(dream.createdAt),
          updatedAt: new Date(dream.updatedAt),
          image: dream.image ? { ...dream.image, createdAt: new Date(dream.image.createdAt) } : undefined,
        }));
        setDreams(parsedDreams);
      }
    } catch (error) {
      console.error('Error loading dreams from localStorage:', error);
      setDreams([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDreams();
  }, [loadDreams]);

  const saveDream = (dream: Dream) => {
    try {
      const updatedDreams = [dream, ...dreams.filter(d => d.id !== dream.id)];
      setDreams(updatedDreams);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDreams));
    } catch (error) {
      console.error('Failed to save dream to localStorage:', error);
    }
  };

  const deleteDream = (dreamId: string) => {
    try {
      const updatedDreams = dreams.filter(d => d.id !== dreamId);
      setDreams(updatedDreams);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDreams));
    } catch (error) {
      console.error('Failed to delete dream from localStorage:', error);
    }
  };

  return {
    dreams,
    isLoading,
    saveDream,
    deleteDream,
  };
};
