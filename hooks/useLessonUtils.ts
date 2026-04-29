import { useCallback } from 'react';

import { getBaseUrl } from '@/utils';

import { LessonTag } from './useLessonData';

interface UseLessonUtilsReturn {
  parseWysiwygContent: (_jsonString: string) => string[];
  getIllustrationUrl: (
    _illustration: LessonTag['illustration'],
  ) => string | null;
  isSupportedImageFormat: (_contentType: string) => boolean;
  isLessonLocked: (
    _currentLesson: LessonTag,
    _index: number,
    _lessons: LessonTag[],
    _completedLessons: Set<string>,
  ) => boolean;
}

export const useLessonUtils = (): UseLessonUtilsReturn => {
  const BASE_URL = getBaseUrl();

  const parseWysiwygContent = useCallback((jsonString: string): string[] => {
    try {
      const parsed = JSON.parse(jsonString);
      return parsed
        .map((block: { type: string; children?: { text: string }[] }) => {
          if (block.type === 'paragraph' && block.children) {
            return block.children.map(child => child.text).join('');
          }
          return '';
        })
        .filter((text: string) => text.trim() !== '');
    } catch (error) {
      console.warn('Failed to parse Wysiwyg content:', error);
      return [];
    }
  }, []);

  const getIllustrationUrl = useCallback(
    (illustration: LessonTag['illustration']): string | null => {
      if (!illustration?.id) return null;
      return `${BASE_URL}/file/download?id=${illustration.id}`;
    },
    [BASE_URL],
  );

  const isSupportedImageFormat = useCallback((contentType: string): boolean => {
    return contentType?.startsWith('image/');
  }, []);

  const isLessonLocked = useCallback(
    (
      currentLesson: LessonTag,
      index: number,
      lessons: LessonTag[],
      completedLessons: Set<string>,
    ): boolean => {
      if (index === 0) return false;
      const previousLesson = lessons[index - 1];
      return previousLesson ? !completedLessons.has(previousLesson.id) : true;
    },
    [],
  );

  return {
    parseWysiwygContent,
    getIllustrationUrl,
    isSupportedImageFormat,
    isLessonLocked,
  };
};
