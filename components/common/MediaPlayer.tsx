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

  console.log('File URL:', fileUrl);
  console.log('gestureInfo:', gestureInfo);

  // Conditional rendering
  let content = null;
  if (gestureInfo?.contentType === 'video/mp4') {
    content = (
      <View className="w-20 max-h-10">
        <Video
          source={{ uri: fileUrl }}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          shouldPlay
          useNativeControls
          resizeMode="cover"
          style={styles.media}
        />
      </View>
    );
  } else {
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
