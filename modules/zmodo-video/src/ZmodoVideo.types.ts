import type { StyleProp, ViewStyle } from 'react-native';

export type ZmodoStreamEvent = {
  type: 'start' | 'error' | 'stop';
  message?: string;
};

export type ZmodoVideoViewProps = {
  physicalId: string;
  channel?: number;
  mode?: 'live' | 'playback';
  aesKey?: string;
  platform?: number;
  videoType?: number;
  deviceIp?: string;
  port?: number;
  connMode?: number;
  token?: string;
  startTime?: string;
  onStreamEvent?: (e: { nativeEvent: ZmodoStreamEvent }) => void;
  style?: StyleProp<ViewStyle>;
};
