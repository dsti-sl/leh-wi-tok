import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';

import { Feather, Ionicons } from '@expo/vector-icons';

import EditProfileModal from '@/components/account/EditProfileModal';
import { Colors } from '@/constants/Colors';
import { checkAndUpdateTranslations } from '@/data/dictionary';
import useAccount from '@/hooks/useAccount';
import useGuestMode from '@/hooks/useGuestMode';
import {
  fetchAuthenticatedUser,
  formatHandle,
  formatPhoneForDisplay,
  getAuthorizedHeaders,
  getUserTypeLabel,
  hydrateCurrentAccountProfile,
  uploadProfileImage,
} from '@/lib/accountProfile';
import { getBaseUrl, getToken } from '@/utils';

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
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [profileIdentity, setProfileIdentity] = useState<{
    handle: string;
    name: string;
    pictureId: string | null;
  } | null>(null);
  const [localProfileImageUri, setLocalProfileImageUri] = useState<
    string | null
  >(null);
  const EXPO_PUBLIC_BASE_URL = getBaseUrl();

  const displayName =
    profileIdentity?.name ??
    userInfo?.name ??
    (isGuest ? 'Guest' : 'Your account');
  const displayHandle = formatHandle(
    profileIdentity?.handle ?? userInfo?.handle ?? (isGuest ? 'guest' : null),
  );
  const initial = displayName?.[0]?.toUpperCase?.() ?? 'A';
  const userTypeLabel = getUserTypeLabel(userInfo);

  useEffect(() => {
    const loadToken = async () => {
      const token = await getToken();
      setAuthToken(token);
    };

    loadToken();
  }, []);

  useEffect(() => {
    setLocalProfileImageUri(null);
  }, [profileIdentity?.pictureId, userInfo?.pictureId]);

  const refreshAccount = React.useCallback(
    async (options?: { isPullToRefresh?: boolean }) => {
      const isPullToRefresh = options?.isPullToRefresh ?? false;

      if (isPullToRefresh) {
        setIsRefreshing(true);
      }

      try {
        const token = await getToken();
        setAuthToken(token);

        if (!token || isGuest) {
          setProfileIdentity(null);
          await fetchUserInfo();
          return;
        }

        const authenticatedUser = await fetchAuthenticatedUser(
          EXPO_PUBLIC_BASE_URL,
          token,
        );
        setProfileIdentity({
          handle: authenticatedUser.handle,
          name: authenticatedUser.name,
          pictureId: authenticatedUser.pictureId ?? null,
        });

        await fetchUserInfo();
      } catch (error) {
        console.warn('Unable to refresh account identity:', error);
      } finally {
        if (isPullToRefresh) {
          setIsRefreshing(false);
        }
      }
    },
    [EXPO_PUBLIC_BASE_URL, fetchUserInfo, isGuest],
  );

  useFocusEffect(
    React.useCallback(() => {
      refreshAccount();
    }, [refreshAccount]),
  );

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await checkAndUpdateTranslations({ force: true });
    } catch (error) {
      console.error('Error syncing dictionary:', error);
      Alert.alert('Sync failed', 'Unable to sync dictionary right now.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenEdit = () => {
    if (isGuest) {
      promptCreateAccount('Create an account to update your profile.');
      return;
    }

    setShowEditProfileModal(true);
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
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      if (!asset) return;

      setIsUpdatingPhoto(true);
      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthorizedHeaders(token),
      };
      const fileId = await uploadProfileImage(EXPO_PUBLIC_BASE_URL, token, {
        fileName:
          asset.fileName ??
          `${userInfo.handle || userInfo.name || 'user'}_profile.jpg`,
        mimeType: asset.mimeType ?? asset.type ?? 'image/jpeg',
        uri: asset.uri,
      });

      const updateResponse = await fetch(
        `${EXPO_PUBLIC_BASE_URL}/user?id=${userInfo.id}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ pictureId: fileId }),
        },
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(errorText || 'Failed to update profile image.');
      }

      await hydrateCurrentAccountProfile(EXPO_PUBLIC_BASE_URL, token);
      setAuthToken(token);
      setLocalProfileImageUri(asset.uri);
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

  const profileImageSource = localProfileImageUri
    ? { uri: localProfileImageUri }
    : (profileIdentity?.pictureId ?? userInfo?.pictureId)
      ? {
          uri: `${EXPO_PUBLIC_BASE_URL}/file/download?id=${profileIdentity?.pictureId ?? userInfo?.pictureId}`,
          headers: getAuthorizedHeaders(authToken),
        }
      : null;

  const settingsItems = [
    {
      key: 'sync-dictionary',
      label: isSyncing ? 'Syncing dictionary...' : 'Sync dictionary',
      icon: 'refresh-cw',
      onPress: handleSync,
      disabled: isSyncing,
      tint: '#0f172a',
    },
    {
      key: 'logout',
      label: isGuest
        ? 'Create account'
        : isLoggingOut
          ? 'Logging out...'
          : 'Log out',
      icon: 'log-out',
      onPress: isGuest
        ? () =>
            promptCreateAccount(
              'Create an account to save your progress and unlock all features.',
            )
        : confirmLogout,
      disabled: isLoggingOut,
      tint: '#0f172a',
    },
    {
      key: 'delete-account',
      label: isGuest
        ? 'Delete account unavailable in guest mode'
        : isDeletingAccount
          ? 'Deleting account...'
          : 'Delete your account',
      icon: 'trash-2',
      onPress: confirmAccountDeletion,
      disabled: isGuest || isDeletingAccount,
      tint: '#dc2626',
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => refreshAccount({ isPullToRefresh: true })}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      <View style={styles.banner}>
        <View style={styles.profileRow}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {profileImageSource ? (
                <Image
                  source={profileImageSource}
                  style={styles.avatarImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
              ) : (
                <Text style={styles.avatarText}>{initial}</Text>
              )}
            </View>
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
                  size={18}
                  color={Colors.primary}
                />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.profileCopy}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{displayName}</Text>
            </View>
            <Text style={styles.profileMeta}>{displayHandle}</Text>
            <Text style={styles.profileMeta}>{userTypeLabel}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryAction,
            isGuest ? styles.primaryActionDisabled : null,
          ]}
          onPress={handleOpenEdit}
          disabled={isGuest}
        >
          <Feather name="edit-2" size={16} color={Colors.primary} />
          <Text style={styles.primaryActionText}>Edit profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <View style={styles.card}>
          <DetailRow icon="at-sign" label="Handle" value={displayHandle} />
          <DetailRow icon="users" label="User type" value={userTypeLabel} />
          <DetailRow
            icon="phone"
            label="Phone number"
            value={
              isGuest
                ? 'Guest mode'
                : formatPhoneForDisplay(userInfo?.phoneNumber)
            }
          />
          <DetailRow
            icon="map-pin"
            label="Address"
            value={
              isGuest ? 'Guest mode' : (userInfo?.address ?? 'Not added yet')
            }
          />

          <DetailRow
            icon="calendar"
            label="Joined"
            value={
              userInfo?.createdAt
                ? new Date(userInfo.createdAt).toDateString()
                : isGuest
                  ? 'Guest mode'
                  : 'Not available'
            }
            isLast
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.card}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.settingsRow,
                index === settingsItems.length - 1 && styles.lastSettingsRow,
                item.disabled && styles.settingsRowDisabled,
              ]}
              onPress={item.onPress}
              disabled={item.disabled}
            >
              <View style={styles.settingsRowLeft}>
                <Feather
                  name={item.icon as never}
                  size={18}
                  color={item.tint}
                />
                <Text style={[styles.settingsText, { color: item.tint }]}>
                  {item.label}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>
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

type DetailRowProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  isLast?: boolean;
  label: string;
  value: string;
};

const DetailRow = ({ icon, label, value, isLast = false }: DetailRowProps) => (
  <View style={[styles.detailRow, isLast && styles.lastDetailRow]}>
    <View style={styles.detailIcon}>
      <Feather name={icon} size={18} color={Colors.primary} />
    </View>
    <View style={styles.detailCopy}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

export default Account;

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: '#0b3d49',
    borderColor: '#ffffff',
    borderRadius: 44,
    borderWidth: 3,
    height: 88,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 88,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: 30,
    fontWeight: '700',
  },
  avatarWrap: {
    position: 'relative',
  },
  banner: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  detailCopy: {
    flex: 1,
    gap: 2,
  },
  detailIcon: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  detailRow: {
    alignItems: 'flex-start',
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  detailValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  iconOverlay: {
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 2,
    bottom: -2,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 28,
  },
  lastDetailRow: {
    borderBottomWidth: 0,
  },
  lastSettingsRow: {
    borderBottomWidth: 0,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryAction: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryActionDisabled: {
    opacity: 0.5,
  },
  primaryActionText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  profileCopy: {
    flex: 1,
    gap: 4,
  },
  profileMeta: {
    color: '#dbeafe',
    fontSize: 14,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  scrollContent: {
    backgroundColor: '#f8fafc',
    flexGrow: 1,
    paddingBottom: 32,
  },
  section: {
    gap: 12,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#0f172a',
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '700',
  },
  settingsRow: {
    alignItems: 'center',
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingsRowDisabled: {
    opacity: 0.5,
  },
  settingsRowLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  settingsText: {
    fontSize: 15,
    fontWeight: '600',
  },
  verifiedBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(251, 139, 36, 0.18)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
