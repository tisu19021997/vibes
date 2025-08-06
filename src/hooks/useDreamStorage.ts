import { useState, useEffect } from 'react';
import { Dream } from '@/types/dream';

const STORAGE_KEY = 'dreams_gallery';

export const useDreamStorage = () => {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDreams();
  }, []);

  const loadDreams = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedDreams = JSON.parse(stored).map((dream: any) => ({
          ...dream,
          createdAt: new Date(dream.createdAt),
          updatedAt: new Date(dream.updatedAt),
          tarotCard: dream.tarotCard ? {
            ...dream.tarotCard,
            createdAt: new Date(dream.tarotCard.createdAt)
          } : undefined
        }));
        setDreams(parsedDreams);
      }
    } catch (error) {
      console.error('Error loading dreams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDream = (dream: Dream) => {
    const updatedDreams = [dream, ...dreams.filter(d => d.id !== dream.id)];
    setDreams(updatedDreams);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDreams));
  };

  const deleteDream = (dreamId: string) => {
    const updatedDreams = dreams.filter(d => d.id !== dreamId);
    setDreams(updatedDreams);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDreams));
  };

  const getDream = (dreamId: string) => {
    return dreams.find(d => d.id === dreamId);
  };

  return {
    dreams,
    isLoading,
    saveDream,
    deleteDream,
    getDream,
    reload: loadDreams
  };
};