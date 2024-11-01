import { useEffect, useState } from 'react';

import useAuth from './useAuth';

import { tutorialsData } from '@/lib/dummyData';
import { Record } from '@/lib/types';

const useTutorials = () => {
  const [tutorials, setTutorials] = useState<Record[] | null>(null);
  const [defaultTutorial, setDefaultTutorial] = useState<Record | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    setTutorials(tutorialsData);
  }, [user]);

  useEffect(() => {
    if (!tutorials) return;
    setDefaultTutorial(tutorials[0]);
  }, [tutorials]);

  return {
    tutorials,
    defaultTutorial,
    user,
  };
};

export default useTutorials;
