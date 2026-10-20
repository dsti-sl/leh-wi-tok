import React from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/Colors';

interface GuestAccessGateProps {
  onContinue: () => void;
}

const GuestAccessGate: React.FC<GuestAccessGateProps> = ({ onContinue }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Dictionary access</Text>
    <Text style={styles.message}>
      The full dictionary is available to signed-in users. Create an account or
      sign in to browse words and definitions.
    </Text>
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onContinue}
      style={styles.button}
    >
      <Text style={styles.buttonText}>Continue</Text>
    </TouchableOpacity>
  </View>
);

export default GuestAccessGate;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 8,
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  message: {
    maxWidth: 360,
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
