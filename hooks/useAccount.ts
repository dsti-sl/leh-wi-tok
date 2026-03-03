import { useCallback, useEffect, useState } from 'react';

import { Alert } from 'react-native';

import { useRouter } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearGuestMode, getBaseUrl, getToken } from '@/utils';
export interface AccountUserInfo {
  id: string;
  name: string;
  handle: string;
  pictureId: string | null;
  createdAt: string;
  student: boolean;
  teacher: boolean;
  superuser: boolean;
  superviewer: boolean;
  [key: string]: string | boolean | null | undefined;
}

export interface UseAccountReturn {
  userInfo: AccountUserInfo | null;
  isLoggingOut: boolean;
  fetchUserInfo: () => Promise<void>;
  handleLogout: () => void;
  handleAccountDeletion: () => void;
  confirmLogout: () => void;
  confirmAccountDeletion: () => void;
}

const useAccount = (): UseAccountReturn => {
  const [userInfo, setUserInfo] = useState<AccountUserInfo | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const BASE_URL = getBaseUrl();

  const fetchUserInfo = useCallback(async () => {
    const user = await AsyncStorage.getItem('user');
    if (user) {
      setUserInfo(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    console.log('USER...  ', userInfo);
  }, [userInfo]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);
      setUserInfo(null);
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
      await AsyncStorage.multiRemove(['token', 'user', 'completedLesson']);
      await clearGuestMode();
      router.replace('/');
    } catch (error) {
      // Optionally handle error
    } finally {
      setIsLoggingOut(false);
    }
  };

  // TODO: Implement actual deletion dedicated page
  const performAccountDeletion = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user', 'completedLesson']);
      router.replace('/');
    } catch (error) {
      // Optionally handle error
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

  // TODO: Implement actual deletion dedicated page
  const confirmAccountDeletion = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account?',
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
    fetchUserInfo,
    handleLogout: performLogout,
    handleAccountDeletion: performAccountDeletion,
    confirmLogout,
    confirmAccountDeletion,
  };
};

export default useAccount;
