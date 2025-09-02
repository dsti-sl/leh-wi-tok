import { useCallback, useEffect, useState } from 'react';
import { Platform, ToastAndroid } from 'react-native';

import {
  getBaseUrl,
  getStoredCompletedLessons,
  getStoredUserId,
  getToken,
  LessonData,
  storeCompletedLessons,
} from '@/utils';

export interface GestureInfo {
  contentType: string;
  id: string;
  path?: string;
  name?: string;
  [key: string]: unknown;
}

export interface LessonTag {
  id: string;
  title: string;
  priority: number;
  active: boolean;
  detail?: string;
  duration?: string;
  gesture?: GestureInfo;
  illustration?: {
    id: string;
    path?: string;
    name?: string;
    contentType?: string;
  };
  lesson?: {
    id: string;
    title: string;
    description?: string;
    active: boolean;
    tags: string;
    illustration?: unknown;
  };
}

interface UseLessonDataReturn {
  lessonNuggets: LessonTag[];
  isLoading: boolean;
  isLoadingMore: boolean;
  lessonCount: number;
  completedLessons: Set<string>;
  hasMoreData: boolean;
  token: string | null;
  currentPage: number;
  error: string | null;
  fetchLessons: (_page?: number, _append?: boolean) => Promise<void>;
  loadMoreData: () => void;
  markLessonCompleted: (_lessonId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useLessonData = (assessment: string): UseLessonDataReturn => {
  const [lessonNuggets, setLessonNuggets] = useState<LessonTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lessonCount, setLessonCount] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    new Set(),
  );
  const [serverProgress, setServerProgress] = useState<LessonData[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const BASE_URL = getBaseUrl();

  // Fetch and set token on mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await getToken();
        setToken(storedToken);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };
    fetchToken();
  }, []);

  // Fetch lesson progress
  const fetchLessonProgress = useCallback(
    async (userId: string): Promise<LessonData[] | null> => {
      try {
        const response = await fetch(
          `${BASE_URL}/lesson-progress?and=(user.id.eq.${userId})&select=totalCompleted,user(id,name),level,totalLessons,lessonsCompleted,id,updatedAt,createdAt`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { data } = await response.json();
        if (data) {
          await storeCompletedLessons(data);
          setServerProgress(data);
          return data;
        }
        return null;
      } catch (error) {
        console.error('Failed to fetch lesson progress:', error);
        return null;
      }
    },
    [BASE_URL],
  );

  // Main fetch function for lessons
  const fetchLessons = useCallback(
    async (page: number = 1, append: boolean = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const userId = await getStoredUserId();
        if (!userId) {
          throw new Error('No user ID found');
        }

        // Fetch lesson nuggets with pagination
        const response = await fetch(
          `${BASE_URL}/nugget?and=(lesson.tags.title.eq.${assessment})&select=lesson(id,title,description,active,tags,title,id,illustration),gesture,priority,id,title,active,detail,illustration&page=${page}&page-size=10&order=priority`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch lessons: ${response.status}`);
        }

        const data = await response.json();

        if (append) {
          setLessonNuggets((prev) => [...prev, ...data.data]);
        } else {
          setLessonNuggets(data.data);
          setLessonCount(data.meta.count);
        }

        setHasMoreData(data.data.length === 10);
        setCurrentPage(page);

        // Fetch progress only on initial load
        if (!append) {
          let progressData: LessonData[] =
            (await fetchLessonProgress(userId)) ?? [];

          if (!progressData.length) {
            const stored = await getStoredCompletedLessons();
            progressData = stored.lessons ?? [];
          }

          // Filter completed lessons
          const currentLevel = progressData.find((l) => l.level === assessment);
          const completedIds = currentLevel?.lessonsCompleted || [];
          const filteredCompleted = completedIds.filter((id: string) =>
            data.data.some((lesson: LessonTag) => lesson.id === id),
          );

          setCompletedLessons(new Set(filteredCompleted));

          // Repair local progress if needed
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

            if (Platform.OS === 'android' && completedIds.length > 0) {
              ToastAndroid.show(
                'Some completed lessons have been removed.',
                ToastAndroid.SHORT,
              );
            }
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error in fetchLessons:', error);

        if (!append) {
          setLessonNuggets([]);
          setCompletedLessons(new Set());
          setLessonCount(0);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [BASE_URL, assessment, fetchLessonProgress],
  );

  // Load more data for pagination
  const loadMoreData = useCallback(() => {
    if (!isLoadingMore && hasMoreData) {
      fetchLessons(currentPage + 1, true);
    }
  }, [isLoadingMore, hasMoreData, currentPage, fetchLessons]);

  // Mark lesson as completed
  const markLessonCompleted = useCallback(
    async (lessonId: string) => {
      try {
        const userId = await getStoredUserId();
        if (!userId) return;

        // Update local state
        const previousCompleted = Array.from(completedLessons).filter((id) =>
          lessonNuggets.some((l) => l.id === id),
        );
        const newCompleted = new Set(previousCompleted);
        newCompleted.add(lessonId);

        // Update storage
        const storedCompleted = await getStoredCompletedLessons();
        const updatedLessons = (storedCompleted.lessons ?? []).filter(
          (l) => l.level !== assessment,
        );
        updatedLessons.push({
          level: assessment,
          totalCompleted: newCompleted.size,
          totalLessons: lessonCount,
          userId,
          lessonsCompleted: Array.from(newCompleted),
        });

        await storeCompletedLessons(updatedLessons);

        // Sync progress to server
        const matchedProgress = serverProgress.find(
          (p) => p.level === assessment,
        );
        const levelExists = !!matchedProgress;

        try {
          await fetch(
            `${BASE_URL}/lesson-progress${levelExists ? `/?id=${matchedProgress.id}` : ''}`,
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
        } catch (serverError) {
          console.warn('Failed to sync to server:', serverError);
        }

        setCompletedLessons(newCompleted);
      } catch (error) {
        console.error('Error marking lesson as completed:', error);
      }
    },
    [
      assessment,
      completedLessons,
      lessonCount,
      serverProgress,
      BASE_URL,
      lessonNuggets,
    ],
  );

  // Refetch data
  const refetch = useCallback(() => {
    setCurrentPage(1);
    setHasMoreData(true);
    return fetchLessons(1, false);
  }, [fetchLessons]);

  // Initial data fetch
  useEffect(() => {
    fetchLessons(1, false);
  }, [fetchLessons]);

  return {
    lessonNuggets,
    isLoading,
    isLoadingMore,
    lessonCount,
    completedLessons,
    hasMoreData,
    token,
    currentPage,
    error,
    fetchLessons,
    loadMoreData,
    markLessonCompleted,
    refetch,
  };
};
