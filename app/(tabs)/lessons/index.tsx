import React, { useCallback, useRef, useState } from 'react';

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { useFocusEffect } from 'expo-router';

import CurrentLevelProgressCard from '@/components/lessons/CurrentLevelProgressCard';
import { LessonsBanner } from '@/components/lessons/LessonsBanner';
import LessonsCategory from '@/components/lessons/LessonsCategory';
import { Colors } from '@/constants/Colors';
import useLessons from '@/hooks/useLessons';
import {
  calculateOverallDataForLevels,
  getBaseUrl,
  getStoredCompletedLessons,
  getStoredUserId,
  getToken,
  LessonCount,
  LessonData,
  LessonLevel,
  LEVELS,
  OverallData,
  SUMMARY_LEVELS,
  storeCompletedLessons,
} from '@/utils';

const fetchLessonProgress = async (baseUrl: string, userId: string) => {
  const url = `${baseUrl}/lesson-progress?and=(user.id.eq.${userId})&select=totalCompleted,user(id,name),level,totalLessons,lessonsCompleted,id,updatedAt,createdAt`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('API error');
  const { data } = await response.json();
  return data as LessonData[] | undefined;
};

const fetchLessonCountForLevel = async (
  baseUrl: string,
  level: LessonLevel,
  anonymous: boolean,
) => {
  const filter = anonymous
    ? 'tags.title.eq.Beginner'
    : `lesson.tags.title.eq.${level}`;
  const url = `${baseUrl}/nugget?and=(${filter})&select=lesson(id,title,description,active,tags,title,id,illustration),gesture,priority,id,title,active`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch for ${level}`);
  const data = await response.json();
  return data.meta.count as number;
};

const IndexScreen: React.FC = () => {
  const { progressSummary } = useLessons();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lessonCount, setLessonCount] = useState<LessonCount>({
    Beginner: 0,
    'Basic Elementary': 0,
    Intermediate: 0,
    Advanced: 0,
  });
  const [overallData, setOverallData] = useState<OverallData>({
    accumulatedLessons: 0,
    accumulatedCompletedLessons: 0,
  });

  const EXPO_PUBLIC_BASE_URL = getBaseUrl();

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

      if (userId && EXPO_PUBLIC_BASE_URL) {
        try {
          fetchedLessons = await fetchLessonProgress(
            EXPO_PUBLIC_BASE_URL,
            userId,
          );
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

      const token = await getToken();
      const anonymous = !token;

      // Fetch all lesson counts (anonymous: only Beginner nugget query is allowed; other levels stay 0)
      const counts: Partial<LessonCount> = {};
      await Promise.all(
        LEVELS.map(async (level: LessonLevel) => {
          if (anonymous && level !== 'Beginner') {
            counts[level] = 0;
            return;
          }
          try {
            counts[level] = await fetchLessonCountForLevel(
              EXPO_PUBLIC_BASE_URL,
              level,
              anonymous,
            );
          } catch {
            counts[level] = 0;
          }
        }),
      );
      setLessonCount(counts as LessonCount);
      setOverallData(
        calculateOverallDataForLevels(
          lessons,
          counts as LessonCount,
          SUMMARY_LEVELS,
        ),
      );
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
          <CurrentLevelProgressCard accumulatedData={overallData} />
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
