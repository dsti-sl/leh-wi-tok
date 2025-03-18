import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';

import C_Button from '@/components/common/Button';
import { Colors } from '@/constants/Colors';
import { Record } from '@/lib/types';

const welcomeScreen = () => {
  const router = useRouter();
  const [user, setUser] = useState<Record | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const BASE_URL = Constants.expoConfig?.extra?.API_URL;

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${BASE_URL}/user/me`);
        const data = await response.json();
        if (response.ok) {
          setUser(data.data[0]);
        } else {
          console.error('Failed to fetch user details:', data?.meta?.message);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setIsLoading(false);
      }
    };

    fetchUserDetails();
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
        <Text style={styles.welcomeText}>Hi! {user?.name}</Text>
        <Text style={styles.welcomeText}>Welcome to Le Wi Tok</Text>
      </View>
      <C_Button
        title="Let's Get Started"
        onPress={() =>
          router.push(`/preferences/roleselection?userId=${user?.id}`)
        }
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
