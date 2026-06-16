import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VaultWebView } from '../../src/components/VaultWebView';
import { colors } from '../../src/theme/tokens';

// The native Zmodo "Store" tab is a WKWebView pointing at the public Zmodo
// online store (ZmodoStoreViewController). No token required.
const STORE_URL =
  'https://www.zmodo.com?utm_campaign=loading&utm_source=iosApp&utm_medium=Referral';

export default function StoreScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.webviewContainer} testID="store.webview">
        <VaultWebView uri={STORE_URL} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  webviewContainer: {
    flex: 1,
  },
});
