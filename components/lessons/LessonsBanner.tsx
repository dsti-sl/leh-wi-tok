import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';

export const LessonsBanner = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.userTxt}>Lessons</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 60,
    paddingBottom: 100,
    width: '100%',
    backgroundColor: Colors.primary,
  },
  userTxt: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
});
