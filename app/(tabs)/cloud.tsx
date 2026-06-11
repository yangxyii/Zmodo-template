import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { colors } from '../../src/theme/tokens';

export default function CloudScreen() {
  return (
    <Screen title="Cloud">
      <View style={styles.centered}>
        <Image
          source={require('../../assets/zmodo/tab_cloud_off.png')}
          style={styles.icon}
          resizeMode="contain"
        />
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.subtitle}>敬请期待</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  icon: {
    width: 48,
    height: 48,
    tintColor: colors.textMuted,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
