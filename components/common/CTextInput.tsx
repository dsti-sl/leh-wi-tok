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

import { FontSizes, FontWeights } from '@/constants/Typography';

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
  inputContainerStyle = {} as ViewStyle,
  inputStyle = {} as TextStyle,
  counterStyle = {} as TextStyle,

  multiline = false,
  showCounter = false,
  ...props
}) => {
  return (
    <View style={[styles.container, inputContainerStyle]}>
      <Text style={styles.label}>{inputLabel}</Text>
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
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#B0C4DE',
    borderRadius: 8,
    flexWrap: 'wrap',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: '#1f2937',
  },
});
