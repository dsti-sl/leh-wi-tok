import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { Colors } from '@/constants/Colors';

const _layout = () => {
  // TODO: Add home level route screens here

  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
            title: 'Home',
          }}
        />
      </Stack>
    </>
  );
};

export default _layout;
