import { useAuth } from '../authStore';

beforeEach(() => {
  useAuth.setState({ token: null, user: null, hydrated: false });
});

test('setSession + clear', () => {
  useAuth.getState().setSession('tk', { id: '1', username: 'u', email: 'e' } as any);
  expect(useAuth.getState().token).toBe('tk');
  useAuth.getState().clear();
  expect(useAuth.getState().token).toBeNull();
});
