import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { searchEvents, eventThumbnailUrl, eventTypeLabel, type ZmodoEvent } from '../../src/api/events';
import { deviceList } from '../../src/api/devices';
import { useAuth } from '../../src/store/authStore';
import type { Device } from '../../src/api/types';
import { colors, spacing, font, radius } from '../../src/theme/tokens';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(alarmTime: string): string {
  const d = new Date(Number(alarmTime) * 1000);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDateHeader(alarmTime: string): string {
  const d = new Date(Number(alarmTime) * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function localDateKey(alarmTime: string): string {
  const d = new Date(Number(alarmTime) * 1000);
  // YYYY-MM-DD in local time — stable sort key
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface EventGroup {
  dateKey: string;
  dateLabel: string;
  events: ZmodoEvent[];
}

function groupByDate(events: ZmodoEvent[]): EventGroup[] {
  const map = new Map<string, EventGroup>();
  for (const ev of events) {
    const key = localDateKey(ev.alarm_time);
    if (!map.has(key)) {
      map.set(key, { dateKey: key, dateLabel: formatDateHeader(ev.alarm_time), events: [] });
    }
    map.get(key)!.events.push(ev);
  }
  // Sort descending (newest date first)
  return Array.from(map.values()).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
}

// ─── EventRow ───────────────────────────────────────────────────────────────

interface EventRowProps {
  ev: ZmodoEvent;
  token: string;
  onPress: (ev: ZmodoEvent) => void;
}

function EventRow({ ev, token, onPress }: EventRowProps) {
  const thumbUri = eventThumbnailUrl(token, ev);
  const time = formatTime(ev.alarm_time);
  const label = eventTypeLabel(ev.type);

  return (
    <Pressable
      testID="events.row"
      accessibilityLabel={`${label} event from ${ev.device_name} at ${time}`}
      accessibilityRole="button"
      style={styles.row}
      onPress={() => onPress(ev)}
    >
      {/* Thumbnail */}
      <View style={styles.thumbContainer}>
        {thumbUri ? (
          <Image
            source={{ uri: thumbUri }}
            style={styles.thumb}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
        {/* Play overlay */}
        <View style={styles.playOverlay} pointerEvents="none">
          <Ionicons name="play" size={18} color="#FFFFFF" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.rowContent}>
        <View style={styles.rowTitleRow}>
          {ev.cloud_playback === '1' && (
            <Ionicons
              name="cloud"
              size={14}
              color={colors.primary}
              style={styles.cloudIcon}
            />
          )}
          <Text style={styles.rowTitle}>{label}</Text>
        </View>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {time} - {ev.device_name}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── DevicePicker ────────────────────────────────────────────────────────────

interface DevicePickerProps {
  devices: Device[];
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
  onClose: () => void;
}

function DevicePicker({ devices, selectedId, onSelect, onClose }: DevicePickerProps) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.pickerSheet}>
          <Pressable
            style={[styles.pickerOption, !selectedId && styles.pickerOptionSelected]}
            onPress={() => { onSelect(undefined); onClose(); }}
          >
            <Text style={[styles.pickerOptionText, !selectedId && styles.pickerOptionTextSelected]}>
              All devices
            </Text>
          </Pressable>
          {devices.map((d) => (
            <Pressable
              key={d.physical_id}
              style={[styles.pickerOption, selectedId === d.physical_id && styles.pickerOptionSelected]}
              onPress={() => { onSelect(d.physical_id); onClose(); }}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  selectedId === d.physical_id && styles.pickerOptionTextSelected,
                ]}
              >
                {d.device_name}
              </Text>
            </Pressable>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── EventsScreen ────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const router = useRouter();
  const token = useAuth((s) => s.token);

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [showDevicePicker, setShowDevicePicker] = useState(false);

  // Fetch device list for the "All devices" filter
  const { data: devices = [] } = useQuery({
    queryKey: ['devices', token],
    queryFn: () => deviceList(token!),
    enabled: !!token,
  });

  // Fetch events
  const {
    data: events = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['events', token, selectedDeviceId],
    queryFn: () =>
      searchEvents(token!, {
        physicalId: selectedDeviceId,
        count: 30,
      }),
    enabled: !!token,
    // TODO(phase-2): pagination — pass oldest alarm_time as maxTime to load more
  });

  const onEventPress = useCallback(
    (ev: ZmodoEvent) => {
      // TODO(phase-2): open event detail / clip viewer
      if (ev.cloud_playback === '1') {
        router.push(`/camera/${ev.from_id}/playback` as any);
      }
    },
    [router],
  );

  const selectedDevice = devices.find((d) => d.physical_id === selectedDeviceId);
  const deviceFilterLabel = selectedDevice ? selectedDevice.device_name : 'All devices';

  const groups = groupByDate(events);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>Events</Text>
        <View style={styles.headerRight}>
          <Pressable
            testID="events.edit"
            accessibilityRole="button"
            accessibilityLabel="Edit"
            onPress={() => { /* TODO(phase-2): selection mode */ }}
          >
            <Text style={styles.editButton}>Edit</Text>
          </Pressable>
        </View>
      </View>

      {/* Filter row */}
      <View style={styles.filterRow}>
        <Pressable
          testID="events.filter.devices"
          accessibilityRole="button"
          accessibilityLabel={deviceFilterLabel}
          style={styles.filterBtn}
          onPress={() => setShowDevicePicker(true)}
        >
          <Text style={styles.filterBtnText} numberOfLines={1}>{deviceFilterLabel}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textDarkGray} />
        </Pressable>

        {/* All categories — visual placeholder for phase 1 */}
        <Pressable
          testID="events.filter.categories"
          accessibilityRole="button"
          accessibilityLabel="All categories"
          style={styles.filterBtn}
          onPress={() => { /* TODO(phase-2): category filter */ }}
        >
          <Text style={styles.filterBtnText}>All categories</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textDarkGray} />
        </Pressable>
      </View>

      {/* Body */}
      {isLoading && !isRefetching ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load events.</Text>
          <Pressable style={styles.retryBtn} onPress={() => void refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No events</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
        >
          {groups.map((group) => (
            <View key={group.dateKey}>
              {/* Date section header */}
              <Text style={styles.sectionHeader}>{group.dateLabel}</Text>

              {/* White card containing event rows */}
              <View style={styles.card}>
                {group.events.map((ev, idx) => (
                  <View key={ev.id}>
                    <EventRow ev={ev} token={token!} onPress={onEventPress} />
                    {idx < group.events.length - 1 && <View style={styles.separator} />}
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* TODO(phase-2): pagination — "Load more" / infinite scroll */}
        </ScrollView>
      )}

      {/* Device picker modal */}
      {showDevicePicker && (
        <DevicePicker
          devices={devices}
          selectedId={selectedDeviceId}
          onSelect={setSelectedDeviceId}
          onClose={() => setShowDevicePicker(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const THUMB_WIDTH = 96;
const THUMB_HEIGHT = 56; // ~16:9

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    width: 48,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: font.lg,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 48,
    alignItems: 'flex-end',
  },
  editButton: {
    fontSize: font.md,
    color: colors.primary,
  },
  // Filter row
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.bgMuted,
  },
  filterBtnText: {
    fontSize: font.sm,
    color: colors.textDarkGray,
    flexShrink: 1,
  },
  // Body states
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontSize: font.md,
    color: colors.textMuted,
  },
  retryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  retryBtnText: {
    fontSize: font.md,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: font.md,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  // Section header
  sectionHeader: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textDarkGray,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  // Card
  card: {
    marginHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: THUMB_WIDTH + spacing.md * 2,
  },
  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: THUMB_HEIGHT + spacing.md,
  },
  // Thumbnail
  thumbContainer: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.videoBg,
    marginRight: spacing.sm,
  },
  thumb: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
  },
  thumbPlaceholder: {
    backgroundColor: colors.videoBg,
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  // Row content
  rowContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cloudIcon: {
    marginRight: 2,
  },
  rowTitle: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: font.sm,
    color: colors.textDarkGray,
  },
  // Device picker modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  pickerSheet: {
    width: '100%',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerOptionSelected: {
    backgroundColor: colors.bgMuted,
  },
  pickerOptionText: {
    fontSize: font.md,
    color: colors.text,
  },
  pickerOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});
