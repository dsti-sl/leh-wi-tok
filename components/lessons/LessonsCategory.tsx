import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, router } from 'expo-router';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import LessonCard from './LessonCard';

import { Record } from '@/lib/types';
import {
  getBaseUrl,
  LessonCompletionData,
  LessonLevel,
  LessonProgress,
  LessonsCategoryProps,
} from '@/utils';

// -- Helper functions outside component (pure, testable) --
const getStoredUserId = async (): Promise<string | null> => {
  const user = await AsyncStorage.getItem('user');
  return user ? JSON.parse(user).id : null;
};

const fetchLessonProgress = async (baseUrl: string, userId: string) => {
  const url = `${baseUrl}/lesson-progress?and=(user.id.eq.${userId})&select=totalCompleted,user(id,name),level,totalLessons,lessonsCompleted,id,updatedAt,createdAt`;
  const response = await fetch(url);
  const { data } = await response.json();
  return data as LessonProgress[] | undefined;
};

const storeCompletedLessons = async (lessons: LessonProgress[]) => {
  await AsyncStorage.setItem('completedLesson', JSON.stringify({ lessons }));
};

const getStoredCompletionData = async (): Promise<LessonCompletionData> => {
  const data = await AsyncStorage.getItem('completedLesson');
  if (data) {
    return JSON.parse(data);
  }
  return { lessons: [] };
};

const defaultLessonData = { totalCompleted: 0, totalLessons: 0 };

// -- Main Component --
const LessonsCategory: React.FC<LessonsCategoryProps> = ({
  progressSummary,
  lessonCount,
}) => {
  const [userCompletionRate, setUserCompletionRate] =
    useState<LessonCompletionData>({ lessons: [] });

  const EXPO_PUBLIC_BASE_URL = getBaseUrl();

  // Fetch latest server data and cache it locally on mount only
  useEffect(() => {
    const fetchAndStoreLessonProgress = async () => {
      try {
        const userId = await getStoredUserId();
        if (!userId || !EXPO_PUBLIC_BASE_URL) return;
        const serverLessons = await fetchLessonProgress(
          EXPO_PUBLIC_BASE_URL,
          userId,
        );
        if (serverLessons) {
          setUserCompletionRate({ lessons: serverLessons });
          await storeCompletedLessons(serverLessons);
        }
      } catch (error) {
        console.warn(
          'Lesson progress API failed, trying local fallback.',
          error,
        );
      }
    };
    fetchAndStoreLessonProgress();
  }, []);

  // Local (possibly stale) state update
  const updateCompletionFromStorage = useCallback(async () => {
    try {
      const completionData = await getStoredCompletionData();
      setUserCompletionRate(completionData);
    } catch (error) {
      console.error('Failed to fetch completed lessons:', error);
      setUserCompletionRate({ lessons: [] });
    }
  }, []);

  // Load local completion state on mount and focus
  useEffect(() => {
    updateCompletionFromStorage();
  }, [updateCompletionFromStorage]);

  useFocusEffect(
    useCallback(() => {
      updateCompletionFromStorage();
    }, [updateCompletionFromStorage]),
  );

  // Helper for level-based lesson data
  const getLessonData = useCallback(
    (level: LessonLevel) =>
      userCompletionRate.lessons.find((lesson) => lesson.level === level) ?? {
        ...defaultLessonData,
        totalLessons: lessonCount[level] ?? 0,
      },
    [userCompletionRate.lessons, lessonCount],
  );

  // Memoized lesson data (prevents unnecessary re-calculation)
  const lessonData = useMemo(
    () => ({
      Beginner: getLessonData('Beginner'),
      'Basic Elementary': getLessonData('Basic Elementary'),
      Intermediate: getLessonData('Intermediate'),
      Advanced: getLessonData('Advanced'),
    }),
    [getLessonData],
  );

  // Card definitions for DRYness and easy updates
  const cards = [
    {
      key: 'Beginner',
      color: '#3e585e',
      assessment: 'Beginner',
    },
    {
      key: 'Basic Elementary',
      color: '#1b6c82',
      assessment: 'Basic Elementary',
    },
    {
      key: 'Intermediate',
      color: '#2e6270',
      assessment: 'Intermediate',
    },
    {
      key: 'Advanced',
      color: '#3088a0',
      assessment: 'Advanced',
    },
  ] as const;

  return (
    <View style={styles.cardsContainer}>
      <View style={styles.cardRowContainer}>
        {cards.slice(0, 2).map(({ key, color, assessment }) => (
          <LessonCard
            key={key}
            title={(progressSummary[key] as Record).title as string}
            completed={lessonData[key]?.totalCompleted}
            totalLesson={lessonCount[key] ?? lessonData[key]?.totalLessons}
            onPress={() =>
              router.push(
                `/(tabs)/lessons/level/${(progressSummary[key] as Record).title}?assessment=${assessment}`,
              )
            }
            backgroundColor={color}
          />
        ))}
      </View>
      <View style={styles.cardRowContainer}>
        {cards.slice(2).map(({ key, color, assessment }) => (
          <LessonCard
            key={key}
            title={(progressSummary[key] as Record).title as string}
            // completed={
            //   lessonData[key.replace(' ', '') as keyof typeof lessonData]
            //     .totalCompleted
            // }
            // totalLesson={
            //   lessonData[key.replace(' ', '') as keyof typeof lessonData]
            //     .totalLessons
            // }
            completed={lessonData[key]?.totalCompleted}
            totalLesson={lessonCount[key] ?? lessonData[key]?.totalLessons}
            onPress={() =>
              router.push(
                `/(tabs)/lessons/level/${(progressSummary[key] as Record).title}?assessment=${assessment}`,
              )
            }
            backgroundColor={color}
          />
        ))}
      </View>
    </View>
  );
};

export default LessonsCategory;

const styles = StyleSheet.create({
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  cardRowContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 20,
  },
});
