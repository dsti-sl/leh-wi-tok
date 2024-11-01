import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';

import { Colors } from '@/constants/Colors';

const _layout = () => {
  // TODO: Add home level route screens here

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <StatusBar style="light" backgroundColor={Colors.primary} />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
            title: 'Home',
          }}
        />
        <Stack.Screen
          name="help"
          options={{
            headerShown: false,
            title: 'Help',
          }}
        />
      </Stack>
    </View>
  );
};

export default _layout;
