import { colors, spacing } from '../tokens';
test('primary brand color is Zmodo blue', () => { expect(colors.primary).toBe('#00AEEF'); });
test('spacing scale exists', () => { expect(spacing.md).toBe(16); });
