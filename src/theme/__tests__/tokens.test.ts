import { colors, spacing } from '../tokens';
test('primary brand color is Zmodo blue', () => { expect(colors.primary).toBe('#00A8E2'); });
test('spacing scale exists', () => { expect(spacing.md).toBe(16); });
