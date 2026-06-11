import { postForm, ApiError } from './http';
import { setHostList, clearHosts } from './hostStore';
import { md5 } from './md5';
import type { LoginData } from './types';

export async function login(email: string, password: string) {
  const r = await postForm<LoginData>('app_access', '/user/user_login', {
    email,
    password: md5(password),
    client: 1,
    client_uuid: globalThis.crypto?.randomUUID?.() ?? `web-${Date.now()}`,
    client_version: '8.0.0',
    language: 'en',
    platform: 2,
    app_version: '8.0.0',
    offset_second: 0,
  });
  setHostList(r.host_list);
  if (!r.token || !r.data) throw new ApiError('missing_auth_data', 'Login response missing token or user data');
  return { token: r.token, user: r.data };
}

export async function logout(token: string) {
  clearHosts();
  try { await postForm('app_access', '/user/user_logout', { token }); } catch { /* ignore */ }
}
