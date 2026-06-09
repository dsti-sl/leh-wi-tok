import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  DictionaryEntry,
  fetchDictionaryEntryByWord,
  searchDictionaryByWord,
} from '@/db/retrivedata';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const index = () => {
  const router = useRouter();
  const { word: definitionWord, query: urlSearchQuery = '' } =
    useLocalSearchParams<{
      word: string;
      query?: string;
    }>();

  const [wordData, setWordData] = useState<DictionaryEntry | null>(null);
  const [searchResults, setSearchResults] = useState<DictionaryEntry[]>([]);
  const [isLoadingDefinition, setIsLoadingDefinition] = useState<boolean>(true);
  const [imageStatus, setImageStatus] = useState({
    illustration: { loading: false, error: false },
    image: { loading: false, error: false },
  });

  useEffect(() => {
    const loadSearchResults = async () => {
      if (!urlSearchQuery) {
        setSearchResults([]);
        return;
      }

      setIsLoadingDefinition(true);
      try {
        const results = await searchDictionaryByWord(urlSearchQuery);
        setSearchResults(results);
      } catch (error) {
        Alert.alert('Error', 'Failed to search dictionary data.');
        console.error('Failed to search dictionary data:', error);
      } finally {
        setIsLoadingDefinition(false);
      }
    };

    loadSearchResults();
  }, [urlSearchQuery]);

  useEffect(() => {
    const loadCurrentWord = async () => {
      if (urlSearchQuery) {
        return;
      }

      if (!definitionWord) {
        setWordData(null);
        setIsLoadingDefinition(false);
        if (!router.canGoBack()) {
          Alert.alert('Error', 'No word provided to display definition.');
        }
        return;
      }

      setIsLoadingDefinition(true);
      try {
        const entry = await fetchDictionaryEntryByWord(definitionWord);
        if (!entry) {
          throw new Error(`Definition for "${definitionWord}" not found.`);
        }
        setWordData(entry);
      } catch (error) {
        setWordData(null);
        Alert.alert(
          'Error',
          error instanceof Error
            ? error.message
            : 'Failed to load word definition.',
        );
        console.error('Error loading word definition:', error);
      } finally {
        setIsLoadingDefinition(false);
      }
    };

    loadCurrentWord();
  }, [definitionWord, router, urlSearchQuery]);

  const renderImage = (
    uri: string | number | null,
    type: 'illustration' | 'image',
  ) => {
    if (!uri) {
      console.warn(`[renderImage] No URI provided for ${type}.`);
      return null;
    }

    // If it's a local image (require), just use it
    if (typeof uri === 'number') {
      return (
        <View style={styles.mediaContainer}>
          <Image
            source={uri}
            style={[
              type === 'illustration' ? styles.illustration : styles.image,
              imageStatus[type].loading && styles.imageLoading,
              { width: '100%', height: undefined, aspectRatio: 1 },
            ]}
            resizeMode="cover"
          />
        </View>
      );
    }

    // If it's a string, check for valid URI
    if (typeof uri === 'string') {
      console.log(`[renderImage] Attempting to render image for ${type}:`, uri);
      if (
        !uri.startsWith('file://') &&
        !uri.startsWith('content://') &&
        !uri.startsWith('http')
      ) {
        console.error(
          `[renderImage] Invalid URI format for ${type}: ${uri}. Expected file://, content://, or http(s)://`,
        );
        return (
          <View style={styles.mediaContainer}>
            <Text style={styles.errorText}>Invalid image URI format</Text>
          </View>
        );
      }

      return (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri }}
            style={[
              type === 'illustration' ? styles.illustration : styles.image,
              imageStatus[type].loading && styles.imageLoading,
              { width: '100%', height: undefined, aspectRatio: 1 },
            ]}
            resizeMode="cover"
            onLoadStart={() =>
              setImageStatus(s => ({
                ...s,
                [type]: { loading: true, error: false },
              }))
            }
            onLoad={() =>
              setImageStatus(s => ({
                ...s,
                [type]: { loading: false, error: false },
              }))
            }
            onError={e => {
              console.warn(
                `Image load error [${type}] at URI:`,
                uri,
                e.nativeEvent,
              );
              setImageStatus(s => ({
                ...s,
                [type]: { loading: false, error: true },
              }));
            }}
          />

          {imageStatus[type].loading && (
            <ActivityIndicator
              size="large"
              color="#007AFF"
              style={styles.imageLoader}
            />
          )}

          {imageStatus[type].error && (
            <Text style={styles.errorText}>Image load failed</Text>
          )}
        </View>
      );
    }

    // Fallback for unexpected types
    return (
      <View style={styles.mediaContainer}>
        <Text style={styles.errorText}>Invalid image source</Text>
      </View>
    );
  };

  if (urlSearchQuery) {
    return (
      <View style={styles.container}>
        <FlatList
          data={searchResults}
          keyExtractor={item => item.word}
          contentContainerStyle={styles.searchResultsContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/dictionary/definition',
                  params: { word: item.word, query: '' },
                });
              }}
              style={styles.FlatlistItemContainer}
            >
              <Text style={styles.FlatlistItemText}>{item.word}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No matching words found</Text>
            </View>
          )}
        />
      </View>
    );
  }

  if (isLoadingDefinition) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading definition...</Text>
      </View>
    );
  }

  if (!wordData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.errorText}>
          Definition not found for "{definitionWord || 'N/A'}"
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {renderImage(wordData.image, 'image')}
      <View style={styles.definitionContainer}>
        <Text style={styles.partOfSpeech}>
          {wordData.partOfSpeech || 'No part of speech'}
        </Text>
        <Text style={styles.definitionText}>{wordData.definition}</Text>
      </View>
      {renderImage(wordData.illustration, 'illustration')}
    </ScrollView>
  );
};

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
  },
  searchResultsContainer: {
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  mediaContainer: {
    width: SCREEN_WIDTH - 32,
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 100,
  },
  illustration: {
    width: '100%',
    height: undefined,
    aspectRatio: 16 / 9,
    borderRadius: 8,
  },
  image: {
    width: '100%',
    height: undefined,
    aspectRatio: 16 / 9,
    borderRadius: 8,
  },
  imageLoading: {
    opacity: 0.7,
  },
  imageLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    zIndex: 1,
  },
  definitionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  partOfSpeech: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  definitionText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 24,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
  FlatlistItemContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  FlatlistItemText: {
    fontSize: 16,
    color: '#555',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
});

export default index;
