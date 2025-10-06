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
import { getBaseUrl } from '@/utils';

const ProfileDetailsScreen = () => {
  const { grades, locations, isLoading, error } = useLocationGrades();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [age, setAge] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [locationId, setLocationID] = useState('');
  const [gradeID, setGradeID] = useState('');
  const router = useRouter();
  const { userId, name } = useLocalSearchParams();

  const EXPO_PUBLIC_BASE_URL = getBaseUrl();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading2(true);
        const response = await fetch(
          `${EXPO_PUBLIC_BASE_URL}/location?name=eq.${selectedLocation}`,
        );
        const data = await response.json();
        if (response.ok) {
          setLocationID(data.data[0].id);
        }
        setIsLoading2(false);
      } catch (error) {
        setIsLoading2(false);
      }
    };

    fetchUserDetails();
  }, [selectedLocation]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading2(true);
        const response = await fetch(
          `${EXPO_PUBLIC_BASE_URL}/tag?title=eq.${selectedGrade}`,
        );
        const data = await response.json();
        if (response.ok) {
          setGradeID(data.data[0].id);
        }
        setIsLoading2(false);
      } catch (error) {
        setIsLoading2(false);
      }
    };

    fetchUserDetails();
  }, [selectedGrade]);

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
    if (!name || !selectedGrade || !age || !selectedLocation) {
      return Alert.alert(
        'Error',
        'Please fill out all fields before continuing.',
      );
    }

    setIsSaving(true);

    try {
      const profileImageData = {
        contentType: 'image/jpeg',
        userId,
        path: profileImage,
        name: `${name}_profile-pic.jpg`,
        size: 1024000,
      };

      const uploadResponse = await uploadProfileImage(profileImageData);
      if (!uploadResponse?.data?.[0]?.id) {
        throw new Error('Profile image upload failed.');
      }

      const profileDetails = {
        handle: name,
        pictureId: uploadResponse.data[0].id,
        tags: [gradeID],
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

  // API Helper Functions
  const uploadProfileImage = async (profileImageData: unknown) => {
    const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileImageData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload profile image.');
    }
    return response.json();
  };

  const updateUserProfile = async (profileInfo: unknown) => {
    const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/user?id=${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileInfo),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update profile details.');
    }
    return response.json();
  };

  if (isLoading || isLoading2) {
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
        keyboardVerticalOffset={80}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
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
              value={typeof name === 'string' ? name : ''}
              disableFullscreenUI={true}
              autoCapitalize="none"
              showSoftInputOnFocus={false} // Prevents keyboard from showing
              editable={false} // Disables typing
              selectTextOnFocus={false} // Prevents text selection
            />
          </View>

          <Select
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
              placeholderTextColor="#999"
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
    paddingBottom: 30,
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
