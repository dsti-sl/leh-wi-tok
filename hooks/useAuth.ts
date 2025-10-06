import { router } from 'expo-router';
import { useState, useEffect } from 'react';

import { getBaseUrl, getStoredUserId } from '@/utils';

const useAuth = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePhoneNumber = (): string => {
    if (!phoneNumber) return 'Phone number is required';
    if (!/^\d+$/.test(phoneNumber))
      return 'Phone number can only contain digits';
    if (phoneNumber.length < 9 || phoneNumber.length > 12)
      return 'Phone number must be between 9 and 12 digits';
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
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: phoneNumber }),
      });
      const data = await response.json();
      if (response.ok) {
        router.push(`/otpscreen?phoneNumber=${phoneNumber}&isSignIn=true`);
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
