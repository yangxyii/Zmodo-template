/**
 * Wi-Fi Setup (Zink) placeholder screen.
 * Wi-Fi smart-config / sound pairing requires the native mobile app and a real device.
 */
// TODO(phase-2): real pairing via native module + device (libSmartLink Zink/sound-wave pairing)
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { PairingPlaceholder } from '../../src/components/PairingPlaceholder';
import { colors, spacing } from '../../src/theme/tokens';

export default function WifiScreen() {
  return (
    <PairingPlaceholder
      title="Wi-Fi Setup"
      icon={require('../../assets/zmodo/add_zink.png')}
      instructions={
        '1. Power on your device and press the reset button until you hear a beep.\n\n' +
        '2. Connect your phone to the 2.4 GHz Wi-Fi network you want the device to join.\n\n' +
        '3. Tap Start Pairing and follow the on-screen prompts.'
      }
      captionNote="Wi-Fi setup requires the mobile app and your device."
      actionLabel="Start Pairing"
    >
      {/* Step illustration: power icon → wifi icon */}
      <View style={styles.stepRow}>
        <Image
          source={require('../../assets/zmodo/add_power.png')}
          style={styles.stepIcon}
          resizeMode="contain"
        />
        <View style={styles.stepArrow} />
        <Image
          source={require('../../assets/zmodo/add_wifi.png')}
          style={styles.stepIcon}
          resizeMode="contain"
        />
      </View>
    </PairingPlaceholder>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  stepIcon: {
    width: 48,
    height: 48,
  },
  stepArrow: {
    width: 32,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
});
