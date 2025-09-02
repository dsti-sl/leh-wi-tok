import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';

interface ImageViewerComponentProps {
  uri: string;
  headers?: Record<string, string>;
  style?: object;
  accessibilityLabel?: string;
  onLoad?: () => void;
  onError?: (_error: unknown) => void;
}

const ImageViewerComponent: React.FC<ImageViewerComponentProps> = ({
  uri,
  headers,
  style,
  accessibilityLabel = 'Image content',
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Prefetch the image for better performance
  useEffect(() => {
    if (uri) {
      Image.prefetch(uri)
        .then(() => {
          // TODO: Handle successful prefetch
        })
        .catch((error) => {
          console.warn('Image prefetch failed:', error);
          // Continue without prefetch - not a critical error
        });
    }
  }, [uri]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(
    (error: unknown) => {
      console.error('Image loading error:', error);
      setIsLoading(false);
      setHasError(true);
      onError?.(error);
    },
    [onError],
  );

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    // Force re-render by updating a key or re-mounting
  }, []);

  if (hasError) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Ionicons name="image-outline" size={48} color="#666" />
        <Text style={styles.errorText}>Failed to load image</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading image...</Text>
        </View>
      )}

      <Image
        source={{
          uri,
          headers: headers || {},
        }}
        style={[styles.image, style]}
        contentFit="contain"
        transition={300}
        accessibilityLabel={accessibilityLabel}
        onLoad={handleImageLoad}
        onError={handleImageError}
        cachePolicy="memory-disk"
        priority="high"
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
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderRadius: 8,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 20,
  },
  errorText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImageViewerComponent;
