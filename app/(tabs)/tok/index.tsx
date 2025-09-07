import React from 'react';
import { StyleSheet, ActivityIndicator, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';

const index = () => {
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

    // Run once immediately
    hideEverything();

    // Observe DOM for dynamically added elements
    const observer = new MutationObserver(hideEverything);
    observer.observe(document.body, { childList: true, subtree: true });
  })();
  true;
`;

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          Please enter the text you want to shown as sign, click the screen to
          replay.
        </Text>
      </View>
      <WebView
        style={styles.webView}
        source={{ uri: 'https://sign.mt/' }}
        injectedJavaScript={injectedJS2}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        renderLoading={() => (
          <ActivityIndicator style={styles.loader} size="large" />
        )}
      />
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 15,
    margin: 0,
    paddingTop: 40,
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
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  bannerText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});
