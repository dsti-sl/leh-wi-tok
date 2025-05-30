import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState, useRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

import CurrentLevelProgressCard from '@/components/lessons/CurrentLevelProgressCard';
import { LessonsBanner } from '@/components/lessons/LessonsBanner';
import LessonsCategory from '@/components/lessons/LessonsCategory';
import useLessons from '@/hooks/useLessons';
import {
  CompletedLessonData,
  getStoredCompletedLessons,
  LessonCount,
  LessonData,
  LessonLevel,
  LEVELS,
  OverallData,
  storeCompletedLessons,
} from '@/utils';

const getStoredUserId = async (): Promise<string | null> => {
  const user = await AsyncStorage.getItem('user');
  return user ? JSON.parse(user).id : null;
};

const fetchLessonProgress = async (baseUrl: string, userId: string) => {
  const url = `${baseUrl}/lesson-progress?and=(user.id.eq.${userId})&select=totalCompleted,user(id,name),level,totalLessons,lessonsCompleted,id,updatedAt,createdAt`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('API error');
  const { data } = await response.json();
  return data as LessonData[] | undefined;
};

const calculateOverallData = (lessons: LessonData[]): OverallData => {
  const accumulatedLessons = lessons.reduce(
    (total, lesson) => total + (lesson.totalLessons || 0),
    0,
  );
  const accumulatedCompletedLessons = lessons.reduce(
    (total, lesson) => total + (lesson.totalCompleted || 0),
    0,
  );
  return { accumulatedLessons, accumulatedCompletedLessons };
};

const fetchLessonCountForLevel = async (
  baseUrl: string,
  level: LessonLevel,
) => {
  const url = `${baseUrl}/nugget?and=(lesson.tags.title.eq.${level})&select=lesson(id,title,description,active,tags,title,id,illustration),gesture,priority,id,title,active`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch for ${level}`);
  const data = await response.json();
  return data.meta.count as number;
};

const IndexScreen: React.FC = () => {
  const { progressSummary } = useLessons();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lessonCount, setLessonCount] = useState<any>({
    Beginner: 0,
    'Basic Elementary': 0,
    Intermediate: 0,
    Advanced: 0,
  });
  const [overallData, setOverallData] = useState<OverallData>({
    accumulatedLessons: 0,
    accumulatedCompletedLessons: 0,
  });
  const [_, setAllTrackingLessons] = useState<CompletedLessonData>({
    lessons: [],
  });
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL as string;

  // To avoid double loading on rapid focus/blur, use a ref.
  const isMountedRef = useRef(false);

  // Unified data loading for focus and refresh
  const loadDataOnFocus = useCallback(async () => {
    setIsLoading(true);
    setRefreshing(true);
    try {
      // Try to fetch fresh user data
      const userId = await getStoredUserId();
      let fetchedLessons: LessonData[] | undefined;

      if (userId && BASE_URL) {
        try {
          fetchedLessons = await fetchLessonProgress(BASE_URL, userId);
          if (fetchedLessons) {
            await storeCompletedLessons(fetchedLessons);
          }
        } catch (err) {
          fetchedLessons = undefined;
        }
      }

      // If no fresh data, fallback to local storage
      let lessons: LessonData[] = [];
      if (fetchedLessons && fetchedLessons.length > 0) {
        lessons = fetchedLessons;
      } else {
        const stored = await getStoredCompletedLessons();
        lessons = stored.lessons || [];
      }
      setAllTrackingLessons({ lessons });
      setOverallData(calculateOverallData(lessons));

      // Fetch all lesson counts
      const counts: Partial<LessonCount> = {};
      await Promise.all(
        LEVELS.map(async (level: any) => {
          try {
            counts[level] = await fetchLessonCountForLevel(BASE_URL, level);
          } catch {
            counts[level] = 0;
          }
        }),
      );
      setLessonCount(counts as LessonCount);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Use focus effect for per-page load
  useFocusEffect(
    useCallback(() => {
      if (isMountedRef.current) {
        // Only reload when returning to focus (not initial mount)
        loadDataOnFocus();
      } else {
        isMountedRef.current = true;
        loadDataOnFocus();
      }
    }, [loadDataOnFocus]),
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={loadDataOnFocus}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <>
          <LessonsBanner />
          <CurrentLevelProgressCard
            lessonCount={lessonCount}
            accumulatedData={overallData}
          />
          {progressSummary && (
            <LessonsCategory
              lessonCount={lessonCount}
              progressSummary={progressSummary}
            />
          )}
        </>
      )}
    </ScrollView>
  );
};

export default IndexScreen;

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
