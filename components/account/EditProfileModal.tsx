import React, { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Feather } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import CModal from '@/components/common/CModal';
import { Colors } from '@/constants/Colors';
import type { AccountUserInfo } from '@/hooks/useAccount';
import { getBaseUrl } from '@/utils';

interface EditProfileModalProps {
  open: boolean;
  setOpen: (_open: boolean) => void;
  userInfo: AccountUserInfo | null;
  onSaved?: () => void;
}

const DEFAULT_USER_ID = '7097e840-ee12-44a0-b3fd-2fe95c4ed617';

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  setOpen,
  userInfo,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [age, setAge] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const EXPO_PUBLIC_BASE_URL = getBaseUrl();

  const initialValues = useMemo(
    () => ({
      name: userInfo?.name ?? '',
      handle: userInfo?.handle ?? '',
      age:
        typeof userInfo?.age === 'number'
          ? String(userInfo?.age)
          : typeof userInfo?.age === 'string'
            ? userInfo?.age
            : '',
    }),
    [userInfo],
  );

  useEffect(() => {
    if (!open) return;
    setName(initialValues.name);
    setHandle(initialValues.handle);
    setAge(initialValues.age);
  }, [open, initialValues]);

  const submitUpdate = async () => {
    const trimmedName = name.trim();
    const trimmedHandle = handle.trim();

    if (!trimmedName || !trimmedHandle) {
      Alert.alert('Missing info', 'Name and handle are required.');
      return;
    }

    const parsedAge = age ? Number(age) : null;
    if (age && Number.isNaN(parsedAge)) {
      Alert.alert('Invalid age', 'Age must be a number.');
      return;
    }

    setIsSaving(true);
    try {
      const id = userInfo?.id ?? DEFAULT_USER_ID;
      const payload = {
        name: trimmedName,
        handle: trimmedHandle,
        age: parsedAge ?? null,
      };

      const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/user?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update profile.');
      }

      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = {
          ...parsed,
          name: trimmedName,
          handle: trimmedHandle,
          age: parsedAge ?? parsed.age,
        };
        await AsyncStorage.setItem('user', JSON.stringify(updated));
      }

      onSaved?.();
      setOpen(false);
      Alert.alert('Profile updated', 'Your profile changes have been saved.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update profile.';
      Alert.alert('Update failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    Alert.alert(
      'Confirm update',
      'Save these changes to your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', style: 'default', onPress: submitUpdate },
      ],
      { cancelable: true },
    );
  };

  return (
    <CModal
      open={open}
      setOpen={setOpen}
      animationType="fade"
      modalContainerStyle={styles.modalContainer}
      closeOnBackdropPress={!isSaving}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity
            accessibilityLabel="Close edit profile"
            onPress={() => setOpen(false)}
            disabled={isSaving}
          >
            <Feather name="x" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Update your details below. These changes will reflect immediately.
        </Text>

        <View style={styles.inputRow}>
          <Feather name="user" size={18} color={Colors.primary} />
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputRow}>
          <Feather name="at-sign" size={18} color={Colors.primary} />
          <TextInput
            style={styles.input}
            placeholder="Handle"
            value={handle}
            onChangeText={setHandle}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputRow}>
          <Feather name="hash" size={18} color={Colors.primary} />
          <TextInput
            style={styles.input}
            placeholder="Age"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => setOpen(false)}
            disabled={isSaving}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="save" size={16} color="#fff" />
                <Text style={styles.saveText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </CModal>
  );
};

export default EditProfileModal;

const styles = StyleSheet.create({
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 18,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelText: {
    color: '#475569',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
  },
});
