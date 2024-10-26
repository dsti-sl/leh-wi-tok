import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import C_Button from '@/components/common/Button';
import { Colors } from '@/constants/Colors';

// TODO: Onboarding slides
const onboarding = () => {
  return (
    <View style={styles.container}>
      <Text>onboarding</Text>

      {/* Signin temp */}
      <C_Button
        title="Skip to Signin"
        onPress={() => {
          router.push('/signin');
        }}
        buttonStyle={styles.btn}
      />
    </View>
  );
};

export default onboarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    backgroundColor: Colors.primary,
    color: Colors.secondary,
    fontWeight: 'bold',
    fontSize: 18,
  },
});
