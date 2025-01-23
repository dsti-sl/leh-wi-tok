import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';

import dictionaryData from '@/constants/DictionaryData.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const index = () => {
  const router = useRouter();
  const { word } = useLocalSearchParams();

  // Find the index of the word in the dictionary
  const initialIndex = dictionaryData.findIndex(
    (item) => item.word.toLowerCase() === word?.toLowerCase(),
  );

  if (initialIndex === -1) {
    Alert.alert('Word Not Found', 'The selected word does not exist.');
    router.replace('/dictionary');
    return null;
  }

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentWord = dictionaryData[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentIndex < dictionaryData.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (direction === 'right' && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
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

  if (!currentWord) {
    Alert.alert('Error', 'Current word data is missing.');
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onGestureEvent={onGestureEvent}>
        <View style={styles.container}>
          {/* Media Section */}
          <View style={styles.mediaContainer}>
            {currentWord.illustration ? (
              <Image
                source={{ uri: currentWord.illustration }}
                style={styles.gif}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.errorText}>No media available</Text>
            )}
          </View>

          {/* Definition Section */}
          <View style={styles.definitionContainer}>
            <Text style={styles.definitionTitle}>Definition</Text>
            <Text style={styles.partOfSpeech}>{currentWord.partOfSpeech}</Text>
            <Text style={styles.definitionText}>{currentWord.definition}</Text>
          </View>

          {/* Image Section */}
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  word: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
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
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  definitionContainer: {
    marginTop: 20,
  },
  definitionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  partOfSpeech: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#555',
    marginVertical: 4,
  },
  definitionText: {
    fontSize: 16,
    color: '#333',
  },
  image: {
    width: SCREEN_WIDTH - 40,
    height: 200,
    marginTop: 20,
  },
});
