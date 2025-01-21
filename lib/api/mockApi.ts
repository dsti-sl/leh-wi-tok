import { getLevelLessons as getLocalLessons } from '../dummyData';

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

export interface LessonProgress {
  lessonId: number;
  progress: number;
  completed: boolean;
  timestamp: string;
}

export class MockApiService {
  private static instance: MockApiService;
  private userProgress: Map<string, LessonProgress[]>;

  private constructor() {
    this.userProgress = new Map();
  }

  static getInstance(): MockApiService {
    if (!MockApiService.instance) {
      MockApiService.instance = new MockApiService();
    }
    return MockApiService.instance;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getLevelLessons(level: string): Promise<ApiResponse<any>> {
    await delay(800); // Simulate network latency
    const lessons = await getLocalLessons(level);

    // Merge with stored progress if any
    const progress = this.userProgress.get(level) || [];
    const lessonsWithProgress = lessons.map((lesson) => ({
      ...lesson,
      progress:
        progress.find((p) => p.lessonId === lesson.id)?.progress ||
        lesson.progress,
      completed:
        progress.find((p) => p.lessonId === lesson.id)?.completed ||
        lesson.completed,
    }));

    return {
      data: lessonsWithProgress,
      status: 200,
      message: 'Success',
    };
  }

  async updateLessonProgress(
    level: string,
    lessonId: number,
    progress: number,
  ): Promise<ApiResponse<LessonProgress>> {
    await delay(300);

    const currentProgress = this.userProgress.get(level) || [];
    const updatedProgress: LessonProgress = {
      lessonId,
      progress,
      completed: progress >= 100,
      timestamp: new Date().toISOString(),
    };

    const newProgress = [
      ...currentProgress.filter((p) => p.lessonId !== lessonId),
      updatedProgress,
    ];

    this.userProgress.set(level, newProgress);

    return {
      data: updatedProgress,
      status: 200,
      message: 'Progress updated successfully',
    };
  }

  async completeLessonAndUnlockNext(
    level: string,
    lessonId: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<ApiResponse<any>> {
    await delay(500);

    const currentProgress = this.userProgress.get(level) || [];
    const timestamp = new Date().toISOString();

    const updatedProgress = [
      ...currentProgress.filter(
        (p) => p.lessonId !== lessonId && p.lessonId !== lessonId + 1,
      ),
      { lessonId, progress: 100, completed: true, timestamp },
      {
        lessonId: lessonId + 1,
        progress: 0,
        completed: false,
        locked: false,
        timestamp,
      },
    ];

    this.userProgress.set(level, updatedProgress);

    return {
      data: { completedLessonId: lessonId, unlockedLessonId: lessonId + 1 },
      status: 200,
      message: 'Lesson completed and next lesson unlocked',
    };
  }
}

export const mockApi = MockApiService.getInstance();
