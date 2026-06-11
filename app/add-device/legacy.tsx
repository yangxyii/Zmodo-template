/**
 * Hub & Accessories (legacy) placeholder screen.
 * Hub discovery requires the native mobile app and a real hub device.
 */
// TODO(phase-2): real pairing via native module + device (hub scan / accessory binding)
import React from 'react';
import { PairingPlaceholder } from '../../src/components/PairingPlaceholder';

export default function LegacyScreen() {
  return (
    <PairingPlaceholder
      title="Hub & Accessories"
      icon={require('../../assets/zmodo/add_legacy.png')}
      instructions="Select your hub to add accessories. Make sure your hub is powered on and connected to your network before searching."
      captionNote="Hub and accessory discovery requires the mobile app and a compatible hub device."
      actionLabel="Search"
    />
  );
}
