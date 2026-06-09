import React, { useCallback, useEffect, useState } from 'react';

import {
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { fetchAndInsertTranslations } from '@/data/dictionary';
import { fetchCategoryData, searchCategoryData } from '@/db/retrivedata';

interface DictionaryEntry {
  word: string;
  categories: string[];
}

const PAGE_SIZE = 100;

const index = () => {
  const router = useRouter();
  const { categoryName, query: searchParamQuery = '' } = useLocalSearchParams<{
    categoryName: string;
    query?: string;
  }>();

  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const query = String(searchParamQuery ?? '').trim();

  const loadPage = useCallback(
    async (offset: number, mode: 'replace' | 'append') => {
      const data = query
        ? await searchCategoryData(categoryName, query, {
            limit: PAGE_SIZE,
            offset,
          })
        : await fetchCategoryData(categoryName, {
            limit: PAGE_SIZE,
            offset,
          });

      setDictionaryData(current =>
        mode === 'replace' ? data : [...current, ...data],
      );
      setHasMore(data.length === PAGE_SIZE);
    },
    [categoryName, query],
  );

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    try {
      await loadPage(dictionaryData.length, 'append');
    } catch (error) {
      console.error('Error loading more category data:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [dictionaryData.length, hasMore, loadPage, loading, loadingMore]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await loadPage(0, 'replace');
      } catch (error) {
        console.error('Error fetching category data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loadPage]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Call your fetchAndInsertTranslations function
      await fetchAndInsertTranslations();

      // Refresh the category-specific data
      await loadPage(0, 'replace');
    } catch (error) {
      console.error('Error refreshing category data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderItem = ({
    item,
    index: itemIndex,
  }: {
    item: DictionaryEntry;
    index: number;
  }) => {
    const currentLetter = item.word[0]?.toUpperCase() ?? '#';
    const previousLetter =
      itemIndex > 0
        ? dictionaryData[itemIndex - 1]?.word[0]?.toUpperCase()
        : undefined;
    const shouldShowHeader = currentLetter !== previousLetter;

    return (
      <View>
        {shouldShowHeader ? (
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeader}>{currentLetter}</Text>
          </View>
        ) : null}
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
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.loadingText}>Loading category words...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={dictionaryData}
        keyExtractor={(item: DictionaryEntry) => item.word}
        contentContainerStyle={styles.listContentContainer}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          loadingMore ? (
            <Text style={styles.loadingMoreText}>Loading more...</Text>
          ) : null
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {query
              ? 'No words found matching search in this category.'
              : 'No words found in this category.'}
          </Text>
        }
      />
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
  listContentContainer: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
    paddingBottom: 32,
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
  loadingMoreText: {
    fontSize: 14,
    color: '#64748b',
    paddingVertical: 16,
    textAlign: 'center',
  },
});
