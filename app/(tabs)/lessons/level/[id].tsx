import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { VideoPlayer, VideoView } from 'expo-video';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';

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

  // console.log('player =>', player);
  // console.log('activeLesson =>', activeLesson);
  const [isLoading, setIsLoading] = useState(false);
  const [lessonTags, setLessonTags] = useState(false);
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

  useEffect(() => {
    const fetchLessonCategpry = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${BASE_URL}/nugget?and=(lesson.tags.title.eq.${assessment})&select=lesson(id,title,description,active,tags,title,id,illustration),gesture,priority,id,title`,
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

  console.log('assessment', assessment);
  console.log('isLoading', isLoading);
  console.log('lessonTags', lessonTags);
  if (loading) {
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
      {/* Top section with video or GIF */}
      <View style={styles.videoContainer}>
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

          <TouchableOpacity>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <VideoView
          style={styles.video}
          player={player as VideoPlayer}
          allowsFullscreen
          allowsPictureInPicture
          nativeControls
          contentFit="fill"
        />
      </View>

      {/* Lesson Details */}
      <View style={styles.lessonInfo}>
        <View style={styles.lessonHeader}>
          <View>
            <Text style={styles.title}>{assessment}</Text>
            <Text style={styles.subtitle}>
              {lesson.completed} of {lesson.total} Lessons Completed
            </Text>
          </View>
        </View>
      </View>

      {/* Lesson List */}
      <ScrollView>
        {/* {levelLessons.map((lesson) => (
          <TouchableOpacity
            key={lesson.id}
            style={[
              styles.lessonItem,
              activeLesson?.id === lesson.id && styles.activeLesson,
            ]}
            onPress={() => handleLessonSelect(lesson)}
            disabled={lesson.locked}
          >
            <View style={styles.iconContainer}>
              <FontAwesome5
                name="play-circle"
                size={24}
                color={lesson.locked ? '#999' : '#4682B4'}
              />
            </View>
            <View style={styles.lessonDetails}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonDuration}>{lesson.duration}</Text>
              {lesson.progress > 0 && lesson.progress < 100 && (
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${lesson.progress}%` },
                    ]}
                  />
                </View>
              )}
            </View>
            {lesson.locked ? (
              <MaterialIcons name="lock" size={24} color="#999" />
            ) : lesson.completed ? (
              <MaterialIcons name="check-circle" size={24} color="#FFD700" />
            ) : (
              <MaterialIcons
                name="radio-button-unchecked"
                size={24}
                color="#999"
              />
            )}
          </TouchableOpacity>
        ))} */}
        {lessonTags?.map((lesson: any) => (
          <TouchableOpacity
            key={lesson.id}
            style={[
              styles.lessonItem,
              activeLesson?.id === lesson.id && styles.activeLesson,
            ]}
            onPress={() => handleLessonSelect(lesson)}
            // disabled={lesson.locked}
          >
            <View style={styles.iconContainer}>
              <FontAwesome5
                name="play-circle"
                size={24}
                color={lesson.locked ? '#999' : '#4682B4'}
              />
            </View>
            <View style={styles.lessonDetails}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonDuration}>{lesson.lesson.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
