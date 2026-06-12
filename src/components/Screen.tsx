import React, { type ReactNode } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, font } from '../theme/tokens';

interface ScreenProps {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  testID?: string;
}

export function Screen({
  title,
  onBack,
  right,
  children,
  scroll = false,
  testID,
}: ScreenProps) {
  const hasHeader = title || onBack || right;

  return (
    <SafeAreaView
      style={styles.safe}
      testID={testID}
    >
      {hasHeader ? (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={styles.backChevron}>‹</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {title ?? ''}
          </Text>
          <View style={styles.headerRight}>{right ?? null}</View>
        </View>
      ) : null}
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.body}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    width: 48,
    alignItems: 'flex-start',
    overflow: 'visible',
  },
  headerRight: {
    minWidth: 48,
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: font.lg,
    fontWeight: '600',
    color: colors.text,
  },
  backButton: {
    padding: spacing.xs,
  },
  backChevron: {
    fontSize: 28,
    color: colors.primary,
    lineHeight: 32,
  },
  body: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
