import { API_PROXY } from '../config';
import { hostFor } from './hostStore';
import type { ApiResult } from './types';

export class ApiError extends Error {
  constructor(public result: string, public errorText?: string) {
    super(errorText ?? result);
  }
}

const encodeForm = (params: Record<string, unknown>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

export async function postForm<T = unknown>(
  hostCategory: string,
  path: string,
  params: Record<string, unknown>,
): Promise<ApiResult<T>> {
  const base = hostFor(hostCategory);
  const target = `${base}${path}`;
  const url = API_PROXY ? `${API_PROXY}?url=${encodeURIComponent(target)}` : target;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: encodeForm(params),
  });
  let json: ApiResult<T>;
  try {
    json = (await res.json()) as ApiResult<T>;
  } catch {
    throw new ApiError(`http_${res.status ?? 0}`, `Non-JSON response (HTTP ${res.status ?? 'unknown'})`);
  }
  if (json.result !== 'ok') throw new ApiError(json.result, json.error);
  return json;
}
