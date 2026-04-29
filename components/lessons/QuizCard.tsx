import React from 'react';

import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import PuzzlePiece from '@/assets/images/puzzle-piece-outline-fill-secondary.png';

interface QuizCardProps {
  completed: number;
  total: number;
}
const QuizCard: React.FC<QuizCardProps> = ({ completed, total }) => {
  // TODO: Review implementation as data become available and clearer
  return (
    <View style={styles.container}>
      <View style={styles.titleContent}>
        <Image source={PuzzlePiece as ImageSourcePropType} />
        <Text style={styles.txtBold}>Quizzes</Text>
      </View>
      <Text
        style={{ ...styles.txtBold, fontWeight: '700' }}
      >{`${completed}/${total}`}</Text>
    </View>
  );
};

export default QuizCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f4c5c',
    padding: 20,
    width: '100%',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3.84,
    elevation: 5,

    gap: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  txtBold: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
