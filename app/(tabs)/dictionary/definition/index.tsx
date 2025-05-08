import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { fetchDictionaryData } from '@/db/retrivedata';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DictionaryEntry = {
  word: string;
  definition: string;
  partOfSpeech: string | null;
  illustration: string | null;
  image: string | null;
};

const index = () => {
  const router = useRouter();
  const { word, query = '' } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [filteredData, setFilteredData] = useState<DictionaryEntry[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchDictionaryData();
        setDictionaryData(data);

        if (query) {
          // Filter data based on search query
          const filtered = data.filter((entry) =>
            entry.word
              .toLowerCase()
              .includes(typeof query === 'string' ? query.toLowerCase() : ''),
          );
          setFilteredData(filtered);
          setLoading(false);
          return;
        }

        // Find current word index if not searching
        const index = data.findIndex(
          (item) =>
            item.word.toLowerCase() ===
            (typeof word === 'string' ? word.toLowerCase() : ''),
        );

        if (index === -1) {
          Alert.alert('Word Not Found', 'The selected word does not exist.');
          router.replace('/dictionary');
          return;
        }

        setCurrentIndex(index);
      } catch (error) {
        console.error('Error loading dictionary data:', error);
        Alert.alert('Error', 'Failed to load dictionary data');
        router.replace('/dictionary');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [word, query, router]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentIndex < dictionaryData.length - 1) {
      const nextWord = dictionaryData[currentIndex + 1].word;
      router.push({
        pathname: '/(tabs)/dictionary/definition',
        params: { word: nextWord },
      });
    } else if (direction === 'right' && currentIndex > 0) {
      const prevWord = dictionaryData[currentIndex - 1].word;
      router.push({
        pathname: '/(tabs)/dictionary/definition',
        params: { word: prevWord },
      });
    }
  };

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX } = event.nativeEvent;

    if (translationX > 50) {
      handleSwipe('right');
    } else if (translationX < -50) {
      handleSwipe('left');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Show search results if there's a query
  if (query) {
    return (
      <View style={styles.container}>
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.word}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/dictionary/definition',
                  params: { word: item.word, query: '' },
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
      </View>
    );
  }

  // Show word definition if no query
  const currentWord = dictionaryData[currentIndex];

  if (!currentWord) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onGestureEvent={onGestureEvent}>
        <View style={styles.container}>
          <Text style={styles.word}>{currentWord.word}</Text>
          <View style={styles.mediaContainer}>
            {currentWord.illustration ? (
              <Image
                source={{ uri: currentWord.illustration }}
                style={styles.gif}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.errorText}>No illustration available</Text>
            )}
          </View>
          <View style={styles.definitionContainer}>
            <Text style={styles.definitionTitle}>Definition</Text>
            <Text style={styles.partOfSpeech}>{currentWord.partOfSpeech}</Text>
            <Text style={styles.definitionText}>{currentWord.definition}</Text>
          </View>

          {currentWord.image && (
            <Image
              source={{ uri: currentWord.image }}
              style={styles.image}
              resizeMode="contain"
            />
          )}
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

export default index;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  word: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'capitalize',
  },
  mediaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  gif: {
    width: SCREEN_WIDTH - 40,
    height: 200,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  definitionContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  definitionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  partOfSpeech: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#555',
    marginBottom: 8,
  },
  definitionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  image: {
    width: SCREEN_WIDTH - 40,
    height: 200,
    marginTop: 20,
    borderRadius: 8,
  },
  searchResultItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
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
