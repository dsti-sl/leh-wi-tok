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

import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import AlphabetBar from '@/components/dictionary/AlphabetBar';
import CategoryCard from '@/components/dictionary/CategoryCard';
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

const extractCategories = (data: DictionaryEntry[]) => {
  const categoryMap = new Map();

  data.forEach(entry => {
    entry.categories.forEach(category => {
      if (categoryMap.has(category)) {
        const existing = categoryMap.get(category);
        categoryMap.set(category, {
          count: existing.count + 1,
          // Keep the first found image unless it was null
          imageSource:
            existing.imageSource || entry.image || entry.illustration,
        });
      } else {
        categoryMap.set(category, {
          count: 1,
          imageSource: entry.image || entry.illustration,
        });
      }
    });
  });

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    categoryName: category,
    wordCount: data.count,
    imageSource:
      data.imageSource || require('@/assets/images/adaptive-icon.png'),
  }));
};

const index = () => {
  const router = useRouter();
  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const loadData = async () => {
    try {
      await checkAndUpdateTranslations();
      const data = await fetchDictionaryData();
      const sortedData = data.sort((a, b) => a.word.localeCompare(b.word));
      setDictionaryData(sortedData);
    } catch (error) {
      console.error('Error refreshing dictionary data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };

    initializeData();
  }, []);

  const categories = useMemo(
    () => extractCategories(dictionaryData),
    [dictionaryData],
  );

  const { query, setQuery, filteredData } = useSearch({
    data: dictionaryData,
    searchKey: 'word',
  });

  const handleAlphabetletterPress = useCallback(
    (letter: string) => {
      console.log(`Sign language letter pressed: ${letter}`);
      setActiveLetter(letter);
    },
    [setQuery],
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
      <AlphabetBar
        onPressLetter={handleAlphabetletterPress}
        activeLetter={activeLetter ?? undefined}
      />
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

        {query ? (
          <FlatList
            data={filteredData}
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
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No words found.</Text>
            }
          />
        ) : (
          <FlatList
            data={categories}
            keyExtractor={item => item.categoryName}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <CategoryCard
                imageSource={item.imageSource}
                categoryName={item.categoryName}
                wordCount={item.wordCount}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/dictionary/category',
                    params: { categoryName: item.categoryName },
                  })
                }
              />
            )}
          />
        )}
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
  searchBar: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    marginTop: 16,
    fontSize: 16,
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
  loadingText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginTop: '50%',
  },
});
