import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import ProfileImagePicker from '@/components/account/ImageUpload';
import C_Button from '@/components/common/Button';
import CModal from '@/components/common/CModal';
import Select from '@/components/common/Select';
import { Colors } from '@/constants/Colors';
import useLocationGrades from '@/hooks/useLocationGrades';
import { getAuthorizedHeaders, uploadProfileImage } from '@/lib/accountProfile';
import { getBaseUrl, getToken } from '@/utils';

const ProfileDetailsScreen = () => {
  const { grades, locations, isLoading, error } = useLocationGrades();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [age, setAge] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [locationId, setLocationID] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [gradeID, setGradeID] = useState('');
  const router = useRouter();
  const { userId, name } = useLocalSearchParams();

  const EXPO_PUBLIC_BASE_URL = getBaseUrl();
  const effectiveUserId =
    typeof user?.id === 'string'
      ? user.id
      : typeof userId === 'string'
        ? userId
        : '';
  const effectiveName =
    typeof user?.name === 'string'
      ? user.name
      : typeof name === 'string'
        ? name
        : '';

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const headers = token ? { Authorization: `Token ${token}` } : {};
        const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/user/me`, {
          headers,
        });
        const data = await response.json();

        if (response.ok) {
          setUser(data.data[0]);
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${EXPO_PUBLIC_BASE_URL}/location?name=eq.${selectedLocation}`,
        );
        const data = await response.json();
        if (response.ok) {
          setLocationID(data.data[0].id);
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [selectedLocation]);

  useEffect(() => {
    if (!user?.student) return;

    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${EXPO_PUBLIC_BASE_URL}/tag?title=eq.${selectedGrade}`,
        );
        const data = await response.json();
        if (response.ok) {
          setGradeID(data.data[0].id);
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [selectedGrade, user]);

  const validateAgeInput = (input: string) => {
    const numericValue = input.replace(/[^0-9]/g, '');
    if (
      numericValue &&
      (parseInt(numericValue) > 99 || parseInt(numericValue) === 0)
    ) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 1 and 99.');
      return;
    }
    setAge(numericValue);
  };

  const handleSaveAndContinue = async () => {
    if (
      !effectiveName ||
      !effectiveUserId ||
      (!selectedGrade && user?.student) ||
      !age ||
      !selectedLocation
    ) {
      return Alert.alert(
        'Error',
        'Please fill out all fields before continuing.',
      );
    }

    setIsSaving(true);

    try {
      const token = await getToken();
      const fileId = profileImage
        ? await uploadProfileImage(EXPO_PUBLIC_BASE_URL, token, {
            fileName: `${effectiveName}_profile-pic.jpg`,
            mimeType: 'image/jpeg',
            uri: profileImage,
          })
        : null;
      if (profileImage && !fileId) {
        throw new Error('Profile image upload failed.');
      }

      const profileDetails = {
        handle: effectiveName,
        ...(fileId ? { pictureId: fileId } : {}),
        tags: user?.student ? [gradeID] : [],
        age: parseInt(age),
        locationId,
      };

      await updateUserProfile(profileDetails);
      setShowSuccessModal(true);
      router.push('/home');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'An error occurred while saving your profile.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateUserProfile = async (profileInfo: unknown) => {
    const token = await getToken();
    const response = await fetch(
      `${EXPO_PUBLIC_BASE_URL}/user?id=${effectiveUserId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthorizedHeaders(token),
        },
        body: JSON.stringify(profileInfo),
      },
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.errors?.[0]?.detail ||
          errorData?.message ||
          'Failed to update profile details.',
      );
    }
    return response.json();
  };

  if (loading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.profileImageContainer}>
            <ProfileImagePicker
              profileImage={profileImage}
              setProfileImage={setProfileImage}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="at-outline" size={24} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={'#ccc'}
              value={effectiveName}
              disableFullscreenUI={true}
              autoCapitalize="none"
              showSoftInputOnFocus={false} // Prevents keyboard from showing
              editable={false} // Disables typing
              selectTextOnFocus={false} // Prevents text selection
            />
          </View>

          <Select
            disabled={!user?.student}
            inputLabel="Class / Form"
            selectItems={grades.map(grade => ({
              label: grade,
              value: grade,
            }))}
            selectedItem={{ value: selectedGrade }}
            labelField="label"
            valueField="value"
            placeholder="Select Class / Form"
            setSelectedItem={item => setSelectedGrade(item.value as string)}
            selectedItemStyle={styles.inputContainer}
            selectItemsContainerStyle={styles.inputContainer}
          />

          <View style={styles.inputContainer}>
            <MaterialIcons name="cake" size={24} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Age"
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              value={age}
              onChangeText={validateAgeInput}
            />
          </View>

          <Select
            inputLabel="Location"
            selectItems={locations.map(location => ({
              label: location,
              value: location,
            }))}
            selectedItem={{ value: selectedLocation }}
            labelField="label"
            valueField="value"
            placeholder="Select Location"
            setSelectedItem={item => setSelectedLocation(item.value as string)}
            selectItemsContainerStyle={styles.selectItemContainer}
            selectedItemStyle={styles.input}
          />

          {isSaving ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <C_Button
              title="Save and Continue"
              onPress={handleSaveAndContinue}
              buttonStyle={styles.saveButton}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <CModal open={showSuccessModal} setOpen={setShowSuccessModal}>
        <View style={styles.modalContent}>
          <Ionicons
            name="checkmark-circle"
            size={80}
            color={Colors.primary}
            style={styles.modalIcon}
          />
          <Text style={styles.modalTitle}>Success</Text>
          <Text style={styles.modalMessage}>
            Congratulations, you have completed your profile registration.
          </Text>
          <C_Button
            title="Done"
            onPress={() => {
              setShowSuccessModal(false);

              // ;
            }}
            buttonStyle={styles.doneButton}
          />
        </View>
      </CModal>
    </SafeAreaView>
  );
};

export default ProfileDetailsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: Colors.primary,
    borderWidth: 0.5,
    borderRadius: 12,
    padding: 5,
    marginBottom: 20,
    marginTop: 20,
  },
  selectItemContainer: {
    borderColor: Colors.primary,
    borderWidth: 0.5,
    borderRadius: 12,
    padding: 5,
    marginBottom: 5,
    marginTop: 5,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333',
  },
  inputIcon: {
    marginRight: 10,
    color: Colors.secondary,
  },
  saveButton: {
    marginTop: 30,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  modalContent: {
    justifyContent: 'center',
    padding: 20,
  },
  modalIcon: {
    marginBottom: 20,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 5,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    color: '#727374',
    marginBottom: 20,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    color: Colors.secondary,
    fontWeight: 'bold',
  },
});
