import React, { memo } from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FontAwesome5 } from '@expo/vector-icons';

import ImagePlayerComponent from '@/components/common/ImageViewerComponent';
import { typography } from '@/constants/Typography';
import { LessonTag } from '@/hooks/useLessonData';

interface LessonItemProps {
  item: LessonTag;
  index: number;
  isLocked: boolean;
  isActive: boolean;
  onPress: () => void;
  parsedDetails: string[];
  illustrationUrl: string | null;
  isSupportedImageFormat: (_contentType: string) => boolean;
  token: string | null;
}

const LessonItem: React.FC<LessonItemProps> = ({
  item,
  isLocked,
  isActive,
  onPress,
  parsedDetails,
  illustrationUrl,
  isSupportedImageFormat,
  token,
}) => {
  const hasContent = parsedDetails.length > 0 || !!illustrationUrl;

  return (
    <View key={item.id}>
      <TouchableOpacity
        style={[
          styles.lessonItem,
          isActive && styles.activeLesson,
          isLocked && styles.lockedLesson,
        ]}
        onPress={!isLocked ? onPress : undefined}
        disabled={isLocked}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <FontAwesome5
            name={isLocked ? 'lock' : 'play-circle'}
            size={24}
            color={isLocked ? '#999' : '#4682B4'}
          />
        </View>
        <View style={styles.lessonDetails}>
          <Text style={[styles.lessonTitle, isLocked && { color: '#999' }]}>
            {item.title}
            {isLocked && ' (Locked)'}
          </Text>
          <Text style={[styles.lessonDuration, isLocked && { color: '#999' }]}>
            {item.duration || item.lesson?.title || ''}
          </Text>
        </View>
        {!isLocked && hasContent && (
          <View style={styles.accordionIcon}>
            <FontAwesome5
              name={isActive ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#666"
            />
          </View>
        )}
      </TouchableOpacity>

      {isActive && !isLocked && hasContent && (
        <View style={styles.accordionContent}>
          {/* Illustration */}
          {illustrationUrl &&
            item.illustration?.contentType &&
            isSupportedImageFormat(item.illustration.contentType) && (
              <View style={styles.illustrationContainer}>
                <ImagePlayerComponent
                  uri={illustrationUrl}
                  headers={{
                    authorization: `Token ${token || ''}`,
                  }}
                  style={styles.illustrationImage}
                  accessibilityLabel={
                    item.illustration.name
                      ? `Lesson illustration: ${item.illustration.name}`
                      : 'Lesson illustration'
                  }
                />
                {item.illustration.name && (
                  <Text style={styles.illustrationCaption}>
                    {item.illustration.name}
                  </Text>
                )}
              </View>
            )}

          {/*
            Text Details
            TODO: To be implemented with rich text editor
           */}
          {parsedDetails.map((paragraph: string, pIndex: number) => (
            <Text key={pIndex} style={styles.detailParagraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
    ...typography.bodyStrong,
    color: '#333',
  },
  lessonDuration: {
    ...typography.body,
    color: '#888',
  },
  activeLesson: {
    backgroundColor: '#f5f5f5',
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
    ...typography.body,
    color: '#555',
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
    ...typography.caption,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default memo(LessonItem);
