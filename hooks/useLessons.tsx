import { useEffect, useState } from 'react';

import { getDummyLessons } from '@/lib/dummyData';
import { Record } from '@/lib/types';

const useLessons = () => {
  const [lessons, setLessons] = useState<Record[] | null>(null);
  const [progressSummary, setProgressSummary] = useState<Record | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    getLessons();
  }, []);

  useEffect(() => {
    if (!lessons || lessons.length === 0) return;

    // TODO: Could be a fetch from the server
    // Mock implementation
    getLessonsSummary(lessons);
  }, [lessons]);

  const getLessonsSummary = async (lessons: Record[]) => {
    const summary = lessons.reduce((acc: Record, lesson: Record) => {
      if (!acc[lesson.level as string]) {
        acc[lesson.level as string] = {
          title: lesson.level as string,
        };
      }

      (acc[lesson.level as string] as Record)['total'] =
        (((acc[lesson.level as string] as Record).total as number) || 0) + 1;
      (acc[lesson.level as string] as Record)[lesson.status as string] =
        (((acc[lesson.level as string] as Record)[
          lesson.status as string
        ] as number) || 0) + 1;

      return acc;
    }, {});

    setProgressSummary(summary);
  };

  const getLessons = async () => {
    setLoading(true);
    try {
      const lessons = await getDummyLessons(60);
      setLessons(lessons as Record[]);
    } catch (error) {
      console.log('Error fetching lessons', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    lessons,
    loading,
    progressSummary,
  };
};

export default useLessons;
