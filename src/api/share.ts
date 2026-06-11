import { postForm } from './http';

export const shareAdd = (token: string, physical_id: string, email: string) =>
  postForm('app_access', '/device/share_add', { token, physical_id, account: email });
