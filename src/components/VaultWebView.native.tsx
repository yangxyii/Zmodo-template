import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export interface VaultWebViewProps {
  uri: string;
}

export function VaultWebView({ uri }: VaultWebViewProps) {
  return (
    <WebView
      source={{ uri }}
      style={styles.webview}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
