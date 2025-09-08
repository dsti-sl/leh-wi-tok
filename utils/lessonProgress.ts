import AsyncStorage from '@react-native-async-storage/async-storage';

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
      (key) => key.startsWith('lesson_') && key.endsWith('_position'),
    );
    await AsyncStorage.multiRemove(lessonPositionKeys);
  } catch (error) {
    console.error('Error clearing lesson positions:', error);
  }
};
