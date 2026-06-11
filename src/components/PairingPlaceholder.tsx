/**
 * Shared instructional placeholder used by hardware-pairing screens.
 * The actual pairing action (Wi-Fi smart-config, BLE, LAN discovery) requires
 * native modules + a real device and cannot run in Expo Go / web.
 */
// TODO(phase-2): real pairing via native module + device
import React, { type ReactNode } from 'react';
import { View, Text, StyleSheet, Image, type ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from './Screen';
import { Button } from './Button';
import { colors, spacing, font, radius } from '../theme/tokens';

interface PairingPlaceholderProps {
  /** Screen header title */
  title: string;
  /** PNG asset for the main icon */
  icon: ImageSourcePropType;
  /** Step-by-step instructions shown to the user */
  instructions: string;
  /** Note explaining why the action is stubbed */
  captionNote: string;
  /** Label on the disabled action button */
  actionLabel: string;
  /** Optional extra illustration content rendered between icon and instructions */
  children?: ReactNode;
}

export function PairingPlaceholder({
  title,
  icon,
  instructions,
  captionNote,
  actionLabel,
  children,
}: PairingPlaceholderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  return (
    <Screen title={title} onBack={handleBack} scroll>
      <View style={styles.container}>
        <View style={styles.iconArea}>
          <Image source={icon} style={styles.icon} resizeMode="contain" />
        </View>

        {children}

        <Text style={styles.instructions}>{instructions}</Text>

        <View style={styles.noteBanner}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} style={styles.noteIcon} />
          <Text style={styles.noteText}>{captionNote}</Text>
        </View>

        <Button
          title={actionLabel}
          onPress={() => {}}
          disabled
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.manualLinkRow}>
          <Text style={styles.manualLinkText}>Know your Device ID? </Text>
          <Text
            style={styles.manualLink}
            onPress={() => router.push('/add-device/manual')}
            accessibilityRole="link"
          >
            Enter it manually
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    alignItems: 'stretch',
  },
  iconArea: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  icon: {
    width: 96,
    height: 96,
  },
  instructions: {
    fontSize: font.md,
    color: colors.textDarkGray,
    lineHeight: 22,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  noteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF7FD',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noteIcon: {
    marginRight: spacing.sm,
    marginTop: 1,
  },
  noteText: {
    flex: 1,
    fontSize: font.sm,
    color: colors.primary,
    lineHeight: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    marginHorizontal: spacing.sm,
    fontSize: font.sm,
    color: colors.textMuted,
  },
  manualLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  manualLinkText: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  manualLink: {
    fontSize: font.sm,
    color: colors.primary,
    fontWeight: '600',
  },
});
