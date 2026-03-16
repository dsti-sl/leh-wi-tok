import React, { useState } from 'react';

import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { setGuestMode } from '@/utils';

const SignUpScreen = () => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    fullName,
    setFullName,
    phoneNumber,
    setPhoneNumber,
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading,
    handleSignUp,
  } = useSignup();

  const handleGuestMode = async () => {
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
            <Image
              source={require('../assets/images/Auth_logo.png')}
              style={styles.logo}
            />
            <View style={styles.titleRow}>
              <Text style={styles.headerText}>Create an account</Text>
              <Image
                source={require('../assets/images/BoyCoder.png')}
                style={styles.boyCoderIcon}
              />
            </View>
            <Text style={styles.subText}>
              Let&apos;s go through a few simple steps
            </Text>
          </View>

          <View style={styles.form}>
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
                placeholder="John Doe"
                placeholderTextColor="#ccc"
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
                placeholder="23278123456"
                placeholderTextColor="#ccc"
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
                placeholder="user@gmail.com"
                placeholderTextColor="#ccc"
                keyboardType="email-address"
                onChangeText={text => setEmail(text)}
                value={email}
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <Text style={styles.label}>Password (optional)</Text>
            <View style={styles.inputContainer}>
              <Feather
                name="lock"
                size={24}
                color={Colors.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#ccc"
                secureTextEntry={!showPassword}
                onChangeText={text => setPassword(text)}
                value={password}
                autoCapitalize="none"
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
                style={styles.loadingIndicator}
              />
            )}

            <TouchableOpacity
              onPress={handleGuestMode}
              style={styles.guestLink}
              disabled={isLoading}
            >
              <Text style={styles.guestLinkText}>Continue as Guest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                await setGuestMode(false);
                router.replace('/signin');
              }}
              style={styles.loginLink}
              disabled={isLoading}
            >
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginLinkText}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignUpScreen;

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
    marginBottom: 24,
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
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  boyCoderIcon: {
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
    textAlign: 'center',
    marginTop: 12,
  },
  signupButton: {
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
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#727374',
    fontSize: 14,
    textAlign: 'center',
  },
  loginLinkText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
