import React, { type ReactNode } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  type ImageSourcePropType,
} from 'react-native';
import { colors, font } from '../theme/tokens';

interface SettingsRowProps {
  /** A ReactNode (e.g. Ionicons element) OR omit if using iconImage */
  icon?: ReactNode;
  /** A require()'d PNG source — renders a 24×24 Image */
  iconImage?: ImageSourcePropType;
  label: string;
  onPress?: () => void;
  showChevron?: boolean;
  /** Shows a bottom hairline separator */
  showSeparator?: boolean;
  danger?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

const CHEVRON = require('../../assets/zmodo/icon_cell_next.png') as ImageSourcePropType;

export function SettingsRow({
  icon,
  iconImage,
  label,
  onPress,
  showChevron = true,
  showSeparator = false,
  danger = false,
  testID,
  accessibilityLabel,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {/* Left icon */}
      <View style={styles.iconWrap}>
        {iconImage ? (
          <Image source={iconImage} style={styles.icon} resizeMode="contain" />
        ) : icon ? (
          icon
        ) : null}
      </View>

      {/* Label */}
      <Text style={[styles.label, danger && styles.labelDanger]} numberOfLines={1}>
        {label}
      </Text>

      {/* Right chevron */}
      {showChevron ? (
        <Image source={CHEVRON} style={styles.chevron} resizeMode="contain" />
      ) : null}

      {/* Bottom separator drawn as an absolute line */}
      {showSeparator ? <View style={styles.separator} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: colors.bg,
  },
  rowPressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  icon: {
    width: 24,
    height: 24,
  },
  label: {
    flex: 1,
    fontSize: font.md + 1, // ~16pt
    color: colors.text,
  },
  labelDanger: {
    color: colors.danger,
  },
  chevron: {
    width: 8,
    height: 14,
    tintColor: '#C8C8C8',
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    left: 56, // inset past icon area
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
