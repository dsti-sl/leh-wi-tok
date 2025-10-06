import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { Record } from '@/lib/types';
import { LessonCount, OverallData, accumulateLessonCounts } from '@/utils';

import ProgressBar from '../common/ProgressBar';

interface CurrentLevelProgressCardProps {
  defaultTutorial?: Record;
  accumulatedData: OverallData;
  lessonCount: LessonCount;
}
const CurrentLevelProgressCard: React.FC<CurrentLevelProgressCardProps> = ({
  accumulatedData,
  lessonCount,
}) => {
  const completedLessons =
    accumulateLessonCounts(lessonCount) || accumulatedData?.accumulatedLessons;

  const progress =
    Math.round(
      (accumulatedData?.accumulatedCompletedLessons / completedLessons) * 100,
    ) || 0;
  return (
    <View style={styles.container}>
      <View style={styles.titleContent}>
        <Text>My Progress</Text>
        <Text>{`${accumulatedData?.accumulatedCompletedLessons} / ${completedLessons}`}</Text>
      </View>
      {/* <ProgressBar progress={0} /> */}
      <ProgressBar progress={progress} />
      <Text>{`${progress}% Complete`}</Text>
    </View>
  );
};

export default CurrentLevelProgressCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: -90,
    width: '90%',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3.84,
    elevation: 5,

    gap: 15,
  },
  titleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 2 },
    gap: 10,
  },
  txtDescription: {
    opacity: 0.5,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    color: Colors.primary,
  },
  txtBold: {
    fontWeight: '400',
    fontSize: 20,
  },
  playTxt: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  },
});
