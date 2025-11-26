import React from 'react';

import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { typography } from '@/constants/Typography';

import WordCounter from './WordCounter';

interface CTextInputProps extends TextInputProps {
  inputLabel: string;
  placeholder: string;
  value: string;
  multiline: boolean;
  showCounter?: boolean;
  setValue: (_value: string) => void;
  inputStyle?: TextStyle;
  inputContainerStyle?: ViewStyle;
  counterStyle?: TextStyle;
}
const CTextInput: React.FC<CTextInputProps> = ({
  inputLabel,
  placeholder,
  value,
  setValue,
  inputContainerStyle = {},
  inputStyle = {},
  counterStyle = {},

  multiline = false,
  showCounter = false,
  ...props
}) => {
  return (
    <View style={[styles.container, inputContainerStyle]}>
      <Text style={styles.labelText}>{inputLabel}</Text>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={setValue}
        multiline={multiline}
        style={[styles.input, inputStyle]}
        numberOfLines={2}
        {...props}
      />
      {showCounter && (
        <WordCounter
          counterStyle={counterStyle}
          value={value}
          maxCount={props.maxLength as number}
        />
      )}
      {/*
      TODO:
      - Render validation component
      - Render left and right elements
      */}
    </View>
  );
};

export default CTextInput;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 5,
  },
  labelText: {
    ...typography.label,
    color: '#0d1a26',
  },
  input: {
    ...typography.body,
    padding: 10,
    borderWidth: 1,
    borderColor: '#B0C4DE',
    borderRadius: 8,
    flexWrap: 'wrap',
  },
});
