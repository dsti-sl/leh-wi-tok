import React, { useState } from 'react';

import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import C_Button from '@/components/common/Button';
import { Colors } from '@/constants/Colors';
import { getBaseUrl, getToken } from '@/utils';
import { getHorizontalPadding } from '@/utils/layout';

const roles = [
  { id: 'student', label: 'Student' },
  { id: 'teacher', label: 'Teacher' },
  { id: 'parent', label: 'Parent' },
  { id: 'volunteer', label: 'Volunteer' },
  { id: 'generalUser', label: 'General User' },
  // { id: 'generalUser', label: 'General User' },
];

const EXPO_PUBLIC_BASE_URL = getBaseUrl();

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { userId, name } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding(width);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
  };

  const updateRole = async (role: string) => {
    const rolesUpdate = roles.reduce(
      (acc, curr) => {
        acc[curr.id] = curr.id === role;
        return acc;
      },
      {} as Record<string, boolean>,
    );
    const token = await getToken();
    const resolvedUserId = typeof userId === 'string' ? userId : '';

    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BASE_URL}/user?id=${resolvedUserId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Token ${token}` } : {}),
          },
          body: JSON.stringify(rolesUpdate),
        },
      );

      await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Role updated successfully!');
        router.push(`/preferences/profilescreen?userId=${userId}&name=${name}`);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'An error occurred while updating your role.',
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
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        <View style={styles.content}>
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
            {roles.map(role => (
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default RoleSelection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
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
    paddingRight: 100,
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
    marginBottom: 32,
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
    width: '100%',
  },
});
