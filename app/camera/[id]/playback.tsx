import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeBack } from '../../../src/hooks/useSafeBack';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../../src/components/Screen';
import { CameraVideoView } from '../../../src/components/CameraVideoView';
import { CircleIconButton } from '../../../src/components/CircleIconButton';
import { deviceList } from '../../../src/api/devices';
import {
  searchEvents,
  eventThumbnailUrl,
  eventTypeLabel,
  type ZmodoEvent,
} from '../../../src/api/events';
import { useAuth } from '../../../src/store/authStore';
import { colors, spacing, font } from '../../../src/theme/tokens';
import type { Device } from '../../../src/api/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CAN_STREAM = Platform.OS !== 'web';

/** Hour labels for the timeline (0..23). */
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEventTime(alarmTime: string): string {
  const ms = Number(alarmTime) * 1000;
  if (Number.isNaN(ms) || ms === 0) return '';
  return new Date(ms).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

function timelineHourLabel(hour: number, refDate: Date): string {
  const d = new Date(refDate);
  d.setHours(hour, 0, 0, 0);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  if (hour === 0) {
    return `${month}/${day} 12:00 AM`;
  }
  const suffix = hour < 12 ? 'AM' : 'PM';
  const h12 = hour > 12 ? hour - 12 : hour;
  return `${String(h12).padStart(2, '0')}:00 ${suffix}`;
}

// ---------------------------------------------------------------------------
// Timeline component
// ---------------------------------------------------------------------------

function HourTimeline() {
  const now = new Date();
  const TICK_WIDTH = 80;
  const PLAYHEAD_HOUR = 0; // playhead sits at hour 0 (left side)

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={tlStyles.scroll}
      testID="playback.timeline"
    >
      <View style={tlStyles.track}>
        {/* Blue playhead */}
        <View
          style={[tlStyles.playhead, { left: PLAYHEAD_HOUR * TICK_WIDTH }]}
          pointerEvents="none"
        />
        {HOURS.map((h) => (
          <View key={h} style={[tlStyles.hourCell, { width: TICK_WIDTH }]}>
            <View style={tlStyles.tick} />
            <Text style={tlStyles.hourLabel} numberOfLines={1}>
              {timelineHourLabel(h, now)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const tlStyles = StyleSheet.create({
  scroll: {
    height: 72,
    backgroundColor: '#F7F8F9',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 72,
    paddingTop: 8,
    position: 'relative',
  },
  hourCell: {
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  tick: {
    width: 1,
    height: 12,
    backgroundColor: '#AAAAAA',
    marginBottom: 4,
  },
  hourLabel: {
    fontSize: 10,
    color: colors.textMuted,
    width: 76,
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.timelineBlue,
    zIndex: 10,
  },
});

// ---------------------------------------------------------------------------
// Alert row
// ---------------------------------------------------------------------------

interface AlertRowProps {
  ev: ZmodoEvent;
  token: string;
  testID?: string;
}

function AlertRow({ ev, token, testID }: AlertRowProps) {
  const thumbUrl = eventThumbnailUrl(token, ev);
  const label = eventTypeLabel(ev.type);
  const timeStr = formatEventTime(ev.alarm_time);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${label} alert at ${timeStr}`}
      onPress={() => {
        // TODO(phase-2): seek to event
      }}
      style={alertStyles.row}
    >
      {/* Thumbnail */}
      <View style={alertStyles.thumbWrapper}>
        {thumbUrl ? (
          <Image
            source={{ uri: thumbUrl }}
            style={alertStyles.thumb}
            resizeMode="cover"
          />
        ) : (
          <View style={[alertStyles.thumb, alertStyles.thumbPlaceholder]} />
        )}
        {/* Play triangle overlay */}
        <Image
          source={require('../../../assets/zmodo/play_triangle.png')}
          style={alertStyles.playTriangle}
          resizeMode="contain"
        />
      </View>

      {/* Text */}
      <View style={alertStyles.textCol}>
        <Text style={alertStyles.eventLabel}>{label}</Text>
        <Text style={alertStyles.eventTime}>{timeStr}</Text>
      </View>

      {/* Alarm icon */}
      <Image
        source={require('../../../assets/zmodo/alert_alarm.png')}
        style={alertStyles.alarmIcon}
        resizeMode="contain"
      />
    </Pressable>
  );
}

const alertStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  thumbWrapper: {
    width: 72,
    height: 48,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.videoBg,
    marginRight: spacing.sm,
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    backgroundColor: '#2A2A2A',
  },
  playTriangle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    marginTop: -10,
    marginLeft: -10,
  },
  textCol: {
    flex: 1,
  },
  eventLabel: {
    fontSize: font.md,
    color: colors.text,
    fontWeight: '500',
  },
  eventTime: {
    fontSize: font.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  alarmIcon: {
    width: 22,
    height: 22,
    tintColor: colors.timelineBlue,
  },
});

// ---------------------------------------------------------------------------
// Custom header for playback (title + subtitle)
// ---------------------------------------------------------------------------

interface PlaybackHeaderProps {
  deviceName: string;
  onBack: () => void;
  onTime: () => void;
  onCalendar: () => void;
}

function PlaybackHeader({ deviceName, onBack }: PlaybackHeaderProps) {
  return (
    <View style={phStyles.header}>
      <View style={phStyles.left}>
        <Pressable
          onPress={onBack}
          style={phStyles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={phStyles.backChevron}>{'‹'}</Text>
        </Pressable>
      </View>
      <View style={phStyles.center}>
        <Text style={phStyles.title} numberOfLines={1}>{deviceName}</Text>
        <Text style={phStyles.subtitle}>Cloud Playback</Text>
      </View>
      <View style={phStyles.right} />
    </View>
  );
}

const phStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  left: {
    width: 48,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 48,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backChevron: {
    fontSize: 28,
    color: colors.primary,
    lineHeight: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

// ---------------------------------------------------------------------------
// PlaybackScreen
// ---------------------------------------------------------------------------

export default function PlaybackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const goBack = useSafeBack(`/camera/${id}/live`);
  const token = useAuth((s) => s.token);

  const [isPlaying, setIsPlaying] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  // Resolve device name from the shared ['devices', token] query cache.
  const { data: devices } = useQuery<Device[]>({
    queryKey: ['devices', token],
    queryFn: () => deviceList(token!),
    enabled: !!token,
  });
  const device = devices?.find((d) => d.physical_id === id);
  const deviceName = device?.device_name ?? id ?? 'Playback';

  // Events / alerts list
  const {
    data: events,
    isLoading: alertsLoading,
    isError: alertsError,
    refetch: refetchAlerts,
  } = useQuery<ZmodoEvent[]>({
    queryKey: ['events', token, id],
    queryFn: () => searchEvents(token!, { physicalId: id ?? undefined, count: 20 }),
    enabled: !!token,
  });

  // Web hint helper
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showHint = () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    setHint('Available in the mobile app');
    hintTimer.current = setTimeout(() => setHint(null), 2500);
  };
  useEffect(() => () => { if (hintTimer.current) clearTimeout(hintTimer.current); }, []);

  const handlePlayPause = () => {
    if (!CAN_STREAM) { showHint(); return; }
    setIsPlaying((p) => !p);
  };

  const handleMute = () => {
    if (!CAN_STREAM) { showHint(); return; }
    setSoundOn((s) => !s);
  };

  const handleFullscreen = () => {
    if (!CAN_STREAM) { showHint(); return; }
  };

  const handleClip = () => {
    if (!CAN_STREAM) { showHint(); return; }
  };

  const handleSnapshot = () => {
    if (!CAN_STREAM) { showHint(); return; }
  };

  const handleTime = () => {
    if (!CAN_STREAM) { showHint(); return; }
  };

  const handleCalendar = () => {
    if (!CAN_STREAM) { showHint(); return; }
  };

  // Timestamp displayed on the video overlay (static placeholder)
  const nowLabel = (() => {
    const d = new Date();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    const hrs = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const sec = String(d.getSeconds()).padStart(2, '0');
    const suffix = hrs >= 12 ? 'PM' : 'AM';
    const h12 = hrs % 12 || 12;
    return `${mo}/${dy} ${String(h12).padStart(2, '0')}:${min}:${sec} ${suffix}`;
  })();

  return (
    <View style={styles.root}>
      <PlaybackHeader
        deviceName={deviceName}
        onBack={goBack}
        onTime={handleTime}
        onCalendar={handleCalendar}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* ── Video area ── */}
        <View style={styles.videoWrapper}>
          <CameraVideoView physicalId={id ?? ''} mode="playback" />

          {/* Video overlay controls row */}
          <View style={styles.videoOverlay}>
            {/* Play/Pause */}
            <Pressable
              testID="playback.playPause"
              onPress={handlePlayPause}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              style={styles.overlayIconBtn}
            >
              <Image
                source={
                  isPlaying
                    ? require('../../../assets/zmodo/pb_pause.png')
                    : require('../../../assets/zmodo/pb_play.png')
                }
                style={styles.overlayIcon}
                resizeMode="contain"
              />
            </Pressable>

            {/* Timestamp */}
            <Text style={styles.overlayTimestamp}>{nowLabel}</Text>

            {/* Mute */}
            <Pressable
              testID="playback.mute"
              onPress={handleMute}
              accessibilityRole="button"
              accessibilityLabel={soundOn ? 'Mute' : 'Unmute'}
              style={styles.overlayIconBtn}
            >
              <Image
                source={
                  soundOn
                    ? require('../../../assets/zmodo/pb_sound.png')
                    : require('../../../assets/zmodo/pb_mute.png')
                }
                style={styles.overlayIcon}
                resizeMode="contain"
              />
            </Pressable>

            {/* Fullscreen */}
            <Pressable
              testID="playback.fullscreen"
              onPress={handleFullscreen}
              accessibilityRole="button"
              accessibilityLabel="Fullscreen"
              style={styles.overlayIconBtn}
            >
              <Image
                source={require('../../../assets/zmodo/pb_fullscreen.png')}
                style={styles.overlayIcon}
                resizeMode="contain"
              />
            </Pressable>
          </View>
        </View>

        {/* ── Web hint banner ── */}
        {hint ? (
          <View style={styles.hintBanner} testID="playback.hint">
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        ) : null}

        {/* ── Timeline ── */}
        <HourTimeline />

        {/* ── Alerts section header ── */}
        <View style={styles.alertsHeader}>
          <Text style={styles.alertsTitle}>Alerts</Text>
          <Pressable
            testID="playback.categories"
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Filter alert categories"
            style={styles.categoriesPill}
          >
            <Text style={styles.categoriesText}>Categories</Text>
          </Pressable>
        </View>

        {/* ── Alerts list: loading / error / empty / data ── */}
        {alertsLoading ? (
          <View style={styles.emptyAlerts} testID="playback.alertsLoading">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : alertsError ? (
          <View style={styles.emptyAlerts}>
            <Text style={styles.emptyAlertsText}>Couldn&apos;t load alerts.</Text>
            <Pressable
              testID="playback.alertsRetry"
              onPress={() => refetchAlerts()}
              accessibilityRole="button"
              style={styles.retryBtn}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (events ?? []).length === 0 ? (
          <View style={styles.emptyAlerts}>
            <Text style={styles.emptyAlertsText}>No alerts</Text>
          </View>
        ) : (
          (events ?? []).map((ev, i) => (
            <AlertRow
              key={ev.id ?? i}
              ev={ev}
              token={token ?? ''}
              testID="playback.alertRow"
            />
          ))
        )}

        {/* ── Bottom control bar: 4 circles ── */}
        <View style={styles.controlBar}>
          <CircleIconButton
            testID="playback.clip"
            accessibilityLabel="Clip"
            source={require('../../../assets/zmodo/pb_clip.png')}
            onPress={handleClip}
            size={49}
            iconSize={24}
          />
          <CircleIconButton
            testID="playback.snapshot"
            accessibilityLabel="Snapshot"
            source={require('../../../assets/zmodo/live_snapshot.png')}
            onPress={handleSnapshot}
            size={49}
            iconSize={24}
          />
          <CircleIconButton
            testID="playback.time"
            accessibilityLabel="Time"
            icon={<Ionicons name="time-outline" size={24} color={colors.text} />}
            onPress={handleTime}
            size={49}
            iconSize={24}
          />
          <CircleIconButton
            testID="playback.calendar"
            accessibilityLabel="Calendar"
            source={require('../../../assets/zmodo/pb_calendar.png')}
            onPress={handleCalendar}
            size={49}
            iconSize={24}
          />
        </View>

      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  // Video
  videoWrapper: {
    width: '100%',
    backgroundColor: colors.videoBg,
  },
  videoOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  overlayIconBtn: {
    padding: 6,
  },
  overlayIcon: {
    width: 22,
    height: 22,
    tintColor: '#FFFFFF',
  },
  overlayTimestamp: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: font.xs,
    textAlign: 'center',
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
  // Alerts section
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgMuted,
  },
  alertsTitle: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.text,
  },
  categoriesPill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: colors.bg,
  },
  categoriesText: {
    fontSize: font.xs,
    color: colors.text,
  },
  emptyAlerts: {
    padding: spacing.md,
    alignItems: 'center',
  },
  retryBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryText: {
    color: colors.primary,
    fontSize: font.sm,
    fontWeight: '600',
  },
  emptyAlertsText: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  // Bottom control bar
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
});
