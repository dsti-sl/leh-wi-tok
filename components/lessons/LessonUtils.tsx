import React, { memo } from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { FontSizes, FontWeights } from '@/constants/Typography';

export const LessonHeader = memo(
  ({ onBackPress }: { onBackPress: () => void }) => (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={onBackPress}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  ),
);
LessonHeader.displayName = 'LessonHeader';

export const LessonInfo = memo(
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

export const LoadingView = memo(() => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.primary} />
  </View>
));
LoadingView.displayName = 'LoadingView';

export const ErrorView = memo(
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

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
  },
  lessonInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: '#333',
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: '#4a4a4a',
    marginTop: 4,
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
    fontSize: FontSizes.md,
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
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semiBold,
  },
});
