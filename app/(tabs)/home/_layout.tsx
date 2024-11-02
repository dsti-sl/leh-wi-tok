import { Stack } from 'expo-router';
import React from 'react';

const _layout = () => {
  // TODO: Add home level route screens here

  return (
    <>
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
    </>
  );
};

export default _layout;
