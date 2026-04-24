import { useEffect, useState } from 'react';

import { router } from 'expo-router';

import { hydrateCurrentAccountProfile } from '@/lib/accountProfile';
import {
  getBaseUrl,
  getGuestMode,
  getStoredUserId,
  setToken,
  validatePhoneNumber,
} from '@/utils';

const useAuth = () => {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const normalizeUserInput = (value: string) => {
    const trimmed = value.trim();
    const compact = trimmed.replace(/[\s()-]+/g, '');
    const withoutPlus = compact.replace(/^\+/, '');
    const isPhone = /^\d+$/.test(withoutPlus);
    const phoneValidation = isPhone ? validatePhoneNumber(compact) : null;
    return {
      isPhone,
      isEmail: /\S+@\S+\.\S+/.test(trimmed),
      phoneValidation,
      normalizedUser:
        isPhone && phoneValidation?.isValid
          ? phoneValidation.normalized
          : trimmed,
    };
  };

  const validateUser = (): string => {
    if (!user.trim()) return 'Phone, email, or handle is required';
    const { isPhone, isEmail, phoneValidation } = normalizeUserInput(user);
    if (isPhone) {
      if (!phoneValidation?.isValid) {
        return phoneValidation?.error || 'Invalid phone number.';
      }
    } else if (user.includes('@') && !isEmail) {
      return 'Invalid email format';
    }
    return '';
  };

  const EXPO_PUBLIC_BASE_URL = getBaseUrl();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getStoredUserId();
        if (user) {
          router.replace('/home');
          return;
        }

        const isGuest = await getGuestMode();
        if (isGuest) {
          router.replace('/home');
        }
      } catch (error) {
        console.warn('Failed to restore authenticated session.', error);
      }
    };
    checkUser();
  }, []);

  const handleRequestOTP = async () => {
    const validationError = validateUser();
    if (validationError) {
      setError(validationError);
      return;
    }

    const { normalizedUser } = normalizeUserInput(user);

    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: normalizedUser }),
      });
      const data = await response.json();
      if (response.ok) {
        router.push(
          `/otpscreen?user=${encodeURIComponent(normalizedUser)}&isSignIn=true`,
        );
      } else {
        setError(data.message || 'Unregistered account. Please sign up.');
      }
    } catch (error) {
      setError(
        'Network error: Unable to request OTP. Please check your connection.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    const validationError = validateUser();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    const { normalizedUser } = normalizeUserInput(user);

    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: normalizedUser, password }),
      });
      const data = await response.json().catch(() => ({}));

      const token = data?.data?.[0]?.token || data?.token;
      if (response.ok && token) {
        await setToken(token);
        await hydrateCurrentAccountProfile(EXPO_PUBLIC_BASE_URL, token);
        router.replace('/');
        return;
      }

      if (response.ok && !token) {
        setError('Password login could not be completed. Please try again.');
        return;
      }

      setError(data.message || 'Invalid credentials. Please try again.');
    } catch (error) {
      setError(
        'Network error: Unable to log in. Please check your connection.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    setUser: (text: string) => {
      setUser(text);
      setError('');
    },
    password,
    setPassword: (text: string) => {
      setPassword(text);
      setError('');
    },
    error,
    isLoading,
    handleRequestOTP,
    handlePasswordLogin,
  };
};

export default useAuth;
