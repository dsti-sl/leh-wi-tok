import React, { useCallback, useMemo, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Platform,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

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
import {
  GestureInfo,
  LessonSection,
  LessonTag,
  useLessonData,
} from '@/hooks/useLessonData';
import { useLessonUtils } from '@/hooks/useLessonUtils';

const Level: React.FC = () => {
  const { assessment } = useLocalSearchParams<{ assessment: string }>();

  const {
    lessonNuggets,
    sectionsData,
    expandedSections,
    isLoading,
    isLoadingMore,
    lessonCount,
    completedLessons,
    token,
    error,
    loadMoreData,
    toggleSectionExpansion,
    getSectionProgress,
    refetch,
    createHandleLessonClick,
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
  const sectionListRef = useRef<SectionList<LessonTag, LessonSection>>(null);

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

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

  const handleLessonClick = useMemo(
    () =>
      createHandleLessonClick({
        setExpandedLessonId,
        setSelectedGestureId,
        setLessonGestureInfo,
        scrollToSection,
      }),
    [createHandleLessonClick, scrollToSection],
  );

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
          onToggle={() => toggleSectionExpansion(section.id)}
        />
      );
    },
    [expandedSections, getSectionProgress, toggleSectionExpansion],
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
          onPress={() => handleLessonClick(item)}
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
      handleLessonClick,
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
  videoContainer: {
    height: 300,
    backgroundColor: '#2d2d2d',
  },
  video: {
    flex: 1,
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
