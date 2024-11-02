import React, { useState } from 'react';
import {
  View,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import ProfileImagePicker from '@/components/account/ImageUpload';
import Select from '@/components/common/Select';
import C_Button from '@/components/common/Button';
import CModal from '@/components/common/CModal';
import useLocationGrades from '@/hooks/useLocationGrades';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const SAVE_PROFILE_API_ENDPOINT = 'https://example.com/api/save-profile';

const ProfileDetailsScreen = () => {
  const { grades, locations, isLoading, error } = useLocationGrades();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [age, setAge] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();

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

  const handleUsernameChange = (text: string) => {
    let formattedText = text.replace(/[^a-z0-9_]/g, '');
    formattedText = formattedText.toLowerCase();
    return formattedText;
  };

  const handleSaveAndContinue = async () => {
    if (!username || !selectedGrade || !age || !selectedLocation) {
      Alert.alert('Error', 'Please fill out all fields before continuing.');
      return;
    }

    setIsSaving(true);
    const profileDetails = {
      username,
      profileImage,
      grade: selectedGrade,
      age,
      location: selectedLocation,
    };

    try {
      const response = await fetch(SAVE_PROFILE_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileDetails),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save profile details');
      }

      // Show the success modal after saving the profile
      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'An error occurred while saving your profile.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text>{error}</Text>
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
          <ProfileImagePicker
            profileImage={profileImage}
            setProfileImage={setProfileImage}
          />

          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={(text) => setUsername(handleUsernameChange(text))}
            autoCapitalize="none"
          />

          <Select
            inputLabel="Select Class / Grade"
            selectItems={grades.map((grade) => ({
              label: grade,
              value: grade,
            }))}
            selectedItem={{ value: selectedGrade }}
            labelField="label"
            valueField="value"
            placeholder="Select Class / Grade"
            setSelectedItem={(item) => setSelectedGrade(item.value as string)}
          />

          <TextInput
            style={styles.input}
            placeholder="Age"
            keyboardType="numeric"
            value={age}
            onChangeText={validateAgeInput}
          />

          <Select
            inputLabel="Select Location"
            selectItems={locations.map((location) => ({
              label: location,
              value: location,
            }))}
            selectedItem={{ value: selectedLocation }}
            labelField="label"
            valueField="value"
            placeholder="Select Location"
            setSelectedItem={(item) =>
              setSelectedLocation(item.value as string)
            }
          />

          {isSaving ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <C_Button
              title="Save and Continue"
              onPress={() => setShowSuccessModal(true)}
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
              router.push('/home');
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
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 4,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  modalContent: {
    justifyContent: 'center',
    padding: 20,
  },
  modalIcon: {
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginVertical: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 12,
    textAlign: 'center',
    color: '#727374',
    marginBottom: 20,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    color: Colors.secondary,
    fontWeight: 'bold',
    borderRadius: 4,
  },
});
