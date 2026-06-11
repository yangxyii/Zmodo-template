import * as http from '../http';
import { login } from '../auth';
import { hostFor, clearHosts } from '../hostStore';

beforeEach(() => clearHosts());

test('login stores host_list', async () => {
  jest.spyOn(http, 'postForm').mockResolvedValue({ result: 'ok', token: 'tk', data: { id: '1' } as any, host_list: { alerts: ['https://a'] } });
  const r = await login('e@x.com', 'pw');
  expect(r.token).toBe('tk');
  expect(hostFor('alerts')).toBe('https://a');
});
