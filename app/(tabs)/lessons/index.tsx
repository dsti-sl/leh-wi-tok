import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router/build/useFocusEffect';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

import CurrentLevelProgressCard from '@/components/lessons/CurrentLevelProgressCard';
import { LessonsBanner } from '@/components/lessons/LessonsBanner';
import LessonsCategory from '@/components/lessons/LessonsCategory';
import useLessons from '@/hooks/useLessons';

const index = () => {
  const { progressSummary } = useLessons();
  const [isLoading, setIsLoading] = useState(false);
  const [lessonCount, setLessonCount] = useState({});
  const [accumulatedData, setAccumulatedData] = useState<unknown>(null);
  const [completedData, setCompletedData] = useState<unknown>(null);
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

  const getLesson = async () => {
    const storedCompleted: unknown =
      await AsyncStorage.getItem('completedLesson');
    const completedStoredData = storedCompleted
      ? JSON.parse(storedCompleted)
      : { user: {}, lessons: [] };

    console.log('completedStoredData', completedStoredData);

    // Calculate accumulated lessons and completed lessons
    const lessonsData = completedStoredData.lessons || [];
    const accumulatedLessons = lessonsData.reduce(
      (total, lesson) => total + (lesson.totallessons || 0),
      0,
    );
    const accumulatedCompletedLessons = lessonsData.reduce(
      (total, lesson) => total + (lesson.totalCompleted || 0),
      0,
    );

    const overallData = {
      accumulatedLessons,
      accumulatedCompletedLessons,
    };

    setAccumulatedData(overallData);

    setCompletedData({ ...completedStoredData, overallData });
  };

  const fetchLessonCounts = useCallback(async () => {
    const levels: string[] = [
      'Beginner',
      'Basic Elementary',
      'Intermediate',
      'Advanced',
    ];
    const counts: Record<string, number> = {};
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
  }, []);

  useEffect(() => {
    fetchLessonCounts();
    getLesson();
  }, [fetchLessonCounts]);

  useFocusEffect(
    useCallback(() => {
      fetchLessonCounts();
      getLesson();
    }, [fetchLessonCounts]),
  );

  console.log('completedData', completedData);
  console.log('lessonCount', lessonCount);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Banner */}
      <LessonsBanner />

      {/* Current Level Progress */}
      <CurrentLevelProgressCard accumulatedData={accumulatedData} />

      {/* Lesssons Categories cards listing */}
      {progressSummary && (
        <LessonsCategory
          lessonCount={lessonCount}
          progressSummary={progressSummary}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
// Removed the incorrect local useCallback definition
