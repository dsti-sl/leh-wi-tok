import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';

import MediaPlayer from '@/components/common/MediaPlayer';
import LessonItem from '@/components/lessons/LessonItem';
import { Colors } from '@/constants/Colors';
import { useLessonData, GestureInfo, LessonTag } from '@/hooks/useLessonData';
import { useLessonUtils } from '@/hooks/useLessonUtils';

const ITEM_HEIGHT = 80;

const LessonHeader = memo(({ onBackPress }: { onBackPress: () => void }) => (
  <View style={styles.headerContainer}>
    <TouchableOpacity onPress={onBackPress}>
      <Ionicons name="chevron-back" size={24} color="#fff" />
    </TouchableOpacity>
  </View>
));
LessonHeader.displayName = 'LessonHeader';

const LessonInfo = memo(
  ({
    assessment,
    completedLessons,
    lessonCount,
  }: {
    assessment: string;
    completedLessons: Set<string>;
    lessonCount: number;
  }) => (
    <View style={styles.lessonInfo}>
      <View style={styles.lessonHeader}>
        <View>
          <Text style={styles.title}>{assessment}</Text>
          <Text style={styles.subtitle}>
            {Math.min(completedLessons.size, lessonCount)} of {lessonCount}{' '}
            Lessons Completed
          </Text>
        </View>
      </View>
    </View>
  ),
);
LessonInfo.displayName = 'LessonInfo';

const LoadingView = memo(() => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.primary} />
  </View>
));
LoadingView.displayName = 'LoadingView';

const ErrorView = memo(
  ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Error: {error}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  ),
);
ErrorView.displayName = 'ErrorView';

const Level: React.FC = () => {
  const { assessment } = useLocalSearchParams<{ assessment: string }>();

  const {
    lessonNuggets,
    isLoading,
    isLoadingMore,
    lessonCount,
    completedLessons,
    token,
    error,
    loadMoreData,
    markLessonCompleted,
    refetch,
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
  const [lessonGestureInfo, setLessonGestureInfo] =
    useState<GestureInfo | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const scrollToLesson = useCallback((index: number) => {
    if (flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      } catch (error) {
        // Fallback to scrollToOffset
        flatListRef.current.scrollToOffset({
          offset: index * ITEM_HEIGHT,
          animated: true,
        });
      }
    }
  }, []);

  const handleLessonClick = useCallback(
    async (lesson: LessonTag) => {
      try {
        setExpandedLessonId((prev) => (prev === lesson.id ? null : lesson.id));

        const lessonIndex = lessonNuggets.findIndex(
          (item) => item.id === lesson.id,
        );
        if (lessonIndex !== -1) {
          scrollToLesson(lessonIndex);
        }

        setSelectedGestureId(lesson?.gesture?.id || null);
        setLessonGestureInfo(lesson?.gesture || null);

        await markLessonCompleted(lesson.id);
      } catch (error) {
        console.error('Error handling lesson click:', error);
        Alert.alert('Error', 'Failed to process lesson selection');
      }
    },
    [lessonNuggets, scrollToLesson, markLessonCompleted],
  );

  const renderLessonItem = useCallback(
    ({ item, index }: { item: LessonTag; index: number }) => {
      const locked = isLessonLocked(
        item,
        index,
        lessonNuggets,
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
          onPress={() => handleLessonClick(item)}
          parsedDetails={parsedDetails}
          illustrationUrl={illustrationUrl}
          isSupportedImageFormat={isSupportedImageFormat}
          token={token}
        />
      );
    },
    [
      lessonNuggets,
      completedLessons,
      expandedLessonId,
      handleLessonClick,
      isLessonLocked,
      parseWysiwygContent,
      getIllustrationUrl,
      isSupportedImageFormat,
      token,
    ],
  );

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
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

  const keyExtractor = useCallback((item: LessonTag) => item.id, []);

  if (error && !lessonNuggets.length) {
    return <ErrorView error={error} onRetry={handleRetry} />;
  }

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <View style={styles.iosStatusBar} />
      ) : (
        <StatusBar style="light" backgroundColor={Colors.primary} />
      )}

      {/* Video Container */}
      <View style={styles.videoContainer}>
        <LessonHeader onBackPress={handleBackPress} />
        {selectedGestureId && lessonGestureInfo?.contentType && (
          <MediaPlayer
            key={selectedGestureId}
            gestureInfo={lessonGestureInfo}
            gestureId={selectedGestureId}
            autoPlay={true}
          />
        )}
      </View>

      {/* Lesson Info */}
      <LessonInfo
        assessment={assessment || ''}
        completedLessons={completedLessons}
        lessonCount={lessonCount}
      />

      {/* Lesson List */}
      <FlatList
        ref={flatListRef}
        data={lessonNuggets}
        keyExtractor={keyExtractor}
        renderItem={renderLessonItem}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={21}
        removeClippedSubviews
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.3}
        getItemLayout={getItemLayout}
        ListFooterComponent={ListFooterComponent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default React.memo(Level);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  iosStatusBar: {
    height: 50,
    backgroundColor: Colors.primary,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  loadingFooter: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
