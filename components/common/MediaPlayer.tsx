import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import * as FileSystem from 'expo-file-system';

import { FontSizes, FontWeights } from '@/constants/Typography';
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
  useAdaptiveStreaming?: boolean; // New prop to enable adaptive streaming
  onEnd?: () => void;
  initialTime?: number;
  onTimeUpdate?: (_currentTime: number) => void;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  gestureId,
  gestureInfo,
  autoPlay = false,
  useAdaptiveStreaming = false,
  onEnd,
  initialTime,
  onTimeUpdate,
}) => {
  const BASE_URL = getBaseUrl();
  const fileUrl = `${BASE_URL}/file/download?id=${gestureId}`;
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [resolvedUri, setResolvedUri] = useState<string>(fileUrl);
  const headers = useMemo(
    () => (token ? { authorization: `Bearer ${token}` } : {}),
    [token],
  );

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

  // Cache media locally so previously played lessons remain available offline
  useEffect(() => {
    let isCancelled = false;

    const cacheMedia = async () => {
      if (!token) return;

      try {
        const cacheDir = `${FileSystem.cacheDirectory}lessons/`;
        const cachedPath = `${cacheDir}${gestureId}`;
        const info = await FileSystem.getInfoAsync(cachedPath);

        if (info.exists && info.size) {
          if (!isCancelled) {
            setResolvedUri(info.uri);
          }
          return;
        }

        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });

        const downloader = FileSystem.createDownloadResumable(
          fileUrl,
          cachedPath,
          { headers },
        );

        const result = await downloader.downloadAsync();

        if (!isCancelled) {
          if (result?.status === 200 && result.uri) {
            setResolvedUri(result.uri);
          } else {
            setResolvedUri(fileUrl);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.warn('Media cache skipped, streaming instead:', error);
          setResolvedUri(fileUrl);
        }
      }
    };

    cacheMedia();

    return () => {
      isCancelled = true;
    };
  }, [fileUrl, gestureId, headers, token]);

  const handleMediaLoad = useCallback(() => {}, []);

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

  if (gestureInfo?.contentType === 'video/mp4' && fileUrl) {
    return (
      <View style={styles.container}>
        <VideoPlayerComponent
          uri={resolvedUri}
          videoId={gestureId}
          enableAdaptiveStreaming={useAdaptiveStreaming}
          autoPlay={autoPlay}
          headers={headers}
          style={styles.media}
          accessibilityLabel={`Video gesture: ${gestureInfo.name || 'gesture'}`}
          onLoad={handleMediaLoad}
          onError={handleMediaError}
          {...(onEnd ? { onEnd } : {})}
          {...(initialTime !== undefined ? { initialTime } : {})}
          {...(onTimeUpdate ? { onTimeUpdate } : {})}
          shouldLoop={false}
        />
      </View>
    );
  }

  if (gestureInfo?.contentType === 'image/gif') {
    return (
      <View style={styles.container}>
        <ImageViewerComponent
          uri={resolvedUri}
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
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 20,
  },
  errorText: {
    color: '#333',
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semiBold,
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
