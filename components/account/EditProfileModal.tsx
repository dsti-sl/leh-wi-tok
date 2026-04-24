import React, { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Feather } from '@expo/vector-icons';

import CModal from '@/components/common/CModal';
import { Colors } from '@/constants/Colors';
import {
  type AccountUserInfo,
  hydrateCurrentAccountProfile,
  normalizeEditablePhoneNumber,
} from '@/lib/accountProfile';
import { getBaseUrl, getToken, validatePhoneNumber } from '@/utils';

interface EditProfileModalProps {
  open: boolean;
  setOpen: (_open: boolean) => void;
  userInfo: AccountUserInfo | null;
  onSaved?: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  setOpen,
  userInfo,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const EXPO_PUBLIC_BASE_URL = getBaseUrl();

  const initialValues = useMemo(
    () => ({
      address: userInfo?.address ?? '',
      name: userInfo?.name ?? '',
      handle: userInfo?.handle ?? '',
      phoneNumber: userInfo?.phoneNumber ?? '',
    }),
    [userInfo],
  );

  useEffect(() => {
    if (!open) return;
    setName(initialValues.name);
    setHandle(initialValues.handle);
    setPhoneNumber(initialValues.phoneNumber);
    setAddress(initialValues.address);
  }, [open, initialValues]);

  const buildHeaders = async () => {
    const token = await getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    };
  };

  const submitUpdate = async () => {
    const trimmedName = name.trim();
    const trimmedHandle = handle.trim();
    const trimmedAddress = address.trim();
    let normalizedPhone = normalizeEditablePhoneNumber(phoneNumber);

    if (!trimmedName || !trimmedHandle) {
      Alert.alert('Missing info', 'Name and handle are required.');
      return;
    }

    if (phoneNumber.trim()) {
      const phoneValidation = validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        Alert.alert(
          'Invalid phone number',
          phoneValidation.error ||
            'Enter a valid phone number. Sierra Leone numbers must be 9 digits locally starting with 0, or start with +232/232.',
        );
        return;
      }

      normalizedPhone = phoneValidation.normalized;
    }

    if (phoneNumber.trim() && !normalizedPhone) {
      Alert.alert('Invalid phone number', 'Enter a valid phone number.');
      return;
    }

    setIsSaving(true);
    try {
      if (!userInfo?.id) {
        throw new Error('User profile is unavailable.');
      }

      const headers = await buildHeaders();

      const response = await fetch(
        `${EXPO_PUBLIC_BASE_URL}/user?id=${userInfo.id}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            name: trimmedName,
            handle: trimmedHandle,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update profile.');
      }

      const phoneChanged = normalizedPhone !== (userInfo.phoneNumber ?? '');
      if (phoneChanged) {
        if (normalizedPhone) {
          const phoneResponse = await fetch(
            `${EXPO_PUBLIC_BASE_URL}/phone${
              userInfo.phoneId ? `?id=${userInfo.phoneId}` : ''
            }`,
            {
              method: userInfo.phoneId ? 'PATCH' : 'POST',
              headers,
              body: JSON.stringify({
                number: normalizedPhone,
                ...(userInfo.phoneId ? { verified: false } : {}),
              }),
            },
          );

          if (!phoneResponse.ok) {
            const errorText = await phoneResponse.text();
            throw new Error(errorText || 'Failed to update phone number.');
          }
        } else if (userInfo.phoneId) {
          const phoneDeleteResponse = await fetch(
            `${EXPO_PUBLIC_BASE_URL}/phone?id=${userInfo.phoneId}`,
            {
              method: 'DELETE',
              headers,
            },
          );

          if (!phoneDeleteResponse.ok) {
            const errorText = await phoneDeleteResponse.text();
            throw new Error(errorText || 'Failed to remove phone number.');
          }
        }
      }

      const addressChanged = trimmedAddress !== (userInfo.address ?? '');
      if (addressChanged) {
        if (trimmedAddress) {
          const addressResponse = await fetch(
            `${EXPO_PUBLIC_BASE_URL}/address${
              userInfo.addressId ? `?id=${userInfo.addressId}` : ''
            }`,
            {
              method: userInfo.addressId ? 'PATCH' : 'POST',
              headers,
              body: JSON.stringify({
                address: trimmedAddress,
                ...(userInfo.addressId ? { verified: false } : {}),
              }),
            },
          );

          if (!addressResponse.ok) {
            const errorText = await addressResponse.text();
            throw new Error(errorText || 'Failed to update address.');
          }
        } else if (userInfo.addressId) {
          const addressDeleteResponse = await fetch(
            `${EXPO_PUBLIC_BASE_URL}/address?id=${userInfo.addressId}`,
            {
              method: 'DELETE',
              headers,
            },
          );

          if (!addressDeleteResponse.ok) {
            const errorText = await addressDeleteResponse.text();
            throw new Error(errorText || 'Failed to remove address.');
          }
        }
      }

      const token = await getToken();
      await hydrateCurrentAccountProfile(EXPO_PUBLIC_BASE_URL, token);
      await onSaved?.();
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 0 }}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
            <Feather name="phone" size={18} color={Colors.primary} />
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputRow}>
            <Feather name="map-pin" size={18} color={Colors.primary} />
            <TextInput
              style={styles.input}
              placeholder="Address"
              value={address}
              onChangeText={setAddress}
              multiline
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
        </ScrollView>
      </KeyboardAvoidingView>
    </CModal>
  );
};

export default EditProfileModal;

const styles = StyleSheet.create({
  modalContainer: {
    width: '90%',
    maxHeight: '90%',
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
    minHeight: 44,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
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
