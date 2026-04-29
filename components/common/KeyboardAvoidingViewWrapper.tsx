import React from 'react';

import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

interface KeyboardAvoidingViewWrapperProps {
  children: React.ReactNode;
}
const KeyboardAvoidingViewWrapper: React.FC<
  KeyboardAvoidingViewWrapperProps
> = ({ children }) => (
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView style={{ flexGrow: 1 }}>{children}</ScrollView>
  </KeyboardAvoidingView>
);

export default KeyboardAvoidingViewWrapper;
