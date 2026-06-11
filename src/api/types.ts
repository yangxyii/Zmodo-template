export type ApiResult<T> = {
  result: string;
  data?: T;
  error?: string;
  token?: string;
  host_list?: HostList;
};

export type HostList = Record<string, string[]>;

export interface LoginData {
  id: string;
  username: string;
  email: string;
  nickname?: string;
  photo_url?: string;
}

export interface Device {
  physical_id: string;
  device_name: string;
  device_online: string; // "0"/"1"
  device_on?: string;
  device_type: string;   // "0"=IPC "1"=NVR
  device_model?: string;
  product_id?: string;
  photo_url?: string;    // remote device thumbnail (often empty)
  permission?: string;   // JSON string {rb,pb,al,vdownload}
  aes_key?: string;
  upnp_ip?: string;
  upnp_port?: string;
  nightvision?: string;
  motion_sensitivity?: string;
  sound_detection?: string;
  imageflip?: string;
  device_volume?: string;
}

export interface DevicePermission {
  rb?: number;
  pb?: number;
  al?: number;
  vdownload?: number;
}

export const parsePermission = (d: Device): DevicePermission => {
  try {
    return d.permission ? JSON.parse(d.permission) : {};
  } catch {
    return {};
  }
};

export const isOnline = (d: Device) => d.device_online === '1';
