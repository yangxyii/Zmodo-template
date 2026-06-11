import { Platform, View, StyleSheet } from 'react-native';
import { radius } from '../theme/tokens';

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={styles.backdrop}>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
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
