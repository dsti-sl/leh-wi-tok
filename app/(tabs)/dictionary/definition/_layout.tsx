import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  View,
  ImageSourcePropType,
  Text,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';

import arrowBackOutline from '@/assets/images/arrow-back-outline.png';
import { Colors } from '@/constants/Colors';

const _layout = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#eaf' }}>
      {Platform.OS === 'ios' ? (
        <View
          style={{
            height: Platform.OS === 'ios' ? 50 : 0,
            backgroundColor: Colors.primary,
          }}
        />
      ) : (
        <StatusBar style="light" backgroundColor={Colors.primary} />
      )}
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            title: 'Definition',
            headerTitleStyle: { color: Colors.primary },
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            header: () => (
              <View
                style={{
                  top: Platform.OS === 'ios' ? 0 : 40,
                  backgroundColor: '#ffffff',
                  paddingHorizontal: 10,
                  paddingVertical: 10,
                  alignItems: 'center',
                  flexDirection: 'row',
                }}
              >
                <TouchableOpacity onPress={() => router.back()}>
                  <Image source={arrowBackOutline as ImageSourcePropType} />
                </TouchableOpacity>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '500',
                      color: Colors.primary,
                    }}
                  >
                    Definition
                  </Text>
                </View>
              </View>
            ),
          }}
        />
      </Stack>
    </View>
  );
};

export default _layout;
