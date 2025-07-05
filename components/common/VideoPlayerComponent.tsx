import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState, memo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';

import { Colors } from '@/constants/Colors';

interface VideoPlayerComponentProps {
  uri: string;
  headers?: Record<string, string>;
  style?: object;
  accessibilityLabel?: string;
  onLoad?: () => void;
  onError?: (_error: unknown) => void;
  shouldLoop?: boolean;
  autoPlay?: boolean;
}

const VideoPlayerComponent: React.FC<VideoPlayerComponentProps> = ({
  uri,
  headers,
  style,
  accessibilityLabel = 'Video player',
  onLoad,
  onError,
  shouldLoop = false,
  autoPlay = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hasLoaded, setHasLoaded] = useState(false);

  // Reset loading state when URI changes
  useEffect(() => {
    setIsLoading(true);
    setHasLoaded(false);
    setHasError(false);
    setErrorMessage('');
  }, [uri]);

  // Initialize video player
  const player = useVideoPlayer(
    {
      uri,
      headers: headers || {},
    },
    (playerInstance) => {
      if (playerInstance) {
        playerInstance.loop = shouldLoop;
        if (autoPlay) {
          playerInstance.play();
        } else {
          playerInstance.pause();
        }
      }
    },
  );

  useEffect(() => {
    if (!player) return;

    const handleLoad = () => {
      if (!hasLoaded) {
        setHasLoaded(true);
        setIsLoading(false);

        // Auto-play if enabled and video is ready
        if (autoPlay && player) {
          try {
            player.play();
          } catch (error) {
            console.warn('VideoPlayer: Failed to auto-play:', error);
          }
        } else {
          try {
            player.pause();
          } catch (error) {
            console.warn('VideoPlayer: Failed to pause:', error);
          }
        }
        // Call onLoad callback if provided TODO: Doing additional stuffs
        onLoad?.();
      }
    };

    // Monitor player status with polling
    const statusInterval = setInterval(() => {
      if (player) {
        try {
          if (!hasLoaded && player.duration > 0) {
            handleLoad();
          }
        } catch (error) {
          console.warn('Error checking player status:', error);
        }
      }
    }, 250);

    return () => {
      clearInterval(statusInterval);
    };
  }, [player, shouldLoop, onError, onLoad, hasLoaded, autoPlay]);

  // Simple retry function
  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    setHasLoaded(false);
  };

  // Error state
  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.primary} />
        <Text style={styles.errorText}>Video failed to load</Text>
        <Text style={styles.errorSubtext}>{errorMessage}</Text>
        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading state if player is not ready
  if (!player) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Video View */}
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        allowsPictureInPicture
        contentFit="contain"
        accessibilityLabel={accessibilityLabel}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default memo(VideoPlayerComponent);
