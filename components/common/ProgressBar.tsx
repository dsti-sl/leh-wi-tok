import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
}
const ProgressBar: React.FC<ProgressBarProps> = ({
  progress = 0,
  width = 100,
  height = 8,
  backgroundColor = '#F5F5FA',
  progressColor = '#FF8A00',
}) => {
  const containerBackgroundColor =
    progress === 0 || width === 0 ? '#FFFFFF' : backgroundColor;

  return (
    <View
      style={[
        styles.container,
        {
          width: `${width}%`,
          height,
          backgroundColor: containerBackgroundColor,
        },
      ]}
    >
      <View
        style={[
          styles.progress,
          { width: `${progress}%`, height, backgroundColor: progressColor },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 4,
  },
});

export default ProgressBar;
