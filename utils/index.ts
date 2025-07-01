// UTILITIES METHODS

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import { Record } from '@/lib/types';

/**
 * @param arrStrings
 * @returns
 */
export const parseArrayStringsToSelectableObjects = (arrStrings: string[]) =>
  arrStrings.reduce(
    (acc: Record[], val: string, curIndex: number) => [
      ...acc,
      { key: curIndex + 1, label: val, value: val },
    ],
    [],
  );

export const parseArrayObjectToSelectables = (
  arrObjects: Record[],
  labelKey: string,
  valueKey: string,
) =>
  arrObjects.reduce(
    (acc: Record[], val, curIndex: number) => [
      ...acc,
      { key: curIndex + 1, label: val[labelKey], value: val[valueKey] },
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
  lessons: LessonData[];
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

export interface LessonsCategoryProps {
  progressSummary: Record;
  lessonCount: { [key: string]: number };
}

export interface LessonProgress {
  level: LessonLevel;
  totalCompleted: number;
  totalLessons: number;
}

export interface LessonCompletionData {
  lessons: LessonProgress[];
}

/**
 * Returns the base API URL from the Expo config.
 * Throws an error if the URL is not set.
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
