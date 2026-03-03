import React, { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Platform,
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
  const { phoneNumber, setPhoneNumber, error, isLoading, handleRequestOTP } =
    useAuth();
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
      </View>
      <Text style={styles.subText}>Welcome back, you’ve been missed</Text>
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
          placeholderTextColor={'#ccc'}
          keyboardType="phone-pad"
          onChangeText={text => setPhoneNumber(text)}
          value={phoneNumber}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <C_Button
        title={isLoading ? 'Please wait...' : 'Request OTP'}
        onPress={handleRequestOTP}
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
  // Removed unused oauth and icon styles
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
