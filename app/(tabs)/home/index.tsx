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

import { HomeBanner } from '@/components/home/HomeBanner';
import HomeItem from '@/components/home/HomeItem';
import InitialVideoCard from '@/components/home/InitialVideoCard';
import { Colors } from '@/constants/Colors';
import useLastLesson from '@/hooks/useLastLesson';
import { hydrateCurrentAccountProfile } from '@/lib/accountProfile';
import { Record } from '@/lib/types';
import { getBaseUrl, getGuestMode, getToken } from '@/utils';

import lessonFillSeconday from '../../../assets/images/lesson-fill-secondary.png';
import volunteerOutlineFillSecondary from '../../../assets/images/puzzle-piece-outline-fill-secondary.png';
import usersOutlineFillSeconday from '../../../assets/images/users-outline-fill-secondary.png';

const buildFallbackUser = (isGuest: boolean): Record =>
  ({
    name: isGuest ? 'Guest' : 'Learner',
    location: { id: isGuest ? 'guest' : 'pending' },
  }) as Record;

const HomeScreen = () => {
  const { lastLesson, loading: lessonLoading } = useLastLesson();
  const [user, setUser] = useState<Record | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const BASE_URL = getBaseUrl();

  useEffect(() => {
    const loadGuestState = async () => {
      const guestValue = await getGuestMode();
      setIsGuest(guestValue);
      if (guestValue) {
        setUser({
          name: 'Guest',
          location: { id: 'guest' },
        } as Record);
      }
    };

    loadGuestState();
  }, []);

  useEffect(() => {
    if (isGuest) return;

    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        const token = await getToken();
        const headers = token ? { Authorization: `Token ${token}` } : {};
        const response = await fetch(`${BASE_URL}/user/me`, {
          headers,
        });
        const data = await response.json();
        if (response.ok) {
          setUser(data.data[0]);
          await hydrateCurrentAccountProfile(BASE_URL, token);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [BASE_URL, isGuest]);

  const displayUser = user ?? buildFallbackUser(isGuest);

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

  return (
    <View style={styles.container}>
      <HomeBanner user={displayUser} />
      {isLoading && !user && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      )}
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
            title="Lessons"
            description="Get Started with our progress driven Le Wi Tok ASL lessons."
            image={lessonFillSeconday as ImageSourcePropType}
            bgColor="#0f4c5c"
            routeName={`/(tabs)/lessons`}
          />
          <HomeItem
            title="Common Words & Dictionary"
            description="Find frequently used words for instant communications "
            image={usersOutlineFillSeconday as ImageSourcePropType}
            bgColor="#1e1e1e"
            routeName="/(tabs)/dictionary"
          />
          <HomeItem
            title="Kam Mak Wi Tok"
            description="With instant translation of text to sign language"
            image={volunteerOutlineFillSecondary as ImageSourcePropType}
            bgColor="#1f1f39"
            routeName="/(tabs)/tok"
          />
        </View>
      </ScrollView>
    </View>
  );
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
