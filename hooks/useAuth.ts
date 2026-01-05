import { useEffect, useState } from 'react';

import { router } from 'expo-router';

import { getBaseUrl, getStoredUserId, normalizePhoneNumber } from '@/utils';

const useAuth = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePhoneNumber = (): string => {
    if (!phoneNumber) return 'Phone number is required';
    if (!/^\d+$/.test(phoneNumber))
      return 'Phone number can only contain digits';
    return '';
  };

  const EXPO_PUBLIC_BASE_URL = getBaseUrl();

  useEffect(() => {
    const checkUser = async () => {
      const user = await getStoredUserId();
      if (user) {
        router.push('/home');
      } else {
        router.push('/signin');
      }
    };
    checkUser();
  }, []);

  const handleRequestOTP = async () => {
    const validationError = validatePhoneNumber();
    if (validationError) {
      setError(validationError);
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (normalizedPhone.length < 11 || normalizedPhone.length > 12) {
      setError(
        'Phone number must be between 9 and 10 digits (e.g., 076XXXXXX).',
      );
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: normalizedPhone }),
      });
      const data = await response.json();
      if (response.ok) {
        router.push(`/otpscreen?phoneNumber=${normalizedPhone}&isSignIn=true`);
      } else {
        setError(data.message || 'Unregistered phone number, Please signup');
      }
    } catch (error) {
      setError(
        'Network error: Unable to request OTP. Please check your connection.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    phoneNumber,
    setPhoneNumber: (text: string) => {
      setPhoneNumber(text);
      setError('');
    },
    error,
    isLoading,
    handleRequestOTP,
  };
};

export default useAuth;
