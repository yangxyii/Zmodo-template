import React from 'react';
import { Pressable, Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import { colors } from '../theme/tokens';

interface CircleIconButtonProps {
  source?: ImageSourcePropType;
  icon?: React.ReactNode;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  tintColor?: string;
  testID?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
}

/**
 * A single circular icon button. Renders either an Image (via `source`) or an
 * arbitrary React node (via `icon`). No nested Pressables.
 */
export function CircleIconButton({
  source,
  icon,
  onPress,
  size = 49,
  iconSize = 24,
  tintColor,
  testID,
  accessibilityLabel,
  disabled,
}: CircleIconButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {source ? (
        <Image
          source={source}
          style={{ width: iconSize, height: iconSize, tintColor }}
          resizeMode="contain"
        />
      ) : (
        icon ?? null
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.circleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.35,
  },
});
