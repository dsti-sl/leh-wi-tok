import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';

import C_Button from '@/components/common/Button';
import { Colors } from '@/constants/Colors';

const USER_API_ENDPOINT = 'https://example.com/api/user';

const welcomeScreen = () => {
  const router = useRouter();
  const [userFullName, setUserFullName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(USER_API_ENDPOINT);
        const data = await response.json();
        if (response.ok) {
          setUserFullName(data.fullName || 'User');
        } else {
          Alert.alert('Error', 'Failed to fetch user data.');
        }
      } catch (error) {
        Alert.alert('Error', 'An error occurred while fetching user data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleGetStarted = () => {
    router.push('/preferences');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#004D40" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0F4C5C" style="light" />
      <Image
        source={require('../../assets/images/Preferences_logo.png')}
        style={styles.logo}
      />
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Hi! {userFullName} User Fullname</Text>
        <Text style={styles.welcomeText}>Welcome to Le Wi Tok</Text>
      </View>
      <C_Button
        title="Let's Get Started"
        onPress={() => router.push('/preferences/roleselection')}
        buttonStyle={styles.getStartedButton}
      />
    </View>
  );
};

export default welcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: Platform.OS === 'ios' ? 20 : 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 250,
    height: 240,
    resizeMode: 'cover',
    alignSelf: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : 0,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -100,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  getStartedButton: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    color: Colors.secondary,
    fontWeight: 'bold',
    marginBottom: 50,
  },
});
