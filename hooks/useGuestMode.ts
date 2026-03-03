import { useCallback, useEffect, useState } from 'react';

import { Alert } from 'react-native';

import { router } from 'expo-router';

import { getGuestMode } from '@/utils';

const DEFAULT_GUEST_MESSAGE =
  'You currently logged in as guest to view all feature please create account or login.';

export const useGuestMode = () => {
  const [isGuest, setIsGuest] = useState(false);

  const refreshGuestMode = useCallback(async () => {
    const guestValue = await getGuestMode();
    setIsGuest(guestValue);
    return guestValue;
  }, []);

  useEffect(() => {
    refreshGuestMode();
  }, [refreshGuestMode]);

  const promptCreateAccount = useCallback((message?: string) => {
    Alert.alert(
      'Create Account',
      message ?? DEFAULT_GUEST_MESSAGE,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create Account', onPress: () => router.push('/signup') },
      ],
      { cancelable: true },
    );
  }, []);

  return { isGuest, refreshGuestMode, promptCreateAccount };
};

export default useGuestMode;
