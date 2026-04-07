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

export const SIERRA_LEONE_PHONE_PREFIXES = [
  '088',
  '099',
  '090',
  '077',
  '073',
  '072',
  '080',
  '078',
  '079',
  '033',
  '034',
  '031',
  '076',
  '075',
  '074',
  '030',
] as const;

const SIERRA_LEONE_PHONE_PREFIX_SET = new Set<string>(
  SIERRA_LEONE_PHONE_PREFIXES,
);
const SIERRA_LEONE_LOCAL_PHONE_LENGTH = 9;
const SIERRA_LEONE_COUNTRY_CODE = '232';

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

  if (digitsOnly.length === SIERRA_LEONE_LOCAL_PHONE_LENGTH - 1) {
    return `0${digitsOnly}`;
  }

  return null;
}

export function validateSierraLeonePhoneNumber(phoneNumber: string): {
  isValid: boolean;
  normalized: string;
  localNumber: string;
  error?: string;
} {
  const localNumber = toSierraLeoneLocalPhoneNumber(phoneNumber);

  if (!localNumber) {
    return {
      isValid: false,
      normalized: '',
      localNumber: '',
      error:
        'Phone number must be 8 digits, 9 digits with a leading 0, or 11 digits with country code 232.',
    };
  }

  const prefix = localNumber.slice(0, 3);
  if (!SIERRA_LEONE_PHONE_PREFIX_SET.has(prefix)) {
    return {
      isValid: false,
      normalized: '',
      localNumber,
      error: `Phone number prefix must be one of: ${SIERRA_LEONE_PHONE_PREFIXES.join(', ')}.`,
    };
  }

  return {
    isValid: true,
    normalized: `${SIERRA_LEONE_COUNTRY_CODE}${localNumber.slice(1)}`,
    localNumber,
  };
}

/**
 * Normalizes Sierra Leone phone numbers to international format (232XXXXXXXXX)
 * Handles various input formats: 0XXX, 232XXXXXXX, +232XXXXXXX
 * @param phoneNumber - The input phone number
 * @returns Normalized phone number starting with 232
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  const validation = validateSierraLeonePhoneNumber(phoneNumber);

  if (validation.isValid) {
    return validation.normalized;
  }

  let normalized = phoneNumber.replace(/\s+/g, '').replace(/^\+/, '');

  if (normalized.startsWith('0')) {
    normalized = `${SIERRA_LEONE_COUNTRY_CODE}${normalized.substring(1)}`;
  } else if (!normalized.startsWith(SIERRA_LEONE_COUNTRY_CODE)) {
    normalized = `${SIERRA_LEONE_COUNTRY_CODE}${normalized}`;
  }

  return normalized;
}

export * from './guest';
