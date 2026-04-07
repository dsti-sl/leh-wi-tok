import { useCallback, useEffect, useState } from 'react';

import { Alert } from 'react-native';

import { useRouter } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  type AccountUserInfo,
  fetchCurrentAccountProfile,
  storeAccountProfile,
} from '@/lib/accountProfile';
import { clearGuestMode, getBaseUrl, getToken } from '@/utils';
import { clearAllLessonPositions } from '@/utils/lessonProgress';

export interface UseAccountReturn {
  userInfo: AccountUserInfo | null;
  isLoggingOut: boolean;
  isDeletingAccount: boolean;
  fetchUserInfo: () => Promise<void>;
  handleLogout: () => void;
  handleAccountDeletion: () => void;
  confirmLogout: () => void;
  confirmAccountDeletion: () => void;
}

const useAccount = (): UseAccountReturn => {
  const [userInfo, setUserInfo] = useState<AccountUserInfo | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const router = useRouter();
  const BASE_URL = getBaseUrl();

  const fetchUserInfo = useCallback(async () => {
    const token = await getToken();
    const storedUser = await AsyncStorage.getItem('user');
    const parsedUser = storedUser
      ? (JSON.parse(storedUser) as AccountUserInfo)
      : null;

    if (!token) {
      if (parsedUser) {
        setUserInfo(parsedUser);
      } else {
        setUserInfo(null);
      }
      return;
    }

    try {
      const freshUser = await fetchCurrentAccountProfile(BASE_URL, token);
      setUserInfo(freshUser);
      await storeAccountProfile(freshUser);
    } catch (error) {
      if (!parsedUser) {
        setUserInfo(null);
      } else {
        setUserInfo(parsedUser);
      }
      console.warn('Unable to refresh account details:', error);
    }
  }, [BASE_URL]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const clearLocalSession = useCallback(async () => {
    setUserInfo(null);
    await AsyncStorage.multiRemove(['token', 'user', 'completedLesson']);
    await clearAllLessonPositions();
    await clearGuestMode();
  }, []);

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);
      try {
        const token = await getToken();
        await fetch(`${BASE_URL}/user/logout`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Token ${token}` } : {}),
          },
        });
      } catch (error) {
        console.warn('Logout request failed, clearing local session anyway.');
      }
      await clearLocalSession();
      router.replace('/');
    } catch (error) {
      // Optionally handle error
    } finally {
      setIsLoggingOut(false);
    }
  };

  const performAccountDeletion = async () => {
    try {
      setIsDeletingAccount(true);

      const token = await getToken();
      const response = await fetch(`${BASE_URL}/user/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
      });

      const payload = await response.json().catch(() => ({}));

      if (payload?.errors?.length) {
        const errorMessage =
          payload.errors[0]?.detail || 'Failed to delete your account.';
        throw new Error(errorMessage);
      }

      if (!response.ok || payload?.data?.status !== 'deleted') {
        const errorMessage =
          payload?.errors?.[0]?.detail ||
          payload?.data?.message ||
          payload?.message ||
          'Failed to delete your account.';
        throw new Error(errorMessage);
      }

      await clearLocalSession();
      router.replace('/');
      Alert.alert(
        'Account deleted',
        payload?.data?.message ||
          'Your account and associated personal data have been deleted.',
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to delete your account.';
      Alert.alert('Delete account failed', message);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: performLogout },
      ],
      { cancelable: true },
    );
  };

  const confirmAccountDeletion = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and associated personal data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: performAccountDeletion,
        },
      ],
      { cancelable: true },
    );
  };

  return {
    userInfo,
    isLoggingOut,
    isDeletingAccount,
    fetchUserInfo,
    handleLogout: performLogout,
    handleAccountDeletion: performAccountDeletion,
    confirmLogout,
    confirmAccountDeletion,
  };
};

export default useAccount;
