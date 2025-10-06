import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ImageSourcePropType,
} from 'react-native';

import HandShake from '../../assets/images/Handshake.png';

import { Colors } from '@/constants/Colors';
import { Record } from '@/lib/types';
import { getFirstWord } from '@/utils';

interface BannerProps {
  user: Record;
}
export const HomeBanner = ({ user }: BannerProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.userWelcomeContainer}>
          <Text
            style={styles.userTxt}
          >{`Hello ${getFirstWord(String(user?.name || ''))}`}</Text>
          <Image
            source={HandShake as ImageSourcePropType}
            style={styles.imageStyles}
          />
        </View>
        {/* <View style={styles.iconButtons}>
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
        </View>*/}
      </View>
      <Text style={styles.footerTxt}>Let us learn with Le Wi Tok</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 50,
    paddingBottom: 70,
    width: '100%',
    backgroundColor: Colors.primary,
  },
  contentContainer: {
    paddingTop: 20,
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
    color: '#fff',
    fontWeight: '400',
  },
});
