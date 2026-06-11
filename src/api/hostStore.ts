import { IOTEK_BASE_URL } from '../config';
import type { HostList } from './types';

let hosts: HostList = {};

export const setHostList = (h?: HostList) => {
  if (h) hosts = h;
};

export const hostFor = (category: string): string =>
  hosts[category]?.[0] ?? IOTEK_BASE_URL;

export const clearHosts = () => {
  hosts = {};
};
