import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import LessonCard from './LessonCard';

import { Record } from '@/lib/types';

interface LessonsCategoryProps {
  progressSummary: Record;
  lessonCount: any;
}

interface LessonCompletionData {
  lessons?: Array<{
    level: string;
    totalCompleted: number;
    totallessons: number;
  }>;
}

const LessonsCategory: React.FC<LessonsCategoryProps> = ({
  progressSummary,
  lessonCount,
}) => {
  const [userCompletionRate, setUserCompletionRate] =
    useState<LessonCompletionData | null>(null);
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

  const [serverProgress, setServerProgress] = useState<any[]>([]);

  useEffect(() => {
    const fetchLesson = async () => {
      const user = await AsyncStorage.getItem('user');
      const userId = user ? JSON.parse(user).id : null;
      try {
        const progressRes = await fetch(
          `${BASE_URL}/lesson-progress?and=(user.id.eq.${userId})&select=totalCompleted,user(id,name),level,totalLessons,lessonsCompleted,id,updatedAt,createdAt`,
        );
        const progressJson = await progressRes.json();

        if (progressJson.data) {
          setServerProgress(progressJson.data);
        }
      } catch (apiError) {
        console.warn('Lesson progress API failed, trying local fallback.');
      }
    };
    fetchLesson();
  }, []);

  const fetchUserInfo = useCallback(async () => {
    try {
      const lessonComplete = await AsyncStorage.getItem('completedLesson');
      if (lessonComplete) {
        setUserCompletionRate(JSON.parse(lessonComplete));
      } else {
        // Initialize with empty data if nothing is found
        setUserCompletionRate({ lessons: [] });
      }
    } catch (error) {
      console.error('Failed to fetch completed lessons:', error);
      // Fallback to empty data if there's an error
      setUserCompletionRate({ lessons: [] });
    }
  }, []);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  // This will run whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserInfo();
    }, [fetchUserInfo]),
  );

  // Helper function to find lesson data safely
  const getLessonData = (level: string) => {
    return (
      userCompletionRate?.lessons?.find((lesson) => lesson.level === level) || {
        totalCompleted: 0,
        totallessons: 0,
      }
    );
  };

  const beginnerData = getLessonData('Beginner');
  const basicElementaryData = getLessonData('Basic Elementary');
  const intermediateData = getLessonData('Intermediate');
  const advancedData = getLessonData('Advanced');

  console.log('serverProgress Data:', serverProgress);
  console.log('userCompletionRate Data:', userCompletionRate);

  return (
    <View style={styles.cardsContainer}>
      <View style={styles.cardRowContainer}>
        <LessonCard
          title={(progressSummary['Beginner'] as Record).title as string}
          completed={beginnerData.totalCompleted}
          totalLesson={beginnerData.totallessons || lessonCount.Beginner}
          onPress={() => {
            router.push(
              `/(tabs)/lessons/level/${(progressSummary['Beginner'] as Record).title}?assessment=Beginner`,
            );
          }}
          backgroundColor="#3e585e"
        />
        <LessonCard
          title={
            (progressSummary['Basic Elementary'] as Record).title as string
          }
          completed={basicElementaryData.totalCompleted}
          totalLesson={
            basicElementaryData.totallessons || lessonCount['Basic Elementary']
          }
          onPress={() => {
            router.push(
              `/(tabs)/lessons/level/${(progressSummary['Basic Elementary'] as Record).title}?assessment=Basic Elementary`,
            );
          }}
          backgroundColor="#1b6c82"
        />
      </View>
      <View style={styles.cardRowContainer}>
        <LessonCard
          title={(progressSummary['Intermediate'] as Record).title as string}
          completed={intermediateData.totalCompleted}
          totalLesson={
            intermediateData.totallessons || lessonCount.Intermediate
          }
          onPress={() => {
            console.log('Intermediate', progressSummary['Intermediate']);
            router.push(
              `/(tabs)/lessons/level/${(progressSummary['Intermediate'] as Record).title}?assessment=Intermediate`,
            );
          }}
          backgroundColor="#2e6270"
        />
        <LessonCard
          title={(progressSummary['Advanced'] as Record).title as string}
          completed={advancedData.totalCompleted}
          totalLesson={advancedData.totallessons || lessonCount.Advanced}
          onPress={() => {
            router.push(
              `/(tabs)/lessons/level/${(progressSummary['Advanced'] as Record).title}?assessment=Advanced`,
            );
          }}
          backgroundColor="#3088a0"
        />
      </View>
    </View>
  );
};

export default LessonsCategory;

const styles = StyleSheet.create({
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  cardRowContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 20,
  },
});
