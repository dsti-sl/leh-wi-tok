import React, { useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';
import { getGuestMode, getStoredUserId } from '@/utils';
import {
  getContentMaxWidth,
  getHorizontalPadding,
  getHeroImageSize,
} from '@/utils/layout';
//import { fetchAndInsertTranslations } from '@/data/dictionary';

import slidesData from '../constants/OnboardingData.json';

const ONBOARDING_KEY = 'hasOnboarded';

const Onboarding = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = getContentMaxWidth(width, {
    compact: 440,
    tablet: 700,
    largeTablet: 860,
  });
  const heroImageSize = Math.min(width * 0.82, getHeroImageSize(width) * 1.8);

  {
    /* TODO: Fix issues with onboarding state and navigation */
  }
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasOnboarded = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (hasOnboarded) {
          const [userId, isGuest] = await Promise.all([
            getStoredUserId(),
            getGuestMode(),
          ]);
          if (userId || isGuest) {
            router.replace('/home');
          } else {
            router.replace('/signin');
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.warn(
          'Failed to resolve onboarding state, showing onboarding screen.',
          error,
        );
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
  /*   useEffect(() => {
    const syncTranslations = async () => {
      console.log('Fetching and inserting translations...');
      await fetchAndInsertTranslations();
    };
    syncTranslations();
  }, []); */

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
    <View style={[styles.slide, { width }]}>
      <View style={[styles.slideInner, { maxWidth: contentMaxWidth }]}>
        <Image
          source={getImageSource(item.image)}
          style={[
            styles.image,
            {
              width: heroImageSize,
              height: Math.min(height * 0.34, heroImageSize),
            },
          ]}
        />
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
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

      <View
        style={[
          styles.buttonContainer,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: Math.max(insets.bottom, 16),
            maxWidth: contentMaxWidth,
          },
        ]}
      >
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
    </SafeAreaView>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.primary,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  slideInner: {
    width: '100%',
    alignItems: 'center',
    alignSelf: 'center',
  },
  image: {
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
    width: '100%',
    alignSelf: 'center',
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
