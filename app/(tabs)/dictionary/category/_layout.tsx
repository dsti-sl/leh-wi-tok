import React, { useRef, useState } from 'react';

import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';

const _layout = () => {
  const router = useRouter();
  const { categoryName } = useLocalSearchParams();
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSearchToggle = () => {
    setIsSearching(prev => !prev);
    if (!isSearching) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      router.setParams({ categoryName, query: '' });
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    router.setParams({ categoryName, query: text });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {Platform.OS === 'ios' ? (
        <View style={{ height: 50, backgroundColor: Colors.primary }} />
      ) : (
        <StatusBar style="light" backgroundColor={Colors.primary} />
      )}

      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#ffffff' },
            header: () => (
              <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.back()}>
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
                      value={query}
                      onChangeText={handleQueryChange}
                    />
                  ) : (
                    <Text style={styles.headerTitle}>
                      {categoryName || 'Category'}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={handleSearchToggle}>
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
  headerContainer: {
    top: Platform.OS === 'ios' ? 0 : 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
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
  },
  searchInput: {
    height: 40,
    width: '90%',
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 5,
    paddingHorizontal: 5,
    fontSize: 16,
    color: Colors.primary,
  },
});
