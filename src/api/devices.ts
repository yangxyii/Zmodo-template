import { postForm } from './http';
import type { Device } from './types';

export const deviceList = (token: string, start = 0, count = 50) =>
  postForm<Device[]>('app_access', '/device/device_list', { token, start, count }).then(
    (r) => {
      const list = r.data ?? [];
      // Diagnostic (not __DEV__-gated so it also lands in the device console for
      // Release): how many devices the API reports online, plus the first one's
      // raw device_online shape, so we can tell "server says all offline" from
      // "we just need to open an online device".
      const onlineCount = list.filter((d) => Number(d.device_online) === 1).length;
      console.log(
        '[zmodo] device_list:',
        list.length,
        'online:',
        onlineCount,
        'first.device_online =',
        JSON.stringify(list[0]?.device_online),
        'typeof',
        typeof list[0]?.device_online,
        'upnp_ip =',
        JSON.stringify(list[0]?.upnp_ip),
      );
      return list;
    },
  );

export const deviceModify = (
  token: string,
  physical_id: string,
  fields: Record<string, unknown>,
) =>
  postForm('app_access', '/device/device_modify', { token, physical_id, ...fields });

export const isOnlineCheck = (token: string, physical_id: string) =>
  postForm('app_access', '/device/is_online', { token, physical_id });

export const deleteDevice = (token: string, physical_id: string) =>
  postForm('app_access', '/device/device_del', { token, physical_id });

export const addDevice = (token: string, physicalId: string, deviceName: string) =>
  postForm('app_access', '/device/device_add', {
    token,
    list: JSON.stringify([{ physical_id: physicalId, device_name: deviceName }]),
  });
