import React, { useCallback, useRef, useState } from 'react';

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';

import CurrentLevelProgressCard from '@/components/lessons/CurrentLevelProgressCard';
import { LessonsBanner } from '@/components/lessons/LessonsBanner';
import LessonsCategory from '@/components/lessons/LessonsCategory';
import { Colors } from '@/constants/Colors';
import useLessons from '@/hooks/useLessons';
import { Record } from '@/lib/types';
import {
  calculateOverallDataForLevels,
  getBaseUrl,
  getStoredCompletedLessons,
  getToken,
  LessonCount,
  LessonData,
  LessonLevel,
  LEVELS,
  OverallData,
  SUMMARY_LEVELS,
  storeCompletedLessons,
  getStoredUserId,
} from '@/utils';

const LAST_LESSON_RESUME_KEY = 'lesson_last_resume';

type LastLessonResume = {
  assessment: LessonLevel;
  lessonId: string;
  lessonTitle: string;
  updatedAt: string;
};

const fetchLessonProgress = async (baseUrl: string, userId: string) => {
  const url = `${baseUrl}/lesson-progress?and=(user.id.eq.${userId})&select=totalCompleted,user(id,name),level,totalLessons,lessonsCompleted,id,updatedAt,createdAt`;
  const token = await getToken();
  const response = await fetch(
    url,
    token ? { headers: { Authorization: `Token ${token}` } } : undefined,
  );

  if (!response.ok) throw new Error('API error');
  const { data } = await response.json();
  return data as LessonData[] | undefined;
};

const fetchLessonCountForLevel = async (
  baseUrl: string,
  level: LessonLevel,
  anonymous: boolean,
) => {
  const token = await getToken();
  const filter = anonymous
    ? 'tags.title.eq.Beginner'
    : `lesson.tags.title.eq.${level}`;
  const url = `${baseUrl}/nugget?and=(${filter})&select=lesson(id,title,description,active,tags,title,id,illustration),gesture,priority,id,title,active`;
  const response = await fetch(
    url,
    !anonymous && token
      ? { headers: { Authorization: `Token ${token}` } }
      : undefined,
  );
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
  const [lastLessonResume, setLastLessonResume] =
    useState<LastLessonResume | null>(null);

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

  const loadLastLessonResume = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(LAST_LESSON_RESUME_KEY);
      setLastLessonResume(
        stored ? (JSON.parse(stored) as LastLessonResume) : null,
      );
    } catch (error) {
      console.warn('Failed to load last lesson resume:', error);
      setLastLessonResume(null);
    }
  }, []);

  // Use focus effect for per-page load
  useFocusEffect(
    useCallback(() => {
      if (isMountedRef.current) {
        // Only reload when returning to focus (not initial mount)
        loadDataOnFocus();
        loadLastLessonResume();
      } else {
        isMountedRef.current = true;
        loadDataOnFocus();
        loadLastLessonResume();
      }
    }, [loadDataOnFocus, loadLastLessonResume]),
  );

  const handleResumeLastLesson = useCallback(() => {
    if (!lastLessonResume || !progressSummary) return;

    router.push(
      `/(tabs)/lessons/level/${(progressSummary[lastLessonResume.assessment] as Record).title}?assessment=${lastLessonResume.assessment}`,
    );
  }, [lastLessonResume, progressSummary]);

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
          {lastLessonResume && progressSummary && (
            <TouchableOpacity
              style={styles.resumeCard}
              onPress={handleResumeLastLesson}
              activeOpacity={0.8}
            >
              <Text style={styles.resumeEyebrow}>
                Continue where you left off
              </Text>
              <Text style={styles.resumeTitle} numberOfLines={2}>
                {lastLessonResume.lessonTitle}
              </Text>
              <Text style={styles.resumeMeta}>
                {lastLessonResume.assessment} lesson
              </Text>
            </TouchableOpacity>
          )}
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
  resumeCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    gap: 6,
  },
  resumeEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resumeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  resumeMeta: {
    fontSize: 14,
    color: '#4B5563',
  },
});
