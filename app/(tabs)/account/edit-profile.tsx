import React, { useEffect, useState } from 'react';

import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNavigation, useRouter } from 'expo-router';

import { Feather } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '@/constants/Colors';

interface UserInfo {
  createdAt: string;
  id: string;
  handle: string;
  name: string;
  superuser: boolean;
  student: boolean;
  teacher: boolean;
  superviewer: boolean;
  pictureId: string | null;
}

const EditProfile = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');

  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const parsed: UserInfo = JSON.parse(stored);
        setUserInfo(parsed);
        setName(parsed.name);
        setHandle(parsed.handle);
      }
    };
    loadUser();
  }, []);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      e.preventDefault(); // stop the pop
      router.push('/account');
    });

    return unsubscribe;
  }, [navigation]);

  const saveProfile = async () => {
    if (!userInfo) return;

    const updatedUser = { ...userInfo, name, handle };
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    Alert.alert('Profile updated!');
    router.back(); // go back to profile page
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header with Avatar */}
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.push('/account')}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Handle</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your handle"
          value={handle}
          onChangeText={setHandle}
        />

        <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
          <Feather name="save" size={18} color="#fff" />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 50,
    paddingBottom: 70,
    width: '100%',
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 16,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 30,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
