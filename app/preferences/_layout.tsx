import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '@/constants/Colors';

const _layout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="profilescreen"
        options={{
          headerShown: true,
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitleText}>Profile Details</Text>
            </View>
          ),
          headerTitleAlign: 'center', // Center title for Android
          headerBackTitleVisible: false,
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen name="roleselection" options={{ headerShown: false }} />
    </Stack>
  );
};

export default _layout;

const styles = StyleSheet.create({
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Ensure it stretches to center the content
  },
  headerTitleText: {
    color: '#fff', // Adjusted for better visibility
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
});
