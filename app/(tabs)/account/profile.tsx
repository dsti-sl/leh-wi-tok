import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useNavigation } from 'expo-router';
import ProfileImagePicker from '@/components/account/ImageUpload';
import { ScrollView } from 'react-native-gesture-handler';

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

const Account = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
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

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      e.preventDefault(); // stop the pop
      router.push('/account');
    });

    return unsubscribe;
  }, [navigation]);
  const [image, setImage] = useState<string | null>(null);

  return (
    <>


      {/* Header with Avatar */}
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.push('/account')}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <ProfileImagePicker setProfileImage={
          (img) => {
            setImage(img);
            // UPLOAD IMAGE
          }

        } profileImage={
          userInfo?.pictureId ? userInfo.pictureId : image
        } />
        {/* <Text style={styles.greeting}>Profile Details</Text> */}
      </View>


      {/* Profile Information Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Information</Text>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Feather name="user" size={20} color={Colors.primary} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{userInfo?.name}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Feather name="at-sign" size={20} color={Colors.primary} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Handle</Text>
            <Text style={styles.infoValue}>{userInfo?.handle}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Feather name="calendar" size={20} color={Colors.primary} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Joined</Text>
            <Text style={styles.infoValue}>
              {userInfo ? new Date(userInfo.createdAt).toDateString() : ''}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Feather name="book" size={20} color={Colors.primary} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>
              {userInfo?.student ? 'Student' : userInfo?.teacher ? 'Teacher' : 'Viewer'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Edit Button */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push('/account/edit-profile')}
      >
        <Feather name="edit-2" size={18} color="#fff" />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </>
  );
};

export default Account;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 50,
    // paddingBottom: 70,
    width: '100%',
    backgroundColor: Colors.primary,
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
    fontFamily: 'monospace',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  avatarLargeText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  itemText: {
    fontSize: 14,
    marginLeft: 10,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  infoTextWrap: {
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    height: 2,
    backgroundColor: '#e2e8f0',
    marginTop: 20,
    width: '100%',
  },
});