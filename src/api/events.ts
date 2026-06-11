import { postForm } from './http';
import { hostFor } from './hostStore';
import { API_PROXY } from '../config';

export interface ZmodoEvent {
  id: string;
  from_id: string;
  device_name: string;
  type: string;           // "0" = Motion
  alarm_time: string;     // unix seconds (string)
  create_time: string;
  image_url: string;      // relative path
  video_url: string;
  cloud_playback: string; // "1" = cloud clip available
  moving_object: string;
  channel: number;
  if_read: string;        // "0"/"1"
}

export async function searchEvents(
  token: string,
  opts: { physicalId?: string; count?: number; maxTime?: number } = {},
): Promise<ZmodoEvent[]> {
  const params: Record<string, unknown> = {
    token,
    count: opts.count ?? 20,
    max_time: opts.maxTime ?? 0,
    main_type: 1,
  };
  if (opts.physicalId) params.physical_id = opts.physicalId;
  const r = await postForm<ZmodoEvent[]>('alerts', '/message/search', params);
  return r.data ?? [];
}

/**
 * Build a URL to fetch an event thumbnail JPEG.
 * On web the request is routed through API_PROXY to defeat CORS.
 */
export function eventThumbnailUrl(
  token: string,
  ev: { from_id: string; image_url: string },
): string | null {
  if (!ev.image_url) return null;
  const base = hostFor('alerts');
  const target =
    `${base}/storage/get_file` +
    `?token=${encodeURIComponent(token)}` +
    `&physical_id=${encodeURIComponent(ev.from_id)}` +
    `&url=${encodeURIComponent(ev.image_url)}`;
  return API_PROXY ? `${API_PROXY}?url=${encodeURIComponent(target)}` : target;
}

export function eventTypeLabel(type: string): string {
  switch (type) {
    case '0':
    default:
      return 'Motion';
  }
}
