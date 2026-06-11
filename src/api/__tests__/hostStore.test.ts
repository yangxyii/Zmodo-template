import AsyncStorage from '@react-native-async-storage/async-storage';
import { setHostList, hostFor, clearHosts, loadHosts } from '../hostStore';
import { IOTEK_BASE_URL } from '../../config';

beforeEach(async () => {
  clearHosts();
  // clearHosts fires removeItem fire-and-forget; flush the mock storage fully.
  await AsyncStorage.clear();
});

test('routes by host category, falls back to base url', () => {
  setHostList({ alerts: ['https://11-alarm-mop.iotek.ai'] });
  expect(hostFor('alerts')).toBe('https://11-alarm-mop.iotek.ai');
  expect(hostFor('app_access')).toBe(IOTEK_BASE_URL);
});

test('setHostList persists host_list to AsyncStorage', async () => {
  setHostList({ vdr_web_address: ['https://storage.meshare.com'] });
  const raw = await AsyncStorage.getItem('zmodo.hostlist');
  expect(raw).not.toBeNull();
  const parsed = JSON.parse(raw!);
  expect(parsed.vdr_web_address[0]).toBe('https://storage.meshare.com');
});

test('loadHosts restores host_list from AsyncStorage when in-memory map is empty', async () => {
  // Directly seed storage (bypassing setHostList so in-memory stays empty).
  await AsyncStorage.setItem('zmodo.hostlist', JSON.stringify({ alerts: ['https://a'] }));
  // In-memory is empty (clearHosts was called in beforeEach).
  await loadHosts();
  expect(hostFor('alerts')).toBe('https://a');
});

test('loadHosts does NOT clobber an already-populated in-memory host map', async () => {
  // Seed storage with a stale value.
  await AsyncStorage.setItem('zmodo.hostlist', JSON.stringify({ alerts: ['https://stale'] }));
  // Login has already set a fresher host list in memory.
  setHostList({ alerts: ['https://fresh'] });
  await loadHosts();
  // Fresh value must survive.
  expect(hostFor('alerts')).toBe('https://fresh');
});

test('clearHosts removes persisted key from AsyncStorage', async () => {
  setHostList({ alerts: ['https://11-alarm-mop.iotek.ai'] });
  clearHosts();
  // Give fire-and-forget removeItem a chance to settle (mock is synchronous).
  const raw = await AsyncStorage.getItem('zmodo.hostlist');
  expect(raw).toBeNull();
});
