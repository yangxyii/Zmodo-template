/**
 * CameraVideoView — platform-aware video component.
 *
 * Metro (Expo) resolves `CameraVideoView` to:
 *   - `CameraVideoView.web.tsx`    when bundling for web
 *   - `CameraVideoView.native.tsx` when bundling for iOS / Android
 *
 * This base file exists solely so that TypeScript (tsc --noEmit) can resolve
 * the import and provide correct types.  It re-exports the web types, which
 * are identical to the native ones.  At runtime Metro never loads this file —
 * it always picks the platform-specific variant first.
 *
 * Jest resolution is handled via the `moduleNameMapper` in jest.config.js:
 *   '^(.*)/CameraVideoView$': '$1/CameraVideoView.web'
 */
export { CameraVideoView } from './CameraVideoView.web';
export type { CameraVideoViewProps } from './CameraVideoView.web';
