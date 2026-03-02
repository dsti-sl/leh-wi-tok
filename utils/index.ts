// UTILITIES METHODS

import Constants from 'expo-constants';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Record as C_Record } from '@/lib/types';

/**
 * @param arrStrings
 * @returns
 */
export const parseArrayStringsToSelectableObjects = (arrStrings: string[]) =>
  arrStrings.reduce(
    (acc: C_Record[], val: string, curIndex: number) => [
      ...acc,
      { key: curIndex + 1, label: val, value: val },
    ],
    [],
  );

export const parseArrayObjectToSelectables = (
  arrObjects: C_Record[],
  labelKey: string,
  valueKey: string,
) =>
  arrObjects.reduce(
    (acc: C_Record[], val, curIndex: number) => [
      ...acc,
      {
        key: curIndex + 1,
        label: val[labelKey] || '',
        value: val[valueKey] || '',
      },
    ],
    [],
  );

export const getFirstWord = (str: string) => {
  return str.split(' ')[0];
};

export const accumulateLessonCounts = (
  lessonCounts: Record<string, number>,
): number => {
  return (Object.values(lessonCounts) as number[]).reduce(
    (sum, count) => sum + count,
    0,
  );
};

export const getToken = async (): Promise<string | null> => {
  const token = await AsyncStorage.getItem('token');
  return token;
};

export const setToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem('token', token);
};
// ----- Helpers for AsyncStorage -----
export type LessonData = {
  id?: string;
  level: string;
  totalCompleted: number;
  totalLessons: number;
  userId: string;
  lessonsCompleted: string[];
};

export type CompletedLessonData = {
  lessons: LessonData[];
};

export const getStoredUserId = async (): Promise<string | null> => {
  const user = await AsyncStorage.getItem('user');
  return user ? JSON.parse(user).id : null;
};

export const getStoredCompletedLessons =
  async (): Promise<CompletedLessonData> => {
    const stored = await AsyncStorage.getItem('completedLesson');
    return stored ? JSON.parse(stored) : { lessons: [] };
  };

export const storeCompletedLessons = async (lessons: LessonData[]) => {
  await AsyncStorage.setItem('completedLesson', JSON.stringify({ lessons }));
};

export type LessonLevel =
  | 'Beginner'
  | 'Basic Elementary'
  | 'Intermediate'
  | 'Advanced';
export type LessonCount = Record<LessonLevel, number>;

export interface LessonCompletionData {
  lessons: LessonProgress[];
}
export interface OverallData {
  accumulatedLessons: number;
  accumulatedCompletedLessons: number;
}
export const LEVELS: LessonLevel[] = [
  'Beginner',
  'Basic Elementary',
  'Intermediate',
  'Advanced',
];
export const SUMMARY_LEVELS: LessonLevel[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
];

export const calculateOverallDataForLevels = (
  lessons: LessonData[],
  lessonCount: LessonCount,
  levels: LessonLevel[] = SUMMARY_LEVELS,
): OverallData => {
  return levels.reduce(
    (acc, level) => {
      const lesson = lessons.find(item => item.level === level);
      const totalLessons = lessonCount[level] ?? lesson?.totalLessons ?? 0;
      const completed = lesson?.totalCompleted ?? 0;
      const cappedCompleted = Math.min(completed, totalLessons);

      acc.accumulatedLessons += totalLessons;
      acc.accumulatedCompletedLessons += cappedCompleted;
      return acc;
    },
    { accumulatedLessons: 0, accumulatedCompletedLessons: 0 },
  );
};

export interface LessonsCategoryProps {
  progressSummary: C_Record;
  lessonCount: LessonCount;
}

export interface LessonProgress {
  level: LessonLevel;
  totalCompleted: number;
  totalLessons: number;
}

/**
 * Returns the base API URL from the Expo config.
 * Returns fallback URL if not set in production builds.
 */
export function getBaseUrl(): string {
  // You can adjust the property if your config structure changes
  const url =
    Constants.expoConfig?.extra?.API_URL || process.env.EXPO_PUBLIC_BASE_URL;

  if (!url) {
    throw new Error(
      '[getBaseUrl] No API URL found. Please check your Expo config or environment variables.',
    );
  }

  return url;
}

/**
 * Normalizes Sierra Leone phone numbers to international format (232XXXXXXXXX)
 * Handles various input formats: 0XXX, 232XXXXXXX, +232XXXXXXX
 * @param phoneNumber - The input phone number
 * @returns Normalized phone number starting with 232
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  let normalized = phoneNumber.replace(/\s+/g, '').replace(/^\+/, '');

  if (normalized.startsWith('0')) {
    normalized = '232' + normalized.substring(1);
  } else if (!normalized.startsWith('232')) {
    normalized = '232' + normalized;
  }

  return normalized;
}
