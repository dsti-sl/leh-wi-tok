import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VideoPlayerComponent from './VideoPlayerComponent';
import { Asset } from 'expo-asset';

interface VideoModalContentProps {
  videoSource: string | number;
  title?: string;
  onClose: () => void;
}

const VideoModalContent: React.FC<VideoModalContentProps> = ({
  videoSource,
  title = 'Introduction Video',
  onClose
}) => {
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.placeholder} />
      </View>
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={(e) => e.stopPropagation()}
      >
        <VideoPlayerComponent
          uri={
            typeof videoSource === 'string'
              ? videoSource
              : Asset.fromModule(videoSource).uri
          }
          style={styles.video}
          autoPlay={true}
          shouldLoop={false}
          onLoad={() => console.log('Video loaded')}
          onError={(error) => console.error('Video error:', error)}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  },
  closeButton: {
    padding: 8,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  video: {
    flex: 1,
  },
});

export default VideoModalContent;