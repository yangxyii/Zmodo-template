import { requireNativeView } from 'expo';
import * as React from 'react';

import { ZmodoVideoViewProps } from './ZmodoVideo.types';

const NativeView: React.ComponentType<ZmodoVideoViewProps> = requireNativeView('ZmodoVideo');

export default function ZmodoVideoView(props: ZmodoVideoViewProps) {
  return <NativeView {...props} />;
}
