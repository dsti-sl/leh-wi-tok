import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';

import C_Button from '@/components/common/Button';
import { Colors } from '@/constants/Colors';
import { getBaseUrl, getStoredUserId } from '@/utils';

const OAUTH_ENDPOINTS = {
  google: 'https://example.com/oauth/google',
  facebook: 'https://example.com/oauth/facebook',
  twitter: 'https://example.com/oauth/twitter',
};
const SignInScreen = () => {
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
    console.log('Base', EXPO_PUBLIC_BASE_URL);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: phoneNumber }),
      });
      console.log('Response', response);

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

  const handleOAuthLogin = async (provider: keyof typeof OAUTH_ENDPOINTS) => {
    const url = OAUTH_ENDPOINTS[provider];
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('OAuth Error', 'Failed to open OAuth URL. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="#FFFFFF" />

      <Image
        source={require('../assets/images/Auth_logo.png')}
        style={styles.logo}
      />
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Hello Again</Text>
        <Image
          source={require('../assets/images/Handshake.png')}
          style={styles.handWaveIcon}
        />
      </View>
      <Text style={styles.subText}>Welcome back, you’ve been missed</Text>
      {/*       <View style={styles.oauthContainer}>
        <TouchableOpacity
          onPress={() => handleOAuthLogin('google')}
          style={styles.oauthButton}
        >
          <Image
            source={require('../assets/images/Google.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleOAuthLogin('twitter')}
          style={styles.oauthButton}
        >
          <Image
            source={require('../assets/images/Twitter.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleOAuthLogin('facebook')}
          style={styles.oauthButton}
        >
          <Image
            source={require('../assets/images/Facebook.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View> 
      <Text style={styles.orText}>Or</Text> */}
      <Text style={styles.label}>Phone Number</Text>
      <View style={styles.inputContainer}>
        <Feather
          name="phone"
          size={24}
          color={Colors.primary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          onChangeText={(text) => {
            setPhoneNumber(text);
            setError('');
          }}
          value={phoneNumber}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : (
        <C_Button
          title="Request OTP"
          // onPress={() => {
          //   const validationError = validatePhoneNumber();
          //   if (!validationError) {
          //     router.push(
          //       `/otpscreen?phoneNumber=${phoneNumber}&isSignIn=true`,
          //     );
          //   }
          // }}
          onPress={handleRequestOTP}
          buttonStyle={styles.requestOtpButton}
        />
      )}

      <Text style={styles.footerText}>
        Don’t have an account?{' '}
        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text style={styles.signUpLink}>Sign Up</Text>
        </TouchableOpacity>
      </Text>
    </View>
  );
};

export default SignInScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: Platform.OS === 'ios' ? 20 : 20,
  },
  logo: {
    width: 160,
    height: 160,
    resizeMode: 'cover',
    alignSelf: 'center',
    marginBottom: 10,
    marginTop: Platform.OS === 'ios' ? -200 : -150,
  },
  welcomeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    paddingLeft: 10,
  },
  handWaveIcon: {
    marginLeft: 0,
    width: 32,
    height: 32,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#727374',
    textAlign: 'center',
    marginBottom: 20,
  },
  oauthContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  oauthButton: {
    backgroundColor: '#F0F0F0',
    padding: 15,
    borderRadius: 40,
    marginHorizontal: 10,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  orText: {
    textAlign: 'center',
    color: '#000',
    fontSize: 14,
    marginVertical: 15,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 12,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: Colors.primary,
    borderWidth: 0.5,
    borderRadius: 12,
    padding: 5,
    marginTop: 5,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
    color: Colors.secondary,
    marginLeft: 10,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333',
  },
  error: {
    color: 'red',
    fontSize: 14,
    marginVertical: 5,
  },
  requestOtpButton: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    alignItems: 'center',
    color: Colors.secondary,
    fontWeight: 'bold',
    marginBottom: 0,
  },
  footerText: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
    textAlign: 'center',
  },
  signUpLink: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: -3,
  },
});
