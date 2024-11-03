import { useState, useEffect } from 'react';

import gradesLocationsData from '../constants/LocationClass.json';

interface UseLoadDataResult {
  grades: string[];
  locations: string[];
  isLoading: boolean;
  error: string | null;
}

const useLocationGrades = (): UseLoadDataResult => {
  const [grades, setGrades] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setGrades(gradesLocationsData.grades);
      setLocations(gradesLocationsData.locations);
    } catch (err) {
      console.error('Failed to load grades and locations:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { grades, locations, isLoading, error };
};

export default useLocationGrades;
