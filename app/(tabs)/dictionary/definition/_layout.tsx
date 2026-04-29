import React, { useEffect, useRef, useState } from 'react';

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

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';

const _layout = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { word: initialDefinitionWord, query: urlQueryParam } =
    useLocalSearchParams<{
      word: string;
      query?: string;
    }>();

  const [isSearching, setIsSearching] = useState<boolean>(!!urlQueryParam);
  const [searchInputText, setSearchInputText] = useState<string>(
    urlQueryParam || '',
  );
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isSearching) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearching]);

  useEffect(() => {
    if ((urlQueryParam || '') !== searchInputText) {
      setSearchInputText(urlQueryParam || '');
      setIsSearching(!!urlQueryParam);
    }
  }, [urlQueryParam]);

  const handleSearchToggle = () => {
    setIsSearching(prev => {
      const nextIsSearching = !prev;
      if (!nextIsSearching) {
        setSearchInputText('');
        router.setParams({ word: initialDefinitionWord, query: '' });
      }
      return nextIsSearching;
    });
  };

  const handleQueryChange = (text: string) => {
    setSearchInputText(text);
    router.setParams({ word: initialDefinitionWord, query: text });
  };

  const handleBackPress = () => {
    if (Platform.OS !== 'android') {
      router.back();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/dictionary');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {Platform.OS === 'ios' ? (
        <View style={{ height: insets.top, backgroundColor: Colors.primary }} />
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
              <View
                style={[
                  styles.headerContainer,
                  Platform.OS === 'android'
                    ? { paddingTop: insets.top + 12 }
                    : null,
                ]}
              >
                <TouchableOpacity
                  onPress={handleBackPress}
                  style={styles.backButton}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
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
                      value={searchInputText}
                      onChangeText={handleQueryChange}
                    />
                  ) : (
                    <Text style={styles.headerTitle}>
                      {typeof initialDefinitionWord === 'string' &&
                      initialDefinitionWord.length > 0
                        ? initialDefinitionWord
                        : 'Definition'}
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
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
    textTransform: 'capitalize',
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
