import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ImageSourcePropType,
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
} from 'react-native';

import lessonFillSeconday from '../../../assets/images/lesson-fill-secondary.png';
import volunteerOutlineFillSecondary from '../../../assets/images/puzzle-piece-outline-fill-secondary.png';
import questionMarkCircular from '../../../assets/images/question-mark-circular.png';
import usersOutlineFillSeconday from '../../../assets/images/users-outline-fill-secondary.png';

import { HomeBanner } from '@/components/home/HomeBanner';
import HomeItem from '@/components/home/HomeItem';
import InitialVideoCard from '@/components/home/InitialVideoCard';
import useTutorials from '@/hooks/useTutorials';
import { Record } from '@/lib/types';

const HomeScreen = () => {
  const { defaultTutorial } = useTutorials();
  const [user, setUser] = useState<Record | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${BASE_URL}/user/me`);
        const data = await response.json();
        if (response.ok) {
          setUser(data.data[0]);
        } else {
          console.error('Failed to fetch user details:', data.meta.message);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [BASE_URL]);

  console.log('user', user);
  console.log('BASE_URL', BASE_URL);

  useEffect(() => {
    if (user && !user.student) {
      router.replace('/preferences');
    }
  }, [user]);

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
        {/* Banner */}
        {user && <HomeBanner user={user} />}

        {/* Video container */}
        {defaultTutorial && (
          <InitialVideoCard defaultTutorial={defaultTutorial as Record} />
        )}

        {/* Items */}
        <View style={styles.itemsContainer}>
          <HomeItem
            title="Find Help"
            description="Find help from volunteers who are blah, blah and blah"
            image={questionMarkCircular as ImageSourcePropType}
            bgColor="#0d3a46"
            routeName="/(tabs)/home/help"
          />
          <HomeItem
            title="Beginners Lessons"
            description="Get Started with our beginners lessons today."
            image={lessonFillSeconday as ImageSourcePropType}
            bgColor="#0f4c5c"
            routeName="/(tabs)/home/help"
          />
          <HomeItem
            title="Common Words"
            description="Find frequently used words for instant communications "
            image={usersOutlineFillSeconday as ImageSourcePropType}
            bgColor="#1e1e1e"
            routeName="/(tabs)/home/help"
          />
          <HomeItem
            title="Become a Volunteer"
            description="Join the community of sign language voluteers and be..."
            image={volunteerOutlineFillSecondary as ImageSourcePropType}
            bgColor="#1f1f39"
            routeName="/(tabs)/home/help"
          />
        </View>
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
  itemsContainer: {
    width: '100%',
    gap: 10,
    paddingHorizontal: 20,
  },
});
