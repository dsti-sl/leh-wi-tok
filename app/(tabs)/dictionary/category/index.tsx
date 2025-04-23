import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SectionList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchDictionaryData } from '@/db/retrivedata';

// Define the DictionaryEntry type
type DictionaryEntry = {
  word: string;
  categories: string[];
};

const index = () => {
  const router = useRouter();
  const { categoryName, query = '' } = useLocalSearchParams() as {
    categoryName: string;
    query: string;
  };

  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[]>([]);
  const [groupedWords, setGroupedWords] = useState<
    { title: string; data: DictionaryEntry[] }[]
  >([]);
  const [filteredData, setFilteredData] = useState<DictionaryEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchDictionaryData();
        setDictionaryData(data);

        if (query) {
          // Filter words based on the search query
          const filtered = data.filter((entry) =>
            entry.word.toLowerCase().includes(query.toLowerCase()),
          );
          setFilteredData(filtered);
        } else {
          // Group words by their first letter for the category
          const filteredWords = data.filter((entry) =>
            entry.categories.includes(categoryName),
          );

          const groupedData = filteredWords.reduce(
            (acc: Record<string, DictionaryEntry[]>, item) => {
              const firstLetter = item.word[0].toUpperCase();
              if (!acc[firstLetter]) acc[firstLetter] = [];
              acc[firstLetter].push(item);
              return acc;
            },
            {} as Record<string, DictionaryEntry[]>,
          );

          const groupedWordsArray = Object.keys(groupedData)
            .sort()
            .map((key) => ({
              title: key,
              data: groupedData[key].sort((a, b) =>
                a.word.localeCompare(b.word),
              ),
            }));

          setGroupedWords(groupedWordsArray);
        }
      } catch (error) {
        console.error('Error fetching dictionary data:', error);
      }
    };

    fetchData();
  }, [categoryName, query]);

  return (
    <SafeAreaView style={styles.container}>
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
              style={styles.itemContainer}
            >
              <Text style={styles.itemText}>{item.word}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No words found.</Text>
          }
        />
      ) : (
        <SectionList
          sections={groupedWords}
          keyExtractor={(item) => item.word}
          renderItem={({ item }) => (
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
    paddingTop: 40,
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
});
