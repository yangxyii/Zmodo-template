import { setHostList, hostFor, clearHosts } from '../hostStore';
import { IOTEK_BASE_URL } from '../../config';

beforeEach(() => clearHosts());

test('routes by host category, falls back to base url', () => {
  setHostList({ alerts: ['https://11-alarm-mop.iotek.ai'] });
  expect(hostFor('alerts')).toBe('https://11-alarm-mop.iotek.ai');
  expect(hostFor('app_access')).toBe(IOTEK_BASE_URL);
});
