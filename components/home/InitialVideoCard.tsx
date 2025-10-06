import React, { useState } from 'react';

import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';

import CModal from '../common/CModal';
import VideoModalContent from '../common/VideoModalContainer';

interface InitialVideoCardProps {
  videoData: {
    id: string;
    title: string;
    videoUrl: string | number;
    thumbnail: string | number;
    duration: string;
    isFirstTimeUser: boolean;
    lastWatchedPosition?: number;
    headers?: Record<string, string>;
  };
  onPlayPress?: (
    _lessonId: string,
    _videoUrl: string,
    _position?: number,
  ) => void;
}

const InitialVideoCard: React.FC<InitialVideoCardProps> = ({
  videoData,
  onPlayPress,
}) => {
  const [showVideoModal, setShowVideoModal] = useState(false);

  const handlePlayPress = () => {
    if (videoData.isFirstTimeUser) {
      setShowVideoModal(true);
    } else {
      onPlayPress?.(
        videoData.id,
        videoData.videoUrl as string,
        videoData.lastWatchedPosition,
      );
    }
  };

  return (
    <>
      <View style={styles.videoContainer}>
        <Image
          source={
            typeof videoData.thumbnail === 'string'
              ? { uri: videoData.thumbnail }
              : videoData.thumbnail
          }
          style={{ width: 60, height: 60, borderRadius: 15 }}
        />
        <View style={styles.videoDetails}>
          <Text style={[styles.txtBold]}>
            {videoData.isFirstTimeUser
              ? 'Welcome to Le Wi Tok'
              : videoData.title}
          </Text>
          <Text style={[styles.txtDescription]}>
            {videoData.isFirstTimeUser
              ? 'Start your sign language learning journey with this introductory video.'
              : `Continue learning - ${videoData.duration}`}
          </Text>
          <TouchableOpacity style={styles.playBtn} onPress={handlePlayPress}>
            <Ionicons name="play-outline" size={25} color={Colors.primary} />
            <Text style={[styles.playTxt]}>Play Video</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CModal
        open={showVideoModal}
        setOpen={setShowVideoModal}
        animationType="slide"
        presentationStyle="fullScreen"
        transparent={false}
        modalContainerStyle={styles.videoModalContainer}
      >
        <VideoModalContent
          videoSource={videoData.videoUrl}
          title="Introduction to the Le wi tok application"
          onClose={() => setShowVideoModal(false)}
          headers={videoData.headers}
        />
      </CModal>
    </>
  );
};

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
    fontWeight: '600',
    fontSize: 20,
  },
  playTxt: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  },
  videoModalContainer: {
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 0,
    padding: 0,
  },
});

export default InitialVideoCard;
