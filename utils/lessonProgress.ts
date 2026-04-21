import AsyncStorage from '@react-native-async-storage/async-storage';

const LESSON_POSITION_PREFIX = 'lesson_';
const LESSON_POSITION_SUFFIX = '_position';
const LAST_LESSON_SELECTED_PREFIX = 'lesson_last_selected_';
const LAST_LESSON_RESUME_KEY = 'lesson_last_resume';

interface CompletedLesson {
  lessonId: string;
  totalCompleted: number;
  updatedAt: string;
}

export const saveLessonPosition = async (
  lessonId: string,
  position: number,
) => {
  try {
    await AsyncStorage.setItem(
      `lesson_${lessonId}_position`,
      position.toString(),
    );
  } catch (error) {
    console.error('Error saving lesson position:', error);
  }
};

export const getLessonPosition = async (lessonId: string): Promise<number> => {
  try {
    const position = await AsyncStorage.getItem(`lesson_${lessonId}_position`);
    return position ? parseFloat(position) : 0;
  } catch (error) {
    console.error('Error getting lesson position:', error);
    return 0;
  }
};

export const markLessonCompleted = async (lessonId: string) => {
  try {
    await AsyncStorage.removeItem(`lesson_${lessonId}_position`);

    // Update completed lessons count
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

export const clearAllLessonPositions = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const lessonPositionKeys = keys.filter(
      key =>
        key.startsWith(LESSON_POSITION_PREFIX) &&
        key.endsWith(LESSON_POSITION_SUFFIX),
    );
    await AsyncStorage.multiRemove(lessonPositionKeys);
  } catch (error) {
    console.error('Error clearing lesson positions:', error);
  }
};

export const clearLessonSessionState = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const lessonSessionKeys = keys.filter(
      key =>
        (key.startsWith(LESSON_POSITION_PREFIX) &&
          key.endsWith(LESSON_POSITION_SUFFIX)) ||
        key.startsWith(LAST_LESSON_SELECTED_PREFIX) ||
        key === LAST_LESSON_RESUME_KEY,
    );

    if (lessonSessionKeys.length > 0) {
      await AsyncStorage.multiRemove(lessonSessionKeys);
    }
  } catch (error) {
    console.error('Error clearing lesson session state:', error);
  }
};
