import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TextStyle,
  ActivityIndicator,
} from 'react-native';

import { Colors } from '@/constants/Colors';

interface ButtonProps {
  buttonStyle?: TextStyle;
  title: string;
  onPress: () => void;
  disabled?: boolean;
  shaded?: boolean;
  loadingIndicator?: boolean;
}
const C_Button: React.FC<ButtonProps> = ({
  buttonStyle,
  title,
  onPress,
  disabled = false,
  shaded = false,
  loadingIndicator = false,
  ...props
}) => {
  const shadedStyle = shaded ? { opacity: 0.5 } : {};
  return (
    <TouchableOpacity
      style={shadedStyle}
      disabled={disabled}
      onPress={onPress}
      {...props}
    >
      {loadingIndicator && (
        <ActivityIndicator
          size="large"
          style={{
            position: 'absolute',
            zIndex: 1,
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          }}
        />
      )}
      <Text style={[styles.base, buttonStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default C_Button;

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
    color: '#ffffff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 45,
    textAlign: 'center',
    overflow: 'hidden',
  },
});
