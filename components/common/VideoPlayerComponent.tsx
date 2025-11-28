import React, { memo, useEffect, useState, useCallback, useRef } from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
} from 'react-native';

import { useVideoPlayer, VideoView } from 'expo-video';

import { Ionicons } from '@expo/vector-icons';

import NetInfo from '@react-native-community/netinfo';

import { Colors } from '@/constants/Colors';
import { getBaseUrl, getToken } from '@/utils';

interface VideoQuality {
  quality: string;
  resolution: string;
  bitrate: string;
  size: number;
  streamUrl: string;
}

interface VideoInfo {
  id: string;
  name: string;
  duration: number;
  isVideo: boolean;
  hasQualities: boolean;
  qualities: VideoQuality[];
  originalUrl: string;
  originalSize: number;
}

interface VideoPlayerComponentProps {
  uri: string;
  headers?: Record<string, string>;
  style?: object;
  accessibilityLabel?: string;
  onLoad?: () => void;
  onError?: (_error: unknown) => void;
  onEnd?: () => void;
  shouldLoop?: boolean;
  autoPlay?: boolean;
  enableAdaptiveStreaming?: boolean;
  videoId?: string;
}

// ============= CONSTANTS =============

const QUALITY_LABELS: Record<string, string> = {
  '144p': '144p (2G)',
  '240p': '240p (3G)',
  '360p': '360p',
  '480p': '480p (4G)',
  '720p': '720p (HD)',
  '1080p': '1080p (Full HD)',
  original: 'Original',
  auto: 'Auto',
};

const NETWORK_QUALITY_MAP: Record<string, string> = {
  '2g': '144p',
  edge: '144p',
  gprs: '144p',
  '3g': '240p',
  hspa: '240p',
  '4g': '480p',
  lte: '480p',
  wifi: '720p',
  ethernet: '720p',
  unknown: '240p',
  none: '144p',
};

