import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { TouchableOpacity, Image, StyleSheet, View, Alert } from 'react-native';

import { Colors } from '@/constants/Colors';

interface ProfileImagePickerProps {
  profileImage: string | null;
  setProfileImage: (uri: string | null) => void;
}

const ProfileImagePicker: React.FC<ProfileImagePickerProps> = ({
  profileImage,
  setProfileImage,
}) => {
  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permission is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick an image. Please try again.');
    }
  };

  return (
    <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
      {profileImage ? (
        <Image source={{ uri: profileImage }} style={styles.profileImage} />
      ) : (
        <View style={styles.placeholderContainer}>
          <Ionicons name="person-outline" size={50} color="#AEAEAE" />
        </View>
      )}
      <View style={styles.iconOverlay}>
        <Ionicons name="camera-outline" size={24} color="#AEAEAE" />
      </View>
    </TouchableOpacity>
  );
};

export default ProfileImagePicker;

const styles = StyleSheet.create({
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 60,
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOverlay: {
    position: 'absolute',
    bottom: 1,
    right: 2,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 4,
  },
});
