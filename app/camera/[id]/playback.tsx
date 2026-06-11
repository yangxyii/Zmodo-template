import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../../src/components/Screen';
import { CameraVideoView } from '../../../src/components/CameraVideoView';
import { deviceList } from '../../../src/api/devices';
import { recordList, storageList } from '../../../src/api/playback';
import { useAuth } from '../../../src/store/authStore';
import { colors, spacing, font, radius } from '../../../src/theme/tokens';
import type { Device } from '../../../src/api/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Source = 'sd' | 'cloud';

interface SDSegment {
  start_time?: number;
  end_time?: number;
  file_type?: number;
}

interface CloudSegment {
  record_type?: number;
  start_time?: string;
  end_time?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a Date as "YYYY-MM-DD". */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Add days to a date string "YYYY-MM-DD" and return new string. */
function shiftDate(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return toDateStr(d);
}

/** Format seconds-from-midnight as HH:MM:SS. */
function secsToTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

/** Extract HH:MM part from a datetime string "YYYY-MM-DD HH:MM:SS". */
function dtToTime(dt: string): string {
  const parts = dt.split(' ');
  if (parts.length >= 2) {
    const timeParts = parts[1].split(':').slice(0, 2);
    return timeParts.join(':');
  }
  return dt;
}

// ---------------------------------------------------------------------------
// PlaybackTimeline sub-component
// ---------------------------------------------------------------------------

interface PlaybackTimelineProps {
  source: Source;
  dateStr: string;
  segments: unknown[];
  isLoading: boolean;
  isError: boolean;
  selectedIndex: number | null;
  onSelectIndex: (i: number) => void;
  onRetry?: () => void;
}

function PlaybackTimeline({
  source,
  dateStr,
  segments,
  isLoading,
  isError,
  selectedIndex,
  onSelectIndex,
  onRetry,
}: PlaybackTimelineProps) {
  if (isLoading) {
    return (
      <View style={tlStyles.center} testID="playback.timeline">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={tlStyles.center} testID="playback.timeline">
        <Text style={tlStyles.emptyText}>Failed to load recordings</Text>
        {onRetry && (
          <Pressable
            testID="playback.retry"
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry loading recordings"
          >
            <Text style={tlStyles.retryText}>Retry</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (segments.length === 0) {
    return (
      <View style={tlStyles.center} testID="playback.timeline">
        <Text style={tlStyles.emptyText}>No recordings</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={tlStyles.scroll} testID="playback.timeline">
      <View style={tlStyles.track}>
        {segments.map((seg, i) => {
          const isSelected = selectedIndex === i;
          let label = `Seg ${i + 1}`;

          if (source === 'sd') {
            const s = seg as SDSegment;
            // SD record_list start_time/end_time are seconds-from-device-midnight (per original Zmodo app).
            // If a device returns epoch seconds, labels will need adjustment.
            if (s.start_time !== undefined && s.end_time !== undefined) {
              label = `${secsToTime(s.start_time)}–${secsToTime(s.end_time)}`;
            }
          } else {
            const s = seg as CloudSegment;
            if (s.start_time && s.end_time) {
              label = `${dtToTime(s.start_time)}–${dtToTime(s.end_time)}`;
            }
          }

          return (
            <Pressable
              key={`${source}-${dateStr}-${i}`}
              testID={`playback.segment.${i}`}
              onPress={() => onSelectIndex(i)}
              accessibilityRole="button"
              accessibilityLabel={`Recording segment ${i + 1}: ${label}`}
              style={[
                tlStyles.segment,
                isSelected && tlStyles.segmentSelected,
              ]}
            >
              <Text
                style={[
                  tlStyles.segmentText,
                  isSelected && tlStyles.segmentTextSelected,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const tlStyles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  center: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  retryText: {
    fontSize: font.sm,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  segment: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgMuted,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentText: {
    fontSize: font.xs,
    color: colors.text,
  },
  segmentTextSelected: {
    color: colors.textOnPrimary ?? '#FFFFFF',
    fontWeight: '600',
  },
});

// ---------------------------------------------------------------------------
// PlaybackScreen
// ---------------------------------------------------------------------------

export default function PlaybackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const token = useAuth((s) => s.token);

  const [source, setSource] = useState<Source>('sd');
  const [dateStr, setDateStr] = useState<string>(() => toDateStr(new Date()));
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  // Resolve device name from the shared ['devices', token] query cache.
  const { data: devices } = useQuery<Device[]>({
    queryKey: ['devices', token],
    queryFn: () => deviceList(token!),
    enabled: !!token,
  });
  const device = devices?.find((d) => d.physical_id === id);
  const deviceName = device?.device_name ?? id ?? 'Playback';

  // --- SD query ---
  const {
    data: sdData,
    isLoading: sdLoading,
    isError: sdError,
    refetch: sdRefetch,
  } = useQuery<unknown[]>({
    queryKey: ['playback', 'sd', id, dateStr],
    queryFn: () => recordList(token!, id ?? '', 0, dateStr),
    enabled: !!token && source === 'sd',
  });

  // --- Cloud query: compute day boundaries as datetime strings ---
  // Cloud day window computed in LOCAL time; confirm against server timezone expectation when wiring real cloud playback.
  const {
    data: cloudData,
    isLoading: cloudLoading,
    isError: cloudError,
    refetch: cloudRefetch,
  } = useQuery<unknown[]>({
    queryKey: ['playback', 'cloud', id, dateStr],
    queryFn: () => {
      // Convert date boundary strings to unix timestamps (seconds) for the API.
      const startTs = Math.floor(new Date(`${dateStr}T00:00:00`).getTime() / 1000);
      const endTs = Math.floor(new Date(`${dateStr}T23:59:59`).getTime() / 1000);
      return storageList(token!, id ?? '', 0, startTs, endTs);
    },
    enabled: !!token && source === 'cloud',
  });

  const segments: unknown[] = source === 'sd' ? (sdData ?? []) : (cloudData ?? []);
  const isLoading = source === 'sd' ? sdLoading : cloudLoading;
  const isError = source === 'sd' ? sdError : cloudError;
  const activeRefetch = source === 'sd' ? sdRefetch : cloudRefetch;

  const isToday = dateStr >= toDateStr(new Date());

  const handlePrevDay = () => {
    setDateStr((d) => shiftDate(d, -1));
    setSelectedSegment(null);
  };

  const handleNextDay = () => {
    if (isToday) return;
    setDateStr((d) => shiftDate(d, 1));
    setSelectedSegment(null);
  };

  const handleSourceChange = (s: Source) => {
    setSource(s);
    setSelectedSegment(null);
  };

  return (
    <Screen
      title={deviceName}
      onBack={() => router.back()}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* ── Video area ── */}
        <View style={styles.videoWrapper}>
          <CameraVideoView physicalId={id ?? ''} mode="playback" />
        </View>

        {/* ── Source segmented control: SD vs Cloud ── */}
        <View style={styles.segmentedRow}>
          <Pressable
            testID="playback.tab.sd"
            onPress={() => handleSourceChange('sd')}
            accessibilityRole="button"
            accessibilityLabel="SD Card recordings"
            accessibilityState={{ selected: source === 'sd' }}
            style={[
              styles.tab,
              styles.tabLeft,
              source === 'sd' && styles.tabActive,
            ]}
          >
            <Text style={[styles.tabText, source === 'sd' && styles.tabTextActive]}>
              SD Card
            </Text>
          </Pressable>
          <Pressable
            testID="playback.tab.cloud"
            onPress={() => handleSourceChange('cloud')}
            accessibilityRole="button"
            accessibilityLabel="Cloud recordings"
            accessibilityState={{ selected: source === 'cloud' }}
            style={[
              styles.tab,
              styles.tabRight,
              source === 'cloud' && styles.tabActive,
            ]}
          >
            <Text style={[styles.tabText, source === 'cloud' && styles.tabTextActive]}>
              Cloud
            </Text>
          </Pressable>
        </View>

        {/* ── Date selector ── */}
        <View style={styles.dateRow}>
          <Pressable
            testID="playback.date.prev"
            onPress={handlePrevDay}
            accessibilityRole="button"
            accessibilityLabel="Previous day"
            style={styles.dateNavBtn}
          >
            <Text style={styles.dateNavText}>‹</Text>
          </Pressable>
          <Text style={styles.dateLabel} testID="playback.date.label">
            {dateStr}
          </Text>
          <Pressable
            testID="playback.date.next"
            onPress={handleNextDay}
            disabled={isToday}
            accessibilityRole="button"
            accessibilityLabel="Next day"
            accessibilityState={{ disabled: isToday }}
            style={[styles.dateNavBtn, isToday && styles.dateNavBtnDisabled]}
          >
            <Text style={[styles.dateNavText, isToday && styles.dateNavTextDisabled]}>›</Text>
          </Pressable>
        </View>

        {/* ── Timeline strip ── */}
        <View style={styles.timelineWrapper}>
          <PlaybackTimeline
            source={source}
            dateStr={dateStr}
            segments={segments}
            isLoading={isLoading}
            isError={isError}
            selectedIndex={selectedSegment}
            onSelectIndex={(i) => setSelectedSegment(i)}
            onRetry={() => activeRefetch()}
          />
        </View>

        {/* ── Selected segment info ── */}
        {selectedSegment !== null && segments[selectedSegment] ? (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedInfoText}>
              Segment {selectedSegment + 1} selected — open in mobile app to play
            </Text>
          </View>
        ) : null}
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
  // ── Segmented control ──
  segmentedRow: {
    flexDirection: 'row',
    margin: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  tabLeft: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  tabRight: {},
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: font.sm,
    color: colors.text,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  // ── Date selector ──
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateNavBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  dateNavBtnDisabled: {
    opacity: 0.3,
  },
  dateNavText: {
    fontSize: 24,
    color: colors.primary,
    lineHeight: 28,
  },
  dateNavTextDisabled: {
    color: colors.textMuted,
  },
  dateLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: font.md,
    color: colors.text,
    fontWeight: '500',
  },
  // ── Timeline ──
  timelineWrapper: {
    backgroundColor: colors.bg,
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'center',
  },
  // ── Selected info ──
  selectedInfo: {
    backgroundColor: colors.bgMuted,
    padding: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedInfoText: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
