import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { HomeBanner } from '@/components/home/HomeBanner';
import HomeItem from '@/components/home/HomeItem';
import InitialVideoCard from '@/components/home/InitialVideoCard';
import { Colors } from '@/constants/Colors';
import useLastLesson from '@/hooks/useLastLesson';
import { Record } from '@/lib/types';
import { getBaseUrl } from '@/utils';

import lessonFillSeconday from '../../../assets/images/lesson-fill-secondary.png';
import volunteerOutlineFillSecondary from '../../../assets/images/puzzle-piece-outline-fill-secondary.png';
import questionMarkCircular from '../../../assets/images/question-mark-circular.png';
import usersOutlineFillSeconday from '../../../assets/images/users-outline-fill-secondary.png';

const HomeScreen = () => {
  const { lastLesson, loading: lessonLoading } = useLastLesson();
  const [user, setUser] = useState<Record | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const BASE_URL = getBaseUrl();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${BASE_URL}/user/me`);
        const data = await response.json();
        if (response.ok) {
          setUser(data.data[0]);
          await AsyncStorage.setItem('user', JSON.stringify(data.data[0]));
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [BASE_URL]);

  useEffect(() => {
    if (user && !user.student) {
      router.replace('/preferences');
    }
  }, [user]);

  const handleVideoPlay = (
    lessonId: string,
    videoUrl: string,
    position?: number,
  ) => {
    if (lessonId !== 'intro') {
      router.push({
        pathname: '/(tabs)/lessons',
        params: {
          lessonId,
          videoUrl,
          startPosition: position?.toString() || '0',
        },
      });
    }
  };

  if (isLoading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (user && user.student) {
    return (
      <View style={styles.container}>
        {user && <HomeBanner user={user} />}
        {lastLesson && !lessonLoading && (
          <InitialVideoCard
            videoData={lastLesson}
            onPlayPress={handleVideoPlay}
          />
        )}
        {lessonLoading && (
          <View style={styles.videoLoadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading your content...</Text>
          </View>
        )}

        <ScrollView style={styles.itemsContainer}>
          <View>
            <HomeItem
              title="Find Help"
              description="Find help from volunteers who are blah, blah and blah"
              image={questionMarkCircular as ImageSourcePropType}
              bgColor="#0d3a46"
              routeName="/(tabs)/home/help"
            />
            <HomeItem
              title="Lessons"
              description="Get Started with our progress driven Le Wi Tok ASL lessons."
              image={lessonFillSeconday as ImageSourcePropType}
              bgColor="#0f4c5c"
              routeName={`/(tabs)/lessons/level/${'Beginner'}?assessment=${'Beginner'}`}
            />
            <HomeItem
              title="Common Words & Dictionary"
              description="Find frequently used words for instant communications "
              image={usersOutlineFillSeconday as ImageSourcePropType}
              bgColor="#1e1e1e"
              routeName="/(tabs)/dictionary"
            />
            {/* <HomeItem
              title="Become a Volunteer"
              description="Join the community of sign language voluteers and be..."
              image={volunteerOutlineFillSecondary as ImageSourcePropType}
              bgColor="#1f1f39"
              routeName="/(tabs)/home/help"
            /> */}
            <HomeItem
              title="Become a Volunteer"
              description="Join the community of sign language voluteers and be..."
              image={volunteerOutlineFillSecondary as ImageSourcePropType}
              bgColor="#1f1f39"
              routeName="/(tabs)/home/help"
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return null;
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLoadingContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  itemsContainer: {
    width: '100%',
    gap: 10,
    paddingHorizontal: 20,
  },
});
