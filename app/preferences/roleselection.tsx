import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

import C_Button from '@/components/common/Button';
import { Colors } from '@/constants/Colors';

const roles = [
  { id: 'student', label: 'Student' },
  { id: 'teacher', label: 'Teacher' },
  { id: 'parent', label: 'Parent' },
  { id: 'generalUser', label: 'General User' },
];
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
  };

  const updateRole = async (role: string) => {
    const roleUpdate =
      role === 'student' ? { student: true } : { teacher: true };
    try {
      const response = await fetch(`${BASE_URL}/user?id=${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleUpdate),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Role updated successfully!');
        router.push(`/preferences/profilescreen?userId=${userId}`);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'An error occurred while updating your role.',
      );
    }
  };

  const handleNext = async () => {
    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role before proceeding.');
      return;
    }
    setIsLoading(true);
    try {
      await updateRole(selectedRole);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Get started</Text>
      <Text style={styles.subText}>
        We want you to get the best out of Le Wi Tok.
      </Text>
      <View style={styles.bannerContainer}>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerHeader}>Tell us more about you</Text>
          <Text style={styles.bannerSubText}>
            We would like to know about you. So let us start by selecting a
            profile.
          </Text>
        </View>
        <Image
          source={require('../../assets/images/prefren_img.png')}
          style={styles.bannerImage}
        />
      </View>
      <View style={styles.rolesContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={styles.roleOption}
            onPress={() => handleRoleSelect(role.id)}
          >
            <View style={styles.radioCircle}>
              {selectedRole === role.id && (
                <View style={styles.selectedCircle} />
              )}
            </View>
            <Text style={styles.roleText}>{role.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <C_Button
        title="Next"
        onPress={handleNext}
        loadingIndicator={isLoading}
        buttonStyle={styles.nextButton}
      />
    </View>
  );
};

export default RoleSelection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'left',
    marginBottom: 5,
  },
  subText: {
    fontSize: 12,
    color: '#727374',
    textAlign: 'left',
    marginBottom: 20,
  },
  bannerContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingTop: 30,
    paddingBottom: 30,
    paddingLeft: 15,
    paddingRight: 15,
    marginBottom: 20,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: 90,
  },
  bannerHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  bannerSubText: {
    fontSize: 12,
    color: '#fff',
  },

  bannerImage: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
    transform: [{ rotate: '15deg' }],
    position: 'absolute',
    right: 5,
    top: 30,
  },
  rolesContainer: {
    marginTop: 10,
    marginBottom: 90,
    paddingLeft: 10,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 5,
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedCircle: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#004D40',
  },
  roleText: {
    fontSize: 14,
    color: '#333',
  },
  nextButton: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    color: Colors.secondary,
    fontWeight: 'bold',
    borderRadius: 4,
    marginBottom: 20,
  },
});
