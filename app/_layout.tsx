import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { StatusBar } from 'react-native';
import { initializeDatabase } from '@/db/schema';
import { getDatabase } from '@/db/schema';
//import { fetchAndInsertTranslations } from '@/data/dictionary';
//import { fetchDictionaryData } from '@/db/retrivedata';
import * as FileSystem from 'expo-file-system';
//import { deleteAllEntries } from '@/utils/deleteEntries';

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
    //fetchDictionaryData();
    console.log('Database', getDatabase.toString());
    StatusBar.setBarStyle('light-content');
    if (loaded) {
      SplashScreen.hideAsync();
    }
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
