import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../../src/components/Screen';
import { CameraVideoView } from '../../../src/components/CameraVideoView';
import { deviceList } from '../../../src/api/devices';
import { useAuth } from '../../../src/store/authStore';
import { colors, spacing, font, radius } from '../../../src/theme/tokens';
import type { Device } from '../../../src/api/types';

/** Whether we are on a platform that can actually stream (native only for now). */
const CAN_STREAM = Platform.OS !== 'web';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Quality = 'HD' | 'SD';

// ---------------------------------------------------------------------------
// Control bar button
// ---------------------------------------------------------------------------

interface CtrlBtnProps {
  label: string;
  icon: string;
  testID?: string;
  onPress: () => void;
  disabled?: boolean;
}

function CtrlBtn({ label, icon, testID, onPress, disabled }: CtrlBtnProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.ctrlBtn,
        pressed && !disabled && styles.ctrlBtnPressed,
        disabled && styles.ctrlBtnDisabled,
      ]}
    >
      <Text style={[styles.ctrlIcon, disabled && styles.ctrlIconDisabled]}>{icon}</Text>
      <Text style={[styles.ctrlLabel, disabled && styles.ctrlLabelDisabled]}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// PTZ direction pad
// ---------------------------------------------------------------------------

interface PtzPadProps {
  onPress: (dir: 'up' | 'down' | 'left' | 'right') => void;
  disabled?: boolean;
}

