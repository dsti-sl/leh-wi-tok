import { useLocalSearchParams } from 'expo-router';
import { useVideoPlayer } from 'expo-video';
import { useEffect, useState } from 'react';

import { mockApi } from '@/lib/api/mockApi';

interface LessonItem {
  id: number;
  title: string;
  duration: string;
  video: string;
  locked: boolean;
  completed: boolean;
  progress: number;
}

const useLessonLevel = () => {
  const [levelLessons, setLevelLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentVideo, setCurrentVideo] = useState<string>('');
  const [lesson, setLesson] = useState({
    completed: 0,
    total: 0,
  });
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);

  const { id: level } = useLocalSearchParams();

  const player = useVideoPlayer(currentVideo);

  useEffect(() => {
    if (!player) return;
    player.loop = false;
    player.play();

    player.addListener('playToEnd', handleVideoComplete);

    player.addListener('timeUpdate', () => {
      if (player.duration > 0) {
        const progress = (player.currentTime / player.duration) * 100;
        updateLessonProgress(progress);
      }
    });

    return () => {
      player.removeAllListeners('playToEnd');
      player.removeAllListeners('timeUpdate');
    };
  }, [player]);

  useEffect(() => {
    fetchLessons();
  }, [level]);

  useEffect(() => {
    if (!activeLesson) return;
    setCurrentVideo(activeLesson.video);
  }, [activeLesson]);

  useEffect(() => {
    if (!currentVideo) return;
    player.replace(currentVideo);
  }, [currentVideo]);

  const fetchLessons = async () => {
    if (!level) return;
    setLoading(true);
    try {
      const response = await mockApi.getLevelLessons(level as string);
      const lessons = response.data;

      const nextAvailableLesson =
        lessons.find(
          (lesson: LessonItem) => !lesson.completed && !lesson.locked,
        ) || lessons[0];

      setLevelLessons(lessons);
      setActiveLesson(nextAvailableLesson);

      const completed = lessons.filter(
        (lesson: LessonItem) => lesson.completed && lesson.progress > 0,
      ).length;
      setLesson({ completed, total: lessons.length });
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoComplete = async () => {
    if (!activeLesson || !level) return;

    try {
      const response = await mockApi.completeLessonAndUnlockNext(
        level as string,
        activeLesson.id,
      );
      const { completedLessonId, unlockedLessonId } = response.data;

      const updatedLessons = levelLessons.map((lesson) => {
        if (lesson.id === completedLessonId) {
          return { ...lesson, completed: true, progress: 100 };
        }
        if (lesson.id === unlockedLessonId) {
          return { ...lesson, locked: false };
        }
        return lesson;
      });

      setLevelLessons(updatedLessons);
      setLesson((prev) => ({
        ...prev,
        completed: updatedLessons.filter((lesson) => lesson.completed).length,
      }));
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const handleLessonSelect = (lesson: LessonItem) => {
    if (lesson.locked) return;

    setActiveLesson(lesson);
    if (!lesson.completed) {
      const updatedLessons = levelLessons.map((l) =>
        l.id === lesson.id ? { ...l, progress: 0 } : l,
      );
      setLevelLessons(updatedLessons);
    }
  };

  const updateLessonProgress = async (progress: number) => {
    if (!activeLesson || !level) return;

    try {
      await mockApi.updateLessonProgress(
        level as string,
        activeLesson.id,
        progress,
      );
      const updatedLessons = levelLessons.map((lesson) =>
        lesson.id === activeLesson.id ? { ...lesson, progress } : lesson,
      );
      setLevelLessons(updatedLessons);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  return {
    levelLessons,
    loading,
    lesson,
    activeLesson,
    handleLessonSelect,
    player,
    currentVideo,
    handleVideoComplete,
    updateLessonProgress,
    level,
    autoPlay,
    setAutoPlay,
  };
};

export default useLessonLevel;
