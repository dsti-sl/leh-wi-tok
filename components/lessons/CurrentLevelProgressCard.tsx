import React from 'react';

import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { Colors } from '@/constants/Colors';
import { FontSizes, FontWeights } from '@/constants/Typography';
import { Record } from '@/lib/types';
import { OverallData } from '@/utils';

import ProgressBar from '../common/ProgressBar';

interface CurrentLevelProgressCardProps {
  defaultTutorial?: Record;
  accumulatedData: OverallData;
}
const CurrentLevelProgressCard: React.FC<CurrentLevelProgressCardProps> = ({
  accumulatedData,
}) => {
  const completedLessons = accumulatedData?.accumulatedLessons ?? 0;
  const completed = accumulatedData?.accumulatedCompletedLessons ?? 0;

  const progress =
    completedLessons === 0
      ? 0
      : Math.round((completed / completedLessons) * 100);
  return (
    <View style={styles.container}>
      <View style={styles.titleContent}>
        <Text style={styles.headingText}>My Progress</Text>
        <Text
          style={styles.headingText}
        >{`${completed} / ${completedLessons}`}</Text>
      </View>
      {/* <ProgressBar progress={0} /> */}
      <ProgressBar progress={progress} />
      <Text style={styles.subText}>{`${progress}% Complete`}</Text>
    </View>
  );
};

export default CurrentLevelProgressCard;

const styles = StyleSheet.create<{
  container: ViewStyle;
  titleContent: ViewStyle;
  txtDescription: ViewStyle;
  playBtn: TextStyle;
  headingText: TextStyle;
  subText: TextStyle;
  txtBold: TextStyle;
  playTxt: TextStyle;
}>({
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
  headingText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: '#1f2937',
  },
  subText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: '#374151',
  },
  txtBold: {
    fontWeight: FontWeights.semiBold,
    fontSize: FontSizes.lg,
  },
  playTxt: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.primary,
  },
});
