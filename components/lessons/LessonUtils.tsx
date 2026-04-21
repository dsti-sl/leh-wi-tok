import React, { memo } from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
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
    completedLessons: number;
    lessonCount: number;
  }) => (
    <View style={styles.lessonInfo}>
      <View style={styles.lessonHeader}>
        <View>
          <Text style={styles.title}>{assessment}</Text>
          <Text style={styles.subtitle}>
            {Math.min(completedLessons, lessonCount)} of {lessonCount} completed
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
  ({
    title = 'Something went wrong',
    message,
    onRetry,
    actionLabel,
    onAction,
  }: {
    title?: string;
    message: string;
    onRetry: () => void;
    actionLabel?: string;
    onAction?: () => void;
  }) => (
    <View style={styles.errorContainer}>
      <View style={styles.errorCard}>
        <Ionicons
          name="alert-circle-outline"
          size={44}
          color={Colors.primary}
        />
        <Text style={styles.errorTitle}>{title}</Text>
        <Text style={styles.errorText}>{message}</Text>
        <View style={styles.errorActions}>
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          {actionLabel && onAction && (
            <TouchableOpacity onPress={onAction} style={styles.secondaryButton}>
              <Ionicons
                name="log-in-outline"
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.secondaryText}>{actionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  ),
);
ErrorView.displayName = 'ErrorView';

const styles = StyleSheet.create<{
  headerContainer: ViewStyle;
  lessonInfo: ViewStyle;
  lessonHeader: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  loadingContainer: ViewStyle;
  errorContainer: ViewStyle;
  errorCard: ViewStyle;
  errorTitle: TextStyle;
  errorText: TextStyle;
  errorActions: ViewStyle;
  retryButton: ViewStyle;
  retryText: TextStyle;
  secondaryButton: ViewStyle;
  secondaryText: TextStyle;
}>({
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
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  subtitle: {
    fontSize: FontSizes.sm,
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
    backgroundColor: '#f6f7f9',
  },
  errorCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e8ee',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  errorTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: '#1f2937',
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FontSizes.md,
    color: '#5b6675',
    textAlign: 'center',
    marginTop: 8,
  },
  errorActions: {
    marginTop: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semiBold,
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#d8dee7',
  },
  secondaryText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semiBold,
  },
});
