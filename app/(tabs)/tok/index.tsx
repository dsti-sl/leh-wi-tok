import React, { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Colors } from '@/constants/Colors';

const index = () => {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, event => {
      setKeyboardHeight(event.endCoordinates.height);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const webViewBottomInset = useMemo(() => {
    if (!keyboardHeight) return 0;
    return Math.max(keyboardHeight - insets.bottom, 0);
  }, [insets.bottom, keyboardHeight]);

  const injectedJS2 = `
    (function() {
    // Hide <app-viewer-selector>
    function hideViewerSelector() {
      const el = document.querySelector('app-viewer-selector');
      if (el) el.style.display = 'none';
    }

    // Helper to hide elements in shadow DOM recursively
    function hideShadowElements(root) {
      const containers = root.querySelectorAll('ion-header ion-toolbar:first-of-type, ion-tab-bar, .buttons-first-slot, .buttons-last-slot');
      containers.forEach(el => el.style.display = 'none');

      const allEls = root.querySelectorAll('*');
      allEls.forEach(el => {
        if (el.shadowRoot) hideShadowElements(el.shadowRoot);
      });
    }

    // Single function to hide everything
    function hideEverything() {
      hideViewerSelector();
      hideShadowElements(document);
    }

    function scrollActiveInputIntoView() {
      const activeElement = document.activeElement;
      if (!activeElement) return;

      const isEditable =
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable;

      if (!isEditable) return;

      setTimeout(() => {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }, 150);
    }

    document.addEventListener('focusin', scrollActiveInputIntoView, true);
    window.addEventListener('resize', scrollActiveInputIntoView);

    // Run once immediately
    hideEverything();

    // Observe DOM for dynamically added elements
    const observer = new MutationObserver(hideEverything);
    observer.observe(document.body, { childList: true, subtree: true });
  })();
  true;
`;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary}
        translucent={false}
      />
      <View style={styles.headerSection}>
        <View style={styles.headerBanner} />
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>✋</Text>
              </View>
              <Text style={styles.cardTitle}>Sign Language Translator</Text>
            </View>
            <Text style={styles.cardText}>
              Enter the text you want to show as sign language, then tap the
              screen to replay the animation.
            </Text>
          </View>
        </View>
      </View>
      <WebView
        style={[styles.webView, { marginBottom: webViewBottomInset }]}
        source={{ uri: 'https://sign.mt/' }}
        injectedJavaScript={injectedJS2}
        injectedJavaScriptBeforeContentLoaded={injectedJS2}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onMessage={event => {
          console.log('FROM WEBVIEW:', event.nativeEvent.data);
        }}
        scalesPageToFit={true}
        renderLoading={() => (
          <ActivityIndicator style={styles.loader} size="large" />
        )}
      />
    </KeyboardAvoidingView>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 25,
    margin: 0,
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  headerSection: {
    position: 'relative',
    marginBottom: 60,
  },
  headerBanner: {
    height: 120,
    backgroundColor: Colors.primary,
  },
  cardContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  cardText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  bannerText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});
