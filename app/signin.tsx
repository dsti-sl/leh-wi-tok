import React, { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Feather } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import C_Button from '@/components/common/Button';
import { Colors } from '@/constants/Colors';
import useAuth from '@/hooks/useAuth';
import { setGuestMode } from '@/utils';

const SignInScreen = () => {
  const [assetsReady, setAssetsReady] = useState(false);

  const logoSource = useMemo(
    () => require('../assets/images/Auth_logo.png'),
    [],
  );
  const handshakeSource = useMemo(
    () => require('../assets/images/Handshake.png'),
    [],
  );

  useEffect(() => {
    let isMounted = true;
    const preloadAssets = async () => {
      try {
        await Asset.loadAsync([logoSource, handshakeSource]);
      } finally {
        if (isMounted) setAssetsReady(true);
      }
    };
    preloadAssets();
    return () => {
      isMounted = false;
    };
  }, [logoSource, handshakeSource]);

  const handleGuestLogin = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    await setGuestMode(true);
    router.replace('/home');
  };
  const { height: screenHeight } = useWindowDimensions();
  const [loginMode, setLoginMode] = useState<'otp' | 'password'>('otp');
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const {
    user,
    setUser,
    password,
    setPassword,
    error,
    isLoading,
    handleRequestOTP,
    handlePasswordLogin,
  } = useAuth();

  const tabOffset = useMemo(() => {
    const targetTop = Math.round(screenHeight * 0.35);
    return Math.max(targetTop - headerHeight, 12);
  }, [screenHeight, headerHeight]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="#FFFFFF" />

      {assetsReady && (
        <Image
          source={logoSource}
          style={styles.logo}
          cachePolicy="memory-disk"
          contentFit="cover"
        />
      )}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Hello Again</Text>
        {assetsReady && (
          <Image
            source={handshakeSource}
            style={styles.handWaveIcon}
            cachePolicy="memory-disk"
            contentFit="contain"
          />
        )}
        <View
          style={styles.header}
          onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)}
        >
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
        </View>

        <View style={[styles.tabContainer, { marginTop: tabOffset }]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              loginMode === 'otp' && styles.tabButtonActive,
            ]}
            onPress={() => {
              setLoginMode('otp');
              setPassword('');
              setShowPassword(false);
            }}
            disabled={isLoading}
          >
            <Text
              style={[
                styles.tabText,
                loginMode === 'otp' && styles.tabTextActive,
              ]}
            >
              OTP Code
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              loginMode === 'password' && styles.tabButtonActive,
            ]}
            onPress={() => setLoginMode('password')}
            disabled={isLoading}
          >
            <Text
              style={[
                styles.tabText,
                loginMode === 'password' && styles.tabTextActive,
              ]}
            >
              Password
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Phone / Email / Handle</Text>
        <View style={styles.inputContainer}>
          <Feather
            name="user"
            size={24}
            color={Colors.primary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter your phone, email, or handle"
            placeholderTextColor={'#ccc'}
            keyboardType="default"
            autoCapitalize="none"
            onChangeText={text => setUser(text)}
            value={user}
          />
        </View>
        {loginMode === 'password' && (
          <>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Feather
                name="lock"
                size={24}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={'#ccc'}
                secureTextEntry={!showPassword}
                onChangeText={text => setPassword(text)}
                value={password}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(prev => !prev)}
                style={styles.eyeButton}
                accessibilityLabel={
                  showPassword ? 'Hide password' : 'Show password'
                }
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={Colors.secondary}
                />
              </TouchableOpacity>
            </View>
          </>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <C_Button
          title={
            isLoading
              ? 'Please wait...'
              : loginMode === 'otp'
                ? 'Request OTP'
                : 'Log In'
          }
          onPress={loginMode === 'otp' ? handleRequestOTP : handlePasswordLogin}
          buttonStyle={styles.requestOtpButton}
          disabled={isLoading}
        />
        {isLoading && (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={{ marginTop: 10 }}
          />
        )}

        <TouchableOpacity onPress={handleGuestLogin} style={styles.guestLink}>
          <Text style={styles.guestLinkText}>Login as Guest</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Don’t have an account?{' '}
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </Text>
      </View>
    </View>
  );
};

export default SignInScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
    padding: Platform.OS === 'ios' ? 20 : 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  logo: {
    width: 160,
    height: 160,
    resizeMode: 'cover',
    alignSelf: 'center',
    marginBottom: 8,
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
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f4f8',
    borderRadius: 12,
    padding: 4,
    alignSelf: 'center',
    width: '100%',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: '#727374',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  // Removed unused oauth and icon styles
  label: {
    fontSize: 12,
    color: '#000',
    marginTop: 16,
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
  eyeButton: {
    paddingHorizontal: 8,
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
  guestLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  guestLinkText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
