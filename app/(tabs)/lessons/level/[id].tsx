import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Platform,
  ScrollView,
  SectionList,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MediaPlayer from '@/components/common/MediaPlayer';
import LessonItem from '@/components/lessons/LessonItem';
import LessonSectionHeader from '@/components/lessons/LessonSectionHeader';
import {
  ErrorView,
  LessonHeader,
  LessonInfo,
  LoadingView,
} from '@/components/lessons/LessonUtils';
import { Colors } from '@/constants/Colors';
import useGuestMode from '@/hooks/useGuestMode';
import {
  GestureInfo,
  LessonSection,
  LessonTag,
  useLessonData,
} from '@/hooks/useLessonData';
import { useLessonUtils } from '@/hooks/useLessonUtils';

const AUTOPLAY_ENABLED_KEY = 'lesson_autoplay_enabled';
const AUTOPLAY_DELAY_KEY = 'lesson_autoplay_delay';
const MIN_AUTOPLAY_DELAY = 3;
const MAX_AUTOPLAY_DELAY = 15;
const GESTURE_POSITION_PREFIX = 'lesson_gesture_position_';
const LAST_LESSON_PREFIX = 'lesson_last_selected_';
const LAST_LESSON_RESUME_KEY = 'lesson_last_resume';

type FlattenedLesson = {
  lesson: LessonTag;
  sectionId: string;
  sectionTitle: string;
  sectionIndex: number;
  itemIndex: number;
  sectionLessons: LessonTag[];
};

