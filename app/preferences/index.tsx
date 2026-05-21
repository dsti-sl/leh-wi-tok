import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import C_Button from '@/components/common/Button';
import { Colors } from '@/constants/Colors';
import { Record } from '@/lib/types';
import { getBaseUrl, getToken } from '@/utils';
import { getHeroImageSize, getHorizontalPadding } from '@/utils/layout';

const welcomeScreen = () => {
  const router = useRouter();
  const [user, setUser] = useState<Record | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding(width);
  const heroSize = getHeroImageSize(width) + 40;

  const EXPO_PUBLIC_BASE_URL = getBaseUrl();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        const token = await getToken();
        const headers = token ? { Authorization: `Token ${token}` } : {};
        const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/user/me`, {
          headers,
        });
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
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <StatusBar backgroundColor="#0F4C5C" style="light" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: insets.top + 24,
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        <View style={styles.content}>
          <Image
            source={require('../../assets/images/Preferences_logo.png')}
            style={[styles.logo, { width: heroSize, height: heroSize * 0.96 }]}
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default welcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    resizeMode: 'cover',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: -12,
    marginBottom: 32,
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
    width: '100%',
  },
});
