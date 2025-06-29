import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

import { getBaseUrl } from '@/utils';

interface GestureInfo {
  contentType: string;
  [key: string]: any;
}

interface MediaPlayerProps {
  gestureId: string;
  gestureInfo: GestureInfo;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  gestureId,
  gestureInfo,
}) => {
  const BASE_URL = getBaseUrl();

  const fileUrl = `${BASE_URL}/file/download?id=${gestureId}`;

  console.log('MediaPlayer fileUrl:', gestureInfo);
  // Initialize the VideoPlayer using the useVideoPlayer hook
  const player = useVideoPlayer(
    {
      uri: gestureInfo.path,
    },
    (playerInstance) => {
      playerInstance.loop = true;
      playerInstance.play();
    },
  );

  // Conditional rendering based on content type
  let content = null;
  if (gestureInfo?.contentType === 'video/mp4') {
    content = (
      <View style={styles.videoContainer}>
        <VideoView
          player={player}
          style={styles.video}
          allowsFullscreen
          allowsPictureInPicture
        />
      </View>
    );
  } else if (gestureInfo?.contentType === 'image/gif') {
    content = (
      <Image
        source={{ uri: fileUrl }}
        isTVSelectable={!!fileUrl}
        style={styles.media}
        contentFit="contain"
        transition={1000}
        accessibilityLabel="Gesture preview"
      />
    );
  } else {
    content = (
      <View>
        <Text>
          Unsupported media format: please include GIF or MP4 files for
          gestures.
        </Text>
      </View>
    );
  }

  return <View style={styles.container}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  media: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#000',
  },
});

export default MediaPlayer;
