/**
 * VaultWebView — platform-aware WebView component for the Vault tab.
 *
 * Metro (Expo) resolves `VaultWebView` to:
 *   - `VaultWebView.web.tsx`    when bundling for web (renders an <iframe>)
 *   - `VaultWebView.native.tsx` when bundling for iOS / Android (react-native-webview)
 *
 * This base file exists solely so that TypeScript (tsc --noEmit) can resolve
 * the import and provide correct types.  At runtime Metro never loads this file —
 * it always picks the platform-specific variant first.
 *
 * Jest resolution is handled via `moduleNameMapper` in jest.config.js:
 *   '^(.*)/VaultWebView$': '$1/VaultWebView.web'
 */
export { VaultWebView } from './VaultWebView.web';
export type { VaultWebViewProps } from './VaultWebView.web';
