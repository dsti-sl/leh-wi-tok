import React, { useRef, useState } from 'react';

import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Ionicons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';

const _layout = () => {
  const router = useRouter();
  const { categoryName } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');

  const inputRef = useRef<TextInput>(null);

  const handleSearchToggle = () => {
    setIsSearching(prev => !prev);

    if (!isSearching) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
      router.setParams({
        categoryName,
        query: '',
      });
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);

    router.setParams({
      categoryName,
      query: text,
    });
  };

  return (
    <View style={styles.container}>
      {/* Same status bar appearance on Android and iOS */}
      <StatusBar style="light" backgroundColor={Colors.primary} />

      {/* Same safe-area background on Android and iOS */}
      <View
        style={[
          styles.statusBarArea,
          {
            height: insets.top,
          },
        ]}
      />

      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            header: () => (
              <View style={styles.headerContainer}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.iconButton}
                >
                  <Ionicons
                    name="arrow-back"
                    size={24}
                    color={Colors.primary}
                  />
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                  {isSearching ? (
                    <TextInput
                      ref={inputRef}
                      style={styles.searchInput}
                      placeholder="Search words..."
                      placeholderTextColor="#999"
                      value={query}
                      onChangeText={handleQueryChange}
                    />
                  ) : (
                    <Text style={styles.headerTitle} numberOfLines={1}>
                      {categoryName || 'Category'}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleSearchToggle}
                  style={styles.iconButton}
                >
                  <Ionicons
                    name={isSearching ? 'close' : 'search'}
                    size={24}
                    color={Colors.secondary}
                  />
                </TouchableOpacity>
              </View>
            ),
          }}
        />
      </Stack>
    </View>
  );
};

export default _layout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  statusBarArea: {
    backgroundColor: Colors.primary,
  },

  headerContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
  },

  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.primary,
    textAlign: 'center',
  },

  searchInput: {
    height: 40,
    width: '90%',
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 5,
    paddingHorizontal: 8,
    fontSize: 16,
    color: Colors.primary,
  },
});
