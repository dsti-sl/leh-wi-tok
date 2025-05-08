import React from 'react';
import {
  ColorValue,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ProgressBar from '../common/ProgressBar';

interface LessonCardProps {
  title: string;
  completed: number;
  totalLesson: number;
  onPress: () => void;
  backgroundColor: ColorValue;
}
const LessonCard: React.FC<LessonCardProps> = ({
  title,
  completed,
  totalLesson,
  onPress,
  backgroundColor,
}) => {
  const progress = Math.round((completed / totalLesson) * 100) || 0;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{ ...styles.container, backgroundColor }]}
    >
      <Text style={styles.txtTitle}>{title}</Text>
      <View style={{ gap: 15 }}>
        <ProgressBar progress={progress} />
        <View style={{ gap: 10 }}>
          <Text style={{ color: '#fff' }}>completed</Text>
          <Text style={styles.txtBold}>{`${completed}/${totalLesson}`}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default LessonCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingVertical: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3.84,
    elevation: 5,

    gap: 30,
  },
  txtTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  txtBold: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
