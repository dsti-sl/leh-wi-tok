import React, { useEffect, useRef, useState } from 'react';

import {
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '@/constants/Colors';
import { fetchAndInsertTranslations } from '@/data/dictionary';

import slidesData from '../constants/OnboardingData.json';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = 'hasOnboarded';

const Onboarding = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  {
    /* TODO: Fix issues with onboarding state and navigation */
  }
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const hasOnboarded = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (hasOnboarded) {
        router.replace('/signin');
      } else {
        setIsLoading(false);
      }
    };
    checkOnboardingStatus();
  }, []);

  const handleCompleteOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/signin');
  };

  const handleNext = () => {
    if (currentIndex < slidesData.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleSkip = () => {
    handleCompleteOnboarding();
  };

  const onMomentumScrollEnd = (event: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);

    if (newIndex === slidesData.length - 1) {
      handleCompleteOnboarding();
    }
  };

  const getImageSource = (imagePath: string) => {
    switch (imagePath) {
      case '../assets/images/SlideImg1.png':
        return require('../assets/images/SlideImg1.png');
      case '../assets/images/SlideImg2.png':
        return require('../assets/images/SlideImg2.png');
      case '../assets/images/SlideImg3.png':
        return require('../assets/images/SlideImg3.png');
      default:
        return null;
    }
  };
  useEffect(() => {
    const syncTranslations = async () => {
      console.log('Fetching and inserting translations...');
      await fetchAndInsertTranslations();
    };
    syncTranslations();
  }, []);

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slidesData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentIndex ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );

  const renderItem = ({
    item,
  }: {
    item: { image: string; title: string; description: string };
  }): React.JSX.Element => (
    <View style={styles.slide}>
      <Image source={getImageSource(item.image)} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );
  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0F4C5C" barStyle="light-content" />

      <FlatList
        data={slidesData}
        ref={flatListRef}
        horizontal
        pagingEnabled
        snapToInterval={width}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
      />

      <View style={styles.buttonContainer}>
        {currentIndex < slidesData.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        <View style={styles.paginationContainer}>{renderPagination()}</View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Ionicons name="chevron-forward" size={12} color="#FB8B24" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
  },
  slide: {
    width,
    alignItems: 'center',
    paddingVertical: 50,
  },
  image: {
    width: width * 0.9,
    height: height * 0.4,
    resizeMode: 'contain',
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 10,
    padding: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#727374',
    alignContent: 'center',
    padding: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 40,
  },
  skipButton: {
    paddingLeft: 35,
  },
  skipText: {
    fontSize: 16,
    color: Colors.primary,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFA500',
    width: 30,
    borderRadius: 5,
  },
  inactiveDot: {
    backgroundColor: Colors.primary,
  },
  nextButton: {
    backgroundColor: '#004D40',
    width: 40,
    height: 40,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
