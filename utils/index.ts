// UTILITIES METHODS

import Constants from 'expo-constants';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Record as C_Record } from '@/lib/types';

import { clearGuestMode } from './guest';

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
  await clearGuestMode();
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
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    return null;
  }

  const user = await AsyncStorage.getItem('user');
  if (!user) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(user) as { id?: string };
    return typeof parsedUser.id === 'string' ? parsedUser.id : null;
  } catch (error) {
    console.warn('Invalid stored user payload, clearing local session.', error);
    await AsyncStorage.multiRemove(['token', 'user']);
    return null;
  }
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

const SIERRA_LEONE_LOCAL_PHONE_LENGTH = 9;
const SIERRA_LEONE_COUNTRY_CODE = '232';
const SIERRA_LEONE_MIN_PREFIX = 11;
const SIERRA_LEONE_MAX_PREFIX = 99;
const MIN_INTERNATIONAL_PHONE_LENGTH = 7;
const MAX_INTERNATIONAL_PHONE_LENGTH = 15;

function isValidSierraLeoneLocalNumber(localNumber: string): boolean {
  if (
    localNumber.length !== SIERRA_LEONE_LOCAL_PHONE_LENGTH ||
    !localNumber.startsWith('0')
  ) {
    return false;
  }

  const prefixValue = Number.parseInt(localNumber.slice(1, 3), 10);
  return (
    Number.isInteger(prefixValue) &&
    prefixValue >= SIERRA_LEONE_MIN_PREFIX &&
    prefixValue <= SIERRA_LEONE_MAX_PREFIX
  );
}

function toSierraLeoneLocalPhoneNumber(phoneNumber: string): string | null {
  const digitsOnly = phoneNumber.replace(/\D+/g, '');

  if (!digitsOnly) {
    return null;
  }

  if (
    digitsOnly.length === SIERRA_LEONE_LOCAL_PHONE_LENGTH &&
    digitsOnly.startsWith('0')
  ) {
    return digitsOnly;
  }

  if (
    digitsOnly.length ===
      SIERRA_LEONE_COUNTRY_CODE.length + SIERRA_LEONE_LOCAL_PHONE_LENGTH - 1 &&
    digitsOnly.startsWith(SIERRA_LEONE_COUNTRY_CODE)
  ) {
    return `0${digitsOnly.slice(SIERRA_LEONE_COUNTRY_CODE.length)}`;
  }

  return null;
}

export function validateSierraLeonePhoneNumber(phoneNumber: string): {
  isValid: boolean;
  normalized: string;
  localNumber: string;
  error?: string;
} {
  const digitsOnly = phoneNumber.trim().replace(/\D+/g, '');
  const localNumber = toSierraLeoneLocalPhoneNumber(phoneNumber);

  if (localNumber) {
    if (!isValidSierraLeoneLocalNumber(localNumber)) {
      return {
        isValid: false,
        normalized: '',
        localNumber,
        error: 'Sierra Leone numbers must be 9 digits locally starting with 0.',
      };
    }

    return {
      isValid: true,
      normalized: `${SIERRA_LEONE_COUNTRY_CODE}${localNumber.slice(1)}`,
      localNumber,
    };
  }

  if (!digitsOnly) {
    return {
      isValid: false,
      normalized: '',
      localNumber: '',
      error: 'Phone number is required.',
    };
  }

  if (
    digitsOnly.length < MIN_INTERNATIONAL_PHONE_LENGTH ||
    digitsOnly.length > MAX_INTERNATIONAL_PHONE_LENGTH
  ) {
    return {
      isValid: false,
      normalized: '',
      localNumber: '',
      error:
        'Enter a valid international phone number. Sierra Leone numbers must be 9 digits locally starting with 0, or start with +232/232.',
    };
  }

  return {
    isValid: true,
    normalized: digitsOnly,
    localNumber: '',
  };
}

export const validatePhoneNumber = validateSierraLeonePhoneNumber;

/**
 * Normalizes phone numbers to a compact digit-only format.
 * Sierra Leone numbers are normalized to 232XXXXXXXX.
 * Other numbers are normalized by stripping formatting and any leading plus.
 * @param phoneNumber - The input phone number
 * @returns Normalized phone number
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  const validation = validatePhoneNumber(phoneNumber);

  if (validation.isValid) {
    return validation.normalized;
  }

  return phoneNumber.replace(/\D+/g, '');
}

export * from './guest';
