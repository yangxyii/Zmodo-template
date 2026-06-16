/**
 * CameraVideoView.native.tsx  — iOS native implementation (M2.3)
 *
 * Renders a ZmodoVideoView backed by LibCore / YUV OpenGL decode.
 * Props:
 *   physicalId — device's physical_id (also the camera ID in the URL)
 *   mode       — "live" | "playback"
 *
 * Device lookup: uses the ['devices', token] React-Query cache populated by
 * the home screen so no extra network round-trip is needed here.
 *
 * Prop mapping to ZmodoVideoView:
 *   physicalId  → physical_id
 *   channel     → 0  (IPC single-channel; device_channel is count, not index)
 *   aesKey      → device.aes_key
 *   platform    → 0  (new Zmodo platform, confirmed from AppData+AccessServer.m)
 *   videoType   → 0  (H.264 default = DECODE_H264)
 *   deviceIp    → device.upnp_ip || ''
 *   port        → parseInt(device.upnp_port) || 0
 *   connMode    → upnp_ip present ? 5 (UPNP|TRANSFER) : 4 (TRANSFER only)
 *   token       → current auth token
 *   mode        → props.mode
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { requireNativeViewManager } from 'expo-modules-core';
import { useQuery } from '@tanstack/react-query';
import { deviceList, wakeUp } from '../api/devices';
import { useAuth } from '../store/authStore';
import { colors, font, spacing } from '../theme/tokens';
import type { StreamMode } from '../native/LibCoreBridge';

// ---------------------------------------------------------------------------
// Native view
// ---------------------------------------------------------------------------

// The Expo view registered via View(ZmodoVideoView.self) in ZmodoVideoModule.
const ZmodoVideoView = requireNativeViewManager<{
  physicalId: string;
  channel: number;
  aesKey?: string;
  platform: number;
  videoType: number;
  deviceIp: string;
  port: number;
  connMode: number;
  token?: string;
  mode: string;
  onStreamEvent?: (e: { nativeEvent: { type: string; message: string } }) => void;
  style?: object;
}>('ZmodoVideo');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CameraVideoViewProps {
  physicalId: string;
  mode: StreamMode;
  channel?: number;
  style?: object;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Native implementation — renders real video via LibCore / NormalPlayView.
 *
 * Overlays:
 *   "Connecting…" — shown until onStreamEvent type === "start"
 *   error banner  — shown on type === "error", cleared on next start
 */
export function CameraVideoView({ physicalId, mode, style }: CameraVideoViewProps) {
  const token = useAuth((s) => s.token);

  const { data: devices } = useQuery<import('../api/types').Device[]>({
    queryKey: ['devices', token],
    queryFn: () => deviceList(token!),
    enabled: !!token,
    // Reuse cached data without refetching — live screen already loaded this.
    staleTime: 5 * 60 * 1000,
  });

  const device = devices?.find((d) => d.physical_id === physicalId);

  // Stream event overlay state
  const [streamStatus, setStreamStatus] = useState<'connecting' | 'started' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');

  function handleStreamEvent(e: { nativeEvent: { type: string; message: string } }) {
    const { type, message } = e.nativeEvent;
    if (type === 'start') {
      setStreamStatus('started');
      setErrorMessage('');
    } else if (type === 'error') {
      setStreamStatus('error');
      setErrorMessage(message ?? '');
    } else if (type === 'stop') {
      // On stop, go back to connecting state (view will unmount shortly anyway)
      setStreamStatus('connecting');
    }
  }

  // Prop derivation — safe defaults when device not yet loaded.
  const upnpIp = device?.upnp_ip ?? '';
  const upnpPort = device?.upnp_port ? parseInt(device.upnp_port, 10) : 0;
  // connMode bitmask (bit0 UPNP, bit1 LAN, bit2 TRANSFER). The native app
  // always uses 5 (UPNP|TRANSFER) and only drops to 4 (TRANSFER-only) on
  // T-Mobile (LiveVideoPlayInstrumens.m). Match that default so behaviour for
  // relay cameras (empty upnp_ip) is identical to production.
  const connMode = 5;

  React.useEffect(() => {
    if (device) {
      console.log(
        '[zmodo] open camera',
        device.physical_id,
        'online=', JSON.stringify(device.device_online),
        'upnp_ip=', JSON.stringify(device.upnp_ip),
        'aes_key?', !!device.aes_key,
        'connMode=', connMode,
      );
    }
  }, [device, connMode]);

  // Wake the device (battery/low-power cams sleep and report offline). The
  // native app does this before relay playback; without it the relay has no
  // path to the device ("register transfer server failed").
  React.useEffect(() => {
    if (token && physicalId) {
      wakeUp(token, physicalId)
        .then((r) => console.log('[zmodo] wakeup result', physicalId, JSON.stringify(r?.result), JSON.stringify(r?.data)))
        .catch((e) => console.warn('[zmodo] wakeup failed', physicalId, e?.message ?? e));
    }
  }, [token, physicalId]);

  return (
    <View style={[styles.container, style]} testID="camera.liveView">
      <ZmodoVideoView
        style={styles.video}
        physicalId={physicalId}
        channel={0}
        aesKey={device?.aes_key}
        platform={0}
        videoType={0}
        deviceIp={upnpIp}
        port={upnpPort}
        connMode={connMode}
        token={token ?? undefined}
        mode={mode}
        onStreamEvent={handleStreamEvent}
      />

      {/* Connecting overlay — visible until first frame arrives */}
      {streamStatus === 'connecting' && (
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.overlayText}>Connecting…</Text>
        </View>
      )}

      {/* Error overlay */}
      {streamStatus === 'error' && (
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.overlayTitle}>连接失败 / Poor connection</Text>
          {errorMessage ? (
            <Text style={styles.overlayMessage}>{errorMessage}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.videoBg,
    width: '100%',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: font.md,
  },
  overlayTitle: {
    color: '#FFFFFF',
    fontSize: font.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  overlayMessage: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: font.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
