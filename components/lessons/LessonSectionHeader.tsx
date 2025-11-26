import React, { memo } from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FontAwesome5 } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { typography } from '@/constants/Typography';

interface LessonSectionHeaderProps {
  lessonTitle: string;
  nuggetCount: number;
  completedCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const LessonSectionHeader: React.FC<LessonSectionHeaderProps> = ({
  lessonTitle,
  nuggetCount,
  completedCount,
  isExpanded,
  onToggle,
}) => {
  const progressPercentage =
    nuggetCount > 0 ? (completedCount / nuggetCount) * 100 : 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Text style={styles.title} numberOfLines={2}>
            {lessonTitle}
          </Text>
          <Text style={styles.subtitle}>
            {completedCount} of {nuggetCount} nuggets completed
          </Text>
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progressPercentage)}%
            </Text>
          </View>
        </View>

        <View style={styles.rightContent}>
          <FontAwesome5
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={Colors.primary}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    marginLeft: 12,
  },
  title: {
    ...typography.subheading,
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
    color: '#666',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    ...typography.caption,
    color: '#666',
    minWidth: 35,
    textAlign: 'right',
  },
});

export default memo(LessonSectionHeader);
