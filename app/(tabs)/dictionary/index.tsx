import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fetchDictionaryData } from '@/db/retrivedata';
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
    imageSource: `https://example.com/images/${category.toLowerCase()}.png`, // Placeholder dynamic image URL
  }));
};

const index = () => {
  const router = useRouter();
  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchDictionaryData();
        const sortedData = data.sort((a, b) => a.word.localeCompare(b.word));
        setDictionaryData(sortedData);
      } catch (error) {
        console.error('Error fetching dictionary data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
