import React, { useEffect } from 'react';

import { StatusBar } from 'react-native';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { SafeAreaProvider } from 'react-native-safe-area-context';

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
    const initializeApp = async () => {
      try {
        StatusBar.setBarStyle('light-content');

        // Initialize database with proper error handling
        await initializeDatabase();

        if (loaded) {
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        // Hide splash screen even if there's an error to prevent white screen
        if (loaded) {
          await SplashScreen.hideAsync();
        }
      }
    };

    initializeApp();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  /*   const syncTranlations = async () => {
    console.log('Fetching and inserting translations...');
    await fetchAndInsertTranslations();
  };
  syncTranlations(); */

  /* Warning!!
   * This function should all be called if one needs to delete all entries
   * So becareful....
   *

  const runFreshTest = async () => {
    console.log('Deleting all entries and reseting ids...');
    await deleteAllEntries();

    console.log('Running fresh entries...');
  };
  runFreshTest();
  */

  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
