// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { router } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import { StyleSheet, View } from 'react-native';

// import LessonCard from './LessonCard';

// import { Record } from '@/lib/types';

// interface LessonsCategoryProps {
//   progressSummary: Record;
// }

// interface LessonCompletionData {
//   lessons?: Array<{
//     level: string;
//     totalCompleted: number;
//     totallessons: number;
//   }>;
// }

// const LessonsCategory: React.FC<LessonsCategoryProps> = ({
//   progressSummary,
// }) => {
//   const [userCompletionRate, setUserCompletionRate] =
//     useState<LessonCompletionData | null>(null);

//   useEffect(() => {
//     const fetchUserInfo = async () => {
//       try {
//         const lessonComplete = await AsyncStorage.getItem('completedLesson');
//         if (lessonComplete) {
//           setUserCompletionRate(JSON.parse(lessonComplete));
//         } else {
//           // Initialize with empty data if nothing is found
//           setUserCompletionRate({ lessons: [] });
//         }
//       } catch (error) {
//         console.error('Failed to fetch completed lessons:', error);
//         // Fallback to empty data if there's an error
//         setUserCompletionRate({ lessons: [] });
//       }
//     };

//     fetchUserInfo();
//   }, []);

//   // Helper function to find lesson data safely
//   const getLessonData = (level: string) => {
//     return (
//       userCompletionRate?.lessons?.find((lesson) => lesson.level === level) || {
//         totalCompleted: 0,
//         totallessons: 0,
//       }
//     );
//   };

//   const beginnerData = getLessonData('Beginner');
//   const basicElementaryData = getLessonData('Basic Elementary');
//   const intermediateData = getLessonData('Intermediate');
//   const advancedData = getLessonData('Advanced');

//   return (
//     <View style={styles.cardsContainer}>
//       <View style={styles.cardRowContainer}>
//         <LessonCard
//           title={(progressSummary['Beginner'] as Record).title as string}
//           completed={beginnerData.totalCompleted}
//           totalLesson={beginnerData.totallessons}
//           onPress={() => {
//             router.push(
//               `/(tabs)/lessons/level/${(progressSummary['Beginner'] as Record).title}?assessment=Beginner`,
//             );
//           }}
//           backgroundColor="#3e585e"
//         />
//         <LessonCard
//           title={
//             (progressSummary['Basic Elementary'] as Record).title as string
//           }
//           completed={basicElementaryData.totalCompleted}
//           totalLesson={basicElementaryData.totallessons}
//           onPress={() => {
//             router.push(
//               `/(tabs)/lessons/level/${(progressSummary['Basic Elementary'] as Record).title}?assessment=Basic Elementary`,
//             );
//           }}
//           backgroundColor="#1b6c82"
//         />
//       </View>
//       <View style={styles.cardRowContainer}>
//         <LessonCard
//           title={(progressSummary['Intermediate'] as Record).title as string}
//           completed={intermediateData.totalCompleted}
//           totalLesson={intermediateData.totallessons}
//           onPress={() => {
//             console.log('Intermediate', progressSummary['Intermediate']);
//             router.push(
//               `/(tabs)/lessons/level/${(progressSummary['Intermediate'] as Record).title}?assessment=Intermediate`,
//             );
//           }}
//           backgroundColor="#2e6270"
//         />
//         <LessonCard
//           title={(progressSummary['Advanced'] as Record).title as string}
//           completed={advancedData.totalCompleted}
//           totalLesson={advancedData.totallessons}
//           onPress={() => {
//             router.push(
//               `/(tabs)/lessons/level/${(progressSummary['Advanced'] as Record).title}?assessment=Advanced`,
//             );
//           }}
//           backgroundColor="#3088a0"
//         />
//       </View>
//     </View>
//   );
// };

// export default LessonsCategory;

// const styles = StyleSheet.create({
//   cardsContainer: {
//     flex: 1,
//     paddingHorizontal: 20,
//     gap: 20,
//   },
//   cardRowContainer: {
//     flexDirection: 'row',
//     width: '100%',
//     gap: 20,
//   },
// });

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

  console.log('lessonCount', lessonCount);

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
