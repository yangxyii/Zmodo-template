/**
 * Bluetooth pairing placeholder screen.
 * BLE pairing requires the native mobile app and a real device.
 */
// TODO(phase-2): real pairing via native module + device (BLE scan / GATT pairing)
import React from 'react';
import { PairingPlaceholder } from '../../src/components/PairingPlaceholder';

export default function BluetoothScreen() {
  return (
    <PairingPlaceholder
      title="Bluetooth"
      icon={require('../../assets/zmodo/add_bluetooth.png')}
      instructions="Enable Bluetooth on your phone and keep your device nearby. The app will scan for compatible devices and guide you through pairing."
      captionNote="Bluetooth pairing requires the mobile app."
      actionLabel="Scan"
    />
  );
}
