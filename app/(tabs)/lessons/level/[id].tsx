import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';

import ImageViewer from '@/components/common/ImageViewer';
import { Colors } from '@/constants/Colors';
import useLessonLevel from '@/hooks/useLessonLevel';

const Level = () => {
  const {
    levelLessons,
    loading,
    lesson,
    activeLesson,
    handleLessonSelect,
    player,
    level,
  } = useLessonLevel();
  const { assessment } = useLocalSearchParams<{
    assessment: string;
  }>();

  const [isLoading, setIsLoading] = useState(false);
  const [lessonTags, setLessonTags] = useState<any[]>([]);
  const [lessonCount, setLessonCount] = useState<number>(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    new Set(),
  );
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
  const [selectedGestureId, setSelectedGestureId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const fetchLessonCategory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${BASE_URL}/nugget?and=(lesson.tags.title.eq.${assessment})&select=lesson(id,title,description,active,tags,title,id,illustration),gesture,priority,id,title,active`,
        );
        const data = await response.json();
        if (response.ok) {
          const sortedData = data.data.sort((a, b) => a.priority - b.priority);
          setLessonTags(sortedData);
          setLessonCount(data.meta.count);
          const storedCompleted = await AsyncStorage.getItem('completedLesson');
          const initialCompleted = storedCompleted
            ? JSON.parse(storedCompleted)
            : { user: {}, lessons: [] };
          const currentLevel = initialCompleted.lessons.find(
            (l) => l.level === assessment,
          );

          setCompletedLessons(new Set(currentLevel?.lessonCompleted || []));
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setIsLoading(false);
      }
    };

    fetchLessonCategory();
  }, []);

  const handleLessonClick = async (lesson: any) => {
    handleLessonSelect(lesson);
    setSelectedGestureId(lesson?.gesture?.id);

    const storedCompleted = await AsyncStorage.getItem('completedLesson');
    const completedData = storedCompleted
      ? JSON.parse(storedCompleted)
      : { user: {}, lessons: [] };

    const loginUser = await AsyncStorage.getItem('user');
    const user = completedData.user || loginUser;

    const newCompleted = new Set(completedLessons);
    newCompleted.add(lesson.id);

    const updatedLessons = completedData.lessons.filter(
      (l) => l.level !== assessment,
    );
    updatedLessons.push({
      lessonCompleted: Array.from(newCompleted),
      level: assessment,
      totalCompleted: newCompleted.size,
      totallessons: lessonCount,
    });

    const updatedData = {
      user,
      lessons: updatedLessons,
    };

    await AsyncStorage.setItem('completedLesson', JSON.stringify(updatedData));
    setCompletedLessons(newCompleted);
  };

  // Determine if a lesson is locked based on priority and completed lessons
  const isLessonLocked = (
    currentLesson: any,
    index: number,
    lessons: any[],
  ) => {
    // First lesson is always unlocked
    if (index === 0) return false;

    // Check if previous lesson is completed
    const previousLesson = lessons[index - 1];
    return !completedLessons.has(previousLesson.id);
  };

  if (loading || isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <View
          style={{
            height: Platform.OS === 'ios' ? 50 : 0,
            backgroundColor: Colors.primary,
          }}
        />
      ) : (
        <StatusBar style="light" backgroundColor={Colors.primary} />
      )}
      {/* Top section with  GIF */}
      <View className="px-10" style={styles.videoContainer}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: Colors.primary,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          {/* <TouchableOpacity>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity> */}
        </View>
        {/* Render image here */}
        {selectedGestureId && (
          <ImageViewer gestureId={selectedGestureId as string} />
        )}
      </View>

      {/* Lesson Details */}
      <View style={styles.lessonInfo}>
        <View style={styles.lessonHeader}>
          <View>
            <Text style={styles.title}>{assessment}</Text>
            <Text style={styles.subtitle}>
              {completedLessons.size} of {lessonCount} Lessons Completed
            </Text>
          </View>
        </View>
      </View>

      {/* Lesson List */}
      <ScrollView>
        {lessonTags
          ?.sort((a, b) => a.priority - b.priority)
          .map((lesson, index, array) => {
            const locked = isLessonLocked(lesson, index, array);
            return (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonItem,
                  activeLesson?.id === lesson.id && styles.activeLesson,
                  locked && styles.lockedLesson,
                ]}
                onPress={() => !locked && handleLessonClick(lesson)}
                disabled={locked}
              >
                <View style={styles.iconContainer}>
                  <FontAwesome5
                    name={locked ? 'lock' : 'play-circle'}
                    size={24}
                    color={locked ? '#999' : '#4682B4'}
                  />
                </View>
                <View style={styles.lessonDetails}>
                  <Text
                    style={[styles.lessonTitle, locked && { color: '#999' }]}
                  >
                    {lesson.title}
                    {locked && ' (Locked)'}
                  </Text>
                  <Text
                    style={[styles.lessonDuration, locked && { color: '#999' }]}
                  >
                    {lesson.duration || lesson.lesson?.title || ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </View>
  );
};

export default Level;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  videoContainer: {
    height: 290,
    backgroundColor: '#2d2d2d',
  },
  video: {
    flex: 1,
  },
  lessonInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  lockedLesson: {
    backgroundColor: '#f9f9f9',
  },
  iconContainer: {
    marginRight: 12,
  },
  lessonDetails: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    color: '#333',
  },
  lessonDuration: {
    fontSize: 14,
    color: '#888',
  },
  activeLesson: {
    backgroundColor: '#f5f5f5',
  },
  progressBar: {
    height: 2,
    backgroundColor: '#eee',
    marginTop: 4,
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4682B4',
    borderRadius: 1,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 20,
    gap: 4,
  },
  playAllActive: {
    backgroundColor: '#4682B4',
  },
  playAllText: {
    fontSize: 14,
    color: '#4682B4',
  },
  playAllTextActive: {
    color: '#fff',
  },
});
