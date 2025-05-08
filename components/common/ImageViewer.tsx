import { Image } from 'expo-image';
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ImageViewerProps {
  gestureId: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ gestureId }) => {
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

  const imageUrl = `${BASE_URL}/file/download?id=${gestureId}`;

  console.log('Image URL:', imageUrl);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        contentFit="contain"
        transition={1000}
        className="w-full h-full"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  image: {
    width: 400,
    height: 400,
  },
});

export default ImageViewer;
