import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  fetchDictionaryData,
  fetchAndInsertTranslations,
} from '@/data/dictionary';
import useSearch from '@/hooks/useSearch';
import CategoryCard from '@/components/dictionary/CategoryCard';

interface DictionaryEntry {
  word: string;
  categories: string[];
}

const extractCategories = (data: DictionaryEntry[]) => {
  const categoryMap = new Map();

  data.forEach((entry) => {
    entry.categories.forEach((category) => {
      if (categoryMap.has(category)) {
        categoryMap.set(category, categoryMap.get(category) + 1);
      } else {
        categoryMap.set(category, 1);
      }
    });
  });

  return Array.from(categoryMap.entries()).map(([category, count]) => ({
    categoryName: category,
    wordCount: count,
    imageSource: `https://example.com/images/${category.toLowerCase()}.png`,
  }));
};

const index = () => {
  const router = useRouter();
  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // First fetch new translations from API and update local DB
      await fetchAndInsertTranslations();
      // Then fetch updated data from local DB
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

  if (loading) {
    return (
      <View style={styles.container}>
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
    <View style={styles.container}>
      <View style={styles.viewContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search..."
          value={query}
          onChangeText={setQuery}
        />

        {query ? (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.word}
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
            keyExtractor={(item) => item.categoryName}
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: Platform.OS === 'ios' ? 20 : 20,
  },
  viewContainer: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  searchBar: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
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
    marginTop: 20,
  },
});
