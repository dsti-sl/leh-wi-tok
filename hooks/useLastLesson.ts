import { useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { getBaseUrl, getGuestMode, getToken } from '@/utils';

interface LastLessonData {
  id: string;
  title: string;
  videoUrl: string | number;
  thumbnail: string | number;
  duration: string;
  isFirstTimeUser: boolean;
  lastWatchedPosition?: number;
  headers?: Record<string, string> | undefined;
}

interface CompletedLesson {
  lessonId: string;
  totalCompleted: number;
  updatedAt: string;
}

interface LessonTagInfo {
  title?: string;
}

const useLastLesson = () => {
  const [lastLesson, setLastLesson] = useState<LastLessonData | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean | null>(null);

  // Fetch token on component mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const [storedToken, guestValue] = await Promise.all([
          getToken(),
          getGuestMode(),
        ]);
        setToken(storedToken);
        setIsGuest(guestValue);
      } catch (error) {
        console.error('Error fetching token:', error);
        setIsGuest(false);
      }
    };

    fetchToken();
  }, []);

  useEffect(() => {
    const checkUserProgress = async () => {
      try {
        if (isGuest === null) return;

        // Wait for token to be available
        if (!token && !isGuest) {
          setLoading(false);
          return;
        }

        // Checks if user has any completed lessons
        const completedLessons = await AsyncStorage.getItem('completedLesson');
        const user = await AsyncStorage.getItem('user');
        const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');

        if (!hasOnboarded || (!user && !isGuest)) {
          setIntroVideo();
          return;
        }

        const lessons = completedLessons
          ? JSON.parse(completedLessons).lessons
          : [];

        const hasCompletedLessons = lessons.some(
          (lesson: CompletedLesson) => lesson.totalCompleted > 0,
        );

        if (!hasCompletedLessons) {
          setIntroVideo();
        } else {
          const lastCompletedLesson = lessons
            .filter((lesson: CompletedLesson) => lesson.totalCompleted > 0)
            .sort(
              (a: CompletedLesson, b: CompletedLesson) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
            )[0];

          if (lastCompletedLesson) {
            await fetchLastLessonDetails(lastCompletedLesson);
          } else {
            setIntroVideo();
          }
        }
      } catch (error) {
        console.error('Error checking user progress:', error);
        setIntroVideo();
      } finally {
        setLoading(false);
      }
    };

    checkUserProgress();
  }, [token, isGuest]);

  const setIntroVideo = () => {
    const baseUrl = getBaseUrl();
    const fileId = '65254ae9-6d04-46d1-ab16-7975a877bb6a';
    const downloadUrl = `${baseUrl}/file/download?id=${fileId}`;

    setLastLesson({
      id: 'intro',
      title: 'Welcome to the Le Wi Tok Application',
      videoUrl: downloadUrl,
      thumbnail: require('../assets/images/Alphabet-A.png'),
      duration: '1:16',
      isFirstTimeUser: true,
      lastWatchedPosition: 0,
      headers: token ? { Authorization: `Token ${token}` } : undefined,
    });
    setIsFirstTimeUser(true);
  };

  const fetchLastLessonDetails = async (lessonData: any) => {
    try {
      const baseUrl = getBaseUrl();
      const nuggetAndClause = isGuest
        ? `(lesson.id.eq.${lessonData.lessonId},tags.title.eq.Beginner)`
        : `(lesson.id.eq.${lessonData.lessonId})`;
      const response = await fetch(
        `${baseUrl}/nugget?and=${nuggetAndClause}&select=lesson(id,title,description,illustration,tags),gesture(id,name,path,contentType)`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch lesson details');
      }

      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const lesson = data.data[0];
        const lessonTags = Array.isArray(lesson?.lesson?.tags)
          ? (lesson.lesson.tags as LessonTagInfo[])
          : [];
        const isBeginner = lessonTags.some(tag => tag?.title === 'Beginner');

        if (isGuest && !isBeginner) {
          setIntroVideo();
          return;
        }

        const lastPosition = await AsyncStorage.getItem(
          `lesson_${lesson.lesson.id}_position`,
        );

        const gestureId = lesson.gesture?.id;
        const videoUrl = gestureId
          ? `${baseUrl}/file/download?id=${gestureId}`
          : lesson.gesture?.path || '';

        setLastLesson({
          id: lesson.lesson.id,
          title: lesson.lesson.title,
          videoUrl,
          thumbnail:
            lesson.lesson.illustration ||
            require('../assets/images/adaptive-icon.png'),
          duration: '5:00',
          isFirstTimeUser: false,
          lastWatchedPosition: lastPosition ? parseFloat(lastPosition) : 0,
          headers: token ? { Authorization: `Token ${token}` } : undefined,
        });
        setIsFirstTimeUser(false);
      } else {
        setIntroVideo();
      }
    } catch (error) {
      console.error('Error fetching lesson details:', error);
      setIntroVideo();
    }
  };

  const saveLessonPosition = async (lessonId: string, position: number) => {
    try {
      await AsyncStorage.setItem(
        `lesson_${lessonId}_position`,
        position.toString(),
      );
    } catch (error) {
      console.error('Error saving lesson position:', error);
    }
  };

  const markLessonCompleted = async (lessonId: string) => {
    try {
      await AsyncStorage.removeItem(`lesson_${lessonId}_position`);

      const completedLessons = await AsyncStorage.getItem('completedLesson');
      if (completedLessons) {
        const lessons = JSON.parse(completedLessons).lessons;
        const updatedLessons = lessons.map((lesson: CompletedLesson) =>
          lesson.lessonId === lessonId
            ? { ...lesson, totalCompleted: lesson.totalCompleted + 1 }
            : lesson,
        );
        await AsyncStorage.setItem(
          'completedLesson',
          JSON.stringify({ lessons: updatedLessons }),
        );
      }
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
    }
  };

  return {
    lastLesson,
    isFirstTimeUser,
    loading,
    saveLessonPosition,
    markLessonCompleted,
  };
};

export default useLastLesson;
