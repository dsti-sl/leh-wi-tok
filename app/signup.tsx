import React from 'react';

import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Feather, Ionicons } from '@expo/vector-icons';

import C_Button from '@/components/common/Button';
import { Colors } from '@/constants/Colors';
import useSignup from '@/hooks/useSignup';

const SignUpScreen = () => {
  const {
    fullName,
    setFullName,
    phoneNumber,
    setPhoneNumber,
    email,
    setEmail,
    error,
    isLoading,
    handleSignUp,
  } = useSignup();

  return (
    <View style={styles.container}>
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
      <Text style={styles.subText}>
        Let&apos;s go through a few simple steps
      </Text>
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
          onChangeText={text => setFullName(text)}
          value={fullName}
          autoCapitalize="words"
          editable={!isLoading}
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
          onChangeText={text => setPhoneNumber(text)}
          value={phoneNumber}
          editable={!isLoading}
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
          onChangeText={text => setEmail(text)}
          value={email}
          autoCapitalize="none"
          editable={!isLoading}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <C_Button
        title={isLoading ? 'Please wait...' : 'Sign Up'}
        onPress={handleSignUp}
        buttonStyle={styles.signupButton}
        disabled={isLoading}
      />
      {isLoading && (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: 10 }}
        />
      )}
      <TouchableOpacity
        onPress={() => router.push('/signin')}
        style={styles.loginLink}
        disabled={isLoading}
      >
        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text style={styles.loginLinkText}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </View>
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
  // Removed unused oauth styles
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
