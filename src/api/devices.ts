import { postForm } from './http';
import type { Device } from './types';

export const deviceList = (token: string, start = 0, count = 50) =>
  postForm<Device[]>('app_access', '/device/device_list', { token, start, count }).then(
    (r) => r.data ?? [],
  );

export const deviceModify = (
  token: string,
  physical_id: string,
  fields: Record<string, unknown>,
) =>
  postForm('app_access', '/device/device_modify', { token, physical_id, ...fields });

export const isOnlineCheck = (token: string, physical_id: string) =>
  postForm('app_access', '/device/is_online', { token, physical_id });
