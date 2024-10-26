import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { HomeBanner } from '@/components/Headers/HomeBanner';
import { Colors } from '@/constants/Colors';

const _layout = () => {
  // TODO: Add home level route screens here

  return (
    <>
      <StatusBar style="inverted" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            title: 'Home',
            headerStyle: { backgroundColor: Colors.primary },
            headerTintColor: '#fff',
            headerTitle(props) {
              return <HomeBanner title={'Home'} {...props} />;
            },
          }}
        />
      </Stack>
    </>
  );
};

export default _layout;
