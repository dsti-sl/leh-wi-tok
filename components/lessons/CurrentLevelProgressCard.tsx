import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import ProgressBar from '../common/ProgressBar';

import { Colors } from '@/constants/Colors';
import { Record } from '@/lib/types';

interface CurrentLevelProgressCardProps {
  defaultTutorial?: Record;
}
const CurrentLevelProgressCard: React.FC<
  CurrentLevelProgressCardProps
> = () => {
  // TODO: Review implementation as data source becomes available
  return (
    <View style={styles.container}>
      <View style={styles.titleContent}>
        <Text>Level 1</Text>
        <Text>{`${0}/${1000}`}</Text>
      </View>
      <ProgressBar progress={50} />
      <Text>{`${'L1'}/${'L10'}`}</Text>
    </View>
  );
};

export default CurrentLevelProgressCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: -95,
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
