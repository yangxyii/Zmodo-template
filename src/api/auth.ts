import { postForm, ApiError } from './http';
import { setHostList, clearHosts, rawHost } from './hostStore';
import { md5 } from './md5';
import type { LoginData } from './types';
import { useAuth } from '../store/authStore';
import { connectServer } from '../native/zmodoSession';

/** Parameters needed to connect LibCore to the Zmodo access server (TRANSFER relay). */
export interface ConnectServerParams {
  /** Login token */
  token_id: string;
  /** User ID as string */
  client_id: string;
  /** Access server IP (from host_list["user_conn"] or host_list["userconn"]) */
  acc_srv_ip: string;
  /** Access server port */
  acc_srv_port: number;
  /** Optional AES encryption key from login response data */
  encrypt_key?: string;
  /** Optional encryption key ID from login response data */
  encrypt_key_id?: string;
  /** Client app ID — always "0" for Zmodo */
  cid: string;
}

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

  // Build access-server connect params for native platforms.
  // host_list["user_conn"] (new platform) or ["userconn"] (old) holds
  // the relay server in "ip:port" format (confirmed from WebServerManager.m).
  const connectParams = buildConnectParams(r.token, r.data, r.host_list);

  return { token: r.token, user: r.data, connectParams };
}

/**
 * Parse the login API response into the ConnectServerParams dict that
 * ZmodoSession.connect / LibCoreWrap.connectServer:paramDic: expects.
 * Returns null if the required userconn host is absent or unparseable.
 */
function buildConnectParams(
  token: string,
  data: LoginData,
  hostList?: Record<string, string[]>,
): ConnectServerParams | null {
  // The host_list key is "user_conn" (new platform) confirmed from
  // AllWebInterfaceName.h: kUserConnKey = @"user_conn".
  // Fall back to "userconn" as a safety net for old-platform responses.
  const userConnEntry =
    hostList?.['user_conn']?.[0] ?? hostList?.['userconn']?.[0] ?? null;

  if (!userConnEntry) return null;

  const colonIdx = userConnEntry.lastIndexOf(':');
  if (colonIdx < 0) return null;

  const acc_srv_ip = userConnEntry.slice(0, colonIdx);
  const acc_srv_port = parseInt(userConnEntry.slice(colonIdx + 1), 10);
  if (!acc_srv_ip || isNaN(acc_srv_port)) return null;

  const params: ConnectServerParams = {
    token_id: token,
    client_id: String(data.id),
    acc_srv_ip,
    acc_srv_port,
    cid: '0', // Zmodo app cid confirmed from Utilities.m appCid: return 0
  };
  if (data.encrypt_key) params.encrypt_key = data.encrypt_key;
  if (data.encrypt_key_id) params.encrypt_key_id = data.encrypt_key_id;
  return params;
}

/**
 * Connect LibCore to the Zmodo access server using the CURRENTLY PERSISTED
 * session (auth store token+user + persisted host_list). Call this on app
 * startup whenever there's a session — not just at fresh login — because a
 * relaunch with a persisted session skips the login screen, and TRANSFER-mode
 * live ("Not login access server") needs this connection established.
 * No-op on web (connectServer is a stub) and when data is missing.
 */
export async function connectAccessServerFromSession(): Promise<void> {
  const { token, user } = useAuth.getState();
  if (!token || !user) return;

  const entry = rawHost('user_conn') ?? rawHost('userconn');
  if (!entry) return;
  const i = entry.lastIndexOf(':');
  if (i < 0) return;
  const acc_srv_ip = entry.slice(0, i);
  const acc_srv_port = parseInt(entry.slice(i + 1), 10);
  if (!acc_srv_ip || isNaN(acc_srv_port)) return;

  const params: ConnectServerParams = {
    token_id: token,
    client_id: String(user.id),
    acc_srv_ip,
    acc_srv_port,
    cid: '0',
  };
  if (user.encrypt_key) params.encrypt_key = user.encrypt_key;
  if (user.encrypt_key_id) params.encrypt_key_id = user.encrypt_key_id;

  await connectServer(params);
}

export async function logout(token: string) {
  clearHosts();
  try { await postForm('app_access', '/user/user_logout', { token }); } catch { /* ignore */ }
}
