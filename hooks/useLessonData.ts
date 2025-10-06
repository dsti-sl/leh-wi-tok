import { useCallback, useEffect, useState, useMemo } from 'react';
import { Platform, ToastAndroid, Alert } from 'react-native';

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

export interface LessonSection {
  id: string;
  title: string;
  description?: string;
  data: LessonTag[];
}

interface LessonClickCallbacks {
  setExpandedLessonId: (_fn: (_prev: string | null) => string | null) => void;
  setSelectedGestureId: (_gestureId: string | null) => void;
  setLessonGestureInfo: (_gestureInfo: GestureInfo | null) => void;
  scrollToSection: (_sectionIndex: number) => void;
}

interface UseLessonDataReturn {
  lessonNuggets: LessonTag[];
  sectionsData: LessonSection[];
  expandedSections: Set<string>;
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
  toggleSectionExpansion: (_sectionId: string) => void;
  getSectionProgress: (_section: LessonSection) => {
    completedCount: number;
    totalCount: number;
  };
  refetch: () => Promise<void>;
  createHandleLessonClick: (
    _callbacks: LessonClickCallbacks,
  ) => (_lesson: LessonTag) => Promise<void>;
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  // Pagination page size
  const PAGE_SIZE = 10;

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
          `${BASE_URL}/nugget?and=(lesson.tags.title.eq.${assessment})&select=lesson(id,title,description,active,tags,title,id,illustration),gesture,priority,id,title,active,detail,illustration&page=${page}&page-size=${PAGE_SIZE}&order=priority`,
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
        // This avoids coupling to the returned page array length
        const more = page * PAGE_SIZE < (data?.meta?.count ?? 0);
        setHasMoreData(more);
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

  // Memoize sections data to avoid unnecessary recalculations
  const sectionsData = useMemo((): LessonSection[] => {
    const grouped = lessonNuggets.reduce(
      (acc, nugget) => {
        const lessonId = nugget.lesson?.id || 'unknown';
        const lessonTitle = nugget.lesson?.title || 'Unknown Lesson';
        const lessonDescription = nugget.lesson?.description;

        if (!acc[lessonId]) {
          acc[lessonId] = {
            id: lessonId,
            title: lessonTitle,
            description: lessonDescription,
            data: [],
          };
        }

        acc[lessonId].data.push(nugget);
        return acc;
      },
      {} as Record<string, LessonSection>,
    );

    // Convert to array and sort by lesson title
    // TODO: Consider sorting by lessons priority/order to simplify this block implementation
    const sections = Object.values(grouped);

    // Sort nuggets within each section by priority
    sections.forEach((section) => {
      section.data.sort((a, b) => a.priority - b.priority);
    });

    return sections;
  }, [lessonNuggets]);

  // Auto-expand first section on initial load
  useEffect(() => {
    if (sectionsData.length > 0 && expandedSections.size === 0) {
      const firstSectionId = sectionsData[0].id;
      setExpandedSections(new Set([firstSectionId]));
    }
  }, [sectionsData, expandedSections.size]);

  // Section expansion toggle
  const toggleSectionExpansion = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Get section progress information
  const getSectionProgress = useCallback(
    (section: LessonSection) => {
      const completedCount = section.data.filter((nugget) =>
        completedLessons.has(nugget.id),
      ).length;
      const totalCount = section.data.length;
      return { completedCount, totalCount };
    },
    [completedLessons],
  );

  // Create handleLessonClick factory function
  const createHandleLessonClick = useCallback(
    (callbacks: LessonClickCallbacks) => {
      return async (lesson: LessonTag) => {
        try {
          callbacks.setExpandedLessonId((prev) =>
            prev === lesson.id ? null : lesson.id,
          );

          // Find the section index for scrolling
          let sectionIndex = -1;
          for (let secIdx = 0; secIdx < sectionsData.length; secIdx++) {
            const section = sectionsData[secIdx];
            const nuggetIndex = section.data.findIndex(
              (item) => item.id === lesson.id,
            );
            if (nuggetIndex !== -1) {
              sectionIndex = secIdx;
              break;
            }
          }

          if (sectionIndex !== -1) {
            callbacks.scrollToSection(sectionIndex);
          }

          const gestureId = lesson?.gesture?.id || null;
          callbacks.setSelectedGestureId(gestureId);
          callbacks.setLessonGestureInfo(lesson?.gesture || null);

          await markLessonCompleted(lesson.id);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred';
          console.error(
            '❌ [handleLessonClick] Error handling lesson click:',
            errorMessage,
          );
          Alert.alert(
            'Error',
            'Failed to process lesson selection. Please try again.',
          );
        }
      };
    },
    [sectionsData, markLessonCompleted],
  );

  // Initial data fetch
  useEffect(() => {
    fetchLessons(1, false);
  }, [fetchLessons]);

  return {
    lessonNuggets,
    sectionsData,
    expandedSections,
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
    toggleSectionExpansion,
    getSectionProgress,
    refetch,
    createHandleLessonClick,
  };
};
