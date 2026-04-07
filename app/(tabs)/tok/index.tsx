import React, { useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Colors } from '@/constants/Colors';

const TOK_WEBVIEW_BOOTSTRAP = `
  (function() {
    function postToNative(type) {
      if (
        window.ReactNativeWebView &&
        typeof window.ReactNativeWebView.postMessage === 'function'
      ) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type }));
      }
    }

    function isEditable(element) {
      if (!element) return false;

      return (
        element.tagName === 'INPUT' ||
        element.tagName === 'TEXTAREA' ||
        element.isContentEditable === true
      );
    }

    function hideViewerSelector() {
      const element = document.querySelector('app-viewer-selector');
      if (element) {
        element.style.display = 'none';
      }
    }

    function hideShadowElements(root) {
      if (!root || !root.querySelectorAll) return;

      const elementsToHide = root.querySelectorAll(
        'ion-header ion-toolbar:first-of-type, ion-tab-bar, .buttons-first-slot, .buttons-last-slot'
      );

      elementsToHide.forEach(function(element) {
        element.style.display = 'none';
      });

      const allElements = root.querySelectorAll('*');
      allElements.forEach(function(element) {
        if (element.shadowRoot) {
          hideShadowElements(element.shadowRoot);
        }
      });
    }

    function hideChrome() {
      hideViewerSelector();
      hideShadowElements(document);
    }

    function findEditableInRoot(root) {
      if (!root || !root.querySelectorAll) return null;

      const editable = root.querySelector(
        'textarea, input[type="text"], input:not([type]), [contenteditable="true"], [contenteditable=""]'
      );

      if (editable) return editable;

      const allElements = root.querySelectorAll('*');
      for (const element of allElements) {
        if (element.shadowRoot) {
          const nestedEditable = findEditableInRoot(element.shadowRoot);
          if (nestedEditable) return nestedEditable;
        }
      }

      return null;
    }

    function findElementsInRoot(root, selector) {
      if (!root || !root.querySelectorAll) return [];

      const matches = Array.from(root.querySelectorAll(selector));
      const allElements = root.querySelectorAll('*');

      allElements.forEach(function(element) {
        if (element.shadowRoot) {
          matches.push.apply(
            matches,
            findElementsInRoot(element.shadowRoot, selector)
          );
        }
      });

      return matches;
    }

    function setNativeValue(element, value) {
      const prototype = Object.getPrototypeOf(element);
      const valueSetter =
        prototype && Object.getOwnPropertyDescriptor(prototype, 'value')
          ? Object.getOwnPropertyDescriptor(prototype, 'value').set
          : null;

      if (valueSetter) {
        valueSetter.call(element, value);
      } else {
        element.value = value;
      }
    }

    function syncText(value) {
      const editable = findEditableInRoot(document);

      if (!editable) return false;

      try {
        editable.focus({ preventScroll: true });
      } catch (error) {
        editable.focus();
      }

      if ('value' in editable) {
        setNativeValue(editable, value);
        editable.dispatchEvent(new Event('input', { bubbles: true }));
        editable.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (editable.isContentEditable) {
        editable.textContent = value;
        editable.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
      }

      return true;
    }

    function getElementLabel(element) {
      if (!element || !element.getAttribute) return '';

      return [
        element.getAttribute('aria-label'),
        element.getAttribute('title'),
        element.getAttribute('name'),
        element.getAttribute('data-testid'),
        element.getAttribute('class'),
        element.innerText,
        element.textContent,
      ]
        .filter(Boolean)
        .join(' ')
        .trim()
        .toLowerCase();
    }

    function isCloseControl(element) {
      if (!element) return false;

      const label = getElementLabel(element);

      if (
        label === 'x' ||
        label.includes('close') ||
        label.includes('dismiss') ||
        label.includes('collapse') ||
        label.includes('minimize') ||
        label.includes('exit')
      ) {
        return true;
      }

      const iconName =
        (element.getAttribute && element.getAttribute('icon')) || '';

      return iconName.toLowerCase().includes('close');
    }

    function findActionButton(root) {
      if (!root || !root.querySelectorAll) return null;

      const selectors = [
        'button[type="submit"]',
        'button',
        '[role="button"]',
        'ion-button',
      ];

      for (const selector of selectors) {
        const buttons = root.querySelectorAll(selector);

        for (const button of buttons) {
          const label = (button.innerText || button.textContent || '')
            .trim()
            .toLowerCase();

          if (
            label.includes('translate') ||
            label.includes('show') ||
            label.includes('play') ||
            label.includes('sign')
          ) {
            return button;
          }
        }
      }

      const allElements = root.querySelectorAll('*');
      for (const element of allElements) {
        if (element.shadowRoot) {
          const nestedButton = findActionButton(element.shadowRoot);
          if (nestedButton) return nestedButton;
        }
      }

      return null;
    }

    function submitTranslation() {
      const button = findActionButton(document);

      if (!button) return false;

      button.click();
      return true;
    }

    function pauseIllustration() {
      const mediaElements = findElementsInRoot(document, 'video, audio');
      mediaElements.forEach(function(element) {
        if (typeof element.pause === 'function') {
          element.pause();
        }
      });

      const animatedPlayers = findElementsInRoot(
        document,
        'lottie-player, dotlottie-player'
      );
      animatedPlayers.forEach(function(player) {
        if (typeof player.pause === 'function') {
          player.pause();
        }
      });

      const pauseButtons = findElementsInRoot(
        document,
        'button, [role="button"], ion-button'
      ).filter(function(button) {
        const label = getElementLabel(button);
        return (
          label.includes('pause') ||
          label.includes('stop') ||
          label.includes('freeze')
        );
      });

      const pauseButton = pauseButtons[0];
      if (pauseButton && typeof pauseButton.click === 'function') {
        pauseButton.click();
      }

      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    }

    function handleViewerClose() {
      window.setTimeout(function() {
        pauseIllustration();
        hideChrome();
        postToNative('viewer_closed');
      }, 0);
    }

    function bindViewerCloseHandler() {
      document.addEventListener(
        'click',
        function(event) {
          const target =
            event.target && event.target.closest
              ? event.target.closest('button, [role="button"], ion-button')
              : null;

          if (target && isCloseControl(target)) {
            handleViewerClose();
          }
        },
        true
      );
    }

    window.__TOK_BRIDGE__ = {
      hideChrome: hideChrome,
      pauseIllustration: pauseIllustration,
      submitTranslation: submitTranslation,
      syncText: syncText,
    };

    hideChrome();
    bindViewerCloseHandler();

    const observer = new MutationObserver(function() {
      hideChrome();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  })();
  true;
`;

