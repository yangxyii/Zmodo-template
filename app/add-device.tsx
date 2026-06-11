import React from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components/Screen';
import { colors, spacing, font, radius } from '../src/theme/tokens';

interface Category {
  key: string;
  title: string;
  subtitle: string;
  icon: ReturnType<typeof require>;
  route: string;
  testID: string;
}

const CATEGORIES: Category[] = [
  {
    key: 'qr',
    title: 'QR Code',
    subtitle: 'Scan the QR code on your device',
    icon: require('../assets/zmodo/add_qr.png'),
    route: '/add-device/qr',
    testID: 'adddevice.cat.qr',
  },
  {
    key: 'wifi',
    title: 'Zink / Wi-Fi Setup',
    subtitle: 'Set up a Wi-Fi camera',
    icon: require('../assets/zmodo/add_zink.png'),
    route: '/add-device/wifi',
    testID: 'adddevice.cat.wifi',
  },
  {
    key: 'smarthome',
    title: 'Smart Home',
    subtitle: 'Auto-discover on your network',
    icon: require('../assets/zmodo/add_smarthome.png'),
    route: '/add-device/smarthome',
    testID: 'adddevice.cat.smarthome',
  },
  {
    key: 'legacy',
    title: 'Legacy / Hub',
    subtitle: 'Add a hub or accessory',
    icon: require('../assets/zmodo/add_legacy.png'),
    route: '/add-device/legacy',
    testID: 'adddevice.cat.legacy',
  },
  {
    key: 'bluetooth',
    title: 'Bluetooth',
    subtitle: 'Pair over Bluetooth',
    icon: require('../assets/zmodo/add_bluetooth.png'),
    route: '/add-device/bluetooth',
    testID: 'adddevice.cat.bluetooth',
  },
];

export default function AddDeviceScreen() {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  return (
    <Screen title="Add Device" onBack={handleBack} scroll>
      <View style={styles.container}>
        {CATEGORIES.map((cat, index) => (
          <Pressable
            key={cat.key}
            testID={cat.testID}
            onPress={() => router.push(cat.route as Parameters<typeof router.push>[0])}
            style={({ pressed }) => [
              styles.card,
              index === CATEGORIES.length - 1 && styles.cardLast,
              pressed && styles.cardPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={cat.title}
          >
            <Image source={cat.icon} style={styles.icon} resizeMode="contain" />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{cat.title}</Text>
              <Text style={styles.cardSubtitle}>{cat.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}

        <View style={styles.divider} />

        <Pressable
          testID="adddevice.manual"
          onPress={() => router.push('/add-device/manual')}
          style={({ pressed }) => [styles.manualRow, pressed && styles.cardPressed]}
          accessibilityRole="button"
          accessibilityLabel="Add manually by Device ID"
        >
          <Ionicons name="keypad-outline" size={22} color={colors.primary} style={styles.manualIcon} />
          <Text style={styles.manualText}>Add manually by Device ID</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLast: {
    marginBottom: 0,
  },
  cardPressed: {
    opacity: 0.75,
  },
  icon: {
    width: 48,
    height: 48,
    marginRight: spacing.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  manualIcon: {
    marginRight: spacing.md,
  },
  manualText: {
    flex: 1,
    fontSize: font.md,
    color: colors.primary,
    fontWeight: '500',
  },
});
