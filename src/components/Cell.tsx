import React, { type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, font } from '../theme/tokens';

interface CellProps {
  title: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  testID?: string;
}

export function Cell({ title, value, onPress, right, testID }: CellProps) {
  const rowContent = (
    <>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rightSlot}>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        {right ?? null}
        {onPress ? <Text style={styles.chevron}>›</Text> : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={styles.row}
        testID={testID}
      >
        {rowContent}
      </Pressable>
    );
  }

  return (
    <View style={styles.row} testID={testID}>
      {rowContent}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 52,
  },
  title: {
    flex: 1,
    fontSize: font.md,
    color: colors.text,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    fontSize: font.md,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
});
