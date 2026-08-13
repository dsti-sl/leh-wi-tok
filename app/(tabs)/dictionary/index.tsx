import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { checkAndUpdateTranslations } from '@/data/dictionary';
import {
  DictionaryCategorySummary,
  searchDictionaryByWord,
  fetchDictionaryCategories,
} from '@/db/retrivedata';

interface DictionaryEntry {
  word: string;
  definition: string;
  illustration: string | null;
  image: string | null;
  partOfSpeech: string | null;
  categories: string[];
}

interface CategorySummary {
  name: string;
  imageSource: string | null;
}

const index = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<DictionaryEntry[]>([]);
  const [query, setQuery] = useState('');

  const loadData = useCallback(
    async (options?: { withRemoteSync?: boolean }) => {
      try {
        if (options?.withRemoteSync) {
          await checkAndUpdateTranslations();
        }

        const categoryData = await fetchDictionaryCategories();
        setCategories(
          categoryData.map((item: DictionaryCategorySummary) => ({
            name: item.name,
            imageSource: item.imageSource,
          })),
        );
      } catch (error) {
        console.error('Error refreshing dictionary data:', error);
      }
    },
    [],
  );

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

  useEffect(() => {
    if (query && query.trim()) {
      const performSearch = async () => {
        const results = await searchDictionaryByWord(query);
        setSearchResults(results);
      };
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [query]);

  const filteredCategories = useMemo<CategorySummary[]>(() => {
    if (!query?.trim()) {
      return categories;
    }
    const lowerQuery = query.toLowerCase();
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(lowerQuery),
    );
  }, [categories, query]);

  if (loading) {
    return (
      <View style={styles.viewContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!categories.length) {
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

        {query?.trim() ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item: DictionaryEntry) => item.word}
            contentContainerStyle={styles.searchResultsContainer}
            renderItem={({ item }: { item: DictionaryEntry }) => (
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
                <Text style={styles.searchResultCategories}>
                  {item.categories.join(', ')}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No words found matching your search.
              </Text>
            }
          />
        ) : filteredCategories.length > 0 ? (
          <FlatList
            data={filteredCategories}
            keyExtractor={item => item.name}
            contentContainerStyle={styles.categoriesListContent}
            ListHeaderComponent={
              <Text style={styles.categoriesTitle}>
                Categories ({filteredCategories.length})
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryChip}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/dictionary/category',
                    params: { categoryName: item.name },
                  })
                }
              >
                {item.imageSource ? (
                  <Image
                    source={{ uri: item.imageSource }}
                    style={styles.categoryImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.categoryImagePlaceholder}>
                    <Text style={styles.categoryImagePlaceholderText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.categoryName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={styles.emptyText}>
            No categories found matching your search.
          </Text>
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
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  categoriesListContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#e2e8f0',
  },
  categoryImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryImagePlaceholderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
  searchResultCategories: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  searchResultsContainer: {
    paddingBottom: 20,
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