const Level: React.FC = () => {
  const { assessment } = useLocalSearchParams<{ assessment: string }>();
  const insets = useSafeAreaInsets();
  const { isGuest, promptCreateAccount } = useGuestMode();
  const hasPromptedGuestRef = useRef(false);

  const {
    lessonNuggets,
    sectionsData,
    expandedSections,
    isLoading,
    isLoadingMore,
    lessonCount,
    completedLessons,
    levelCompletedCount,
    levelTotalLessons,
    token,
    error,
    loadMoreData,
    toggleSectionExpansion,
    expandOnlySection,
    getSectionProgress,
    refetch,
    createHandleLessonClick,
    fetchLessonById,
  } = useLessonData(assessment || '');

  const {
    parseWysiwygContent,
    getIllustrationUrl,
    isSupportedImageFormat,
    isLessonLocked,
  } = useLessonUtils();

  const [selectedGestureId, setSelectedGestureId] = useState<string | null>(
    null,
  );
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [lessonGestureInfo, setLessonGestureInfo] =
    useState<GestureInfo | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState<boolean>(true);
  const [autoPlayDelay, setAutoPlayDelay] = useState<number>(5);
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(
    null,
  );
  const [nextLessonEntry, setNextLessonEntry] =
    useState<FlattenedLesson | null>(null);
  const [showFullList, setShowFullList] = useState<boolean>(false);
  const [resumeTime, setResumeTime] = useState<number>(0);
  const [playbackSessionKey, setPlaybackSessionKey] = useState(0);
  const sectionListRef = useRef<SectionList<LessonTag, LessonSection>>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const countdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const resumeKeyRef = useRef<string | null>(null);
  const resumeSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const pendingResumeTimeRef = useRef<number | null>(null);
  const hasRestoredLastLessonRef = useRef(false);
  const restartFromBeginningRef = useRef(false);

  const clearAutoPlayTimers = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
    setCountdownRemaining(null);
    setNextLessonEntry(null);
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const loadAutoPlayPreferences = async () => {
      try {
        const [storedEnabled, storedDelay] = await Promise.all([
          AsyncStorage.getItem(AUTOPLAY_ENABLED_KEY),
          AsyncStorage.getItem(AUTOPLAY_DELAY_KEY),
        ]);

        if (storedEnabled !== null) {
          setAutoPlayEnabled(storedEnabled === 'true');
        }

        if (storedDelay !== null) {
          const parsedDelay = parseInt(storedDelay, 10);
          if (!Number.isNaN(parsedDelay)) {
            setAutoPlayDelay(
              Math.min(
                MAX_AUTOPLAY_DELAY,
                Math.max(MIN_AUTOPLAY_DELAY, parsedDelay),
              ),
            );
          }
        }
      } catch (error) {
        console.warn('Failed to load auto-play settings:', error);
      }
    };

    loadAutoPlayPreferences();
  }, []);

  useEffect(() => {
    if (!isGuest || !assessment) return;
    if (assessment === 'Beginner') return;
    if (hasPromptedGuestRef.current) return;

    hasPromptedGuestRef.current = true;
    promptCreateAccount(
      'Create an account to unlock Intermediate and Advanced lessons.',
    );
  }, [assessment, isGuest, promptCreateAccount]);

  useEffect(() => {
    AsyncStorage.setItem(
      AUTOPLAY_ENABLED_KEY,
      autoPlayEnabled ? 'true' : 'false',
    ).catch(error =>
      console.warn('Failed to persist auto-play enabled:', error),
    );
  }, [autoPlayEnabled]);

  useEffect(() => {
    AsyncStorage.setItem(AUTOPLAY_DELAY_KEY, `${autoPlayDelay}`).catch(error =>
      console.warn('Failed to persist auto-play delay:', error),
    );
  }, [autoPlayDelay]);

  useEffect(() => {
    if (!autoPlayEnabled) {
      clearAutoPlayTimers();
    }
  }, [autoPlayEnabled, clearAutoPlayTimers]);

  useEffect(
    () => () => {
      clearAutoPlayTimers();
    },
    [clearAutoPlayTimers],
  );

  const findSectionIdForLesson = useCallback(
    (lessonId: string) => {
      for (const section of sectionsData) {
        const match = section.data.some(item => item.id === lessonId);
        if (match) return section.id;
      }
      return null;
    },
    [sectionsData],
  );

  useEffect(() => {
    if (!assessment) return;
    if (hasRestoredLastLessonRef.current) return;
    if (currentLessonId) return;
    if (!lessonNuggets.length) return;

    let isMounted = true;

    const restoreLastLesson = async () => {
      try {
        const storageKey = `${LAST_LESSON_PREFIX}${assessment}`;
        const storedId = await AsyncStorage.getItem(storageKey);
        if (!storedId || !isMounted) return;

        let match: LessonTag | null =
          lessonNuggets.find(lesson => lesson.id === storedId) ?? null;
        if (!match) {
          match = await fetchLessonById(storedId);
        }
        if (!match) return;

        setCurrentLessonId(match.id);
        setExpandedLessonId(match.id);
        setSelectedGestureId(match.gesture?.id || null);
        setLessonGestureInfo(match.gesture || null);

        const sectionId = findSectionIdForLesson(match.id);
        if (sectionId) {
          expandOnlySection(sectionId);
        }
      } catch (error) {
        console.warn('Failed to restore last lesson:', error);
      } finally {
        if (isMounted) {
          hasRestoredLastLessonRef.current = true;
        }
      }
    };

    restoreLastLesson();

    return () => {
      isMounted = false;
    };
  }, [
    assessment,
    currentLessonId,
    expandOnlySection,
    fetchLessonById,
    findSectionIdForLesson,
    lessonNuggets,
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadResumePosition = async () => {
      if (!selectedGestureId) {
        setResumeTime(0);
        resumeKeyRef.current = null;
        pendingResumeTimeRef.current = null;
        return;
      }

      try {
        setResumeTime(0);
        const storageKey = `${GESTURE_POSITION_PREFIX}${selectedGestureId}`;
        resumeKeyRef.current = storageKey;

        if (restartFromBeginningRef.current) {
          restartFromBeginningRef.current = false;
          pendingResumeTimeRef.current = 0;
          return;
        }

        const storedValue = await AsyncStorage.getItem(storageKey);
        const parsed = storedValue ? parseFloat(storedValue) : 0;
        const safeValue = Number.isFinite(parsed) ? parsed : 0;

        if (isMounted) {
          setResumeTime(safeValue);
          pendingResumeTimeRef.current = safeValue;
        }
      } catch (error) {
        console.warn('Failed to load resume position:', error);
      }
    };

    loadResumePosition();

    return () => {
      isMounted = false;
    };
  }, [selectedGestureId]);

  useEffect(
    () => () => {
      if (resumeSaveTimeoutRef.current) {
        clearTimeout(resumeSaveTimeoutRef.current);
        resumeSaveTimeoutRef.current = null;
      }

      const storageKey = resumeKeyRef.current;
      const pendingTime = pendingResumeTimeRef.current;
      if (!storageKey || pendingTime === null) return;

      AsyncStorage.setItem(storageKey, pendingTime.toString()).catch(error =>
        console.warn('Failed to persist resume position:', error),
      );
    },
    [],
  );

  const scrollToSection = useCallback((sectionIndex: number) => {
    if (sectionListRef.current) {
      try {
        sectionListRef.current.scrollToLocation({
          sectionIndex,
          itemIndex: 0,
          animated: true,
          viewPosition: 0.5,
        });
      } catch (error) {
        // Failed to scroll; ignore quietly
      }
    } else {
      // SectionList ref not ready; ignore
    }
  }, []);

  const flattenedLessons = useMemo(
    () =>
      sectionsData.flatMap((section, sectionIndex) =>
        section.data.map((lesson, itemIndex) => ({
          lesson,
          sectionId: section.id,
          sectionTitle: section.title,
          sectionIndex,
          itemIndex,
          sectionLessons: section.data,
        })),
      ),
    [sectionsData],
  );

  const baseLessonClickHandler = useMemo(
    () =>
      createHandleLessonClick({
        setExpandedLessonId,
        setSelectedGestureId,
        setLessonGestureInfo,
        scrollToSection,
      }),
    [createHandleLessonClick, scrollToSection],
  );

  const nextPlayableLesson = useMemo(() => {
    if (!flattenedLessons.length) return null;

    const startIndex = currentLessonId
      ? flattenedLessons.findIndex(
          entry => entry.lesson.id === currentLessonId,
        ) + 1
      : 0;

    const ordered = [
      ...flattenedLessons.slice(startIndex),
      ...flattenedLessons.slice(0, startIndex),
    ];

    return (
      ordered.find(entry => {
        const locked = isLessonLocked(
          entry.lesson,
          entry.itemIndex,
          entry.sectionLessons,
          completedLessons,
        );
        return entry.lesson.gesture?.id && !locked;
      }) || null
    );
  }, [flattenedLessons, currentLessonId, completedLessons, isLessonLocked]);

  const currentLessonSection = useMemo(() => {
    if (!currentLessonId) return null;
    return (
      sectionsData.find(section =>
        section.data.some(item => item.id === currentLessonId),
      ) || null
    );
  }, [currentLessonId, sectionsData]);

  const currentLessonNuggets = useMemo(
    () => currentLessonSection?.data || [],
    [currentLessonSection],
  );

  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      if (!selectedGestureId || !Number.isFinite(currentTime)) return;

      pendingResumeTimeRef.current = currentTime;

      if (resumeSaveTimeoutRef.current) return;

      resumeSaveTimeoutRef.current = setTimeout(() => {
        resumeSaveTimeoutRef.current = null;
        const storageKey = resumeKeyRef.current;
        const pendingTime = pendingResumeTimeRef.current;
        if (!storageKey || pendingTime === null) return;

        AsyncStorage.setItem(storageKey, pendingTime.toString()).catch(error =>
          console.warn('Failed to persist resume position:', error),
        );
      }, 1000);
    },
    [selectedGestureId],
  );

  const handleLessonSelect = useCallback(
    (lesson: LessonTag) => {
      clearAutoPlayTimers();
      restartFromBeginningRef.current = true;
      setResumeTime(0);
      pendingResumeTimeRef.current = 0;
      setPlaybackSessionKey(prev => prev + 1);
      setShowFullList(false);
      setCurrentLessonId(lesson.id);
      setNextLessonEntry(null);
      const sectionId = findSectionIdForLesson(lesson.id);
      if (sectionId) {
        expandOnlySection(sectionId);
      }
      if (assessment) {
        Promise.all([
          AsyncStorage.setItem(`${LAST_LESSON_PREFIX}${assessment}`, lesson.id),
          AsyncStorage.setItem(
            LAST_LESSON_RESUME_KEY,
            JSON.stringify({
              assessment,
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              updatedAt: new Date().toISOString(),
            }),
          ),
        ]).catch(error =>
          console.warn('Failed to persist last lesson:', error),
        );
      }
      baseLessonClickHandler(lesson);
    },
    [
      assessment,
      baseLessonClickHandler,
      clearAutoPlayTimers,
      expandOnlySection,
      findSectionIdForLesson,
      setShowFullList,
    ],
  );

  const startNextLesson = useCallback(
    (entry: FlattenedLesson) => {
      if (!entry?.lesson?.gesture?.id) {
        clearAutoPlayTimers();
        return;
      }

      const isLockedLesson = isLessonLocked(
        entry.lesson,
        entry.itemIndex,
        entry.sectionLessons,
        completedLessons,
      );

      if (isLockedLesson) {
        clearAutoPlayTimers();
        return;
      }

      if (!expandedSections.has(entry.sectionId)) {
        toggleSectionExpansion(entry.sectionId);
      }

      clearAutoPlayTimers();
      handleLessonSelect(entry.lesson);
    },
    [
      clearAutoPlayTimers,
      completedLessons,
      expandedSections,
      handleLessonSelect,
      isLessonLocked,
      toggleSectionExpansion,
    ],
  );

  const scheduleNextLesson = useCallback(
    (finishedLessonId: string | null) => {
      clearAutoPlayTimers();

      if (!autoPlayEnabled || !finishedLessonId) return;

      const currentIndex = flattenedLessons.findIndex(
        entry => entry.lesson.id === finishedLessonId,
      );

      if (currentIndex === -1) return;

      const upcoming = flattenedLessons
        .slice(currentIndex + 1)
        .find(entry => entry.lesson.gesture?.id);

      if (!upcoming) return;

      const isLockedLesson = isLessonLocked(
        upcoming.lesson,
        upcoming.itemIndex,
        upcoming.sectionLessons,
        completedLessons,
      );

      if (isLockedLesson) return;

      setNextLessonEntry(upcoming);
      setCountdownRemaining(autoPlayDelay);

      countdownIntervalRef.current = setInterval(() => {
        setCountdownRemaining(prev => (prev && prev > 0 ? prev - 1 : prev));
      }, 1000);

      countdownTimeoutRef.current = setTimeout(() => {
        startNextLesson(upcoming);
      }, autoPlayDelay * 1000);
    },
    [
      autoPlayDelay,
      autoPlayEnabled,
      clearAutoPlayTimers,
      completedLessons,
      flattenedLessons,
      isLessonLocked,
      startNextLesson,
    ],
  );

  const handleVideoEnd = useCallback(() => {
    scheduleNextLesson(currentLessonId);
  }, [currentLessonId, scheduleNextLesson]);

  const handleAutoPlayCancel = useCallback(() => {
    clearAutoPlayTimers();
  }, [clearAutoPlayTimers]);

  const renderSectionHeader = useCallback(
    ({ section }: { section: LessonSection }) => {
      const isExpanded = expandedSections.has(section.id);
      const { completedCount, totalCount } = getSectionProgress(section);

      return (
        <LessonSectionHeader
          lessonTitle={section.title}
          nuggetCount={totalCount}
          completedCount={completedCount}
          isExpanded={isExpanded}
          onToggle={() => {
            if (isExpanded) {
              toggleSectionExpansion(section.id);
              return;
            }
            expandOnlySection(section.id);
          }}
        />
      );
    },
    [
      expandedSections,
      expandOnlySection,
      getSectionProgress,
      toggleSectionExpansion,
    ],
  );

  const renderLessonItem = useCallback(
    ({
      item,
      index,
      section,
    }: {
      item: LessonTag;
      index: number;
      section: LessonSection;
    }) => {
      const isExpanded = expandedSections.has(section.id);

      // Only render expanded section's items
      if (!isExpanded) {
        return null;
      }

      const locked = isLessonLocked(
        item,
        index,
        section.data,
        completedLessons,
      );
      const isActive = expandedLessonId === item.id;
      const parsedDetails = parseWysiwygContent(item.detail || '[]');
      const illustrationUrl = getIllustrationUrl(item.illustration);

      return (
        <LessonItem
          item={item}
          index={index}
          isLocked={locked}
          isActive={isActive}
          onPress={() => handleLessonSelect(item)}
          parsedDetails={parsedDetails}
          illustrationUrl={illustrationUrl}
          isSupportedImageFormat={isSupportedImageFormat}
          token={token}
        />
      );
    },
    [
      expandedSections,
      completedLessons,
      expandedLessonId,
      handleLessonSelect,
      isLessonLocked,
      parseWysiwygContent,
      getIllustrationUrl,
      isSupportedImageFormat,
      token,
    ],
  );

  const ListFooterComponent = useCallback(
    () =>
      isLoadingMore ? (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : null,
    [isLoadingMore],
  );

  const keyExtractor = useCallback(
    (item: LessonTag, index: number) => item.id + '_' + index,
    [],
  );

  if (isGuest && assessment && assessment !== 'Beginner') {
    return (
      <View style={styles.guestLockContainer}>
        <Text style={styles.guestLockTitle}>
          Create an account to access this lesson level.
        </Text>
        <TouchableOpacity
          onPress={() => promptCreateAccount()}
          style={styles.guestPrimaryButton}
        >
          <Text style={styles.guestPrimaryText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.guestSecondaryButton}
        >
          <Text style={styles.guestSecondaryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error && !lessonNuggets.length) {
    const isAuthError =
      error.toLowerCase().includes('sign in') ||
      error.toLowerCase().includes('authenticated');

    const actionLabel = isAuthError
      ? isGuest
        ? 'Create Account'
        : 'Sign In'
      : undefined;

    const handleAction = () => {
      if (!isAuthError) return;
      if (isGuest) {
        promptCreateAccount();
      } else {
        router.push('/signin');
      }
    };

    return (
      <View style={styles.container}>
        {Platform.OS === 'ios' ? (
          <View style={[styles.iosStatusBar, { height: insets.top }]} />
        ) : (
          <StatusBar style="light" backgroundColor={Colors.primary} />
        )}
        <LessonHeader onBackPress={handleBackPress} />
        <ErrorView
          title={
            isAuthError ? 'Authentication Required' : 'Something went wrong'
          }
          message={error}
          onRetry={handleRetry}
          {...(actionLabel ? { actionLabel } : {})}
          {...(actionLabel ? { onAction: handleAction } : {})}
        />
      </View>
    );
  }

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <View style={[styles.iosStatusBar, { height: insets.top }]} />
      ) : (
        <StatusBar style="light" backgroundColor={Colors.primary} />
      )}
      <View style={styles.videoContainer}>
        <LessonHeader onBackPress={handleBackPress} />
        <View style={styles.playerWrapper}>
          {selectedGestureId && lessonGestureInfo?.contentType ? (
            <MediaPlayer
              key={`${selectedGestureId}-${playbackSessionKey}`}
              gestureInfo={lessonGestureInfo}
              gestureId={selectedGestureId}
              autoPlay={true}
              useAdaptiveStreaming={true}
              onEnd={handleVideoEnd}
              initialTime={resumeTime}
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                Choose a lesson to get started
              </Text>
              <Text style={styles.emptySubtitle}>
                Auto-play will queue the next video with a short countdown.
              </Text>
            </View>
          )}

          {nextLessonEntry && countdownRemaining !== null && (
            <View style={styles.countdownBanner}>
              <View style={styles.countdownTextWrap}>
                <Text style={styles.countdownLabel}>Up next</Text>
                <Text style={styles.countdownLesson} numberOfLines={2}>
                  {nextLessonEntry.lesson.title}
                </Text>
                <Text style={styles.countdownTimer}>
                  Starting in {countdownRemaining}s
                </Text>
              </View>
              <View style={styles.countdownActions}>
                <TouchableOpacity
                  onPress={handleAutoPlayCancel}
                  style={styles.countdownSecondary}
                  accessibilityRole="button"
                >
                  <Text style={styles.countdownSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => startNextLesson(nextLessonEntry)}
                  style={styles.countdownPrimary}
                  accessibilityRole="button"
                >
                  <Text style={styles.countdownPrimaryText}>Play now</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.autoPlayControls}>
          <View style={styles.autoPlayRow}>
            <View style={styles.autoPlayTextGroup}>
              <Text style={styles.autoPlayLabel}>Auto-play next lesson</Text>
              <Text style={styles.autoPlayHelper}>
                {autoPlayEnabled
                  ? 'Countdown leaves room to pause or read notes.'
                  : 'Stay in control by tapping lessons manually.'}
              </Text>
            </View>
            <Switch
              value={autoPlayEnabled}
              onValueChange={setAutoPlayEnabled}
              thumbColor={autoPlayEnabled ? '#ffffff' : '#ffffff'}
              trackColor={{ false: '#94a3b8', true: Colors.primary }}
              ios_backgroundColor="#64748b"
            />
          </View>
        </View>
      </View>

      {/* Lesson Info */}
      <LessonInfo
        assessment={assessment || ''}
        completedLessons={levelCompletedCount}
        lessonCount={levelTotalLessons || lessonCount}
      />

      {/* Compact Lesson Preview */}
      {!showFullList && (
        <View style={styles.compactList}>
          <View style={styles.compactHeader}>
            <Text style={styles.compactTitle}>Lessons</Text>
            <TouchableOpacity
              onPress={() => setShowFullList(true)}
              accessibilityRole="button"
            >
              <Text style={styles.compactLink}>See all</Text>
            </TouchableOpacity>
          </View>
          {currentLessonSection ? (
            <View style={styles.compactCard}>
              <Text style={styles.compactLabel}>Current lesson</Text>
              <Text style={styles.compactLesson} numberOfLines={2}>
                {currentLessonSection.title}
              </Text>
              <Text style={styles.compactHint}>
                Continue where you left off or pick another nugget.
              </Text>
            </View>
          ) : nextPlayableLesson ? (
            <TouchableOpacity
              style={styles.compactCard}
              onPress={() => handleLessonSelect(nextPlayableLesson.lesson)}
              accessibilityRole="button"
            >
              <Text style={styles.compactLabel}>Up next</Text>
              <Text style={styles.compactLesson} numberOfLines={2}>
                {nextPlayableLesson.lesson.title}
              </Text>
              <Text style={styles.compactHint}>
                Tap to start or swipe to sign
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.compactEmpty}>
              <Text style={styles.compactLesson}>No more lessons ready.</Text>
              <Text style={styles.compactHint}>
                You can review from the list.
              </Text>
            </View>
          )}

          {!!currentLessonNuggets.length && (
            <View style={styles.compactNuggetList}>
              <ScrollView
                style={styles.compactNuggetScroll}
                contentContainerStyle={styles.compactNuggetContent}
                showsVerticalScrollIndicator={false}
              >
                {currentLessonNuggets.map((item, index) => {
                  const locked = isLessonLocked(
                    item,
                    index,
                    currentLessonNuggets,
                    completedLessons,
                  );
                  const isActive = expandedLessonId === item.id;
                  const parsedDetails = parseWysiwygContent(
                    item.detail || '[]',
                  );
                  const illustrationUrl = getIllustrationUrl(item.illustration);

                  return (
                    <LessonItem
                      key={item.id}
                      item={item}
                      index={index}
                      isLocked={locked}
                      isActive={isActive}
                      onPress={() => handleLessonSelect(item)}
                      parsedDetails={parsedDetails}
                      illustrationUrl={illustrationUrl}
                      isSupportedImageFormat={isSupportedImageFormat}
                      token={token}
                    />
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* Lesson List */}
      {showFullList && (
        <View style={styles.listContainer}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listTitle}>All lessons</Text>
            <TouchableOpacity
              onPress={() => setShowFullList(false)}
              accessibilityRole="button"
            >
              <Text style={styles.compactLink}>Hide list</Text>
            </TouchableOpacity>
          </View>
          <SectionList<LessonTag, LessonSection>
            ref={sectionListRef}
            sections={sectionsData}
            keyExtractor={keyExtractor}
            renderItem={renderLessonItem}
            renderSectionHeader={renderSectionHeader}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={21}
            removeClippedSubviews
            onEndReached={loadMoreData}
            onEndReachedThreshold={0.3}
            ListFooterComponent={ListFooterComponent}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
        </View>
      )}
    </View>
  );
};

export default React.memo(Level);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  iosStatusBar: { backgroundColor: Colors.primary },
  videoContainer: {
    // backgroundColor: '#1f1f1f',
    // paddingBottom: 12,
  },
  playerWrapper: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#000',
    minHeight: 220,
    marginHorizontal: 0,
    // marginTop: 8,
    borderRadius: 0,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#d9d9d9',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  countdownBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(15, 76, 92, 0.9)',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countdownTextWrap: { flex: 1 },
  countdownLabel: {
    color: '#d1f0ff',
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  countdownLesson: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  countdownTimer: {
    color: '#f0f8ff',
    fontSize: 13,
    marginTop: 2,
  },
  countdownActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdownSecondary: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b6dce7',
    marginRight: 8,
  },
  countdownSecondaryText: {
    color: '#e3f6ff',
    fontSize: 13,
    fontWeight: '600',
  },
  countdownPrimary: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
  },
  countdownPrimaryText: {
    color: '#0a1f26',
    fontSize: 13,
    fontWeight: '700',
  },
  autoPlayControls: {
    marginTop: 5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f6f8fa',
    borderTopWidth: 1,
    borderTopColor: '#d9d9d9',
  },
  autoPlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  autoPlayTextGroup: { flex: 1 },
  autoPlayLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  autoPlayHelper: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 4,
    lineHeight: 18,
  },
  delayRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  delayLabel: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  delayButtons: {
    flexDirection: 'row',
  },
  delayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  delayButtonSpacer: {
    marginLeft: 8,
  },
  delayButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  compactList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  compactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  compactLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
  compactCard: {
    backgroundColor: '#f6f8fa',
    borderRadius: 12,
    padding: 14,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  compactLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compactLesson: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  compactHint: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 4,
  },
  compactEmpty: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fafafa',
  },
  compactNuggetList: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingBottom: 4,
  },
  compactNuggetScroll: {
    maxHeight: 320,
    paddingBottom: 10,
  },
  compactNuggetContent: {
    paddingBottom: 10,
  },
  listContainer: {
    flex: 1,
    paddingTop: 6,
    backgroundColor: '#fff',
  },
  listHeaderRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  loadingFooter: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestLockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
    gap: 12,
  },
  guestLockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
  },
  guestPrimaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  guestPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  guestSecondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  guestSecondaryText: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '500',
  },
});
