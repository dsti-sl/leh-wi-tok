import React, { useEffect, useMemo, useState } from 'react';

import {
  FlatList,
  Platform,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  checkAndUpdateTranslations,
  fetchDictionaryData,
  LocalDictionaryEntry,
} from '@/data/dictionary';
import useSearch from '@/hooks/useSearch';

type DictionaryEntry = Pick<LocalDictionaryEntry, 'word' | 'categories'>;

interface GroupedWordsSection {
  title: string;
  data: DictionaryEntry[];
}

const index = () => {
  const router = useRouter();
  const { categoryName: rawCategoryName, query: rawSearchParamQuery = '' } =
    useLocalSearchParams<{
      categoryName: string;
      query?: string;
    }>();
  const categoryName = Array.isArray(rawCategoryName)
    ? (rawCategoryName[0] ?? '')
    : rawCategoryName;
  const searchParamQuery = Array.isArray(rawSearchParamQuery)
    ? (rawSearchParamQuery[0] ?? '')
    : rawSearchParamQuery;

  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const { query, setQuery, filteredData } = useSearch({
    data: dictionaryData,
    searchKey: 'word',
  });

  const categoryEntries = useMemo(
    () =>
      dictionaryData.filter(entry => entry.categories.includes(categoryName)),
    [categoryName, dictionaryData],
  );

  const categorySearchResults = useMemo(
    () =>
      query
        ? filteredData.filter(entry => entry.categories.includes(categoryName))
        : [],
    [categoryName, filteredData, query],
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchDictionaryData();
        setDictionaryData(data);
        if (searchParamQuery !== query) {
          setQuery(searchParamQuery);
        }
      } catch (error) {
        console.error('Error fetching dictionary data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParamQuery, setQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await checkAndUpdateTranslations({ force: true });
      const data = await fetchDictionaryData();
      setDictionaryData(data);
    } catch (error) {
      console.error('Error refreshing dictionary data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  const categoryGroupedWords: GroupedWordsSection[] = useMemo(() => {
    if (loading || query) {
      return [];
    }

    const groupedData = categoryEntries.reduce(
      (acc: Record<string, DictionaryEntry[]>, item) => {
        const firstLetter = item.word[0]?.toUpperCase();
        if (firstLetter) {
          if (!acc[firstLetter]) acc[firstLetter] = [];
          acc[firstLetter].push(item);
        }
        return acc;
      },
      {} as Record<string, DictionaryEntry[]>,
    );

    return Object.keys(groupedData)
      .sort()
      .map(key => ({
        title: key,
        data:
          groupedData[key]?.sort((a, b) => a.word.localeCompare(b.word)) || [],
      }));
  }, [categoryEntries, loading, query]);

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.loadingText}>Loading category words...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {query ? (
        <FlatList
          data={categorySearchResults}
          keyExtractor={(item: DictionaryEntry) => item.word}
          contentContainerStyle={styles.searchResultsContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }: { item: DictionaryEntry }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/dictionary/definition',
                  params: { word: item.word },
                })
              }
              style={styles.itemContainer}
            >
              <Text style={styles.itemText}>{item.word}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No words found matching search.
            </Text>
          }
        />
      ) : (
        <SectionList
          sections={categoryGroupedWords}
          keyExtractor={(item: DictionaryEntry) => item.word}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }: { item: DictionaryEntry }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/dictionary/definition',
                  params: { word: item.word },
                })
              }
              style={styles.itemContainer}
            >
              <Text style={styles.itemText}>{item.word}</Text>
            </TouchableOpacity>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionHeader}>{title}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No words found in this category.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  searchResultsContainer: {
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderContainer: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
  },
  itemContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  itemText: {
    fontSize: 16,
    color: '#555',
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
  },
});
