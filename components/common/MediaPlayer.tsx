import { Video } from 'expo-av';
import { Image } from 'expo-image';
import React from 'react';
import { View, StyleSheet } from 'react-native';

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
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
  const fileUrl = `${BASE_URL}/file/download?id=${gestureId}`;

  // Conditional rendering
  let content = null;
  if (gestureInfo?.contentType === 'video/mp4') {
    content = (
      <View className="mt-20 mx-10 h-1">
        <Video
          source={{ uri: fileUrl }}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          shouldPlay
          useNativeControls
          resizeMode="cover"
          style={{ width: '10%', height: '10%' }}
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
    <View>
      Unspported video format: please include gif or mp4 videos for gesture
    </View>;
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
  media: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#000',
  },
});

export default MediaPlayer;
