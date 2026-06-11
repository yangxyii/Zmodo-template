import { Platform, View, StyleSheet } from 'react-native';
import { radius } from '../theme/tokens';

const EMBEDDED_PREVIEW_STYLE_ID = 'iotek-embedded-preview-style';

function isEmbeddedPreview() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  try {
    return window.parent !== window;
  } catch {
    return true;
  }
}

function ensureEmbeddedPreviewStyle() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  document.documentElement.dataset.iotekEmbeddedPreview = 'true';
  if (document.getElementById(EMBEDDED_PREVIEW_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = EMBEDDED_PREVIEW_STYLE_ID;
  style.textContent = `
    html,
    body,
    #root,
    #expo-root {
      width: 100%;
      height: 100%;
      min-height: 100%;
      margin: 0;
      overflow: hidden;
      background: #ffffff;
    }

    body > div,
    #root > div,
    #expo-root > div {
      width: 100%;
      height: 100%;
      min-height: 100%;
    }
  `;
  document.head.appendChild(style);
}

export function isIotekEmbeddedPreview() {
  return isEmbeddedPreview();
}

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  if (isEmbeddedPreview()) {
    ensureEmbeddedPreviewStyle();
    return <View style={styles.embeddedRoot}>{children}</View>;
  }
  return (
    <View style={styles.backdrop}>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  embeddedRoot: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1220' },
  frame: {
    width: 390,
    height: 844,
    borderRadius: radius.lg + 24, // 44 = 20 + 24 to match spec
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 10,
    borderColor: '#111',
  },
});
