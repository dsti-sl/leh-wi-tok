import AsyncStorage from '@react-native-async-storage/async-storage';

export const GUEST_MODE_KEY = 'guestMode';
export const GUEST_USER_ID = 'guest';

export const getGuestMode = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(GUEST_MODE_KEY);
    return value === 'true';
  } catch (error) {
    return false;
  }
};

export const setGuestMode = async (isGuest: boolean): Promise<void> => {
  if (isGuest) {
    await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
  } else {
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
  }
};

export const clearGuestMode = async (): Promise<void> => {
  await AsyncStorage.removeItem(GUEST_MODE_KEY);
};
