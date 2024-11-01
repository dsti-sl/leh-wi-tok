import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import C_Button from '@/components/common/Button';
import { Colors } from '@/constants/Colors';

//import { Picker } from '@react-native-picker/picker';
//import gradesLocationsData from '../../assets/data/grades_locations.json'; // Adjust the path as needed

const SAVE_PROFILE_API_ENDPOINT = 'https://example.com/api/save-profile'; // Replace with your actual API endpoint

const ProfileDetailsScreen = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [grades, setGrades] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [age, setAge] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  /*   useEffect(() => {
    // Load data from local JSON file
    loadLocalData();
  }, []);

  const loadLocalData = () => {
    try {
      setGrades(gradesLocationsData.grades);
      setLocations(gradesLocationsData.locations);
    } catch (error) {
      Alert.alert('Error', 'Failed to load grades and locations');
    } finally {
      setIsFetchingData(false);
    }
  }; */

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick an image. Please try again.');
    }
  };

  const validateAgeInput = (input: string) => {
    const numericValue = input.replace(/[^0-9]/g, '');
    if (
      numericValue !== '' &&
      (parseInt(numericValue) > 99 || parseInt(numericValue) === 0)
    ) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 1 and 99.');
      return;
    }
    setAge(numericValue);
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

      Alert.alert('Success', 'Profile details saved successfully!');
      router.push('/home'); // Replace with the actual next screen route
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'An error occurred while saving your profile.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*   if (isFetchingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  } */

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <Text style={styles.imagePlaceholderText}>
                Upload Profile Picture
              </Text>
            )}
          </TouchableOpacity>

          {/* Username Field */}
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />

          {/* Class / Grade Dropdown */}
          {/*           <View style={styles.pickerContainer}>
          <Picker
              selectedValue={selectedGrade}
              onValueChange={(itemValue) => setSelectedGrade(itemValue)}
            >
              <Picker.Item label="Select Class / Grade" value="" />
              {grades.map((grade, index) => (
                <Picker.Item key={index} label={grade} value={grade} />
              ))}
            </Picker>
          </View> */}

          {/* Age Field with Validation */}
          <TextInput
            style={styles.input}
            placeholder="Age"
            keyboardType="numeric"
            value={age}
            onChangeText={validateAgeInput}
          />

          {/* Location Dropdown */}
          <View style={styles.pickerContainer}>
            {/*   <Picker
              selectedValue={selectedLocation}
              onValueChange={(itemValue) => setSelectedLocation(itemValue)}
            >
              <Picker.Item label="Select Location" value="" />
              {locations.map((location, index) => (
                <Picker.Item key={index} label={location} value={location} />
              ))}
            </Picker> */}
          </View>

          {/* Save and Continue Button */}
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
    </SafeAreaView>
  );
};

export default ProfileDetailsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flexContainer: {
    flex: 1,
    paddingTop: 50,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholderText: {
    color: '#666',
    textAlign: 'center',
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
  pickerContainer: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});