const VideoPlayerComponent: React.FC<VideoPlayerComponentProps> = ({
  uri,
  headers,
  style,
  accessibilityLabel = 'Video player',
  onLoad,
  onError,
  onEnd,
  shouldLoop = false,
  autoPlay = false,
  enableAdaptiveStreaming = false,
  videoId,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hasLoaded, setHasLoaded] = useState(false);

  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string>(uri);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isBuffering, setIsBuffering] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const playerRef = useRef<React.ComponentRef<typeof VideoView> | null>(null);

  useEffect(() => {
    if (enableAdaptiveStreaming) {
      const initializeData = async () => {
        try {
          const storedToken = await getToken();
          setToken(storedToken);
        } catch (error) {
          console.error('Error initializing adaptive video player:', error);
          setErrorMessage('Failed to initialize video player');
        }
      };
      initializeData();
    }
  }, [enableAdaptiveStreaming]);

  useEffect(() => {
    if (!enableAdaptiveStreaming) return;

    const unsubscribe = NetInfo.addEventListener(state => {
      const type = state.type?.toLowerCase() || 'unknown';
      setConnectionType(type);
      console.log('Network type:', type);
    });

    return () => unsubscribe();
  }, [enableAdaptiveStreaming]);

  useEffect(() => {
    if (!showControls) return;

    // Auto-hide controls after 5 seconds (increased from 3)
    const timer = setTimeout(() => {
      setShowControls(false);
      setShowQualityMenu(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls, showQualityMenu]);

  const player = useVideoPlayer(
    {
      uri: enableAdaptiveStreaming ? currentStreamUrl : uri,
      headers: {
        ...headers,
        ...(enableAdaptiveStreaming &&
          token && { authorization: `Bearer ${token}` }),
      },
    },
    playerInstance => {
      if (playerInstance) {
        try {
          playerInstance.loop = shouldLoop;
          if (autoPlay) {
            playerInstance.play();
          } else {
            playerInstance.pause();
          }
        } catch (error) {
          console.error('Error configuring player instance:', error);
        }
      }
    },
  );

  useEffect(() => {
    if (!player || !enableAdaptiveStreaming) return;

    const subscription = player.addListener('statusChange', status => {
      setIsBuffering(status.status === 'loading');
    });

    return () => {
      try {
        subscription?.remove();
      } catch (error) {
        console.warn('Error removing player subscription:', error);
      }
    };
  }, [player, videoId, currentStreamUrl, headers, enableAdaptiveStreaming]);

  useEffect(() => {
    if (!player || !onEnd) return;

    const endSubscription = player.addListener('playToEnd', () => {
      onEnd();
    });

    return () => {
      try {
        endSubscription?.remove();
      } catch (error) {
        console.warn('Error removing end listener:', error);
      }
    };
  }, [player, onEnd]);

  const loadVideoInfo = useCallback(async () => {
    if (!videoId || !token || !enableAdaptiveStreaming) return;

    try {
      setIsLoading(true);
      setHasError(false);

      const baseUrl = getBaseUrl();

      // Try adaptive streaming endpoint first
      try {
        const response = await fetch(`${baseUrl}/video/info?id=${videoId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...headers,
          },
        });

        if (response.ok) {
          const result = await response.json();

          if (result.errors) {
            throw new Error(result.errors[0]?.title || 'Failed to load video');
          }

          const info = result.data[0];
          setVideoInfo(info);
          setUsingFallback(false);

          if (info.hasQualities && info.qualities?.length > 0) {
            const recommended = getRecommendedQuality();
            const url = getStreamUrl(info, recommended);
            setCurrentStreamUrl(url);
          } else {
            setCurrentStreamUrl(info.originalUrl);
          }
          return;
        }
      } catch (adaptiveError) {
        console.warn(
          'Adaptive streaming lookup failed, falling back.',
          adaptiveError,
        );
      }

      setCurrentStreamUrl(uri);
      setUsingFallback(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load video';
      console.error('Load error:', errorMessage);
      setHasError(true);
      setErrorMessage(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [videoId, token, headers, onError, uri, enableAdaptiveStreaming]);

  useEffect(() => {
    if (enableAdaptiveStreaming && token) {
      loadVideoInfo();
    }
  }, [enableAdaptiveStreaming, token, loadVideoInfo]);

  useEffect(() => {
    if (!enableAdaptiveStreaming) {
      setCurrentStreamUrl(uri);
      setIsLoading(true);
      setHasLoaded(false);
      setHasError(false);
      setErrorMessage('');
    }
  }, [uri, enableAdaptiveStreaming]);

  const getRecommendedQuality = useCallback((): string => {
    const type = connectionType.toLowerCase();
    return NETWORK_QUALITY_MAP[type] || '240p';
  }, [connectionType]);

  const getStreamUrl = useCallback(
    (info: VideoInfo, quality: string): string => {
      if (quality === 'original') {
        let originalUrl = info.originalUrl;
        // Convert HTTP to HTTPS if base URL is HTTPS
        if (
          originalUrl.startsWith('http://') &&
          getBaseUrl().startsWith('https://')
        ) {
          originalUrl = originalUrl.replace('http://', 'https://');
        }
        return originalUrl;
      }

      if (!info.hasQualities) {
        let originalUrl = info.originalUrl;
        // Convert HTTP to HTTPS if base URL is HTTPS
        if (
          originalUrl.startsWith('http://') &&
          getBaseUrl().startsWith('https://')
        ) {
          originalUrl = originalUrl.replace('http://', 'https://');
        }
        return originalUrl;
      }

      const qualityOption = info.qualities?.find(q => q.quality === quality);
      if (qualityOption) {
        let finalUrl = qualityOption.streamUrl;

        // Convert HTTP to HTTPS if base URL is HTTPS
        if (
          finalUrl.startsWith('http://') &&
          getBaseUrl().startsWith('https://')
        ) {
          finalUrl = finalUrl.replace('http://', 'https://');
        }

        // Convert relative URL to absolute URL if needed
        if (finalUrl.startsWith('/')) {
          const baseUrl = getBaseUrl();
          finalUrl = `${baseUrl}${finalUrl}`;
        }

        return finalUrl;
      }

      const fallback = info.qualities?.[0];
      let fallbackUrl = fallback ? fallback.streamUrl : info.originalUrl;

      // Convert HTTP to HTTPS if base URL is HTTPS
      if (
        fallbackUrl.startsWith('http://') &&
        getBaseUrl().startsWith('https://')
      ) {
        fallbackUrl = fallbackUrl.replace('http://', 'https://');
      }
      return fallbackUrl;
    },
    [],
  );

  // ===== AUTO-SELECT QUALITY ON NETWORK CHANGE =====
  useEffect(() => {
    if (
      videoInfo &&
      selectedQuality === 'auto' &&
      currentStreamUrl &&
      !usingFallback &&
      enableAdaptiveStreaming
    ) {
      const recommended = getRecommendedQuality();
      const newUrl = getStreamUrl(videoInfo, recommended);

      if (newUrl !== currentStreamUrl) {
        setCurrentStreamUrl(newUrl);
      }
    }
  }, [
    connectionType,
    videoInfo,
    selectedQuality,
    getRecommendedQuality,
    getStreamUrl,
    currentStreamUrl,
    usingFallback,
    enableAdaptiveStreaming,
  ]);

  const handleQualityChange = useCallback(
    async (quality: string) => {
      if (!videoInfo || !enableAdaptiveStreaming) return;

      setSelectedQuality(quality);
      setShowQualityMenu(false);

      if (usingFallback) {
        return;
      }

      // Don't access player.currentTime here as it may be stale
      let newUrl: string;

      if (quality === 'auto') {
        const recommended = getRecommendedQuality();
        newUrl = getStreamUrl(videoInfo, recommended);
      } else {
        newUrl = getStreamUrl(videoInfo, quality);
      }

      // Simply update the URL - useVideoPlayer will handle recreation
      setCurrentStreamUrl(newUrl);
    },
    [
      videoInfo,
      getRecommendedQuality,
      getStreamUrl,
      usingFallback,
      enableAdaptiveStreaming,
      selectedQuality,
    ],
  );

  const getQualityLabel = useCallback((): string => {
    if (!enableAdaptiveStreaming || usingFallback) {
      return 'Original';
    }
    if (selectedQuality === 'auto') {
      const recommended = getRecommendedQuality();
      return `Auto (${QUALITY_LABELS[recommended] || recommended})`;
    }
    return QUALITY_LABELS[selectedQuality] || selectedQuality;
  }, [
    selectedQuality,
    getRecommendedQuality,
    usingFallback,
    enableAdaptiveStreaming,
  ]);

  const handleVideoTap = useCallback(() => {
    if (Platform.OS === 'android') {
      setShowControls(prev => !prev);

      setShowQualityMenu(false);
    } else {
      setShowControls(prev => !prev);
      setShowQualityMenu(false);
    }
  }, [showControls, showQualityMenu]);

  const handleQualityButtonPress = useCallback(() => {
    setShowQualityMenu(prev => !prev);

    // On Android, ensure controls stay visible when menu is open
    if (Platform.OS === 'android' && !showQualityMenu) {
      setShowControls(true);
    }
  }, [showQualityMenu]);

  useEffect(() => {
    if (!player) return;

    const handleLoad = () => {
      if (!hasLoaded) {
        setHasLoaded(true);
        setIsLoading(false);

        if (autoPlay && player) {
          try {
            player.play();
          } catch (error) {
            console.error('Video player play error:', error);
            setHasError(true);
            setErrorMessage('Failed to play video');
            onError?.(error);
          }
        } else {
          try {
            player.pause();
          } catch (error) {
            console.warn('Video pause failed:', error);
          }
        }
        onLoad?.();
      }
    };

    const statusInterval = setInterval(() => {
      if (player) {
        try {
          if (!hasLoaded && player.duration > 0) {
            handleLoad();
          }
        } catch (error) {
          console.warn('Status polling failed:', error);
        }
      }
    }, 250);

    return () => {
      clearInterval(statusInterval);
    };
  }, [player, shouldLoop, onError, onLoad, hasLoaded, autoPlay]);

  useEffect(() => {
    if (enableAdaptiveStreaming && currentStreamUrl) {
      // Reset loading state when URL changes
      setIsLoading(true);
      setHasLoaded(false);
      setHasError(false);
      setErrorMessage('');
    }
  }, [currentStreamUrl, enableAdaptiveStreaming]);

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    setHasLoaded(false);

    if (enableAdaptiveStreaming) {
      loadVideoInfo();
    }
  };

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

  if (!player) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <StatusBar hidden />

      <TouchableOpacity
        style={styles.videoTouchArea}
        onPress={handleVideoTap}
        activeOpacity={1}
      >
        <VideoView
          ref={playerRef}
          player={player}
          style={styles.video}
          allowsFullscreen
          allowsPictureInPicture
          contentFit="contain"
          accessibilityLabel={accessibilityLabel}
          nativeControls={true}
        />
      </TouchableOpacity>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}

      {enableAdaptiveStreaming && isBuffering && (
        <View style={styles.bufferingOverlay}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.bufferingText}>Buffering…</Text>
        </View>
      )}

      {enableAdaptiveStreaming &&
        !usingFallback &&
        videoInfo?.hasQualities &&
        showControls && (
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.qualityButtonInline}
              onPress={handleQualityButtonPress}
              activeOpacity={0.7}
            >
              <Text style={styles.qualityButtonText}>{getQualityLabel()}</Text>
            </TouchableOpacity>

            {showQualityMenu && (
              <View style={styles.qualityMenuInline}>
                <TouchableOpacity
                  style={[
                    styles.qualityOption,
                    selectedQuality === 'auto' && styles.selectedOption,
                  ]}
                  onPress={() => handleQualityChange('auto')}
                >
                  <Text style={styles.qualityText}>Auto</Text>
                  <Text style={styles.qualitySubtext}>
                    Recommended for {connectionType.toUpperCase()}
                  </Text>
                </TouchableOpacity>

                {videoInfo.qualities
                  ?.sort((a, b) => {
                    const qualityOrder = [
                      '1080p',
                      '720p',
                      '480p',
                      '360p',
                      '240p',
                      '144p',
                    ];
                    const aIndex = qualityOrder.indexOf(a.quality);
                    const bIndex = qualityOrder.indexOf(b.quality);

                    if (aIndex !== -1 && bIndex !== -1) {
                      return aIndex - bIndex;
                    }

                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;

                    return b.quality.localeCompare(a.quality);
                  })
                  ?.map(q => (
                    <TouchableOpacity
                      key={q.quality}
                      style={[
                        styles.qualityOption,
                        selectedQuality === q.quality && styles.selectedOption,
                      ]}
                      onPress={() => handleQualityChange(q.quality)}
                    >
                      <Text style={styles.qualityText}>
                        {QUALITY_LABELS[q.quality] || q.quality}
                      </Text>
                      <Text style={styles.qualitySubtext}>
                        {q.resolution} • {q.bitrate} •{' '}
                        {(q.size / 1024 / 1024).toFixed(1)}MB
                      </Text>
                    </TouchableOpacity>
                  ))}

                <TouchableOpacity
                  style={[
                    styles.qualityOption,
                    selectedQuality === 'original' && styles.selectedOption,
                  ]}
                  onPress={() => handleQualityChange('original')}
                >
                  <Text style={styles.qualityText}>Original</Text>
                  <Text style={styles.qualitySubtext}>
                    Best quality •{' '}
                    {(videoInfo.originalSize / 1024 / 1024).toFixed(1)}MB
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', position: 'relative' },
  video: { flex: 1, width: '100%', height: '100%' },
  videoTouchArea: { flex: 1, width: '100%', height: '100%' },
  loadingOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    zIndex: 10,
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
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  bufferingOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10,
    pointerEvents: 'none',
  },
  bufferingText: { color: '#FFF', fontSize: 13, marginLeft: 6 },
  bottomControls: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0b1c22',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  qualityButtonInline: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  qualityButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  qualityMenuInline: {
    position: 'absolute',
    bottom: 60,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderRadius: 10,
    minWidth: 220,
    maxHeight: 400,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  qualityOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  selectedOption: { backgroundColor: 'rgba(0,122,255,0.4)' },
  qualityText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  qualitySubtext: { color: '#AAA', fontSize: 11 },
});

export default memo(VideoPlayerComponent);
