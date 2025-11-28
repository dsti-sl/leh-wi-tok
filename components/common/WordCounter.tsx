import React from 'react';

import { StyleSheet, Text, TextStyle } from 'react-native';

interface WordCounterProps {
  value: string;
  maxCount: number;
  counterStyle?: TextStyle;
}
const WordCounter: React.FC<WordCounterProps> = ({
  value,
  maxCount,
  counterStyle = {} as TextStyle,
}) => (
  <Text
    style={[styles.container, counterStyle]}
  >{`${value.length}/${maxCount}`}</Text>
);

export default WordCounter;

const styles = StyleSheet.create({
  container: {
    fontSize: 14,
    fontWeight: '400',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
});
