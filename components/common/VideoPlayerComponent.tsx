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

// ============= INTERFACES =============

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
  shouldLoop?: boolean;
  autoPlay?: boolean;
  // New adaptive streaming props
  enableAdaptiveStreaming?: boolean;
  videoId?: string; // Required for adaptive streaming
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

// ============= MAIN COMPONENT =============

const VideoPlayerComponent: React.FC<VideoPlayerComponentProps> = ({
  uri,
  headers,
  style,
  accessibilityLabel = 'Video player',
  onLoad,
  onError,
  shouldLoop = false,
  autoPlay = false,
  enableAdaptiveStreaming = false,
  videoId,
}) => {
  // ===== ORIGINAL STATE =====
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hasLoaded, setHasLoaded] = useState(false);

  // ===== ADAPTIVE STREAMING STATE =====
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string>(uri);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isBuffering, setIsBuffering] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  // NEW: Controls visibility state
  const [showControls, setShowControls] = useState(true);

  // ===== REFS =====
  const playerRef = useRef<any>(null);

  // ===== INITIALIZATION =====
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

  // ===== NETWORK MONITORING =====
  useEffect(() => {
    if (!enableAdaptiveStreaming) return;

    const unsubscribe = NetInfo.addEventListener(state => {
      const type = state.type?.toLowerCase() || 'unknown';
      setConnectionType(type);
      console.log('Network type:', type);
    });

    return () => unsubscribe();
  }, [enableAdaptiveStreaming]);

  // ===== AUTO-HIDE CONTROLS TIMER =====
  useEffect(() => {
    if (!showControls) return;

    // Auto-hide controls after 3 seconds
    const timer = setTimeout(() => {
      setShowControls(false);
      setShowQualityMenu(false); // Also hide quality menu
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls]);

  // ===== VIDEO PLAYER =====
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
        playerInstance.loop = shouldLoop;
        if (autoPlay) {
          playerInstance.play();
        } else {
          playerInstance.pause();
        }
      }
    },
  );

  // ===== MONITOR PLAYBACK STATUS =====
  useEffect(() => {
    if (!player || !enableAdaptiveStreaming) return;

    const subscription = player.addListener('statusChange', status => {
      setIsBuffering(status.status === 'loading');
    });

    return () => {
      subscription.remove();
    };
  }, [player, enableAdaptiveStreaming]);

  // ===== LOAD VIDEO INFO (ADAPTIVE STREAMING) =====
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

          console.log('Video loaded with adaptive streaming:', {
            name: info.name,
            duration: info.duration,
            hasQualities: info.hasQualities,
            qualities:
              info.qualities?.map((q: VideoQuality) => q.quality).join(', ') ||
              'none',
          });

          // Set initial URL
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
        console.log(
          'Adaptive streaming not available, using fallback:',
          adaptiveError,
        );
      }

      // Fallback to original URI
      setCurrentStreamUrl(uri);
      setUsingFallback(true);
      console.log('Using fallback video player for:', videoId);
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

  // ===== LOAD ADAPTIVE STREAMING INFO =====
  useEffect(() => {
    if (enableAdaptiveStreaming && token) {
      loadVideoInfo();
    }
  }, [enableAdaptiveStreaming, token, loadVideoInfo]);

  // ===== ORIGINAL URI CHANGE HANDLER =====
  useEffect(() => {
    if (!enableAdaptiveStreaming) {
      setCurrentStreamUrl(uri);
      setIsLoading(true);
      setHasLoaded(false);
      setHasError(false);
      setErrorMessage('');
    }
  }, [uri, enableAdaptiveStreaming]);

  // ===== QUALITY RECOMMENDATION =====
  const getRecommendedQuality = useCallback((): string => {
    const type = connectionType.toLowerCase();
    return NETWORK_QUALITY_MAP[type] || '240p';
  }, [connectionType]);

  // ===== GET STREAM URL =====
  const getStreamUrl = useCallback(
    (info: VideoInfo, quality: string): string => {
      if (quality === 'original') {
        return info.originalUrl;
      }

      if (!info.hasQualities) {
        return info.originalUrl;
      }

      const qualityOption = info.qualities?.find(q => q.quality === quality);
      if (qualityOption) {
        console.log(`Selected ${quality}: ${qualityOption.bitrate}`);
        return qualityOption.streamUrl;
      }

      const fallback = info.qualities?.[0];
      return fallback ? fallback.streamUrl : info.originalUrl;
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
        console.log(
          `Network changed to ${connectionType}, switching to ${recommended}`,
        );
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

  // ===== QUALITY CHANGE HANDLER =====
  const handleQualityChange = useCallback(
    async (quality: string) => {
      if (!videoInfo || !enableAdaptiveStreaming) return;

      setSelectedQuality(quality);
      setShowQualityMenu(false);

      if (usingFallback) return;

      const currentTime = player?.currentTime || 0;
      let newUrl: string;

      if (quality === 'auto') {
        const recommended = getRecommendedQuality();
        newUrl = getStreamUrl(videoInfo, recommended);
      } else {
        newUrl = getStreamUrl(videoInfo, quality);
      }

      setCurrentStreamUrl(newUrl);

      /*       setTimeout(() => {
        if (player && currentTime > 0) {
          player.currentTime = currentTime;
          if (autoPlay) {
            player.play();
          }
        }
      }, 500); */
    },
    [
      videoInfo,
      player,
      autoPlay,
      getRecommendedQuality,
      getStreamUrl,
      usingFallback,
      enableAdaptiveStreaming,
    ],
  );

  // ===== GET QUALITY LABEL =====
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

  // ===== HANDLE VIDEO TAP =====
  const handleVideoTap = useCallback(() => {
    setShowControls(prev => !prev);
    setShowQualityMenu(false); // Hide quality menu when toggling controls
  }, []);

  // ===== ORIGINAL PLAYER LOGIC =====
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
            console.error('Video player error:', error);
            setHasError(true);
            setErrorMessage('Failed to load video');
            onError?.(error);
          }
        } else {
          try {
            player.pause();
          } catch (error) {
            console.warn('VideoPlayer: Failed to pause:', error);
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
          console.error('Video player error:', error);
          setHasError(true);
          setErrorMessage('Failed to load video');
          onError?.(error);
        }
      }
    }, 250);

    return () => {
      clearInterval(statusInterval);
    };
  }, [player, shouldLoop, onError, onLoad, hasLoaded, autoPlay]);

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    setHasLoaded(false);

    if (enableAdaptiveStreaming) {
      loadVideoInfo();
    }
  };

  // ===== RENDER =====

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
      <StatusBar hidden />

      {/* Video View with Tap Handler */}
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
          nativeControls={true} // Always show native controls
        />
      </TouchableOpacity>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* Buffering Indicator (Adaptive Streaming) */}
      {enableAdaptiveStreaming && isBuffering && (
        <View style={styles.bufferingOverlay}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.bufferingText}>Buffering...</Text>
        </View>
      )}

      {/* Quality Controls (Adaptive Streaming) - Only show when controls are visible */}
      {enableAdaptiveStreaming &&
        !usingFallback &&
        videoInfo?.hasQualities &&
        showControls && (
          <View style={styles.qualityControls}>
            <TouchableOpacity
              style={styles.qualityButton}
              onPress={() => setShowQualityMenu(!showQualityMenu)}
              activeOpacity={0.7}
            >
              <Text style={styles.qualityButtonText}>{getQualityLabel()}</Text>
            </TouchableOpacity>

            {showQualityMenu && (
              <View style={styles.qualityMenu}>
                {/* Auto Option */}
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

                {/* Quality Options - Sorted from Highest to Lowest */}
                {videoInfo.qualities
                  ?.sort((a, b) => {
                    // Define quality order for proper sorting (highest to lowest)
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

                    // If both qualities are in the order array, sort by their index
                    if (aIndex !== -1 && bIndex !== -1) {
                      return aIndex - bIndex; // Lower index = higher quality
                    }

                    // If only one is in the array, prioritize it
                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;

                    // If neither is in the array, sort alphabetically (reverse)
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

                {/* Original Option */}
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

      {/* Network Indicator (Adaptive Streaming) */}
      {/*       {enableAdaptiveStreaming && (
        <View style={styles.networkIndicator}>
          <View
            style={[styles.networkDot, getNetworkDotStyle(connectionType)]}
          />
          <Text style={styles.networkText}>
            {usingFallback ? 'FALLBACK' : connectionType.toUpperCase()}
          </Text>
        </View>
      )} */}
    </View>
  );
};

// ============= HELPERS =============

function getNetworkDotStyle(type: string) {
  if (type.includes('wifi') || type.includes('ethernet')) {
    return { backgroundColor: '#34C759' };
  }
  if (type.includes('4g') || type.includes('lte')) {
    return { backgroundColor: '#007AFF' };
  }
  if (type.includes('3g')) {
    return { backgroundColor: '#FF9500' };
  }
  return { backgroundColor: '#FF3B30' };
}

// ============= STYLES =============

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', position: 'relative' },
  video: { flex: 1, width: '100%', height: '100%' },
  videoTouchArea: { flex: 1, width: '100%', height: '100%' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
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
  // Adaptive streaming styles
  bufferingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    pointerEvents: 'none',
  },
  bufferingText: { color: '#FFF', marginTop: 8, fontSize: 14 },
  qualityControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    right: 15,
    zIndex: 1000,
  },
  qualityButton: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  qualityButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  qualityMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
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
  networkIndicator: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 60 : 50,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  networkDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  networkText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
});

export default memo(VideoPlayerComponent);
