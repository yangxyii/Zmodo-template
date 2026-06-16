import { postForm, ApiError } from './http';
import { setHostList, clearHosts, rawHosts } from './hostStore';
import { md5 } from './md5';
import type { LoginData } from './types';
import { useAuth } from '../store/authStore';
import { connectServer } from '../native/zmodoSession';

/** True for RFC-1918 / loopback / link-local "ip:port" entries (unreachable from a phone). */
const isPrivateHostEntry = (entry: string): boolean => {
  const ip = entry.split(':')[0];
  return (
    /^10\./.test(ip) ||
    /^127\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^169\.254\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
};

/**
 * Pick the access-server "ip:port" to connect to. user_conn often lists a
 * private address first (e.g. "10.10.0.56:6202") followed by the public one;
 * prefer the first PUBLIC entry so the phone can actually reach it, falling
 * back to the first entry if all are private.
 */
const pickAccessHost = (entries: string[]): string | undefined =>
  entries.find((e) => !isPrivateHostEntry(e)) ?? entries[0];

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
  // Diagnostic: the real host_list keys are app_address / alarm_address /
  // user_conn (AllWebInterfaceName.h). We route HTTP via category "app_access"
  // which has a base-url fallback, so confirm what the backend actually returns
  // and whether app_address differs from the base URL (region routing).
  console.log(
    '[zmodo] host_list keys:',
    r.host_list ? Object.keys(r.host_list).join(',') : 'none',
    '| app_address=', JSON.stringify(r.host_list?.['app_address']),
    '| alarm_address=', JSON.stringify(r.host_list?.['alarm_address']),
    '| user_conn=', JSON.stringify(r.host_list?.['user_conn']),
  );
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
  // Prefer a public entry — user_conn often lists a private IP first.
  const userConnEntry =
    pickAccessHost(hostList?.['user_conn'] ?? hostList?.['userconn'] ?? []) ?? null;

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
  if (!token || !user) {
    console.log('[zmodo] connect skip: no persisted session');
    return;
  }

  const entry =
    pickAccessHost(rawHosts('user_conn')) ?? pickAccessHost(rawHosts('userconn'));
  if (!entry) {
    // Most common cause of "stuck connecting / all offline" on relaunch: the
    // persisted host_list has no user_conn (e.g. session saved before host
    // persistence existed). A fresh log out + log in repopulates it.
    console.warn('[zmodo] connect skip: no user_conn host — please log out and log in again');
    return;
  }
  const i = entry.lastIndexOf(':');
  if (i < 0) {
    console.warn('[zmodo] connect skip: malformed user_conn host:', entry);
    return;
  }
  const acc_srv_ip = entry.slice(0, i);
  const acc_srv_port = parseInt(entry.slice(i + 1), 10);
  if (!acc_srv_ip || isNaN(acc_srv_port)) {
    console.warn('[zmodo] connect skip: bad acc_srv ip/port from:', entry);
    return;
  }

  const params: ConnectServerParams = {
    token_id: token,
    client_id: String(user.id),
    acc_srv_ip,
    acc_srv_port,
    cid: '0',
  };
  if (user.encrypt_key) params.encrypt_key = user.encrypt_key;
  if (user.encrypt_key_id) params.encrypt_key_id = user.encrypt_key_id;

  console.log(
    '[zmodo] connecting access server (session)',
    acc_srv_ip + ':' + acc_srv_port,
    'encrypt_key?', !!user.encrypt_key,
  );
  await connectServer(params);
  console.log('[zmodo] access server connected OK (session)');
}

export async function logout(token: string) {
  clearHosts();
  try { await postForm('app_access', '/user/user_logout', { token }); } catch { /* ignore */ }
}
