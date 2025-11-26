import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import C_Button from '@/components/common/Button';
import { Colors } from '@/constants/Colors';
import { typography } from '@/constants/Typography';
import { Record } from '@/lib/types';
import { getBaseUrl } from '@/utils';

const welcomeScreen = () => {
  const router = useRouter();
  const [user, setUser] = useState<Record | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const EXPO_PUBLIC_BASE_URL = getBaseUrl();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/user/me`);
        const data = await response.json();
        if (response.ok) {
          setUser(data.data[0]);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

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
        <Text style={styles.welcomeText}>
          Hi! {user?.name?.toString() || ''}
        </Text>
        <Text style={styles.welcomeText}>Welcome to Le Wi Tok</Text>
      </View>
      <C_Button
        title="Let's Get Started"
        onPress={() =>
          router.push(
            `/preferences/roleselection?userId=${user?.id}&name=${user?.name}`,
          )
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
    ...typography.headingMd,
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
