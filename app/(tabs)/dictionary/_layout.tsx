import { Stack } from 'expo-router';
import React from 'react';

const _layout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="category"
        options={{
          headerTitle: 'Category',
          headerBackTitle: 'Back',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="definition"
        options={{
          headerShown: false,
          headerTitle: 'Definition',
        }}
      />
    </Stack>
  );
};

export default _layout;
