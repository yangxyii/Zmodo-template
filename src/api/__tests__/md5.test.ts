import { md5 } from '../md5';

test('md5 hashes a known value to the expected hex digest', () => {
  // synthetic vector (well-known MD5 of "hello"); the same hashing path is
  // what login uses for the password field.
  expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
});
