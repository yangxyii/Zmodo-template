import { postForm } from './http';

export const recordDate = (token: string, physical_id: string, channel: number) =>
  postForm<unknown[]>('app_access', '/device/record_date', {
    token,
    physical_id,
    channel,
  }).then((r) => r.data ?? []);

export const recordList = (
  token: string,
  physical_id: string,
  channel: number,
  recordDateStr: string,
) =>
  postForm<unknown[]>('app_access', '/device/record_list', {
    token,
    physical_id,
    channel,
    record_date: recordDateStr,
  }).then((r) => r.data ?? []);

export const storageList = (
  token: string,
  physical_id: string,
  channel: number,
  startTime: number,
  endTime: number,
) =>
  postForm<unknown[]>('app_access', '/device/storage_list', {
    token,
    physical_id,
    channel,
    start_time: startTime,
    end_time: endTime,
  }).then((r) => r.data ?? []);
