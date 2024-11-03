import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

import ProfileImagePicker from '@/components/account/ImageUpload';
import C_Button from '@/components/common/Button';
import CModal from '@/components/common/CModal';
import Select from '@/components/common/Select';
import { Colors } from '@/constants/Colors';
import useLocationGrades from '@/hooks/useLocationGrades';

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
              value={username}
              onChangeText={(text) => setUsername(handleUsernameChange(text))}
              autoCapitalize="none"
            />
          </View>

          <Select
            inputLabel="Class / Form"
            selectItems={grades.map((grade) => ({
              label: grade,
              value: grade,
            }))}
            selectedItem={{ value: selectedGrade }}
            labelField="label"
            valueField="value"
            placeholder="Select Class / Form"
            setSelectedItem={(item) => setSelectedGrade(item.value as string)}
            selectedItemStyle={styles.inputContainer}
            selectItemsContainerStyle={styles.inputContainer}
          />

          <View style={styles.inputContainer}>
            <MaterialIcons name="cake" size={24} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Age"
              keyboardType="numeric"
              value={age}
              onChangeText={validateAgeInput}
            />
          </View>

          <Select
            inputLabel="Location"
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
            selectItemsContainerStyle={styles.selectItemContainer}
            selectedItemStyle={styles.input}
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
