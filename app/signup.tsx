import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Linking,
} from 'react-native';

import C_Button from '@/components/common/Button';
import { Colors } from '@/constants/Colors';

const OAUTH_ENDPOINTS = {
  google: 'https://example.com/oauth/google',
  facebook: 'https://example.com/oauth/facebook',
  twitter: 'https://example.com/oauth/twitter',
};

const SignUpScreen = () => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // Validation form function
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

  const handleSignUp = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    router.push(`/otpscreen?phoneNumber=${phoneNumber}&isSignIn=false`);
  };

  const handleOAuthSignUp = async (provider: keyof typeof OAUTH_ENDPOINTS) => {
    const url = OAUTH_ENDPOINTS[provider];
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('OAuth Error', 'Failed to open OAuth URL. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" translucent backgroundColor="#FFFFFF" />

      <Image
        source={require('../assets/images/Auth_logo.png')}
        style={styles.logo}
      />

      <Text style={styles.headerText}>
        Create an account{' '}
        <Image
          source={require('../assets/images/BoyCoder.png')}
          style={styles.boyCoderIcon}
        />
      </Text>
      <Text style={styles.subText}>Let's go through a few simple steps</Text>
      <View style={styles.oauthContainer}>
        <TouchableOpacity
          onPress={() => handleOAuthSignUp('google')}
          style={styles.oauthButton}
        >
          <Image
            source={require('../assets/images/Google.png')}
            style={styles.oauthIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleOAuthSignUp('twitter')}
          style={styles.oauthButton}
        >
          <Image
            source={require('../assets/images/Twitter.png')}
            style={styles.oauthIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleOAuthSignUp('facebook')}
          style={styles.oauthButton}
        >
          <Image
            source={require('../assets/images/Facebook.png')}
            style={styles.oauthIcon}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.orText}>Or</Text>
      <Text style={styles.label}>Full Name</Text>
      <View style={styles.inputContainer}>
        <Ionicons
          name="person-outline"
          size={24}
          color={Colors.secondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter your Full Name"
          onChangeText={setFullName}
          value={fullName}
        />
      </View>
      <Text style={styles.label}>Phone Number</Text>
      <View style={styles.inputContainer}>
        <Feather
          name="phone"
          size={24}
          color={Colors.secondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter your Phone Number"
          keyboardType="phone-pad"
          onChangeText={setPhoneNumber}
          value={phoneNumber}
        />
      </View>
      <Text style={styles.label}>Email (optional)</Text>
      <View style={styles.inputContainer}>
        <Feather
          name="mail"
          size={24}
          color={Colors.secondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          keyboardType="email-address"
          onChangeText={setEmail}
          value={email}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <C_Button
        title="Sign up"
        onPress={() => router.push('/otpscreen')}
        buttonStyle={styles.signupButton}
      />
      <TouchableOpacity
        onPress={() => router.push('/signin')}
        style={styles.loginLink}
      >
        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text style={styles.loginLinkText}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;

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
    marginBottom: 1,
    marginTop: Platform.OS === 'ios' ? -200 : 0,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    paddingLeft: 10,
  },
  boyCoderIcon: {
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
  oauthIcon: {
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
    paddingTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: Colors.primary,
    borderWidth: 0.5,
    borderRadius: 12,
    padding: 5,
    marginTop: 5,
    marginBottom: 5,
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
    textAlign: 'center',
    marginTop: 5,
  },
  signupButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    color: Colors.secondary,
    fontWeight: 'bold',
    marginBottom: 50,
    marginTop: 20,
  },
  loginLink: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  loginText: {
    color: '#727374',
    fontSize: 14,
  },
  loginLinkText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
