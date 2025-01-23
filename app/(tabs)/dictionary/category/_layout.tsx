import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useSearch from '@/hooks/useSearch';
import dictionaryData from '@/constants/DictionaryData.json';
import { Colors } from '@/constants/Colors';

const _layout = () => {
  const router = useRouter();
  const { categoryName } = useLocalSearchParams();
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);

  // Search logic with hook
  const { filteredData, setQuery, query } = useSearch({
    data: dictionaryData,
    searchKey: 'word',
  });

  const handleSearchToggle = () => {
    setIsSearching((prev) => !prev);
    if (!isSearching) {
      setTimeout(() => inputRef.current?.focus(), 100); // Focus input when opening
    } else {
      setQuery(''); // Reset query and results
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#eaf' }}>
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
                      onChangeText={(text) => setQuery(text)}
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
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ),
          }}
        />
      </Stack>

      {isSearching && query.trim() ? (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.word}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/dictionary/definition',
                  params: { word: item.word },
                })
              }
              style={styles.searchResultItem}
            >
              <Text style={styles.searchResultText}>{item.word}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No matching words found.</Text>
          }
        />
      ) : null}
    </View>
  );
};

export default _layout;

const styles = StyleSheet.create({
  headerContainer: {
    top: Platform.OS === 'ios' ? 0 : 40,
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
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    color: Colors.primary,
  },
  searchResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultText: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});
