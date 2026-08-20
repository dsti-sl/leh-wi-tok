import React, { useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import C_Button from '@/components/common/Button';
import { Colors } from '@/constants/Colors';
import { hydrateCurrentAccountProfile } from '@/lib/accountProfile';
import { getBaseUrl, setToken } from '@/utils';
import {
  getHeroImageSize,
  getHorizontalPadding,
  getOtpCellSize,
} from '@/utils/layout';

const OtpScreen = () => {
  const {
    isSignIn = true,
    phoneNumber = '',
    user = '',
    password = '',
  } = useLocalSearchParams();

  const toStringParam = (value: string | string[]) =>
    Array.isArray(value) ? value[0] : value;

  const loginUser = toStringParam(user || phoneNumber);
  const loginPassword = toStringParam(password) || '';

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding(width);
  const logoSize = getHeroImageSize(width);
  const otpCellSize = getOtpCellSize(width);

  const BASE_URL = getBaseUrl();
  // Refs for each input field
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const validateOtp = () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return 'Please enter a 6-digit OTP';
    if (!/^\d+$/.test(otpValue)) return 'OTP can only contain digits';
    return '';
  };

  const handleVerifyOtp = async () => {
    const validationError = validateOtp();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsVerifying(true);

    const verifiedData = {
      user: loginUser,
      verificationCode: otp.join(''),
      ...(loginPassword ? { password: loginPassword } : {}),
    };

    try {
      const response = await fetch(`${BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifiedData),
      });

      const data = await response.json();

      if (response.ok) {
        const token = data.data[0]?.token;
        await setToken(token);
        await hydrateCurrentAccountProfile(BASE_URL, token);

        // Sync translations after successful authentication
        try {
          const { checkAndUpdateTranslations } =
            await import('@/data/dictionary');
          await checkAndUpdateTranslations();
          console.log('Translations synced after login');
        } catch (syncError) {
          console.log('Translation sync failed (non-critical):', syncError);
        }

        router.replace(isSignIn ? '/' : '/preferences');
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      setError(
        error.errors[0].detail ||
          'Network error: Unable to verify OTP. Please check your connection.',
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setError('');

    try {
      const response = await fetch(`${BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: loginUser,
          ...(loginPassword ? { password: loginPassword } : {}),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'A new OTP has been sent to your account.');
        //localStorage.setItem('token', data[0].token);
      } else {
        setError(data.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (error: any) {
      let errorMessage = 'Please try again.';
      if (
        error &&
        typeof error === 'object' &&
        error.errors &&
        Array.isArray(error.errors) &&
        error.errors[0]?.detail
      ) {
        errorMessage = error.errors[0].detail;
      }
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const updatedOtp = [...otp];
    if (text.length === 6) {
      const otpArray = text.split('');
      setOtp(otpArray);
      setTimeout(() => inputRefs.current[5]?.focus(), 100);
    } else {
      updatedOtp[index] = text;
      setOtp(updatedOtp);
      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else if (!text && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingTop: insets.top + 24,
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Image
              source={require('../assets/images/Auth_logo.png')}
              style={[styles.logo, { width: logoSize, height: logoSize }]}
            />

            <Text style={styles.headerText}>Enter OTP</Text>
            <Text style={styles.subText}>
              Enter the OTP code we just sent{'\n'}to your registered Phone
              number
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((value, index) => (
                <TextInput
                  key={index}
                  ref={ref => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    { width: otpCellSize, height: otpCellSize * 1.35 },
                  ]}
                  keyboardType="numeric"
                  maxLength={1}
                  value={value}
                  onChangeText={text => handleOtpChange(text, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (
                      nativeEvent.key === 'Backspace' &&
                      !value &&
                      index > 0
                    ) {
                      inputRefs.current[index - 1]?.focus();
                    }
                  }}
                />
              ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View>
              {isVerifying ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <C_Button
                  title="Confirm OTP"
                  onPress={handleVerifyOtp}
                  buttonStyle={styles.verifyOtpButton}
                />
              )}
            </View>

            <TouchableOpacity
              onPress={handleResendOtp}
              style={[styles.resendButton, isResending && { opacity: 0.5 }]}
              disabled={isResending}
            >
              {isResending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.resendText}>
                  Didn’t get OTP? Resend OTP
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default OtpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
  },
  logo: {
    resizeMode: 'cover',
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 20,
  },
  subText: {
    fontSize: 14,
    color: '#727374',
    textAlign: 'center',
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  otpInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eaeff5',
    textAlign: 'center',
    fontSize: 14,
    color: Colors.primary,
    backgroundColor: '#f5f9fe',
  },
  error: {
    color: 'red',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  verifyOtpButton: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    alignItems: 'center',
    color: Colors.secondary,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  resendButton: {
    alignItems: 'flex-start',
    color: Colors.primary,
    fontWeight: 'bold',
  },
  resendText: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 0,
  },
});
