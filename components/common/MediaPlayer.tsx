import React, { useCallback, useEffect, useState } from 'react';

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { getBaseUrl, getToken } from '@/utils';

import ImageViewerComponent from './ImageViewerComponent';
import VideoPlayerComponent from './VideoPlayerComponent';

interface GestureInfo {
  contentType: string;
  id: string;
  path?: string;
  name?: string;
  [key: string]: unknown;
}

interface MediaPlayerProps {
  gestureId: string;
  gestureInfo: GestureInfo;
  autoPlay?: boolean;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  gestureId,
  gestureInfo,
  autoPlay = false,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const BASE_URL = getBaseUrl();
  const fileUrl = `${BASE_URL}/file/download?id=${gestureId}`;

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const storedToken = await getToken();
        setToken(storedToken);
      } catch (error) {
        console.error('Error fetching token:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  const handleMediaLoad = useCallback(() => {
    // Media loaded successfully
    // TODO Do some stuffs
  }, []);

  const handleMediaError = useCallback((error: unknown) => {
    console.error('Media loading error:', error);
    setHasError(true);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  // Show error state if token fetch failed
  if (hasError || !token) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load media. Please try again.
          </Text>
        </View>
      </View>
    );
  }

  const headers = { authorization: `Token ${token}` };

  if (gestureInfo?.contentType === 'video/mp4' && fileUrl) {
    return (
      <View style={styles.container}>
        <VideoPlayerComponent
          uri={fileUrl}
          autoPlay={autoPlay}
          headers={headers}
          style={styles.media}
          accessibilityLabel={`Video gesture: ${gestureInfo.name || 'gesture'}`}
          onLoad={handleMediaLoad}
          onError={handleMediaError}
          shouldLoop={false}
        />
      </View>
    );
  }

  if (gestureInfo?.contentType === 'image/gif') {
    return (
      <View style={styles.container}>
        <ImageViewerComponent
          uri={fileUrl}
          headers={headers}
          style={styles.media}
          accessibilityLabel={`GIF gesture: ${gestureInfo.name || 'gesture'}`}
          onLoad={handleMediaLoad}
          onError={handleMediaError}
        />
      </View>
    );
  }

  // Unsupported media type
  return (
    <View style={styles.container}>
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Unsupported media format: please include GIF or MP4 files for
          gestures.
        </Text>
        <Text style={styles.subErrorText}>
          Content type: {gestureInfo?.contentType || 'unknown'}
        </Text>
      </View>
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
  media: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#000',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 20,
  },
  errorText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  subErrorText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default MediaPlayer;
