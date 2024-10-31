import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
} from 'react-native';

import Badge from '../../assets/images/badge.png';
import Bell from '../../assets/images/bell.png';
import HandShake from '../../assets/images/Handshake.png';

import { Colors } from '@/constants/Colors';
import { Record } from '@/lib/types';

interface BannerProps {
  user: Record;
}
export const HomeBanner = ({ user }: BannerProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.userWelcomeContainer}>
          <Text style={styles.userTxt}>Hello, {user.firstName as string}</Text>
          <Image
            source={HandShake as ImageSourcePropType}
            style={styles.imageStyles}
          />
        </View>
        <View style={styles.iconButtons}>
          <TouchableOpacity
            onPress={() => {
              // TODO: Go to notification screen
              console.log('Notification clicked');
            }}
          >
            <Image
              style={styles.imageStyles}
              source={Bell as ImageSourcePropType}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              // TODO: Badge implementation
              console.log('Badge clicked');
            }}
          >
            <Image
              style={styles.imageStyles}
              source={Badge as ImageSourcePropType}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.footerTxt}>Let us learn with leh we talk</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    height: 180,
    width: '100%',
    backgroundColor: Colors.primary,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userWelcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  userTxt: {
    fontSize: 30,
    fontFamily: 'poppins',
    fontWeight: '700',
    color: '#fff',
  },
  iconButtons: {
    flexDirection: 'row',
    gap: 5,
  },
  imageStyles: {
    width: 40,
    height: 40,
  },
  footerTxt: {
    fontFamily: 'poppins',
    color: '#fff',
    fontWeight: '400',
  },
});
