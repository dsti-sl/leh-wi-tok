import AsyncStorage from '@react-native-async-storage/async-storage';

const LEGACY_ONBOARDING_KEY = 'hasOnboarded';
const USER_ONBOARDING_PREFIX = 'hasOnboarded:user:';

function getUserOnboardingKey(userId: string): string {
  return `${USER_ONBOARDING_PREFIX}${userId}`;
}

export async function getLegacyOnboardingComplete(): Promise<boolean> {
  return (await AsyncStorage.getItem(LEGACY_ONBOARDING_KEY)) === 'true';
}

export async function hasCompletedOnboardingForUser(
  userId: string,
): Promise<boolean> {
  const completed = await AsyncStorage.getItem(getUserOnboardingKey(userId));
  if (completed === 'true') {
    return true;
  }

  return getLegacyOnboardingComplete();
}

export async function shouldShowOnboarding(
  userId: string | null,
  isGuest: boolean,
): Promise<boolean> {
  if (userId) {
    return !(await hasCompletedOnboardingForUser(userId));
  }

  if (isGuest) {
    return !(await getLegacyOnboardingComplete());
  }

  return !(await getLegacyOnboardingComplete());
}

export async function completeOnboarding(userId: string | null): Promise<void> {
  await AsyncStorage.setItem(LEGACY_ONBOARDING_KEY, 'true');

  if (userId) {
    await AsyncStorage.setItem(getUserOnboardingKey(userId), 'true');
  }
}
