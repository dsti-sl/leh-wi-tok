import React from 'react';

import { StyleSheet, View, ViewStyle } from 'react-native';

import { Colors } from '@/constants/Colors';

interface DividerProps {
  color?: string;
  thickness?: 1 | 2 | 3 | 4 | 5;
  dividerStyle?: ViewStyle;
}
const Divider: React.FC<DividerProps> = ({
  thickness = 1,
  color = Colors.primary,
  dividerStyle = {
    ...styles.container,
    height: thickness,
    backgroundColor: color,
  },
}) => {
  return <View style={dividerStyle} />;
};

export default Divider;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: 1,
    backgroundColor: Colors.primary,
    opacity: 0.3,
  },
});
