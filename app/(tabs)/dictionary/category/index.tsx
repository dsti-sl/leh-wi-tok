import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import dictionaryData from '@/constants/DictionaryData.json';

const index = () => {
  const router = useRouter();
  const { categoryName } = useLocalSearchParams() as { categoryName: string };
  const filteredWords = useMemo(() => {
    return dictionaryData.filter((entry) =>
      entry.categories.includes(categoryName),
    );
  }, [categoryName]);

  const groupedWords = useMemo(() => {
    const groupedData = filteredWords.reduce<
      Record<string, typeof filteredWords>
    >((acc, item) => {
      const firstLetter = item.word[0].toUpperCase();
      if (!acc[firstLetter]) acc[firstLetter] = [];
      acc[firstLetter].push(item);
      return acc;
    }, {});

    return Object.keys(groupedData)
      .sort()
      .map((key) => ({
        title: key,
        data: groupedData[key]
          .sort((a, b) => a.word.localeCompare(b.word))
          .map((item) => ({
            ...item,
            word:
              item.word.charAt(0).toUpperCase() +
              item.word.slice(1).toLowerCase(),
          })),
      }));
  }, [filteredWords]);

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.emptyText}>No words found in this category.</Text>
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
    paddingTop: 40,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
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
