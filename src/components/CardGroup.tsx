import React, { type ReactNode, Children } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

interface CardGroupProps {
  children: ReactNode;
  style?: object;
}

/**
 * White rounded card that wraps SettingsRow children.
 * Automatically injects `showSeparator` between rows (all but the last).
 */
export function CardGroup({ children, style }: CardGroupProps) {
  const childArray = Children.toArray(children);

  return (
    <View style={[styles.card, style]}>
      {childArray.map((child, index) => {
        if (!React.isValidElement(child)) return child;
        // Clone to inject separator on all rows except the last
        return React.cloneElement(child as React.ReactElement<{ showSeparator?: boolean }>, {
          showSeparator: index < childArray.length - 1,
        });
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
    // Subtle card shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});
