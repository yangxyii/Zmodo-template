jest.mock('../../config', () => ({ API_PROXY: 'http://proxy.local/', IOTEK_BASE_URL: 'https://base.test' }));

import { postForm } from '../http';

beforeEach(() => { (globalThis as any).fetch = jest.fn(); });

test('ok resolves data', async () => {
  (fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => ({ result: 'ok', data: [{ physical_id: 'X' }] }) });
  const r = await postForm('app_access', '/device/device_list', { token: 't', start: 0, count: 1 });
  expect(r.data).toEqual([{ physical_id: 'X' }]);
  const body = (fetch as jest.Mock).mock.calls[0][1].body as string;
  expect(body).toContain('token=t');
});

test('non-ok rejects', async () => {
  (fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => ({ result: '1002', error: 'token' }) });
  await expect(postForm('app_access', '/x', {})).rejects.toMatchObject({ result: '1002' });
});

test('skips undefined and null params', async () => {
  (fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => ({ result: 'ok' }) });
  await postForm('app_access', '/x', { a: 'val', b: undefined, c: null, d: 0 });
  const body = (fetch as jest.Mock).mock.calls[0][1].body as string;
  expect(body).toBe('a=val&d=0');
});

test('prefixes proxy url when API_PROXY set', async () => {
  (fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => ({ result: 'ok' }) });
  await postForm('app_access', '/device/device_list', { token: 't' });
  const calledUrl = (fetch as jest.Mock).mock.calls[0][0] as string;
  expect(calledUrl).toContain('http://proxy.local/?url=');
  expect(calledUrl).toContain(encodeURIComponent('https://base.test/device/device_list'));
});
