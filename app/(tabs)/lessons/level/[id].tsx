import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ToastAndroid,
} from 'react-native';

import MediaPlayer from '@/components/common/MediaPlayer';
import { Colors } from '@/constants/Colors';
import useLessonLevel from '@/hooks/useLessonLevel';
import {
  getStoredCompletedLessons,
  getStoredUserId,
  LessonData,
  storeCompletedLessons,
} from '@/utils';

// === Utility: Filter out deleted lessons ===
function filterValidCompletedLessons(
  completedIds: string[],
  availableLessons: any[],
) {
  const lessonSet = new Set(availableLessons.map((l) => l.id));
  return completedIds.filter((id) => lessonSet.has(id));
}

// ----- Main Component -----
const Level = () => {
  const {
    levelLessons,
    loading,
    lesson,
    activeLesson,
    handleLessonSelect,
    player,
    level,
  } = useLessonLevel();

  const { assessment } = useLocalSearchParams<{ assessment: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [lessonTags, setLessonTags] = useState<any[]>([]);
  const [lessonGestureInfo, setLessonGestureInfo] = useState({});
  const [lessonCount, setLessonCount] = useState<number>(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    new Set(),
  );
  const [serverProgress, setServerProgress] = useState<LessonData[]>([]);
  const [selectedGestureId, setSelectedGestureId] = useState<string | null>(
    null,
  );

  const EXPO_PUBLIC_BASE_URL = Constants.expoConfig?.extra?.API_URL;

  // Fetch lesson progress from server or fallback to storage
  const fetchLessonProgress = useCallback(
    async (userId: string) => {
      try {
        const progressRes = await fetch(
          `${EXPO_PUBLIC_BASE_URL}/lesson-progress?and=(user.id.eq.${userId})&select=totalCompleted,user(id,name),level,totalLessons,lessonsCompleted,id,updatedAt,createdAt`,
        );
        if (!progressRes.ok) throw new Error('API error');
        const { data } = await progressRes.json();
        if (data) {
          await storeCompletedLessons(data);
          setServerProgress(data);
          return data;
        }
        return null;
      } catch (apiError) {
        console.warn('Lesson progress API failed, trying local fallback.');
        return null;
      }
    },
    [EXPO_PUBLIC_BASE_URL],
  );

  // Fetch lesson tags for category
  const fetchLessonCategory = useCallback(async () => {
    setIsLoading(true);
    try {
      const userId = await getStoredUserId();
      if (!userId) throw new Error('No user ID found');

      // 1. Fetch lesson tags
      const response = await fetch(
        `${EXPO_PUBLIC_BASE_URL}/nugget?and=(lesson.tags.title.eq.${assessment})&select=lesson(id,title,description,active,tags,title,id,illustration),gesture,priority,id,title,active`,
      );
      if (!response.ok) throw new Error('Failed to fetch lesson category');
      const data = await response.json();
      const sortedTags = data.data.sort(
        (a: { priority: number }, b: { priority: number }) =>
          a.priority - b.priority,
      );
      setLessonTags(sortedTags);
      setLessonCount(data.meta.count);

      // 2. Fetch progress (prefer server, fallback to local)
      let progressData: LessonData[] =
        (await fetchLessonProgress(userId)) ?? [];
      if (!progressData.length) {
        const stored = await getStoredCompletedLessons();
        progressData = stored.lessons ?? [];
      }

      // === [NEW] 3. Filter completed lessons for this assessment/level ===
      const currentLevel = progressData.find((l) => l.level === assessment);
      const completedIds = currentLevel?.lessonsCompleted || [];
      const filteredCompleted = filterValidCompletedLessons(
        completedIds,
        sortedTags,
      );

      // Update state
      setCompletedLessons(new Set(filteredCompleted));

      // === [NEW] Optionally repair local progress if out of sync ===
      if (filteredCompleted.length !== completedIds.length) {
        const updatedProgress = progressData.map((p) =>
          p.level === assessment
            ? {
                ...p,
                lessonsCompleted: filteredCompleted,
                totalCompleted: filteredCompleted.length,
              }
            : p,
        );
        await storeCompletedLessons(updatedProgress);

        // Optional: show toast if any IDs were dropped
        if (Platform.OS === 'android' && completedIds.length > 0) {
          ToastAndroid.show(
            'Some completed lessons have been removed.',
            ToastAndroid.SHORT,
          );
        }
      }
    } catch (error) {
      console.error('Error fetching category or progress:', error);
      setLessonTags([]);
      setCompletedLessons(new Set());
      setLessonCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [EXPO_PUBLIC_BASE_URL, assessment, fetchLessonProgress]);

  useEffect(() => {
    fetchLessonCategory();
  }, [fetchLessonCategory]);

  // --- Lesson completion handler ---
  const handleLessonClick = useCallback(
    async (lesson: any) => {
      handleLessonSelect(lesson);
      setSelectedGestureId(lesson?.gesture?.id);
      setLessonGestureInfo(lesson?.gesture);
      const userId = await getStoredUserId();
      if (!userId) return;

      // Load progress data from storage (always use storage for updating)
      const storedCompleted = await getStoredCompletedLessons();
      // --- [NEW] Always start with filtered completed lessons ---
      const previousCompleted = filterValidCompletedLessons(
        Array.from(completedLessons),
        lessonTags,
      );
      const newCompleted = new Set(previousCompleted);
      newCompleted.add(lesson.id);

      // Update or add lesson progress for this level
      const updatedLessons = storedCompleted.lessons.filter(
        (l) => l.level !== assessment,
      );
      updatedLessons.push({
        level: assessment,
        totalCompleted: newCompleted.size,
        totalLessons: lessonCount,
        userId,
        lessonsCompleted: Array.from(newCompleted),
      });

      // Prepare to sync to server
      const matchedProgress = serverProgress.find(
        (p) => p.level === assessment,
      );
      const levelExists = !!matchedProgress;

      // Optimistically update local storage
      await storeCompletedLessons(updatedLessons);

      // Try to sync with server
      try {
        const response = await fetch(
          `${EXPO_PUBLIC_BASE_URL}/lesson-progress${levelExists ? `/?id=${matchedProgress.id}` : ''}`,
          {
            method: levelExists ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              level: assessment,
              totalCompleted: newCompleted.size,
              totalLessons: lessonCount,
              lessonsCompleted: Array.from(newCompleted),
            }),
          },
        );
        if (!response.ok) throw new Error('Lesson progress API failed');
        // Optionally refetch or update UI based on response
      } catch (err) {
        console.warn('Falling back to AsyncStorage due to error:', err);
      }

      setCompletedLessons(newCompleted);
      fetchLessonCategory();
    },
    [
      assessment,
      completedLessons,
      lessonCount,
      serverProgress,
      EXPO_PUBLIC_BASE_URL,
      handleLessonSelect,
      fetchLessonCategory,
      lessonTags,
    ],
  );

  // --- Lesson locked logic ---
  const isLessonLocked = (
    currentLesson: any,
    index: number,
    lessons: any[],
  ) => {
    if (index === 0) return false;
    const previousLesson = lessons[index - 1];
    return !completedLessons.has(previousLesson.id);
  };

  // --- Render ---
  if (loading || isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <View style={{ height: 50, backgroundColor: Colors.primary }} />
      ) : (
        <StatusBar style="light" backgroundColor={Colors.primary} />
      )}
      {/* Top Section with GIF */}
      <View className="px-10" style={styles.videoContainer}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: Colors.primary,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        {selectedGestureId && (
          <MediaPlayer
            gestureInfo={lessonGestureInfo}
            gestureId={selectedGestureId as string}
          />
        )}
      </View>

      {/* Lesson Details */}
      <View style={styles.lessonInfo}>
        <View style={styles.lessonHeader}>
          <View>
            <Text style={styles.title}>{assessment}</Text>
            <Text style={styles.subtitle}>
              {/* --- [NEW] Always use filtered completed lessons for display --- */}
              {completedLessons.size < lessonCount
                ? completedLessons.size
                : lessonCount}{' '}
              of {lessonCount} Lessons Completed
            </Text>
          </View>
        </View>
      </View>

      {/* Lesson List */}
      <ScrollView>
        {lessonTags?.map((lesson, index, array) => {
          const locked = isLessonLocked(lesson, index, array);
          return (
            <TouchableOpacity
              key={lesson.id}
              style={[
                styles.lessonItem,
                activeLesson?.id === lesson.id && styles.activeLesson,
                locked && styles.lockedLesson,
              ]}
              onPress={() => !locked && handleLessonClick(lesson)}
              disabled={locked}
            >
              <View style={styles.iconContainer}>
                <FontAwesome5
                  name={locked ? 'lock' : 'play-circle'}
                  size={24}
                  color={locked ? '#999' : '#4682B4'}
                />
              </View>
              <View style={styles.lessonDetails}>
                <Text style={[styles.lessonTitle, locked && { color: '#999' }]}>
                  {lesson.title}
                  {locked && ' (Locked)'}
                </Text>
                <Text
                  style={[styles.lessonDuration, locked && { color: '#999' }]}
                >
                  {lesson.duration || lesson.lesson?.title || ''}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default Level;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  videoContainer: {
    height: 300,
    backgroundColor: '#2d2d2d',
  },
  video: {
    flex: 1,
  },
  lessonInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  lockedLesson: {
    backgroundColor: '#f9f9f9',
  },
  iconContainer: {
    marginRight: 12,
  },
  lessonDetails: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    color: '#333',
  },
  lessonDuration: {
    fontSize: 14,
    color: '#888',
  },
  activeLesson: {
    backgroundColor: '#f5f5f5',
  },
  progressBar: {
    height: 2,
    backgroundColor: '#eee',
    marginTop: 4,
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4682B4',
    borderRadius: 1,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 20,
    gap: 4,
  },
  playAllActive: {
    backgroundColor: '#4682B4',
  },
  playAllText: {
    fontSize: 14,
    color: '#4682B4',
  },
  playAllTextActive: {
    color: '#fff',
  },
});
