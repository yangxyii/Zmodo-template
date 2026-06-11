import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../../src/components/Screen';
import { CameraVideoView } from '../../../src/components/CameraVideoView';
import { CircleIconButton } from '../../../src/components/CircleIconButton';
import { deviceList } from '../../../src/api/devices';
import { useAuth } from '../../../src/store/authStore';
import { colors, spacing, font } from '../../../src/theme/tokens';
import type { Device } from '../../../src/api/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Whether we are on a platform that can actually stream (native only for now). */
const CAN_STREAM = Platform.OS !== 'web';

const QUALITY_CYCLE: Quality[] = ['LD', 'SD', 'HD'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Quality = 'LD' | 'SD' | 'HD';

// ---------------------------------------------------------------------------
// Live screen
// ---------------------------------------------------------------------------

export default function LiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const token = useAuth((s) => s.token);

  const [quality, setQuality] = useState<Quality>('LD');
  const [soundOn, setSoundOn] = useState(false);
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
  const showHint = () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    setHint('Available in the mobile app');
    hintTimer.current = setTimeout(() => setHint(null), 2500);
  };
  useEffect(() => () => { if (hintTimer.current) clearTimeout(hintTimer.current); }, []);

  const handleRecord = () => {
    if (!CAN_STREAM) { showHint(); return; }
  };

  const handleSnapshot = () => {
    if (!CAN_STREAM) { showHint(); return; }
  };

  const handleTalk = () => {
    if (!CAN_STREAM) { showHint(); return; }
  };

  const handleSound = () => {
    if (!CAN_STREAM) { showHint(); return; }
    setSoundOn((s) => !s);
  };

  const handlePlayback = () => {
    router.push((`/camera/${id}/playback`) as any);
  };

  const handleSettings = () => {
    router.push((`/camera/${id}/settings`) as any);
  };

  const handleQuality = () => {
    setQuality((q) => {
      const idx = QUALITY_CYCLE.indexOf(q);
      return QUALITY_CYCLE[(idx + 1) % QUALITY_CYCLE.length];
    });
  };

  const handleFullscreen = () => {
    if (!CAN_STREAM) { showHint(); return; }
  };

  const settingsBtn = (
    <Pressable
      onPress={handleSettings}
      accessibilityRole="button"
      accessibilityLabel="Camera settings"
      testID="live.settings"
      style={styles.headerIconBtn}
    >
      <Ionicons name="settings-outline" size={22} color={colors.text} />
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

          {/* Quality badge — bottom-left of video */}
          <Pressable
            testID="live.quality"
            onPress={handleQuality}
            accessibilityRole="button"
            accessibilityLabel={`Video quality: ${quality}`}
            style={styles.qualityBadge}
          >
            <Text style={styles.qualityText}>{quality}</Text>
          </Pressable>

          {/* Fullscreen — bottom-right of video (plain white icon on the dark video, no circle) */}
          <View style={styles.fullscreenWrapper}>
            <Pressable
              testID="live.fullscreen"
              accessibilityLabel="Fullscreen"
              accessibilityRole="button"
              onPress={handleFullscreen}
              hitSlop={8}
            >
              <Image
                source={require('../../../assets/zmodo/live_fullscreen.png')}
                style={{ width: 22, height: 22, tintColor: '#FFFFFF' }}
                resizeMode="contain"
              />
            </Pressable>
          </View>
        </View>

        {/* ── Web hint banner ── */}
        {hint ? (
          <View style={styles.hintBanner} testID="live.hint">
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        ) : null}

        {/* ── Control bar: 5 circle buttons ── */}
        <View style={styles.controlBar}>
          <CircleIconButton
            testID="live.record"
            accessibilityLabel="Record"
            source={require('../../../assets/zmodo/live_record.png')}
            onPress={handleRecord}
            size={49}
            iconSize={24}
          />
          <CircleIconButton
            testID="live.snapshot"
            accessibilityLabel="Snapshot"
            source={require('../../../assets/zmodo/live_snapshot.png')}
            onPress={handleSnapshot}
            size={49}
            iconSize={24}
          />
          {/* Talk — center, larger */}
          <CircleIconButton
            testID="live.talk"
            accessibilityLabel="Talk"
            source={require('../../../assets/zmodo/live_talk.png')}
            onPress={handleTalk}
            size={64}
            iconSize={32}
          />
          <CircleIconButton
            testID="live.sound"
            accessibilityLabel={soundOn ? 'Mute sound' : 'Unmute sound'}
            source={
              soundOn
                ? require('../../../assets/zmodo/live_sound_on.png')
                : require('../../../assets/zmodo/live_sound_off.png')
            }
            onPress={handleSound}
            size={49}
            iconSize={24}
          />
          <CircleIconButton
            testID="live.playback"
            accessibilityLabel="Playback"
            source={require('../../../assets/zmodo/live_playback.png')}
            onPress={handlePlayback}
            size={49}
            iconSize={24}
          />
        </View>

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
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  videoWrapper: {
    width: '100%',
    backgroundColor: colors.videoBg,
    position: 'relative',
  },
  // Quality badge — overlaid bottom-left of video
  qualityBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  // Fullscreen button wrapper — bottom-right of video
  fullscreenWrapper: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  qualityText: {
    color: '#FFFFFF',
    fontSize: font.xs,
    fontWeight: '600',
  },
  // Header icon button
  headerIconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  // Hint banner
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
  // Control bar
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
