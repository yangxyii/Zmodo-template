import { ZmodoVideoViewProps } from './ZmodoVideo.types';

// ZmodoVideoView is not available on the web platform.
export default function ZmodoVideoView(_props: ZmodoVideoViewProps) {
  throw new Error('ZmodoVideoView is not available on the web platform.');
}
