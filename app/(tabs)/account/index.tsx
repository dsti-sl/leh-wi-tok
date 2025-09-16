import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/Colors';

const Account = () => {
  const [userInfo, setUserInfo] = useState<unknown>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchUserInfo = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        setUserInfo(JSON.parse(user));
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: performLogout,
        },
      ],
      { cancelable: true },
    );
  };

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Clear user session data
      await AsyncStorage.multiRemove(['token', 'user', 'completedLesson']);

      // Navigate to login/onboarding screen
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <View style={styles.container}></View>
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>
            Hey, {userInfo ? userInfo.name.split(' ')[0] : ''}!
          </Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userInfo ? userInfo.name.charAt(0) : ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your account</Text>
        <TouchableOpacity
          style={styles.itemRow}
          onPress={() => {
            router.replace('/account/profile');
          }}
        >
          <Feather name="user" size={24} />
          <Text style={styles.itemText}>Personal Details</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity
          style={[styles.itemRow, isLoggingOut && styles.itemRowDisabled]}
          onPress={confirmLogout}
          disabled={isLoggingOut}
        >
          <Feather
            name="log-out"
            size={24}
            color={isLoggingOut ? '#999' : '#000'}
          />
          <Text
            style={[styles.itemText, isLoggingOut && styles.itemTextDisabled]}
          >
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.itemRow}
          onPress={confirmAccountDeletion}
        >
          <Feather name="trash-2" size={24} color="#dc2626" />
          <Text style={[styles.itemText, { color: '#dc2626' }]}>
            Delete your account
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default Account;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 50,
    paddingBottom: 70,
    width: '100%',
    backgroundColor: Colors.primary,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  avatar: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    padding: 16,
    width: 80,
    height: 80,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  itemRowDisabled: {
    opacity: 0.5,
  },
  itemText: {
    fontSize: 14,
    marginLeft: 10,
    color: '#000',
  },
  itemTextDisabled: {
    color: '#999',
  },
  divider: {
    height: 2,
    backgroundColor: '#e2e8f0',
    marginTop: 20,
    width: '100%',
  },
  feedbackButton: {
    backgroundColor: '#cbd5e1',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  feedbackText: {
    fontSize: 14,
  },
});
