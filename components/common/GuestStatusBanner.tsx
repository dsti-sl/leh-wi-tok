import React from 'react';

import { Platform, StatusBar, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import useGuestMode from '@/hooks/useGuestMode';

const GuestStatusBanner = () => {
  const { isGuest } = useGuestMode();

  if (!isGuest) return null;

  return <View style={styles.container}></View>;
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#fff4d5',
    borderBottomWidth: 1,
    borderBottomColor: '#f5d090',
  },
  text: {
    color: Colors.primary,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default GuestStatusBanner;
