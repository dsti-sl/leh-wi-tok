import React, {
  memo,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';

import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Platform,
} from 'react-native';

import {
  type SourceLoadEventPayload,
  type StatusChangeEventPayload,
  type TimeUpdateEventPayload,
  type VideoPlayer,
  useVideoPlayer,
  VideoView,
} from 'expo-video';

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
  initialTime?: number;
  onTimeUpdate?: (_currentTime: number) => void;
}

type VideoPlayerEventMap = {
  playToEnd: undefined;
  sourceLoad: SourceLoadEventPayload;
  statusChange: StatusChangeEventPayload;
  timeUpdate: TimeUpdateEventPayload;
};

type VideoPlayerSubscription = {
  remove: () => void;
};

type VideoPlayerWithListeners = VideoPlayer & {
  addListener<TKey extends keyof VideoPlayerEventMap>(
    eventName: TKey,
    listener: VideoPlayerEventMap[TKey] extends undefined
      ? () => void
      : (payload: VideoPlayerEventMap[TKey]) => void,
  ): VideoPlayerSubscription;
};

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

const QUALITY_ORDER = ['1080p', '720p', '480p', '360p', '240p', '144p'];

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

const VIDEO_ASPECT_RATIO = 16 / 9;
const MAX_VIDEO_FRAME_WIDTH = 1280;

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
  initialTime,
  onTimeUpdate,
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
  const [frameAspectRatio, setFrameAspectRatio] = useState(VIDEO_ASPECT_RATIO);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const playerRef = useRef<React.ComponentRef<typeof VideoView> | null>(null);
  const hasAppliedInitialTimeRef = useRef(false);

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
    if (enableAdaptiveStreaming) return;

    const timer = setTimeout(() => {
      setShowControls(false);
      setShowQualityMenu(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls, showQualityMenu, enableAdaptiveStreaming]);

  const player = useVideoPlayer(
    {
      uri: enableAdaptiveStreaming ? currentStreamUrl : uri,
      headers: {
        ...headers,
        ...(enableAdaptiveStreaming &&
          token && { Authorization: `Token ${token}` }),
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
    hasAppliedInitialTimeRef.current = false;
  }, [videoId, uri]);

  useEffect(() => {
    if (!player) return;

    const eventedPlayer = player as VideoPlayerWithListeners;
    const subscription = eventedPlayer.addListener('sourceLoad', payload => {
      const bestTrack = payload.availableVideoTracks
        .filter(
          track =>
            track?.size?.width > 0 &&
            track?.size?.height > 0 &&
            track.isSupported !== false,
        )
        .sort(
          (left, right) =>
            right.size.width * right.size.height -
            left.size.width * left.size.height,
        )[0];

      const nextAspectRatio =
        bestTrack?.size?.width && bestTrack?.size?.height
          ? bestTrack.size.width / bestTrack.size.height
          : VIDEO_ASPECT_RATIO;

      if (Number.isFinite(nextAspectRatio) && nextAspectRatio > 0) {
        setFrameAspectRatio(nextAspectRatio);
      }
    });

    return () => {
      try {
        subscription?.remove();
      } catch (error) {
        console.warn('Error removing source load listener:', error);
      }
    };
  }, [player]);

  useEffect(() => {
    if (!player) return;

    const eventedPlayer = player as VideoPlayerWithListeners;
    const subscription = eventedPlayer.addListener('statusChange', status => {
      setIsBuffering(status.status === 'loading');
    });

    return () => {
      try {
        subscription?.remove();
      } catch (error) {
        console.warn('Error removing player subscription:', error);
      }
    };
  }, [player, videoId, currentStreamUrl, headers]);

  useEffect(() => {
    if (!player || !onEnd) return;

    const eventedPlayer = player as VideoPlayerWithListeners;
    const endSubscription = eventedPlayer.addListener('playToEnd', () => {
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

  const applyInitialTime = useCallback(() => {
    if (!player || hasAppliedInitialTimeRef.current) return;
    if (!initialTime || initialTime <= 0) return;

    try {
      const duration = player.duration;
      const maxTime =
        Number.isFinite(duration) && duration > 1
          ? duration - 0.5
          : initialTime;
      player.currentTime = Math.min(initialTime, maxTime);
      hasAppliedInitialTimeRef.current = true;
    } catch (error) {
      console.warn('Failed to apply initial playback time:', error);
    }
  }, [player, initialTime]);

  useEffect(() => {
    if (!player || !onTimeUpdate) return;

    player.timeUpdateEventInterval = 1;
    const eventedPlayer = player as VideoPlayerWithListeners;
    const subscription = eventedPlayer.addListener('timeUpdate', payload => {
      onTimeUpdate(payload.currentTime);
    });

    return () => {
      try {
        subscription?.remove();
      } catch (error) {
        console.warn('Error removing time update listener:', error);
      }
    };
  }, [player, onTimeUpdate]);

  useEffect(() => {
    if (!player || onTimeUpdate) return;
    player.timeUpdateEventInterval = 0;
  }, [player, onTimeUpdate]);

  const loadVideoInfo = useCallback(async () => {
    if (!videoId || !enableAdaptiveStreaming) return;

    try {
      setIsLoading(true);
      setHasError(false);

      const baseUrl = getBaseUrl();
      const authHeaders = token
        ? { Authorization: `Token ${token}` as const }
        : {};

      // Try adaptive streaming endpoint first (auth optional; guests use curriculum file policy)
      try {
        const response = await fetch(`${baseUrl}/video/info?id=${videoId}`, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...authHeaders,
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
            setSelectedQuality('auto');
            const recommended = getRecommendedQuality();
            const url = getStreamUrl(info, recommended);
            setCurrentStreamUrl(url);
          } else {
            setSelectedQuality('original');
            setCurrentStreamUrl(info.originalUrl);
          }
          return;
        }

        if (response.status === 404) {
          console.warn('video/info returned 404; falling back to direct URI.');
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
    if (enableAdaptiveStreaming && videoId) {
      loadVideoInfo();
    }
  }, [enableAdaptiveStreaming, videoId, token, loadVideoInfo]);

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

  const buildStreamUrl = useCallback(
    (quality?: string): string => {
      const baseUrl = getBaseUrl();
      if (!videoId) {
        return uri;
      }

      const params = new URLSearchParams({ id: videoId });
      if (quality && quality !== 'original') {
        params.set('quality', quality);
      }

      if (token) {
        params.set('token', token);
      }

      return `${baseUrl}/video/stream?${params.toString()}`;
    },
    [videoId, token, uri],
  );

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
      setSelectedQuality(quality);
      setShowQualityMenu(false);

      if (!enableAdaptiveStreaming) {
        return;
      }

      // Don't access player.currentTime here as it may be stale
      let newUrl: string;

      if (quality === 'auto' && videoInfo && !usingFallback) {
        const recommended = getRecommendedQuality();
        newUrl = getStreamUrl(videoInfo, recommended);
      } else if (videoInfo && !usingFallback) {
        newUrl = getStreamUrl(videoInfo, quality);
      } else {
        newUrl =
          quality === 'auto'
            ? buildStreamUrl(getRecommendedQuality())
            : buildStreamUrl(quality);
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
      buildStreamUrl,
    ],
  );

  const getQualityLabel = useCallback((): string => {
    if (!enableAdaptiveStreaming) {
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

  const qualityOptions = useMemo(() => {
    return QUALITY_ORDER.map(quality => {
      return {
        quality,
        stream: videoInfo?.qualities?.find(q => q.quality === quality),
      };
    });
  }, [videoInfo?.qualities]);

  const handleVideoTap = useCallback(() => {
    if (enableAdaptiveStreaming) {
      setShowControls(true);
      setShowQualityMenu(false);
      return;
    }

    if (Platform.OS === 'android') {
      setShowControls(prev => !prev);
      setShowQualityMenu(false);
    } else {
      setShowControls(prev => !prev);
      setShowQualityMenu(false);
    }
  }, [enableAdaptiveStreaming]);

  const handleQualityButtonPress = useCallback(() => {
    setShowQualityMenu(prev => !prev);

    // On Android, ensure controls stay visible when menu is open
    if (Platform.OS === 'android' && !showQualityMenu) {
      setShowControls(true);
    }
  }, [showQualityMenu]);

  useEffect(() => {
    if (enableAdaptiveStreaming) {
      setShowControls(true);
    }
  }, [enableAdaptiveStreaming]);

  useEffect(() => {
    if (!player) return;

    const handleLoad = () => {
      if (!hasLoaded) {
        setHasLoaded(true);
        setIsLoading(false);

        if (autoPlay && player) {
          try {
            applyInitialTime();
            player.play();
          } catch (error) {
            console.error('Video player play error:', error);
            setHasError(true);
            setErrorMessage('Failed to play video');
            onError?.(error);
          }
        } else {
          try {
            applyInitialTime();
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
  }, [
    player,
    shouldLoop,
    onError,
    onLoad,
    hasLoaded,
    autoPlay,
    applyInitialTime,
  ]);

  useEffect(() => {
    if (!player || !hasLoaded) return;
    applyInitialTime();
  }, [player, hasLoaded, applyInitialTime]);

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

  const maxAvailableWidth = Math.min(screenWidth, MAX_VIDEO_FRAME_WIDTH);
  const maxAvailableHeight = Math.max(220, screenHeight * 0.55);
  let frameWidth = maxAvailableWidth;
  let frameHeight = frameWidth / frameAspectRatio;

  if (frameHeight > maxAvailableHeight) {
    frameHeight = maxAvailableHeight;
    frameWidth = frameHeight * frameAspectRatio;
  }

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
      <View
        style={[
          styles.videoFrame,
          {
            width: frameWidth,
            height: frameHeight,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.videoWrapper}
          onPress={handleVideoTap}
          activeOpacity={1}
        >
          <VideoView
            ref={playerRef}
            player={player}
            style={styles.video}
            fullscreenOptions={{ enable: true }}
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
      </View>

      {enableAdaptiveStreaming && showControls && (
        <View style={styles.qualityPanel}>
          <TouchableOpacity
            style={styles.qualityButtonInline}
            onPress={handleQualityButtonPress}
            activeOpacity={0.7}
          >
            <Text style={styles.qualityButtonText}>{getQualityLabel()}</Text>
          </TouchableOpacity>
        </View>
      )}

      {enableAdaptiveStreaming && showQualityMenu && (
        <Modal
          visible={showQualityMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQualityMenu(false)}
        >
          <View style={styles.qualityModalRoot}>
            <Pressable
              style={styles.qualityBackdrop}
              onPress={() => setShowQualityMenu(false)}
            />
            <View style={styles.qualitySheet}>
              <View style={styles.qualitySheetHeader}>
                <Text style={styles.qualitySheetTitle}>Video Quality</Text>
                <TouchableOpacity
                  onPress={() => setShowQualityMenu(false)}
                  style={styles.qualityCloseButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.qualityMenuScroll}
                contentContainerStyle={styles.qualityMenuContent}
                showsVerticalScrollIndicator={true}
              >
                {videoInfo?.hasQualities && !usingFallback && (
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
                )}

                {qualityOptions.map(option => (
                  <TouchableOpacity
                    key={option.quality}
                    style={[
                      styles.qualityOption,
                      selectedQuality === option.quality &&
                        styles.selectedOption,
                    ]}
                    onPress={() => handleQualityChange(option.quality)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.qualityText}>
                      {QUALITY_LABELS[option.quality] || option.quality}
                    </Text>
                    <Text style={styles.qualitySubtext}>
                      {option.stream
                        ? `${option.stream.resolution} • ${(
                            option.stream.size /
                            1024 /
                            1024
                          ).toFixed(1)}MB`
                        : 'Will stream best available for this video'}
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
                    {videoInfo
                      ? `Best quality • ${(
                          videoInfo.originalSize /
                          1024 /
                          1024
                        ).toFixed(1)}MB`
                      : 'Best available quality'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 220,
  },
  videoFrame: {
    alignSelf: 'center',
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
    minHeight: 220,
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
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
  qualityPanel: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    zIndex: 30,
  },
  qualityButtonInline: {
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
  },
  qualityButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  qualityModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  qualityBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  qualitySheet: {
    backgroundColor: 'rgba(0,0,0,0.97)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '70%',
    paddingTop: 4,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  qualitySheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  qualitySheetTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  qualityCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  qualityMenuScroll: {
    maxHeight: '100%',
  },
  qualityMenuContent: {
    paddingBottom: 8,
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
