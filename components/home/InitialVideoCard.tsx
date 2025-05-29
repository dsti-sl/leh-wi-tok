import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';

import { Colors } from '@/constants/Colors';
import { Record } from '@/lib/types';

interface InitialVideoCardProps {
  defaultTutorial: Record;
}
const InitialVideoCard: React.FC<InitialVideoCardProps> = ({
  defaultTutorial,
}) => {
  return (
    <View style={styles.videoContainer}>
      <Image
        source={{ uri: defaultTutorial.thumbnail as string }}
        style={{ width: 60, height: 60, borderRadius: 15 }}
      />
      <View style={styles.videoDetails}>
        <Text style={[styles.txtBold]}>{defaultTutorial.title as string}</Text>
        <Text style={[styles.txtDescription]}>
          {defaultTutorial.description as string}
        </Text>
        <TouchableOpacity
          style={styles.playBtn}
          onPress={() => {
            // TODO: Play in modal or a dedicated screen
            console.log('Playing preview video');
          }}
        >
          {/* <Ionicons name="play-outline" size={25} color={Colors.primary} /> */}
          {/* <Text style={[styles.playTxt]}>Play Video</Text> */}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InitialVideoCard;

const styles = StyleSheet.create({
  videoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    top: -30,
    width: '90%',
    borderColor: Colors.secondary,
    borderWidth: 1,
    borderRadius: 10,

    flexDirection: 'row',
    gap: 10,
  },
  videoDetails: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 10,
  },
  txtDescription: {
    opacity: 0.5,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    color: Colors.primary,
  },
  txtBold: {
    fontWeight: '400',
    fontSize: 20,
  },
  playTxt: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  },
});
