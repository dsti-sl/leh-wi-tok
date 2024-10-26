import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import C_Button from '@/components/common/Button';
import { Colors } from '@/constants/Colors';

const signin = () => {
  return (
    <View style={styles.container}>
      <Text>signin</Text>

      {/* Signin temp */}
      <C_Button
        title="Go Home"
        onPress={() => {
          router.push('/(tabs)/home');
        }}
        buttonStyle={styles.btn}
      />
    </View>
  );
};

export default signin;

const styles = StyleSheet.create({
  container: {
    //Could be extracted to utility styles
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
