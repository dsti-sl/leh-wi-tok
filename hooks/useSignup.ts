import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { getBaseUrl } from '@/utils';

const useSignup = () => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!fullName) return 'Full name is required';
    if (!/^[A-Za-z\s]+$/.test(fullName))
      return 'Full name can only contain letters and spaces';
    if (!phoneNumber) return 'Phone number is required';
    if (!/^\d+$/.test(phoneNumber))
      return 'Phone number can only contain digits';
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return 'Invalid email format';
    return '';
  };

  const EXPO_PUBLIC_BASE_URL = getBaseUrl();

  const handleSignUp = async () => {
    setError('');
    setIsLoading(true);
    try {
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        setIsLoading(false);
        return;
      }
      const userData = {
        name: fullName,
        phone: phoneNumber,
        user: phoneNumber,
      };
      const registerResponse = await fetch(
        `${EXPO_PUBLIC_BASE_URL}/user/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        },
      );
      const registerData = await registerResponse.json().catch(() => ({}));
      if (!registerResponse.ok) {
        const regErrMsg =
          registerData?.errors?.[0]?.detail ||
          'Failed to register. Please try again.';
        Alert.alert('Registration Error', regErrMsg);
        setError(regErrMsg);
        setIsLoading(false);
        return;
      }
      // Auto-login (get OTP)
      const loginResponse = await fetch(`${EXPO_PUBLIC_BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: phoneNumber }),
      });
      const loginData = await loginResponse.json().catch(() => ({}));
      if (loginResponse.ok) {
        Alert.alert('Success', loginData?.meta?.message || 'OTP sent!');
        router.replace(`/otpscreen?phoneNumber=${phoneNumber}&isSignIn=false`);
      } else {
        const loginErrMsg =
          loginData?.meta?.message ||
          loginData?.errors?.[0]?.detail ||
          'Failed to request OTP. Please try again.';
        setError(loginErrMsg);
        Alert.alert('OTP Error', loginErrMsg);
      }
    } catch (err: unknown) {
      let errMsg =
        'Network error: Unable to verify OTP. Please check your connection.';
      if (typeof err === 'object' && err !== null) {
        // Use type guards to avoid 'any' as much as possible
        if ('errors' in err) {
          const errorsArr = (err as { errors?: { detail?: string }[] }).errors;
          if (Array.isArray(errorsArr) && errorsArr[0]?.detail) {
            errMsg = errorsArr[0].detail;
          }
        } else if (
          'message' in err &&
          typeof (err as { message?: string }).message === 'string'
        ) {
          errMsg = (err as { message: string }).message;
        }
      }
      setError(errMsg);
      Alert.alert('Error', errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fullName,
    setFullName,
    phoneNumber,
    setPhoneNumber,
    email,
    setEmail,
    error,
    isLoading,
    handleSignUp,
  };
};

export default useSignup;
