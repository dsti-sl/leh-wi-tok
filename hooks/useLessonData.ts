import { useCallback, useEffect, useMemo, useState } from 'react';

import { Alert } from 'react-native';

import {
  getBaseUrl,
  getStoredCompletedLessons,
  getStoredUserId,
  getGuestMode,
  getToken,
  GUEST_USER_ID,
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
  description?: string | undefined;
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
  levelCompletedCount: number;
  levelTotalLessons: number;
  fetchLessons: (_page?: number, _append?: boolean) => Promise<void>;
  loadMoreData: () => void;
  markLessonCompleted: (_lessonId: string) => Promise<void>;
  toggleSectionExpansion: (_sectionId: string) => void;
  expandOnlySection: (_sectionId: string) => void;
  getSectionProgress: (_section: LessonSection) => {
    completedCount: number;
    totalCount: number;
  };
  refetch: () => Promise<void>;
  createHandleLessonClick: (
    _callbacks: LessonClickCallbacks,
  ) => (_lesson: LessonTag) => Promise<void>;
  fetchLessonById: (_lessonId: string) => Promise<LessonTag | null>;
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
  const [isGuest, setIsGuest] = useState<boolean | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelCompletedCount, setLevelCompletedCount] = useState(0);
  const [levelTotalLessons, setLevelTotalLessons] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  // Pagination page size
  const PAGE_SIZE = 25;

  const BASE_URL = getBaseUrl();

  const refreshAuthState = useCallback(async () => {
    try {
      const [storedToken, guestValue] = await Promise.all([
        getToken(),
        getGuestMode(),
      ]);
      setToken(storedToken);
      setIsGuest(guestValue);
    } catch (error) {
      console.error('Error fetching token:', error);
      setToken(null);
      setIsGuest(false);
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  // Fetch and set token on mount
  useEffect(() => {
    refreshAuthState();
  }, [refreshAuthState]);

  // Fetch lesson progress
  const fetchLessonProgress = useCallback(
    async (
      userId: string,
      authHeaders?: Record<string, string>,
    ): Promise<LessonData[] | null> => {
      try {
        const response = await fetch(
          `${BASE_URL}/lesson-progress?and=(user.id.eq.${userId})&select=totalCompleted,user(id,name),level,totalLessons,lessonsCompleted,id,updatedAt,createdAt`,
          authHeaders ? { headers: authHeaders } : undefined,
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

  const buildNuggetSelectQuery = useCallback(
    () =>
      'select=lesson(id,title,description,active,tags,title,id,illustration),gesture,priority,id,title,active,detail,illustration',
    [],
  );

  const dedupeAndSortLessonNuggets = useCallback((nuggets: LessonTag[]) => {
    const merged = new Map<string, LessonTag>();

    nuggets.forEach(item => {
      merged.set(item.id, item);
    });

    return Array.from(merged.values()).sort((a, b) => a.priority - b.priority);
  }, []);

  const mergeLessonNuggets = useCallback(
    (current: LessonTag[], incoming: LessonTag[]) =>
      dedupeAndSortLessonNuggets([...current, ...incoming]),
    [dedupeAndSortLessonNuggets],
  );

  const fetchLessonById = useCallback(
    async (lessonId: string): Promise<LessonTag | null> => {
      if (!isAuthReady || isGuest === null) return null;

      const effectiveAssessment = isGuest ? 'Beginner' : assessment;
      const authHeaders =
        !isGuest && token ? { Authorization: `Token ${token}` } : undefined;
      const nuggetFilter = isGuest
        ? `(id.eq.${lessonId},tags.title.eq.Beginner)`
        : `(id.eq.${lessonId},lesson.tags.title.eq.${effectiveAssessment})`;

      try {
        const response = await fetch(
          `${BASE_URL}/nugget?and=${nuggetFilter}&${buildNuggetSelectQuery()}`,
          authHeaders ? { headers: authHeaders } : undefined,
        );

        if (!response.ok) {
          return null;
        }

        const payload = await response.json();
        const fetchedLesson =
          (payload?.data?.[0] as LessonTag | undefined) ?? null;

        if (!fetchedLesson) {
          return null;
        }

        const lessonGroupId = fetchedLesson.lesson?.id;
        let lessonContext: LessonTag[] = [fetchedLesson];

        if (lessonGroupId) {
          const contextFilter = isGuest
            ? `(lesson.id.eq.${lessonGroupId},tags.title.eq.Beginner)`
            : `(lesson.id.eq.${lessonGroupId},lesson.tags.title.eq.${effectiveAssessment})`;

          const contextResponse = await fetch(
            `${BASE_URL}/nugget?and=${contextFilter}&${buildNuggetSelectQuery()}&order=priority`,
            authHeaders ? { headers: authHeaders } : undefined,
          );

          if (contextResponse.ok) {
            const contextPayload = await contextResponse.json();
            const contextLessons = Array.isArray(contextPayload?.data)
              ? (contextPayload.data as LessonTag[])
              : [];

            if (contextLessons.length > 0) {
              lessonContext = contextLessons;
            }
          }
        }

        setLessonNuggets(prev => mergeLessonNuggets(prev, lessonContext));

        return fetchedLesson;
      } catch (error) {
        console.warn('Failed to fetch lesson by id:', error);
        return null;
      }
    },
    [
      BASE_URL,
      assessment,
      buildNuggetSelectQuery,
      isAuthReady,
      isGuest,
      mergeLessonNuggets,
      token,
    ],
  );

  const getCurrentLevelProgress = useCallback(
    (
      progressData: LessonData[],
      level: string,
      fallbackTotalLessons: number,
      userId: string,
    ): LessonData => {
      const matched = progressData.find(item => item.level === level);

      return {
        ...(matched?.id ? { id: matched.id } : {}),
        level,
        userId,
        totalCompleted: Math.max(0, matched?.totalCompleted ?? 0),
        totalLessons: Math.max(
          0,
          matched?.totalLessons ?? fallbackTotalLessons ?? 0,
        ),
        lessonsCompleted: matched?.lessonsCompleted ?? [],
      };
    },
    [],
  );

  const applyLevelProgressState = useCallback((progress: LessonData) => {
    setCompletedLessons(new Set(progress.lessonsCompleted));
    setLevelCompletedCount(
      Math.min(progress.totalCompleted, progress.totalLessons),
    );
    setLevelTotalLessons(progress.totalLessons);
  }, []);

  const upsertLevelProgress = useCallback(
    (
      lessons: LessonData[],
      nextProgress: LessonData,
    ): { updatedLessons: LessonData[]; wasAlreadyCompleted: boolean } => {
      const previous = lessons.find(item => item.level === nextProgress.level);
      const previousCompletedIds = new Set(previous?.lessonsCompleted ?? []);
      const nextCompletedIds = new Set(nextProgress.lessonsCompleted);
      const wasAlreadyCompleted = Array.from(nextCompletedIds).every(id =>
        previousCompletedIds.has(id),
      );

      return {
        updatedLessons: [
          ...lessons.filter(item => item.level !== nextProgress.level),
          nextProgress,
        ],
        wasAlreadyCompleted,
      };
    },
    [],
  );

  // Main fetch function for lessons
  const fetchLessons = useCallback(
    async (page: number = 1, append: boolean = false) => {
      if (!isAuthReady || isGuest === null) return;

      const effectiveAssessment = isGuest ? 'Beginner' : assessment;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        if (!isGuest && !token) {
          setError('Please sign in to access this content.');
          if (!append) {
            setLessonNuggets([]);
            setCompletedLessons(new Set());
            setLessonCount(0);
          }
          return;
        }

        const userId = isGuest ? GUEST_USER_ID : await getStoredUserId();
        if (!userId) {
          setError('Please sign in to access this content.');
          if (!append) {
            setLessonNuggets([]);
            setCompletedLessons(new Set());
            setLessonCount(0);
          }
          return;
        }

        const authHeaders =
          !isGuest && token ? { Authorization: `Token ${token}` } : undefined;

        // guest user nugget list requires nugget tag Beginner
        const nuggetFilter = isGuest
          ? 'tags.title.eq.Beginner'
          : `lesson.tags.title.eq.${effectiveAssessment}`;

        // Fetch lesson nuggets with pagination
        const response = await fetch(
          `${BASE_URL}/nugget?and=(${nuggetFilter})&select=lesson(id,title,description,active,tags,title,id,illustration),gesture,priority,id,title,active,detail,illustration&page=${page}&page-size=${PAGE_SIZE}&order=priority`,
          authHeaders ? { headers: authHeaders } : undefined,
        );

        if (!response.ok) {
          let errorMessage =
            response.status === 401
              ? 'Please sign in to access this content.'
              : 'Unable to load lessons right now. Please try again.';

          try {
            const payload = await response.json();
            const apiError = payload?.errors?.[0];
            const status = Number(apiError?.status ?? response.status);

            if (status === 401) {
              errorMessage = 'Please sign in to access this content.';
            } else if (apiError?.detail) {
              errorMessage = apiError.detail;
            } else if (apiError?.title) {
              errorMessage = apiError.title;
            } else if (response.status >= 500) {
              errorMessage = 'Server error. Please try again in a few minutes.';
            }
          } catch (parseError) {
            if (response.status >= 500) {
              errorMessage = 'Server error. Please try again in a few minutes.';
            }
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (append) {
          setLessonNuggets(prev => mergeLessonNuggets(prev, data.data));
        } else {
          setLessonNuggets(dedupeAndSortLessonNuggets(data.data));
          const totalCount = data?.meta?.count ?? 0;
          setLessonCount(totalCount);
          setLevelTotalLessons(totalCount);
        }
        // This avoids coupling to the returned page array length
        const more = page * PAGE_SIZE < (data?.meta?.count ?? 0);
        setHasMoreData(more);
        setCurrentPage(page);

        // Fetch progress only on initial load
        if (!append) {
          let progressData: LessonData[] = [];

          if (!isGuest) {
            progressData =
              (await fetchLessonProgress(userId, authHeaders)) ?? [];
          }

          if (!progressData.length) {
            const stored = await getStoredCompletedLessons();
            progressData = stored.lessons ?? [];
          }

          const currentLevelProgress = getCurrentLevelProgress(
            progressData,
            effectiveAssessment,
            data?.meta?.count ?? 0,
            userId,
          );

          applyLevelProgressState(currentLevelProgress);

          if (!isGuest && progressData.length > 0) {
            await storeCompletedLessons(progressData);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMessage);
        if (!errorMessage.toLowerCase().includes('sign in')) {
          console.error('Error in fetchLessons:', error);
        }

        if (!append) {
          setLessonNuggets([]);
          setCompletedLessons(new Set());
          setLessonCount(0);
          setLevelCompletedCount(0);
          setLevelTotalLessons(0);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      BASE_URL,
      applyLevelProgressState,
      assessment,
      fetchLessonProgress,
      getCurrentLevelProgress,
      isAuthReady,
      isGuest,
      token,
    ],
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

        const storedCompleted = await getStoredCompletedLessons();
        const currentLevelProgress = getCurrentLevelProgress(
          storedCompleted.lessons ?? [],
          assessment,
          levelTotalLessons || lessonCount,
          userId,
        );

        const nextCompletedIds = new Set(currentLevelProgress.lessonsCompleted);
        const wasAlreadyCompleted = nextCompletedIds.has(lessonId);
        nextCompletedIds.add(lessonId);

        const nextLevelProgress: LessonData = {
          ...currentLevelProgress,
          userId,
          lessonsCompleted: Array.from(nextCompletedIds),
          totalCompleted: nextCompletedIds.size,
          totalLessons:
            currentLevelProgress.totalLessons ||
            levelTotalLessons ||
            lessonCount,
        };

        const { updatedLessons } = upsertLevelProgress(
          storedCompleted.lessons ?? [],
          nextLevelProgress,
        );

        await storeCompletedLessons(updatedLessons);
        setServerProgress(updatedLessons);
        applyLevelProgressState(nextLevelProgress);

        if (wasAlreadyCompleted) {
          return;
        }

        if (!isGuest) {
          // Sync progress to server
          const matchedProgress = serverProgress.find(
            p => p.level === assessment,
          );
          const levelExists = !!matchedProgress;

          try {
            const authToken = await getToken();
            const headers = {
              'Content-Type': 'application/json',
              ...(authToken ? { Authorization: `Token ${authToken}` } : {}),
            };
            await fetch(
              `${BASE_URL}/lesson-progress${levelExists ? `/?id=${matchedProgress.id}` : ''}`,
              {
                method: levelExists ? 'PATCH' : 'POST',
                headers,
                body: JSON.stringify({
                  userId,
                  level: assessment,
                  totalCompleted: nextLevelProgress.totalCompleted,
                  totalLessons: nextLevelProgress.totalLessons,
                  lessonsCompleted: nextLevelProgress.lessonsCompleted,
                }),
              },
            );
          } catch (serverError) {
            console.warn('Failed to sync to server:', serverError);
          }
        }
      } catch (error) {
        console.error('Error marking lesson as completed:', error);
      }
    },
    [
      assessment,
      applyLevelProgressState,
      getCurrentLevelProgress,
      isGuest,
      lessonCount,
      levelTotalLessons,
      serverProgress,
      BASE_URL,
      upsertLevelProgress,
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

        const alreadyExists = acc[lessonId].data.some(
          item => item.id === nugget.id,
        );
        if (!alreadyExists) {
          acc[lessonId].data.push(nugget);
        }
        return acc;
      },
      {} as Record<string, LessonSection>,
    );

    // Convert to array and sort by lesson title
    // TODO: Consider sorting by lessons priority/order to simplify this block implementation
    const sections = Object.values(grouped);

    // Sort nuggets within each section by priority
    sections.forEach(section => {
      section.data.sort((a, b) => a.priority - b.priority);
    });

    return sections;
  }, [lessonNuggets]);

  // Auto-expand first section on initial load
  useEffect(() => {
    if (sectionsData.length > 0 && expandedSections.size === 0) {
      const firstSection = sectionsData[0];
      if (firstSection) {
        const firstSectionId = firstSection.id;
        setExpandedSections(new Set([firstSectionId]));
      }
    }
  }, [sectionsData, expandedSections.size]);

  // Section expansion toggle
  const toggleSectionExpansion = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const expandOnlySection = useCallback((sectionId: string) => {
    setExpandedSections(new Set([sectionId]));
  }, []);

  // Get section progress information
  const getSectionProgress = useCallback(
    (section: LessonSection) => {
      const completedCount = section.data.filter(nugget =>
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
          callbacks.setExpandedLessonId(prev =>
            prev === lesson.id ? null : lesson.id,
          );

          // Find the section index for scrolling
          let sectionIndex = -1;
          for (let secIdx = 0; secIdx < sectionsData.length; secIdx++) {
            const section = sectionsData[secIdx];
            const nuggetIndex = section?.data.findIndex(
              item => item.id === lesson.id,
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
    if (!isAuthReady || isGuest === null) return;
    fetchLessons(1, false);
  }, [fetchLessons, isAuthReady, isGuest]);

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
    levelCompletedCount,
    levelTotalLessons,
    fetchLessons,
    loadMoreData,
    markLessonCompleted,
    toggleSectionExpansion,
    expandOnlySection,
    getSectionProgress,
    refetch,
    createHandleLessonClick,
    fetchLessonById,
  };
};
