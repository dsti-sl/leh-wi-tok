import React, { useState } from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import { Feather, Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import useAccount from '@/hooks/useAccount';
import { fetchAndInsertTranslations } from '@/data/dictionary';

const Account = () => {
  const { userInfo, isLoggingOut, confirmLogout, confirmAccountDeletion } =
    useAccount();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  const initial = userInfo?.name?.[0]?.toUpperCase?.() ?? '';

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

  return (
    <ScrollView
      scrollEnabled={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.banner}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
            <TouchableOpacity
              accessibilityLabel="Change profile photo"
              style={styles.iconOverlay}
            >
              <Ionicons
                name="camera-outline"
                size={20}
                color={Colors.primary}
              />
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
              disabled={true}
              accessibilityLabel="Edit profile"
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              onPress={() => router.push('/account/edit-profile')}
              style={{ ...styles.iconButton, backgroundColor: Colors.primary }}
            >
              <Feather name="edit" size={16} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Feather name="user" size={20} color={Colors.primary} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{userInfo?.name ?? ''}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Feather name="at-sign" size={20} color={Colors.primary} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Handle</Text>
            <Text style={styles.infoValue}>{userInfo?.handle ?? ''}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Feather name="calendar" size={20} color={Colors.primary} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Joined</Text>
            <Text style={styles.infoValue}>
              {userInfo?.createdAt
                ? new Date(userInfo.createdAt).toDateString()
                : ''}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
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
        </View>
      </View>

      <View style={styles.divider} />

      <View style={{ marginHorizontal: 20, marginTop: 20 }}>
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
        <TouchableOpacity
          disabled={true}
          style={styles.itemRow}
          onPress={confirmAccountDeletion}
        >
          <Feather name="trash-2" size={24} color="#dc2626" />
          <Text style={[styles.itemText, { color: '#dc2626' }]}>
            Delete your account
          </Text>
        </TouchableOpacity>
      </View>
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
