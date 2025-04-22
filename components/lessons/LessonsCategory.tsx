import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import LessonCard from './LessonCard';
import QuizCard from './QuizCard';

import { Record } from '@/lib/types';

interface LessonsCategoryProps {
  progressSummary: Record;
}
const LessonsCategory: React.FC<LessonsCategoryProps> = ({
  progressSummary,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lessonTags, setLessonTags] = useState(false);
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

  useEffect(() => {
    const fetchLessonCategpry = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${BASE_URL}/tag?category=eq.dificulty-level`,
        );
        const data = await response.json();
        if (response.ok) {
          setLessonTags(data.data);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setIsLoading(false);
      }
    };

    fetchLessonCategpry();
  }, []);

  console.log('lessonTags', lessonTags);

  return (
    <View style={styles.cardsContainer}>
      <View style={styles.cardRowContainer}>
        <LessonCard
          title={(progressSummary['Beginner'] as Record).title as string}
          completed={
            (progressSummary['Beginner'] as Record).completed as number
          }
          totalLesson={(progressSummary['Beginner'] as Record).total as number}
          onPress={() => {
            console.log('Beginners');
            router.push(
              `/(tabs)/lessons/level/${(progressSummary['Beginner'] as Record).title}`,
            );
          }}
          backgroundColor="#3e585e"
        />
        <LessonCard
          title={
            (progressSummary['Basic Elementary'] as Record).title as string
          }
          completed={
            (progressSummary['Basic Elementary'] as Record).completed as number
          }
          totalLesson={
            (progressSummary['Basic Elementary'] as Record).total as number
          }
          onPress={() => {
            console.log('Basic Elementary ');
          }}
          backgroundColor="#1b6c82"
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          width: '100%',
          gap: 20,
        }}
      >
        <LessonCard
          title={(progressSummary['Intermediate'] as Record).title as string}
          completed={
            (progressSummary['Intermediate'] as Record).completed as number
          }
          totalLesson={
            (progressSummary['Intermediate'] as Record).total as number
          }
          onPress={() => {
            console.log('Intermediate');
          }}
          backgroundColor="#2e6270"
        />
        <LessonCard
          title={(progressSummary['Advanced'] as Record).title as string}
          completed={
            (progressSummary['Advanced'] as Record).completed as number
          }
          totalLesson={(progressSummary['Advanced'] as Record).total as number}
          onPress={() => {
            console.log('Advance');
          }}
          backgroundColor="#3088a0"
        />
      </View>
      <QuizCard completed={1} total={100} />
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
