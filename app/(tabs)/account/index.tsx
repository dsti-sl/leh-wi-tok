import React, { useEffect, useState } from 'react';

import {
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import { Feather, Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import EditProfileModal from '@/components/account/EditProfileModal';
import { Colors } from '@/constants/Colors';
import { fetchAndInsertTranslations } from '@/data/dictionary';
import useAccount from '@/hooks/useAccount';
import useGuestMode from '@/hooks/useGuestMode';
import { getBaseUrl } from '@/utils';

const Account = () => {
  const {
    userInfo,
    isLoggingOut,
    isDeletingAccount,
    confirmLogout,
    confirmAccountDeletion,
    fetchUserInfo,
  } = useAccount();
  const { isGuest, promptCreateAccount } = useGuestMode();
  const [isSyncing, setIsSyncing] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const EXPO_PUBLIC_BASE_URL: string = getBaseUrl();
  const displayName = userInfo?.name ?? (isGuest ? 'Guest' : '');
  const initial = displayName?.[0]?.toUpperCase?.() ?? '';

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        if (!userInfo?.pictureId || isGuest) {
          setProfileImageUrl(null);
          return;
        }
        const imageUrl = `${EXPO_PUBLIC_BASE_URL}/file?id=eq.${userInfo?.pictureId}&select=path
`;
        const response = await fetch(imageUrl);
        if (response.ok) {
          const data = await response.json();
          setProfileImageUrl(data?.data[0]?.path);
          return;
        }
        setProfileImageUrl(null);
      } catch (error) {
        setProfileImageUrl(null);
      }
    };

    fetchProfileImage();
  }, [userInfo?.pictureId, isGuest]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetchAndInsertTranslations();
      console.log('Dictionary synced successfully');
    } catch (error) {
      console.error('Error syncing dictionary:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateStoredUser = async (pictureId: string) => {
    const stored = await AsyncStorage.getItem('user');
    if (!stored) return;
    const parsed = JSON.parse(stored);
    const updated = { ...parsed, pictureId, picture: pictureId };
    await AsyncStorage.setItem('user', JSON.stringify(updated));
  };

  const handlePickProfileImage = async () => {
    if (isGuest) {
      promptCreateAccount('Create an account to update your profile.');
      return;
    }
    if (!userInfo?.id || isUpdatingPhoto) return;

    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please allow photo library access to update your profile image.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      if (!asset) {
        return;
      }
      setIsUpdatingPhoto(true);

      const profileImageData = {
        contentType: asset.type ?? 'image/jpeg',
        userId: userInfo.id,
        path: asset.uri,
        name:
          asset.fileName ??
          `${userInfo.handle || userInfo.name || 'user'}_profile.jpg`,
        size: asset.fileSize ?? 1024000,
      };

      const uploadResponse = await fetch(`${EXPO_PUBLIC_BASE_URL}/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileImageData),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Failed to upload profile image.');
      }

      const uploadData = await uploadResponse.json();
      const fileId = uploadData?.data?.[0]?.id;
      if (!fileId) {
        throw new Error('Profile image upload failed.');
      }

      const updateResponse = await fetch(
        `${EXPO_PUBLIC_BASE_URL}/user?id=${userInfo.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ picture: fileId }),
        },
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(errorText || 'Failed to update profile image.');
      }

      setProfileImageUrl(asset.uri);
      await updateStoredUser(fileId);
      await fetchUserInfo();
      Alert.alert('Profile photo updated', 'Your new photo is saved.');
    } catch (error) {
      console.error('Profile image update failed:', error);
      Alert.alert(
        'Update failed',
        error instanceof Error
          ? error.message
          : 'Could not update your profile photo.',
      );
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  return (
    <ScrollView
      scrollEnabled={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.banner}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
            <TouchableOpacity
              accessibilityLabel="Change profile photo"
              style={styles.iconOverlay}
              onPress={handlePickProfileImage}
              disabled={isUpdatingPhoto || isGuest}
            >
              {isUpdatingPhoto ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons
                  name="camera-outline"
                  size={20}
                  color={Colors.primary}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              disabled={isSyncing}
              accessibilityLabel="Sync dictionary"
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              onPress={handleSync}
              style={[
                styles.iconButton,
                { backgroundColor: isSyncing ? '#ccc' : Colors.primary },
              ]}
            >
              <Ionicons
                name={isSyncing ? 'refresh' : 'sync'}
                size={16}
                color={Colors.secondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Edit profile"
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              onPress={() =>
                isGuest
                  ? promptCreateAccount(
                      'Create an account to edit your profile.',
                    )
                  : setShowEditProfileModal(true)
              }
              style={[
                styles.iconButton,
                {
                  backgroundColor: Colors.primary,
                  opacity: isGuest ? 0.5 : 1,
                },
              ]}
            >
              <Feather name="edit" size={16} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Feather name="user" size={20} color={Colors.primary} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{displayName}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Feather name="at-sign" size={20} color={Colors.primary} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Handle</Text>
            <Text style={styles.infoValue}>
              {userInfo?.handle ?? (isGuest ? 'guest' : '')}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Feather name="calendar" size={20} color={Colors.primary} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Joined</Text>
            <Text style={styles.infoValue}>
              {userInfo?.createdAt
                ? new Date(userInfo.createdAt).toDateString()
                : isGuest
                  ? 'Guest mode'
                  : ''}
            </Text>
          </View>
        </View>

        {/* <View style={styles.infoRow}>
          <Feather name="book" size={20} color={Colors.primary} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>
              {userInfo?.student
                ? 'Student'
                : userInfo?.teacher
                  ? 'Teacher'
                  : 'Viewer'}
            </Text>
          </View>
        </View> */}
      </View>

      <View style={styles.divider} />

      <View style={{ marginHorizontal: 20, marginTop: 20 }}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity
          style={[styles.itemRow, isLoggingOut && styles.itemRowDisabled]}
          onPress={
            isGuest
              ? () =>
                  promptCreateAccount(
                    'Create an account to save your progress and unlock all features.',
                  )
              : confirmLogout
          }
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
            {isGuest
              ? 'Create Account'
              : isLoggingOut
                ? 'Logging out...'
                : 'Log out'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={isGuest || isDeletingAccount}
          style={[
            styles.itemRow,
            (isGuest || isDeletingAccount) && styles.itemRowDisabled,
          ]}
          onPress={confirmAccountDeletion}
        >
          <Feather name="trash-2" size={24} color="#dc2626" />
          <Text
            style={[
              styles.itemText,
              { color: isGuest || isDeletingAccount ? '#f87171' : '#dc2626' },
            ]}
          >
            {isGuest
              ? 'Delete account unavailable in guest mode'
              : isDeletingAccount
                ? 'Deleting account...'
                : 'Delete your account'}
          </Text>
        </TouchableOpacity>
      </View>

      <EditProfileModal
        open={showEditProfileModal && !isGuest}
        setOpen={setShowEditProfileModal}
        userInfo={userInfo}
        onSaved={fetchUserInfo}
      />
    </ScrollView>
  );
};

export default Account;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
  },
  banner: {
    paddingHorizontal: 20,
    paddingVertical: 50,
    paddingBottom: 70,
    width: '100%',
    backgroundColor: Colors.primary,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 60,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    width: 80,
    height: 80,
    marginBottom: -140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  iconOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -6,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  iconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
});
