import { useState, useEffect } from 'react';
import { Dream } from '@/types/dream';
import { APP_CONFIG } from '@/config/app';

export const useDreamStorage = () => {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDreams = () => {
      try {
        const savedDreams = localStorage.getItem(APP_CONFIG.storage.dreams);
        if (savedDreams) {
          setDreams(JSON.parse(savedDreams));
        }
      } catch (error) {
        console.error('Error loading dreams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDreams();
  }, []);

  const saveDream = (dream: Dream) => {
    const updatedDreams = [dream, ...dreams];
    setDreams(updatedDreams);
    localStorage.setItem(APP_CONFIG.storage.dreams, JSON.stringify(updatedDreams));
  };

  const deleteDream = (dreamId: string) => {
    const updatedDreams = dreams.filter(dream => dream.id !== dreamId);
    setDreams(updatedDreams);
    localStorage.setItem(APP_CONFIG.storage.dreams, JSON.stringify(updatedDreams));
  };

  return {
    dreams,
    saveDream,
    deleteDream,
    isLoading
  };
};
