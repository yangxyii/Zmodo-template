import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/store/authStore';
import { vaultWebUrl } from '../../src/api/vault';
import { VaultWebView } from '../../src/components/VaultWebView';
import { colors, font, spacing } from '../../src/theme/tokens';

export default function VaultScreen() {
  const token = useAuth((s) => s.token);

  if (!token) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Text style={styles.loginPrompt}>Please log in</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.webviewContainer} testID="vault.webview">
        <VaultWebView uri={vaultWebUrl(token)} />
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginPrompt: {
    fontSize: font.md,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
  },
});
