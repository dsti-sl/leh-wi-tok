import React from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const index = () => {
  return (
    <WebView
      style={styles.container}
      source={{ uri: 'https://sign.mt/' }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      scalesPageToFit={true}
      renderLoading={() => (
        <ActivityIndicator style={styles.loader} size="large" />
      )}
    />
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
});
