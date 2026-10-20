import React from 'react';

import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';

interface SignLanguageDisclaimerProps {
  visible: boolean;
  onClose: () => void;
}

const SignLanguageDisclaimer: React.FC<SignLanguageDisclaimerProps> = ({
  visible,
  onClose,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={onClose}
  >
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.card}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close sign language content notice"
          onPress={onClose}
          style={styles.closeButton}
          hitSlop={12}
        >
          <Ionicons name="close" size={22} color="#475569" />
        </TouchableOpacity>
        <Text style={styles.title}>A note about our content</Text>
        <Text style={styles.message}>
          Leh We Tok contains ASL learning content alongside selected Sierra
          Leone Sign Language content. Signs may vary by language, community and
          context.
        </Text>
      </View>
    </View>
  </Modal>
);

export default SignLanguageDisclaimer;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    padding: 24,
    paddingTop: 30,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  title: {
    marginBottom: 10,
    color: Colors.primary,
    fontSize: 19,
    fontWeight: '700',
  },
  message: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
  },
});
