import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

import { Colors } from '@/constants/Colors';

const Account = () => {
  const [userInfo, setUserInfo] = useState<unknown>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchUserInfo = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        setUserInfo(JSON.parse(user));
        console.log(user);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    // await AsyncStorage.removeItem('completedLesson');
    Alert.alert('Logged out');
    router.replace('/');
  };

  return (
    <>
      <View style={styles.container}></View>
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>
            Hey, {userInfo?.name?.split(' ')[0]}!
          </Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInfo?.name?.charAt(0)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your account</Text>
        <View style={styles.itemRow}>
          <Feather name="user" size={24} />
          <Text style={styles.itemText}>Personal Details</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How are we doing?</Text>
        <TouchableOpacity style={styles.feedbackButton}>
          <Text style={styles.feedbackText}>Give us feedback</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.itemRow}>
          <Feather name="bell" size={24} />
          <Text style={styles.itemText}>Notifications</Text>
        </View>
        <TouchableOpacity style={styles.itemRow} onPress={handleLogout}>
          <Feather name="log-out" size={24} />
          <Text style={styles.itemText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <TouchableOpacity style={styles.itemRow}>
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
  itemText: {
    fontSize: 14,
    marginLeft: 10,
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
