# Zmodo — Expo React Native Web Preview

A cross-platform port of the Zmodo camera app built with **Expo SDK 56** and **react-native-web**.

**Phase 1 (this branch):** Web preview with real IOTEK API, CORS proxy, device listing, settings management, and a video placeholder (native streaming not available in a browser).  
**Phase 2:** iOS native video via the Zmodo LibCore SDK (`modules/` native module, `src/native/LibCoreBridge.ts`).  
**Phase 3:** Android native video via the same `LibCoreBridge` interface.

---

## Prerequisites

- **Node 20+** (recommended: use `nvm`)
- **npm 10+** (bundled with Node 20)

```bash
npm install
```

---

## Environment Setup

Copy the example env file and fill in the values:

```bash
cp .env.example .env
```

Edit `.env`:

```
IOTEK_BASE_URL=https://11-app-mop.iotek.ai   # IOTEK backend (default already set)
ZMODO_TEST_EMAIL=your@email.com               # test account email
ZMODO_TEST_PASSWORD=yourpassword              # test account password
EXPO_PUBLIC_API_PROXY=                        # leave blank for non-web; set for web (see below)
```

`.env` is gitignored and must never be committed.

---

## Run Web Preview (Linux / macOS)

The browser cannot call the IOTEK API directly due to CORS restrictions. A local proxy is required.

**Terminal 1 — start the CORS proxy:**

```bash
node proxy/server.mjs
# Listens on http://localhost:8787
```

**Terminal 2 — start the Expo web dev server:**

```bash
EXPO_PUBLIC_API_PROXY=http://localhost:8787/ npx expo start --web
# Open http://localhost:8081 in your browser
```

The `EXPO_PUBLIC_API_PROXY` env var is inlined into the Metro bundle at build time, so it **must** be set before starting the dev server. On web, `src/config.ts` routes all API calls through this proxy URL.

---

## Tests

| Command | What it does |
|---|---|
| `npm test` | Jest unit tests (mocked API, component rendering) |
| `node scripts/smoke-login.mjs` | Live API smoke test — logs in and lists devices against the real backend |

### Unit tests

```bash
npm test
```

### Live API smoke test

Requires credentials in `.env`. Logs in and lists the account's devices against the real IOTEK backend (Node has no CORS, so no proxy needed):

```bash
node scripts/smoke-login.mjs
# → LOGIN ok, devices: 7
```

---

## Verification

Phase 1 was verified end-to-end against the **real IOTEK backend** through the CORS proxy in a browser. Captured evidence lives in [`docs/verification/`](docs/verification):

| Screenshot | Shows |
|---|---|
| `01-login.png` | Login screen (phone-framed web preview) |
| `02-home-7-real-devices.png` | Home list populated with the account's **7 real devices** (online/offline status from live data) |
| `03-live-placeholder.png` | Live screen — video placeholder + full control bar (snapshot/record/HD/sound/talk), PTZ pad, playback entry |

All unit tests pass (`npm test`), `npx tsc --noEmit` is clean, and `npx expo export -p web` builds successfully.

---

## Project Structure

```
app/                      Expo Router file-based routes
  index.tsx               Redirect to /login or /home
  login.tsx               Auth screen
  home.tsx                Device list
  account.tsx             Account / logout
  add-device.tsx          Add-device placeholder
  camera/[id]/
    live.tsx              Live view (video placeholder on web)
    settings.tsx          Device settings (optimistic updates + rollback)
    share.tsx             Share device
    playback.tsx          Playback placeholder

src/
  api/                    IOTEK API client (login, device list/modify)
  components/
    CameraVideoView.tsx          Platform entry-point (re-exports web or native)
    CameraVideoView.web.tsx      Web placeholder ("open mobile app")
    CameraVideoView.native.tsx   Native stub (Phase 2: wires LibCoreBridge)
    DeviceCard.tsx               Home screen device card
    Screen.tsx                   Shared header/layout wrapper
    Cell.tsx                     Settings row
  config.ts               Reads IOTEK_BASE_URL + API_PROXY from Expo Constants
  native/
    LibCoreBridge.ts      Interface + stub for the native LibCore streaming SDK
  store/
    authStore.ts          Zustand auth state (token, login, logout)
  theme/
    tokens.ts             Design tokens (colors, spacing, font, radius)

proxy/
  server.mjs              Node CORS proxy (forwards to *.iotek.ai / *.myzmodo.com)

scripts/
  smoke-login.mjs         CLI smoke test for the live IOTEK API

docs/
  superpowers/            Design spec + implementation plan
  verification/           Browser screenshots proving Phase 1 works on real data
```

> **Phase 2 note:** the iOS native module (`modules/`) that links the LibCore `.xcframework` is created in Phase 2 — see below.

---

## Phase 2 / 3 — Native Video

Video streaming requires the proprietary **Zmodo LibCore** native SDK which only runs on device (iOS / Android), not in a browser.

**iOS (Phase 2):**

- `src/native/LibCoreBridge.ts` — TypeScript interface shared by web stub and native implementation.
- `src/components/CameraVideoView.native.tsx` — React Native component that will call `LibCoreBridge.startStream()`.
- `modules/` — Expo native module scaffold where the iOS `.xcframework` will be linked.
- Requires a Mac with Xcode, CocoaPods, and the LibCore `.xcframework` file from Zmodo.
- Build: `npx expo run:ios`

**Android (Phase 3):**

- Same `LibCoreBridge` interface; Android `.aar` provided by Zmodo.
- Implement `modules/` Android side.
- Build: `npx expo run:android`

The web and native paths are selected automatically by Metro's platform extension resolution (`.web.tsx` vs `.native.tsx`).
