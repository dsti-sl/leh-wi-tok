import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import {
  checkAndUpdateTranslations,
  fetchDictionaryData,
} from '@/data/dictionary';
import useSearch from '@/hooks/useSearch';

interface DictionaryEntry {
  word: string;
  definition: string;
  illustration: string | null;
  image: string | null;
  partOfSpeech: string | null;
  categories: string[];
}

const index = () => {
  const router = useRouter();
  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(
    async (options?: { withRemoteSync?: boolean }) => {
      try {
        if (options?.withRemoteSync) {
          await checkAndUpdateTranslations();
        }

        const data = await fetchDictionaryData();
        const sortedData = data.sort((a, b) => a.word.localeCompare(b.word));
        setDictionaryData(sortedData);
      } catch (error) {
        console.error('Error refreshing dictionary data:', error);
      }
    },
    [],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData({ withRemoteSync: true });
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await loadData({ withRemoteSync: true });
      setLoading(false);
    };

    initializeData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const { query, setQuery, filteredData } = useSearch({
    data: dictionaryData,
    searchKey: 'word',
  });

  const displayedData = useMemo(
    () => (query ? filteredData : dictionaryData),
    [dictionaryData, filteredData, query],
  );

  if (loading) {
    return (
      <View style={styles.viewContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!dictionaryData.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No data available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <View style={styles.viewContainer}>
        <View style={styles.searchBarContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.secondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search..."
            value={query}
            onChangeText={setQuery}
          />
          {query?.length ? (
            <TouchableOpacity
              onPress={() => setQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close" size={20} color={Colors.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          data={displayedData}
          keyExtractor={item => item.word}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
              <Text numberOfLines={2} style={styles.searchResultDefinition}>
                {item.definition}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No words found.</Text>
          }
        />
      </View>
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 30 : 30,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: Platform.OS === 'ios' ? 30 : 30,
  },
  viewContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    marginTop: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 6,
    marginLeft: 6,
  },
  searchResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  searchResultDefinition: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginTop: '50%',
  },
});
