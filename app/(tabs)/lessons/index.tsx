import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import CurrentLevelProgressCard from '@/components/lessons/CurrentLevelProgressCard';
import { LessonsBanner } from '@/components/lessons/LessonsBanner';
import LessonsCategory from '@/components/lessons/LessonsCategory';
import useLessons from '@/hooks/useLessons';

const index = () => {
  const { progressSummary } = useLessons();
  const [isLoading, setIsLoading] = useState(false);
  const [lessonCount, setLessonCount] = useState({});
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

  useEffect(() => {
    const fetchLessonCounts = async () => {
      const levels: string[] = [
        'Beginner',
        'Basic Elementary',
        'Intermediate',
        'Advanced',
      ];
      const counts = {};

      try {
        setIsLoading(true);
        for (const level of levels) {
          const response = await fetch(
            `${BASE_URL}/nugget?and=(lesson.tags.title.eq.${level})&select=lesson(id,title,description,active,tags,title,id,illustration),gesture,priority,id,title,active`,
          );
          const data = await response.json();
          if (response.ok) {
            counts[level] = data.meta.count;
          }
        }
        setLessonCount(counts);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching lesson counts:', error);
      }
    };
    fetchLessonCounts();
  }, []);

  console.log('setLessonCount', lessonCount);
  return (
    <View style={styles.container}>
      {/* Banner */}
      <LessonsBanner />

      {/* Current Level Progress */}
      <CurrentLevelProgressCard />

      {/* Lesssons Categories cards listing */}
      {progressSummary && <LessonsCategory progressSummary={progressSummary} />}
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 20,
  },
});
