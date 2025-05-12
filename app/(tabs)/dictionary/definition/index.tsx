import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
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
  const { word } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [wordData, setWordData] = useState<DictionaryEntry | null>(null);
  const [imageError, setImageError] = useState<{
    illustration?: string;
    image?: string;
  }>({});

  useEffect(() => {
    const loadWordData = async () => {
      try {
        console.log('Loading dictionary data for word:', word);
        setLoading(true);

        const data = await fetchDictionaryData();

        if (!data || !Array.isArray(data) || data.length === 0) {
          console.error('Dictionary data is empty or invalid');
          Alert.alert('Error', 'Dictionary data is not available');
          router.back();
          return;
        }

        console.log('Dictionary data loaded:', data.length, 'entries');

        if (!word || typeof word !== 'string') {
          console.error('Invalid word parameter:', word);
          Alert.alert('Error', 'Invalid word parameter');
          router.back();
          return;
        }

        const wordEntry = data.find(
          (entry) =>
            entry.word.toLowerCase().trim() === word.toLowerCase().trim(),
        );

        if (!wordEntry) {
          console.log('Word not found:', word);
          Alert.alert(
            'Word Not Found',
            'The selected word does not exist in the dictionary.',
          );
          router.back();
          return;
        }

        const assetPath = `${FileSystem.documentDirectory}assets/`;
        const processedEntry = {
          ...wordEntry,
          illustration: wordEntry.illustration
            ? wordEntry.illustration.startsWith('file://')
              ? wordEntry.illustration
              : `${assetPath}${wordEntry.illustration}`
            : null,
          image: wordEntry.image
            ? wordEntry.image.startsWith('file://')
              ? wordEntry.image
              : `${assetPath}${wordEntry.image}`
            : null,
        };

        console.log('Word data processed:', {
          word: processedEntry.word,
          hasIllustration: !!processedEntry.illustration,
          hasImage: !!processedEntry.image,
        });

        setWordData(processedEntry);
      } catch (error) {
        console.error('Error in loadWordData:', error);
        Alert.alert('Error', 'Failed to load word data. Please try again.');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadWordData();
  }, [word, router]);

  const handleImageError = (type: 'illustration' | 'image', error: string) => {
    setImageError((prev) => ({
      ...prev,
      [type]: error,
    }));
    console.error(`${type} loading error:`, error);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!wordData) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {wordData.illustration && (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: wordData.illustration }}
            style={styles.illustration}
            resizeMode="contain"
            onError={(e) =>
              handleImageError('illustration', e.nativeEvent.error)
            }
          />
          {imageError.illustration && (
            <Text style={styles.errorText}>{imageError.illustration}</Text>
          )}
        </View>
      )}

      {/* Definition Section */}
      <View style={styles.definitionContainer}>
        <Text style={styles.partOfSpeech}>
          {wordData.partOfSpeech || 'No part of speech available'}
        </Text>
        <Text style={styles.definitionText}>{wordData.definition}</Text>
      </View>

      {/* Image Section */}
      {wordData.image && (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: wordData.image }}
            style={styles.image}
            resizeMode="contain"
            onError={(e) => handleImageError('image', e.nativeEvent.error)}
          />
          {imageError.image && (
            <Text style={styles.errorText}>{imageError.image}</Text>
          )}
        </View>
      )}
    </ScrollView>
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
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  wordTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchQuery: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  mediaContainer: {
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 100,
  },
  illustration: {
    width: SCREEN_WIDTH - 48,
    height: 200,
    borderRadius: 8,
  },
  image: {
    width: SCREEN_WIDTH - 48,
    height: 200,
    borderRadius: 8,
  },
  definitionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
});