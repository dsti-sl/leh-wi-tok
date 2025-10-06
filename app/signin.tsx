import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import C_Button from '@/components/common/Button';
import { Colors } from '@/constants/Colors';
import useAuth from '@/hooks/useAuth';

const SignInScreen = () => {
  const { phoneNumber, setPhoneNumber, error, isLoading, handleRequestOTP } =
    useAuth();

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
          onChangeText={(text) => setPhoneNumber(text)}
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
});
