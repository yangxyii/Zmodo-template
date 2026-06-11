/**
 * Smart Home (one-key / LAN auto-discovery) placeholder screen.
 * LAN discovery requires the native mobile app and a real device on the same network.
 */
// TODO(phase-2): real pairing via native module + device (LAN broadcast / one-key pairing)
import React from 'react';
import { PairingPlaceholder } from '../../src/components/PairingPlaceholder';

export default function SmartHomeScreen() {
  return (
    <PairingPlaceholder
      title="Smart Home"
      icon={require('../../assets/zmodo/add_smarthome.png')}
      instructions="Make sure your device is powered on and connected to the same Wi-Fi network as your phone. The app will automatically search for compatible devices nearby."
      captionNote="Network discovery requires the mobile app."
      actionLabel="Search"
    />
  );
}
