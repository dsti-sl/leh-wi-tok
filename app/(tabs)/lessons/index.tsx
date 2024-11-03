import React from 'react';
import { StyleSheet, View } from 'react-native';

import CurrentLevelProgressCard from '@/components/lessons/CurrentLevelProgressCard';
import { LessonsBanner } from '@/components/lessons/LessonsBanner';
import LessonsCategory from '@/components/lessons/LessonsCategory';
import useLessons from '@/hooks/useLessons';

const index = () => {
  const { progressSummary } = useLessons();

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
