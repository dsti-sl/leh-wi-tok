import React, { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
  const [loginMode, setLoginMode] = useState<'otp' | 'password'>('otp');
  const [showPassword, setShowPassword] = useState(false);

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
        if (isMounted) {
          setAssetsReady(true);
        }
      }
    };

    preloadAssets();

    return () => {
      isMounted = false;
    };
  }, [handshakeSource, logoSource]);

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

  const handleGuestLogin = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    await setGuestMode(true);
    router.replace('/home');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            {assetsReady && (
              <Image
                source={logoSource}
                style={styles.logo}
                cachePolicy="memory-disk"
                contentFit="cover"
              />
            )}
            <View style={styles.titleRow}>
              <Text style={styles.welcomeText}>Hello Again</Text>
              {assetsReady && (
                <Image
                  source={handshakeSource}
                  style={styles.handWaveIcon}
                  cachePolicy="memory-disk"
                  contentFit="contain"
                />
              )}
            </View>
            <Text style={styles.subText}>Welcome back, you’ve been missed</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.tabContainer}>
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
                placeholderTextColor="#ccc"
                keyboardType="default"
                autoCapitalize="none"
                onChangeText={text => setUser(text)}
                value={user}
                editable={!isLoading}
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
                    placeholderTextColor="#ccc"
                    secureTextEntry={!showPassword}
                    onChangeText={text => setPassword(text)}
                    value={password}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(prev => !prev)}
                    style={styles.eyeButton}
                    accessibilityLabel={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    disabled={isLoading}
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
              onPress={
                loginMode === 'otp' ? handleRequestOTP : handlePasswordLogin
              }
              buttonStyle={styles.requestOtpButton}
              disabled={isLoading}
            />

            {isLoading && (
              <ActivityIndicator
                size="large"
                color={Colors.primary}
                style={styles.loadingIndicator}
              />
            )}

            <TouchableOpacity
              onPress={handleGuestLogin}
              style={styles.guestLink}
              disabled={isLoading}
            >
              <Text style={styles.guestLinkText}>Continue as Guest</Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don’t have an account?</Text>
              <TouchableOpacity
                onPress={() => router.push('/signup')}
                disabled={isLoading}
              >
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignInScreen;

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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 72 : 40,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  handWaveIcon: {
    width: 32,
    height: 32,
  },
  subText: {
    fontSize: 14,
    color: '#727374',
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f4f8',
    borderRadius: 12,
    padding: 4,
    width: '100%',
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
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
  label: {
    fontSize: 12,
    color: '#000',
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: Colors.primary,
    borderWidth: 0.5,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 5,
  },
  inputIcon: {
    marginRight: 10,
    color: Colors.secondary,
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
    marginTop: 12,
    textAlign: 'center',
  },
  requestOtpButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    color: Colors.secondary,
    fontWeight: 'bold',
    marginTop: 24,
  },
  loadingIndicator: {
    marginTop: 10,
  },
  guestLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  guestLinkText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
  },
  footerText: {
    color: '#727374',
    fontSize: 14,
  },
  signUpLink: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
