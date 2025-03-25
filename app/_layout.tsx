import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { StatusBar } from 'react-native';
import { initializeDatabase } from '@/db/schema';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  /*
    TODO: Initialization of app state:
    - Load user settings from AsyncStorage.
    - Load user data from AsyncStorage.
    - App state
      - skip or redirect to onboarding or login screen.
  */

  useEffect(() => {
    initializeDatabase();
    StatusBar.setBarStyle('light-content');
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* TODO: Add root level screens here */}
      <Stack.Screen name="signin" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="otpscreen" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="preferences" options={{ headerShown: false }} />
    </Stack>
  );
}