function PtzPad({ onPress, disabled }: PtzPadProps) {
  return (
    <View style={styles.ptzContainer}>
      <Text style={styles.ptzTitle}>PTZ Control</Text>
      <View style={styles.ptzRow}>
        <View style={styles.ptzSpacer} />
        <Pressable
          onPress={() => onPress('up')}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="PTZ up"
          testID="ptz.up"
          style={[styles.ptzBtn, disabled && styles.ctrlBtnDisabled]}
        >
          <Text style={styles.ptzIcon}>▲</Text>
        </Pressable>
        <View style={styles.ptzSpacer} />
      </View>
      <View style={styles.ptzRow}>
        <Pressable
          onPress={() => onPress('left')}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="PTZ left"
          testID="ptz.left"
          style={[styles.ptzBtn, disabled && styles.ctrlBtnDisabled]}
        >
          <Text style={styles.ptzIcon}>◀</Text>
        </Pressable>
        <View style={styles.ptzCenter} />
        <Pressable
          onPress={() => onPress('right')}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="PTZ right"
          testID="ptz.right"
          style={[styles.ptzBtn, disabled && styles.ctrlBtnDisabled]}
        >
          <Text style={styles.ptzIcon}>▶</Text>
        </Pressable>
      </View>
      <View style={styles.ptzRow}>
        <View style={styles.ptzSpacer} />
        <Pressable
          onPress={() => onPress('down')}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="PTZ down"
          testID="ptz.down"
          style={[styles.ptzBtn, disabled && styles.ctrlBtnDisabled]}
        >
          <Text style={styles.ptzIcon}>▼</Text>
        </Pressable>
        <View style={styles.ptzSpacer} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Live screen
// ---------------------------------------------------------------------------

export default function LiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const token = useAuth((s) => s.token);

  // TODO(phase-2): sync isPlaying to real player state when native streaming is wired.
  const [isPlaying, setIsPlaying] = useState(true);
  const [quality, setQuality] = useState<Quality>('HD');
  const [soundOn, setSoundOn] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const { data: devices } = useQuery<Device[]>({
    queryKey: ['devices', token],
    queryFn: () => deviceList(token!),
    enabled: !!token,
  });

  const device = devices?.find((d) => d.physical_id === id);
  const deviceName = device?.device_name ?? id ?? 'Camera';

  // Web hint helper — shows a transient message when native-only actions are pressed.
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showWebHint = (msg: string) => {
    if (!CAN_STREAM) {
      if (hintTimer.current) clearTimeout(hintTimer.current);
      setHint(msg);
      hintTimer.current = setTimeout(() => setHint(null), 2500);
    }
  };
  useEffect(() => () => { if (hintTimer.current) clearTimeout(hintTimer.current); }, []);

  const handlePlayPause = () => {
    if (!CAN_STREAM) { showWebHint('Playback control available in the mobile app'); return; }
    setIsPlaying((p) => !p);
  };

  const handleSnapshot = () => {
    if (!CAN_STREAM) { showWebHint('Snapshot available in the mobile app'); return; }
  };

  const handleRecord = () => {
    if (!CAN_STREAM) { showWebHint('Recording available in the mobile app'); return; }
  };

  const handleQuality = () => {
    if (!CAN_STREAM) { showWebHint('Quality switch available in the mobile app'); return; }
    setQuality((q) => (q === 'HD' ? 'SD' : 'HD'));
  };

  const handleSound = () => {
    if (!CAN_STREAM) { showWebHint('Audio control available in the mobile app'); return; }
    setSoundOn((s) => !s);
  };

  const handleTalk = () => {
    if (!CAN_STREAM) { showWebHint('Two-way talk available in the mobile app'); return; }
    setIsTalking((t) => !t);
  };

  const handlePtz = (_dir: 'up' | 'down' | 'left' | 'right') => {
    if (!CAN_STREAM) { showWebHint('PTZ control available in the mobile app'); return; }
  };

  const handleSettings = () => {
    // TODO(phase-2): replace `as any` cast when /camera/[id]/settings route is implemented.
    router.push((`/camera/${id}/settings`) as any);
  };

  const handlePlayback = () => {
    // TODO(phase-2): replace `as any` cast when /camera/[id]/playback route is implemented.
    router.push((`/camera/${id}/playback`) as any);
  };

  const settingsBtn = (
    <Pressable
      onPress={handleSettings}
      accessibilityRole="button"
      accessibilityLabel="Camera settings"
      testID="live.settings"
      style={styles.settingsBtn}
    >
      <Text style={styles.settingsIcon}>⚙</Text>
    </Pressable>
  );

  return (
    <Screen
      title={deviceName}
      onBack={() => router.back()}
      right={settingsBtn}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* ── Video area ── */}
        <View style={styles.videoWrapper}>
          <CameraVideoView physicalId={id ?? ''} mode="live" />
        </View>

        {/* ── Web hint banner ── */}
        {hint ? (
          <View style={styles.hintBanner} testID="live.hint">
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        ) : null}

        {/* ── Control bar ── */}
        <View style={styles.controlBar}>
          <CtrlBtn
            testID="live.playPause"
            label={isPlaying ? 'Pause' : 'Play'}
            icon={isPlaying ? '⏸' : '▶'}
            onPress={handlePlayPause}
          />
          <CtrlBtn
            testID="live.snapshot"
            label="Snapshot"
            icon="📸"
            onPress={handleSnapshot}
          />
          <CtrlBtn
            testID="live.record"
            label="Record"
            icon="⏺"
            onPress={handleRecord}
          />
          <CtrlBtn
            testID="live.quality"
            label={quality}
            icon="🎞"
            onPress={handleQuality}
          />
          <CtrlBtn
            testID="live.sound"
            label={soundOn ? 'Mute' : 'Sound'}
            icon={soundOn ? '🔊' : '🔇'}
            onPress={handleSound}
          />
          <CtrlBtn
            testID="live.talk"
            label={isTalking ? 'End Talk' : 'Talk'}
            icon="🎤"
            onPress={handleTalk}
          />
        </View>

        {/* ── PTZ direction pad ── */}
        {/* Fix 5: PTZ stays pressable on web so pressing shows the hint banner, consistent with control-bar buttons. */}
        <PtzPad onPress={handlePtz} />

        {/* ── Playback entry ── */}
        <Pressable
          testID="live.playback"
          onPress={handlePlayback}
          accessibilityRole="button"
          accessibilityLabel="Go to playback"
          style={styles.playbackBtn}
        >
          <Text style={styles.playbackText}>Playback</Text>
          <Text style={styles.playbackChevron}>›</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bgMuted,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  videoWrapper: {
    width: '100%',
    backgroundColor: colors.videoBg,
  },
  hintBanner: {
    backgroundColor: colors.bgMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  hintText: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  controlBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    backgroundColor: colors.bg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ctrlBtn: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 52,
  },
  ctrlBtnPressed: {
    opacity: 0.6,
  },
  ctrlBtnDisabled: {
    opacity: 0.35,
  },
  ctrlIcon: {
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
  },
  ctrlIconDisabled: {
    color: colors.textMuted,
  },
  ctrlLabel: {
    fontSize: font.xs,
    color: colors.text,
    marginTop: 2,
    textAlign: 'center',
  },
  ctrlLabelDisabled: {
    color: colors.textMuted,
  },
  // PTZ
  ptzContainer: {
    backgroundColor: colors.bg,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ptzTitle: {
    fontSize: font.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ptzRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ptzBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.xs,
    backgroundColor: colors.bgMuted,
    borderRadius: radius.sm,
  },
  ptzIcon: {
    fontSize: 18,
    color: colors.text,
  },
  ptzCenter: {
    width: 44,
    height: 44,
    margin: spacing.xs,
  },
  ptzSpacer: {
    width: 44 + spacing.xs * 2,
  },
  // Playback entry
  playbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  playbackText: {
    fontSize: font.md,
    color: colors.text,
    fontWeight: '500',
  },
  playbackChevron: {
    fontSize: 20,
    color: colors.textMuted,
  },
  settingsBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  settingsIcon: {
    fontSize: 20,
    color: colors.primary,
  },
});