const buildSyncScript = (text: string): string => {
  const escapedText = JSON.stringify(text);

  return `
    (function() {
      if (window.__TOK_BRIDGE__) {
        window.__TOK_BRIDGE__.syncText(${escapedText});
      }
    })();
    true;
  `;
};

const PAUSE_ILLUSTRATION_SCRIPT = `
  (function() {
    if (window.__TOK_BRIDGE__) {
      window.__TOK_BRIDGE__.pauseIllustration();
      window.__TOK_BRIDGE__.hideChrome();
    }
  })();
  true;
`;

export default function TokScreen() {
  const webViewRef = useRef<WebView>(null);
  const [text, _] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    webViewRef.current?.injectJavaScript(buildSyncScript(text));
  }, [isReady, text]);

  const handleWebViewMessage = (event: WebViewMessageEvent): void => {
    let payload: { type?: string } | null = null;

    try {
      payload = JSON.parse(event.nativeEvent.data) as { type?: string };
    } catch {
      return;
    }

    if (payload?.type === 'viewer_closed') {
      webViewRef.current?.injectJavaScript(PAUSE_ILLUSTRATION_SCRIPT);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
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
              Type your message below. The text field stays visible above the
              keypad while the animation plays underneath.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          style={styles.webView}
          source={{ uri: 'https://sign.mt/' }}
          injectedJavaScriptBeforeContentLoaded={TOK_WEBVIEW_BOOTSTRAP}
          injectedJavaScript={TOK_WEBVIEW_BOOTSTRAP}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          keyboardDisplayRequiresUserAction={false}
          startInLoadingState={true}
          onLoadEnd={() => {
            setIsReady(true);
          }}
          onMessage={handleWebViewMessage}
          setDisplayZoomControls={true}
          scalesPageToFit={true}
          renderLoading={() => (
            <ActivityIndicator style={styles.loader} size="large" />
          )}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerSection: {
    position: 'relative',
    marginBottom: 68,
  },
  headerBanner: {
    height: 136,
    backgroundColor: Colors.primary,
  },
  cardContainer: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  composerSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  composerLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: 16,
  },
  translateButton: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  translateButtonDisabled: {
    opacity: 0.45,
  },
  translateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  webViewContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },
  webView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
});
