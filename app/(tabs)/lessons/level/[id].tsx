import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ToastAndroid,
  ActivityIndicator,
  FlatList,
} from 'react-native';

import MediaPlayer from '@/components/common/MediaPlayer';
import { Colors } from '@/constants/Colors';
import useLessonLevel from '@/hooks/useLessonLevel';
import {
  getBaseUrl,
  getStoredCompletedLessons,
  getStoredUserId,
  getToken,
  LessonData,
  storeCompletedLessons,
} from '@/utils';

interface GestureInfo {
  contentType: string;
  [key: string]: any;
}

const Level = () => {
  const { loading, activeLesson, handleLessonSelect } = useLessonLevel();

  const { assessment } = useLocalSearchParams<{ assessment: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [lessonTags, setLessonTags] = useState<any[]>([]);
  const [lessonGestureInfo, setLessonGestureInfo] =
    useState<GestureInfo | null>(null);
  const [lessonCount, setLessonCount] = useState<number>(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    new Set(),
  );
  const [serverProgress, setServerProgress] = useState<LessonData[]>([]);
  const [selectedGestureId, setSelectedGestureId] = useState<string | null>(
    null,
  );
  const [token, setToken] = React.useState<string | null>(null);

  const EXPO_PUBLIC_BASE_URL = getBaseUrl();

  // --- Fetch lesson progress ---
  const fetchLessonProgress = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch(
          `${EXPO_PUBLIC_BASE_URL}/lesson-progress?and=(user.id.eq.${userId})&select=totalCompleted,user(id,name),level,totalLessons,lessonsCompleted,id,updatedAt,createdAt`,
        );
        if (!res.ok) throw new Error('API error');
        const { data } = await res.json();
        if (data) {
          await storeCompletedLessons(data);
          setServerProgress(data);
          return data;
        }
        return null;
      } catch {
        return null;
      }
    },
    [EXPO_PUBLIC_BASE_URL],
  );

  // --- Fetch lessons and progress, optimized ---
  const fetchLessonCategory = useCallback(async () => {
    setIsLoading(true);
    try {
      const userId = await getStoredUserId();
      if (!userId) throw new Error('No user ID found');

      // 1. Fetch lesson tags
      const res = await fetch(
        `${EXPO_PUBLIC_BASE_URL}/nugget?and=(lesson.tags.title.eq.${assessment})&select=lesson(id,title,description,active,tags,title,id,illustration),gesture,priority,id,title,active,detail,illustration`,
      );
      if (!res.ok) throw new Error('Failed to fetch lesson category');
      const data = await res.json();
      const sortedTags = data.data.sort((a, b) => a.priority - b.priority);
      setLessonTags(sortedTags);
      setLessonCount(data.meta.count);

      // 2. Fetch progress
      let progressData: LessonData[] =
        (await fetchLessonProgress(userId)) ?? [];
      if (!progressData.length) {
        const stored = await getStoredCompletedLessons();
        progressData = stored.lessons ?? [];
      }
      // 3. Filter completed lessons
      const currentLevel = progressData.find((l) => l.level === assessment);
      const completedIds = currentLevel?.lessonsCompleted || [];
      const filteredCompleted = completedIds.filter((id: string) =>
        sortedTags.some((lesson: any) => lesson.id === id),
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
    } catch (error) {
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

  // --- Lesson completion handler ---
  const handleLessonClick = useCallback(
    async (lesson: any) => {
      handleLessonSelect(lesson);
      setSelectedGestureId(lesson?.gesture?.id);
      setLessonGestureInfo(lesson?.gesture);
      const userId = await getStoredUserId();
      if (!userId) return;

      // Always start with filtered completed lessons
      const previousCompleted = Array.from(completedLessons).filter((id) =>
        lessonTags.some((l) => l.id === id),
      );
      const newCompleted = new Set(previousCompleted);
      newCompleted.add(lesson.id);

      // Update or add lesson progress for this level
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

      // Sync to server (PATCH or POST)
      const matchedProgress = serverProgress.find(
        (p) => p.level === assessment,
      );
      const levelExists = !!matchedProgress;
      await storeCompletedLessons(updatedLessons);
      try {
        await fetch(
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
      } catch {}

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
  const isLessonLocked = useCallback(
    (currentLesson: any, index: number, lessons: any[]) => {
      if (index === 0) return false;
      const previousLesson = lessons[index - 1];
      return !completedLessons.has(previousLesson.id);
    },
    [completedLessons],
  );

  const parseWeziwikContent = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return parsed
        .map((block: { type: string; children?: { text: string }[] }) => {
          if (block.type === 'paragraph' && block.children) {
            return block.children.map((child) => child.text).join('');
          }
          return '';
        })
        .filter((text: string) => text.trim() !== '');
    } catch (error) {
      return [];
    }
  }, []);

  const getIllustrationUrl = useCallback(
    (illustration: any) => {
      if (!illustration?.path) return null;
      return `${EXPO_PUBLIC_BASE_URL}/file/download?id=${illustration.id}`;
    },
    [EXPO_PUBLIC_BASE_URL],
  );

  const isSupportedImageFormat = useCallback((contentType: string) => {
    return contentType?.startsWith('image/');
  }, []);

  // --- Render item (Memoized) ---
  const renderLessonItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const locked = isLessonLocked(item, index, lessonTags);
      const isActive = activeLesson?.id === item.id;
      const parsedDetails = parseWeziwikContent(item.detail || '[]');
      const illustrationUrl = getIllustrationUrl(item.illustration);
      const hasContent = parsedDetails.length > 0 || illustrationUrl;

      return (
        <View key={item.id}>
          <TouchableOpacity
            style={[
              styles.lessonItem,
              isActive && styles.activeLesson,
              locked && styles.lockedLesson,
            ]}
            onPress={() => !locked && handleLessonClick(item)}
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
                {item.title}
                {locked && ' (Locked)'}
              </Text>
              <Text
                style={[styles.lessonDuration, locked && { color: '#999' }]}
              >
                {item.duration || item.lesson?.title || ''}
              </Text>
            </View>
            {!locked && hasContent && (
              <View style={styles.accordionIcon}>
                <FontAwesome5
                  name={isActive ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#666"
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Accordion Details */}
          {isActive && !locked && hasContent && (
            <View style={styles.accordionContent}>
              {/* Illustration */}
              {illustrationUrl &&
                item.illustration?.contentType &&
                isSupportedImageFormat(item.illustration.contentType) && (
                  <View style={styles.illustrationContainer}>
                    <Image
                      source={{
                        uri: illustrationUrl,
                        headers: {
                          authorization: `Token ${token || ''}`,
                        },
                      }}
                      style={styles.illustrationImage}
                      contentFit="contain"
                      transition={200}
                    />
                    {item.illustration.name && (
                      <Text style={styles.illustrationCaption}>
                        {item.illustration.name}
                      </Text>
                    )}
                  </View>
                )}

              {/* Text Details */}
              {parsedDetails.map((paragraph: string, pIndex: number) => (
                <Text key={pIndex} style={styles.detailParagraph}>
                  {paragraph}
                </Text>
              ))}
            </View>
          )}
        </View>
      );
    },
    [
      lessonTags,
      activeLesson,
      handleLessonClick,
      isLessonLocked,
      parseWeziwikContent,
      getIllustrationUrl,
      isSupportedImageFormat,
    ],
  );

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <View style={{ height: 50, backgroundColor: Colors.primary }} />
      ) : (
        <StatusBar style="light" backgroundColor={Colors.primary} />
      )}
      {loading || isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <>
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
            {selectedGestureId &&
              lessonGestureInfo?.contentType &&
              lessonGestureInfo && (
                <MediaPlayer
                  gestureInfo={lessonGestureInfo}
                  gestureId={selectedGestureId as string}
                />
              )}
          </View>

          <View style={styles.lessonInfo}>
            <View style={styles.lessonHeader}>
              <View>
                <Text style={styles.title}>{assessment}</Text>
                <Text style={styles.subtitle}>
                  {completedLessons.size < lessonCount
                    ? completedLessons.size
                    : lessonCount}{' '}
                  of {lessonCount} Lessons Completed
                </Text>
              </View>
            </View>
          </View>

          <FlatList
            data={lessonTags}
            keyExtractor={(item) => item.id}
            renderItem={renderLessonItem}
            initialNumToRender={20}
            maxToRenderPerBatch={40}
            windowSize={21}
            removeClippedSubviews
          />
        </>
      )}
    </View>
  );
};

export default React.memo(Level);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  accordionIcon: {
    marginLeft: 8,
  },
  accordionContent: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailParagraph: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  illustrationImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  illustrationCaption: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
