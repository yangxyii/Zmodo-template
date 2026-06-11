# Zmodo RN (+Web) 阶段① Web 预览 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Expo + react-native-web 实现 Zmodo 相机 App 的 8 个核心页面，连真实 IOTEK API（经 CORS 代理），视频占位，Web 构建可跑在 Linux。

**Architecture:** 单一 Expo/TypeScript 代码库，Expo Router 文件路由；`src/api` 复刻 IOTEK 接口（表单编码、MD5 密码、`result==ok` 判定、登录后按 `host_list` 路由）；Zustand 管登录态、TanStack Query 管服务端数据；`<CameraVideoView>` 按平台分叉（`.web` 占位 / `.native` 后续桥接）；`proxy/` 是 Web 端绕过浏览器 CORS 的转发服务。

**Tech Stack:** Expo (SDK 最新), TypeScript, expo-router, react-native-web, @tanstack/react-query, zustand, jest-expo + @testing-library/react-native, Playwright (web 验证), Node (proxy + smoke script).

**依据规格：** `docs/superpowers/specs/2026-06-10-zmodo-react-native-web-design.md`

**已实测事实（动工前用真实账号跑通）：**
- 基地址 `https://11-app-mop.iotek.ai`。
- 登录 `POST /user/user_login`（表单）：`email, password=md5(明文), client=1, client_uuid, client_version, language, platform, app_version, offset_second` → `{result:"ok", token, data:{id,...}, host_list:{app_access,alerts,user_mng,device_add,file_server,...}}`。
- 设备列表 `POST /device/device_list`（表单）：`token, start, count` → `{result:"ok", data:[device,...]}`；测试账号有 7 台（6 IPC `device_type:"0"` + 1 NVR `device_type:"1"`）。
- 设备字段：`physical_id, device_name, device_online, device_on, device_type, device_model, product_id, permission(JSON字符串 rb/pb/al/vdownload), aes_key, upnp_ip, upnp_port, nightvision, motion_sensitivity, sound_detection, imageflip, device_volume` 等。
- 设置写：`POST /device/device_modify` `{token, physical_id, <字段>}`。分享：`POST /device/share_add`。回放列表：`/device/record_list`、`/device/storage_list`、`/device/record_date`。在线：`/device/is_online`。
- 成功码 `result=="ok"`；token 失效 `"1002"`；其余错误码带 `error` 文案。

**凭证：** 全部进 `.env`（gitignore）。`.env.example` 提交键名。源码与本计划不含明文密码/token。

**范围说明：** 本计划只覆盖阶段①（Web 预览）。阶段②（iOS 原生视频桥接）、阶段③（Android）各自单独成计划。

---

## 文件结构（阶段①创建/修改）

```
zmodo-temolate-react/
├─ app.json / app.config.ts        # Expo 配置（web bundler=metro, scheme）
├─ package.json / tsconfig.json    # 依赖与 TS 配置
├─ babel.config.js                 # expo preset
├─ jest.config.js / jest.setup.ts  # jest-expo + testing-library
├─ .env.example                    # IOTEK_BASE_URL / 测试账号键名
├─ app/                            # Expo Router 页面
│  ├─ _layout.tsx                  # 根 Provider（Query + 手机框 + 路由守卫）
│  ├─ index.tsx                    # 启动重定向（已登录→/home 否则→/login）
│  ├─ login.tsx                    # 登录页
│  ├─ home.tsx                     # 设备列表
│  ├─ account.tsx                  # 账户/退出
│  ├─ add-device.tsx               # 加设备（扫码占位）
│  └─ camera/[id]/
│     ├─ live.tsx                  # 直播页
│     ├─ playback.tsx              # 回放页
│     ├─ settings.tsx             # 设备设置
│     └─ share.tsx                 # 设备分享
├─ src/
│  ├─ config.ts                    # 读 env：baseUrl、默认 host
│  ├─ api/
│  │  ├─ http.ts                   # 核心请求：表单编码 + result 判定 + host 路由
│  │  ├─ hostStore.ts              # 缓存登录返回的 host_list
│  │  ├─ md5.ts                    # 纯 JS md5（密码用）
│  │  ├─ auth.ts                   # login / logout
│  │  ├─ devices.ts                # deviceList / deviceModify / isOnline
│  │  ├─ playback.ts               # recordDate / recordList / storageList
│  │  ├─ share.ts                  # shareAdd
│  │  └─ types.ts                  # Device / LoginResult 等类型
│  ├─ store/
│  │  └─ authStore.ts              # Zustand：token/user/持久化
│  ├─ components/
│  │  ├─ PhoneFrame.tsx            # Web 手机外框（"看起来像模拟器"）
│  │  ├─ Button.tsx / TextField.tsx / Screen.tsx / Cell.tsx  # 通用 UI
│  │  ├─ DeviceCard.tsx            # 设备卡片
│  │  └─ CameraVideoView.web.tsx / .native.tsx / index.ts   # 视频抽象
│  └─ theme/tokens.ts              # 颜色/间距/字号
├─ proxy/server.mjs                # Linux CORS 转发代理
├─ scripts/smoke-login.mjs         # Node 真实 API 冒烟（login→device_list）
└─ e2e/web.spec.ts                 # Playwright web 截图/导航验证
```

---

## Milestone 0：项目脚手架

### Task 0.1：创建 Expo 工程

**Files:** 整个项目根

- [ ] **Step 1: 用 Expo 模板创建到当前空目录**

Run（在 `/Users/jianzhang/zmodo-temolate-react`，目录已存在且含 docs/.git）：
```bash
cd /Users/jianzhang/zmodo-temolate-react
npx create-expo-app@latest . --template blank-typescript
```
若提示目录非空，选择保留现有文件（docs/、.git、.gitignore）。如命令拒绝非空目录，改为在临时目录生成再拷入：
```bash
npx create-expo-app@latest /tmp/zmodo-expo --template blank-typescript
rsync -a --exclude .git --exclude docs /tmp/zmodo-expo/ /Users/jianzhang/zmodo-temolate-react/
```

- [ ] **Step 2: 安装依赖**

Run:
```bash
cd /Users/jianzhang/zmodo-temolate-react
npx expo install react-dom react-native-web @expo/metro-runtime expo-router expo-linking expo-constants expo-status-bar
npm install @tanstack/react-query zustand
npm install -D jest-expo jest @testing-library/react-native @testing-library/jest-native @types/jest @playwright/test
```

- [ ] **Step 3: 验证脚手架可启动（Web）**

Run:
```bash
npx expo export -p web 2>&1 | tail -5
```
Expected: 生成 `dist/`，无报错（首跑只验证导出成功）。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: scaffold Expo + react-native-web project"
```

### Task 0.2：启用 Expo Router + Web 配置

**Files:**
- Modify: `package.json`（main 改 `expo-router/entry`）
- Create: `app.json`（scheme + web bundler）
- Create: `app/_layout.tsx`, `app/index.tsx`

- [ ] **Step 1: 设置 entry 与 web bundler**

`package.json` 中 `"main": "expo-router/entry"`。`app.json` 内 `expo.scheme: "zmodo"`，`expo.web.bundler: "metro"`，`expo.plugins: ["expo-router"]`。

- [ ] **Step 2: 写最小根布局**

`app/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```
`app/index.tsx`:
```tsx
import { Text, View } from 'react-native';
export default function Index() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Zmodo</Text></View>;
}
```

- [ ] **Step 3: 验证 Web dev server 渲染**

Run:
```bash
npx expo export -p web 2>&1 | tail -3
```
Expected: 导出成功，`dist/index.html` 存在。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: enable expo-router and web bundler"
```

### Task 0.3：配置 Jest

**Files:** Create `jest.config.js`, `jest.setup.ts`; Modify `package.json` scripts

- [ ] **Step 1: 写 jest 配置**

`jest.config.js`:
```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@tanstack/.*))',
  ],
};
```
`jest.setup.ts`:
```ts
import '@testing-library/jest-native/extend-expect';
```
`package.json` scripts 增加：`"test": "jest"`。

- [ ] **Step 2: 冒烟测试**

Create `src/__tests__/sanity.test.ts`:
```ts
test('jest works', () => { expect(1 + 1).toBe(2); });
```
Run: `npm test -- src/__tests__/sanity.test.ts`
Expected: 1 passed。

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: configure jest-expo + testing-library"
```

---

## Milestone 1：配置、主题、通用 UI、手机框

### Task 1.1：env 配置

**Files:** Create `.env.example`, `src/config.ts`; Modify `app.config.ts`

- [ ] **Step 1: 列出 env 键名（不含值）**

`.env.example`:
```
IOTEK_BASE_URL=https://11-app-mop.iotek.ai
# 仅本地开发/测试用；勿提交真实值
ZMODO_TEST_EMAIL=
ZMODO_TEST_PASSWORD=
# Web 预览经代理时的代理地址
EXPO_PUBLIC_API_PROXY=
```
本地 `.env`（不提交）填真实值：`IOTEK_BASE_URL=https://11-app-mop.iotek.ai`，测试账号见交接。

- [ ] **Step 2: 暴露配置给应用**

将 `app.json` 改为 `app.config.ts` 以读 env：
```ts
import 'dotenv/config';
export default {
  expo: {
    name: 'Zmodo', slug: 'zmodo', scheme: 'zmodo',
    web: { bundler: 'metro' },
    plugins: ['expo-router'],
    extra: {
      iotekBaseUrl: process.env.IOTEK_BASE_URL ?? 'https://11-app-mop.iotek.ai',
      apiProxy: process.env.EXPO_PUBLIC_API_PROXY ?? '',
    },
  },
};
```
`npm install -D dotenv`。
`src/config.ts`:
```ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';
const extra = (Constants.expoConfig?.extra ?? {}) as { iotekBaseUrl: string; apiProxy: string };
export const IOTEK_BASE_URL = extra.iotekBaseUrl;
// Web 端走代理绕过 CORS；原生端直连
export const API_PROXY = Platform.OS === 'web' ? extra.apiProxy : '';
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: env-driven config (base url + web proxy)"
```

### Task 1.2：主题 token

**Files:** Create `src/theme/tokens.ts`, `src/theme/__tests__/tokens.test.ts`

- [ ] **Step 1: 写失败测试**

`src/theme/__tests__/tokens.test.ts`:
```ts
import { colors, spacing } from '../tokens';
test('primary brand color is Zmodo blue', () => {
  expect(colors.primary).toBe('#00AEEF');
});
test('spacing scale exists', () => {
  expect(spacing.md).toBe(16);
});
```

- [ ] **Step 2: 运行验证失败**

Run: `npm test -- src/theme`
Expected: FAIL（找不到模块）。

- [ ] **Step 3: 实现 tokens**

`src/theme/tokens.ts`:
```ts
export const colors = {
  primary: '#00AEEF',
  bg: '#FFFFFF',
  bgMuted: '#F2F4F7',
  text: '#1A1A1A',
  textMuted: '#8A8F98',
  border: '#E4E7EC',
  online: '#22C55E',
  offline: '#9CA3AF',
  danger: '#EF4444',
};
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 8, md: 12, lg: 20 };
export const font = { sm: 13, md: 15, lg: 18, xl: 24 };
```

- [ ] **Step 4: 运行验证通过**

Run: `npm test -- src/theme`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: theme tokens (Zmodo blue palette)"
```

### Task 1.3：手机外框（Web "像模拟器"）

**Files:** Create `src/components/PhoneFrame.tsx`, `src/components/__tests__/PhoneFrame.test.tsx`

- [ ] **Step 1: 写失败测试**

```tsx
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PhoneFrame } from '../PhoneFrame';
test('renders children inside frame', () => {
  const { getByText } = render(<PhoneFrame><Text>hi</Text></PhoneFrame>);
  expect(getByText('hi')).toBeTruthy();
});
```

- [ ] **Step 2: 运行验证失败**

Run: `npm test -- PhoneFrame`
Expected: FAIL。

- [ ] **Step 3: 实现**

`src/components/PhoneFrame.tsx`：在 `Platform.OS === 'web'` 时用一个固定宽度（390）、圆角、居中、带阴影的容器包裹 children，模拟手机；原生端直接返回 children。
```tsx
import { Platform, View, StyleSheet } from 'react-native';
import { radius } from '../theme/tokens';
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={styles.backdrop}>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1220' },
  frame: { width: 390, height: 844, borderRadius: 44, overflow: 'hidden', backgroundColor: '#fff',
    borderWidth: 10, borderColor: '#111' },
});
```

- [ ] **Step 4: 运行验证通过 + Commit**

Run: `npm test -- PhoneFrame` → PASS
```bash
git add -A && git commit -m "feat: web phone frame wrapper"
```

### Task 1.4：通用 UI 组件（Screen / Button / TextField / Cell）

**Files:** Create `src/components/Screen.tsx`, `Button.tsx`, `TextField.tsx`, `Cell.tsx` + 各自测试

- [ ] **Step 1: 写失败测试（Button 触发 onPress、TextField 受控、Cell 显示 title）**

`src/components/__tests__/ui.test.tsx`:
```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';
import { Cell } from '../Cell';
test('Button fires onPress', () => {
  const fn = jest.fn();
  const { getByText } = render(<Button title="OK" onPress={fn} />);
  fireEvent.press(getByText('OK'));
  expect(fn).toHaveBeenCalled();
});
test('Cell shows title + value', () => {
  const { getByText } = render(<Cell title="Name" value="Cam1" />);
  expect(getByText('Name')).toBeTruthy();
  expect(getByText('Cam1')).toBeTruthy();
});
```

- [ ] **Step 2: 运行失败**

Run: `npm test -- components/__tests__/ui` → FAIL

- [ ] **Step 3: 实现四个组件（用 theme tokens）**

`Button.tsx`（Pressable + 主色背景 + accessibilityRole="button"，支持 `variant`、`loading`、`disabled`、`testID`）；`TextField.tsx`（受控 TextInput + label + secureTextEntry + accessibilityLabel）；`Screen.tsx`（SafeArea + 背景 + 可选 header title/返回）；`Cell.tsx`（左 title 右 value/箭头/开关，支持 `onPress`、`right` 插槽）。每个组件 props 需含 `testID`/accessibility 以便 e2e 选择。

- [ ] **Step 4: 运行通过 + Commit**

Run: `npm test -- components/__tests__/ui` → PASS
```bash
git add -A && git commit -m "feat: shared UI components (Screen/Button/TextField/Cell)"
```

---

## Milestone 2：API 层（真实 IOTEK 接口）

### Task 2.1：md5（密码哈希）

**Files:** Create `src/api/md5.ts`, `src/api/__tests__/md5.test.ts`

- [ ] **Step 1: 写失败测试（用真实已知值）**

```ts
import { md5 } from '../md5';
test('md5 hashes a known value to the expected hex digest', () => {
  expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
});
```
（该哈希在动工前已被真实后端接受。）

- [ ] **Step 2: 运行失败**

Run: `npm test -- api/__tests__/md5` → FAIL

- [ ] **Step 3: 实现纯 JS md5**

安装 `npm install spark-md5`，`src/api/md5.ts`:
```ts
import SparkMD5 from 'spark-md5';
export const md5 = (s: string): string => SparkMD5.hash(s);
```

- [ ] **Step 4: 运行通过 + Commit**

Run → PASS
```bash
git add -A && git commit -m "feat: md5 password hashing"
```

### Task 2.2：类型定义

**Files:** Create `src/api/types.ts`

- [ ] **Step 1: 定义类型（依据实测响应）**

```ts
export type ApiResult<T> = { result: string; data?: T; error?: string; token?: string; host_list?: HostList };
export type HostList = Record<string, string[]>; // app_access/alerts/user_mng/device_add/file_server...
export interface LoginData { id: string; username: string; email: string; nickname?: string; photo_url?: string; }
export interface Device {
  physical_id: string;
  device_name: string;
  device_online: string; // "0"/"1"
  device_on?: string;
  device_type: string;   // "0"=IPC "1"=NVR
  device_model?: string;
  product_id?: string;
  permission?: string;   // JSON 字符串 {rb,pb,al,vdownload}
  aes_key?: string;
  upnp_ip?: string;
  upnp_port?: string;
  nightvision?: string;
  motion_sensitivity?: string;
  sound_detection?: string;
  imageflip?: string;
  device_volume?: string;
}
export interface DevicePermission { rb?: number; pb?: number; al?: number; vdownload?: number; }
export const parsePermission = (d: Device): DevicePermission => {
  try { return d.permission ? JSON.parse(d.permission) : {}; } catch { return {}; }
};
export const isOnline = (d: Device) => d.device_online === '1';
```

- [ ] **Step 2: 编译检查 + Commit**

Run: `npx tsc --noEmit`
Expected: 无错误。
```bash
git add -A && git commit -m "feat: API types from verified responses"
```

### Task 2.3：host 缓存

**Files:** Create `src/api/hostStore.ts`, `src/api/__tests__/hostStore.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { setHostList, hostFor } from '../hostStore';
import { IOTEK_BASE_URL } from '../../config';
test('routes by host category, falls back to base url', () => {
  setHostList({ alerts: ['https://11-alarm-mop.iotek.ai'] });
  expect(hostFor('alerts')).toBe('https://11-alarm-mop.iotek.ai');
  expect(hostFor('app_access')).toBe(IOTEK_BASE_URL); // 未提供则回退
});
```

- [ ] **Step 2: 运行失败 → 实现**

`src/api/hostStore.ts`:
```ts
import { IOTEK_BASE_URL } from '../config';
import type { HostList } from './types';
let hosts: HostList = {};
export const setHostList = (h?: HostList) => { if (h) hosts = h; };
export const hostFor = (category: string): string => hosts[category]?.[0] ?? IOTEK_BASE_URL;
export const clearHosts = () => { hosts = {}; };
```

- [ ] **Step 3: 运行通过 + Commit**

Run: `npm test -- hostStore` → PASS
```bash
git add -A && git commit -m "feat: host_list routing store"
```

### Task 2.4：核心请求 http.ts

**Files:** Create `src/api/http.ts`, `src/api/__tests__/http.test.ts`

- [ ] **Step 1: 写失败测试（表单编码 + result 判定 + 代理前缀）**

mock `global.fetch`，断言：① 请求体是 `application/x-www-form-urlencoded` 且含传入字段；② `result:"ok"` 时 resolve `data`；③ 非 ok 时 reject 带 `result/error`；④ Web 设置代理时 URL 前缀为代理地址。
```ts
import { postForm } from '../http';
beforeEach(() => { (global as any).fetch = jest.fn(); });
test('ok resolves data', async () => {
  (fetch as jest.Mock).mockResolvedValue({ json: async () => ({ result: 'ok', data: [{ physical_id: 'X' }] }) });
  const r = await postForm('app_access', '/device/device_list', { token: 't', start: 0, count: 1 });
  expect(r.data).toEqual([{ physical_id: 'X' }]);
  const body = (fetch as jest.Mock).mock.calls[0][1].body as string;
  expect(body).toContain('token=t');
});
test('non-ok rejects', async () => {
  (fetch as jest.Mock).mockResolvedValue({ json: async () => ({ result: '1002', error: 'token' }) });
  await expect(postForm('app_access', '/x', {})).rejects.toMatchObject({ result: '1002' });
});
```

- [ ] **Step 2: 运行失败 → 实现**

`src/api/http.ts`:
```ts
import { API_PROXY } from '../config';
import { hostFor } from './hostStore';
import type { ApiResult } from './types';
export class ApiError extends Error { constructor(public result: string, public errorText?: string) { super(errorText ?? result); } }
const encodeForm = (params: Record<string, unknown>) =>
  Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
export async function postForm<T = unknown>(hostCategory: string, path: string, params: Record<string, unknown>): Promise<ApiResult<T>> {
  const base = hostFor(hostCategory);
  const target = `${base}${path}`;
  const url = API_PROXY ? `${API_PROXY}?url=${encodeURIComponent(target)}` : target;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: encodeForm(params) });
  const json = (await res.json()) as ApiResult<T>;
  if (json.result !== 'ok') throw new ApiError(json.result, json.error);
  return json;
}
```

- [ ] **Step 3: 运行通过 + Commit**

Run: `npm test -- http` → PASS
```bash
git add -A && git commit -m "feat: core form-encoded request with host routing + proxy"
```

### Task 2.5：auth / devices / playback / share 接口

**Files:** Create `src/api/auth.ts`, `devices.ts`, `playback.ts`, `share.ts` + `src/api/__tests__/devices.test.ts`

- [ ] **Step 1: 写失败测试（login 设置 host、deviceList 透传）**

```ts
import * as http from '../http';
import { login } from '../auth';
import { hostFor } from '../hostStore';
test('login stores host_list', async () => {
  jest.spyOn(http, 'postForm').mockResolvedValue({ result: 'ok', token: 'tk', data: { id: '1' } as any, host_list: { alerts: ['https://a'] } });
  const r = await login('e@x.com', 'pw');
  expect(r.token).toBe('tk');
  expect(hostFor('alerts')).toBe('https://a');
});
```

- [ ] **Step 2: 运行失败 → 实现**

`src/api/auth.ts`:
```ts
import { postForm } from './http';
import { setHostList } from './hostStore';
import { md5 } from './md5';
import type { LoginData } from './types';
export async function login(email: string, password: string) {
  const r = await postForm<LoginData>('app_access', '/user/user_login', {
    email, password: md5(password), client: 1,
    client_uuid: globalThis.crypto?.randomUUID?.() ?? `web-${Date.now()}`,
    client_version: '8.0.0', language: 'en', platform: 2, app_version: '8.0.0', offset_second: 0,
  });
  setHostList(r.host_list);
  return { token: r.token!, user: r.data! };
}
export async function logout(token: string) {
  try { await postForm('app_access', '/user/user_logout', { token }); } catch { /* 忽略 */ }
}
```
`src/api/devices.ts`:
```ts
import { postForm } from './http';
import type { Device } from './types';
export const deviceList = (token: string, start = 0, count = 50) =>
  postForm<Device[]>('app_access', '/device/device_list', { token, start, count }).then(r => r.data ?? []);
export const deviceModify = (token: string, physical_id: string, fields: Record<string, unknown>) =>
  postForm('app_access', '/device/device_modify', { token, physical_id, ...fields });
export const isOnlineCheck = (token: string, physical_id: string) =>
  postForm('app_access', '/device/is_online', { token, physical_id });
```
`src/api/playback.ts`（`recordDate`/`recordList`/`storageList`，均 `app_access`，参数依规格）。
`src/api/share.ts`:
```ts
import { postForm } from './http';
export const shareAdd = (token: string, physical_id: string, email: string) =>
  postForm('app_access', '/device/share_add', { token, physical_id, account: email });
```

- [ ] **Step 3: 运行通过 + Commit**

Run: `npm test -- devices` → PASS
```bash
git add -A && git commit -m "feat: auth/devices/playback/share API modules"
```

### Task 2.6：真实 API 冒烟脚本（Node，无 CORS）

**Files:** Create `scripts/smoke-login.mjs`

- [ ] **Step 1: 写脚本（读 .env，登录→设备列表，断言 ok）**

`scripts/smoke-login.mjs`:
```js
import 'dotenv/config';
import SparkMD5 from 'spark-md5';
const base = process.env.IOTEK_BASE_URL ?? 'https://11-app-mop.iotek.ai';
const email = process.env.ZMODO_TEST_EMAIL, pw = process.env.ZMODO_TEST_PASSWORD;
const form = (o) => Object.entries(o).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
const post = async (path, params) => (await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form(params) })).json();
const login = await post('/user/user_login', { email, password: SparkMD5.hash(pw), client: 1, client_uuid: crypto.randomUUID(), client_version: '8.0.0', language: 'en', platform: 2, app_version: '8.0.0', offset_second: 0 });
if (login.result !== 'ok') { console.error('LOGIN FAIL', login); process.exit(1); }
const list = await post('/device/device_list', { token: login.token, start: 0, count: 50 });
console.log('LOGIN ok, devices:', Array.isArray(list.data) ? list.data.length : 'n/a');
process.exit(list.result === 'ok' ? 0 : 1);
```

- [ ] **Step 2: 运行（需本地 .env 填好测试账号）**

Run: `node scripts/smoke-login.mjs`
Expected: `LOGIN ok, devices: 7`（或当前真实台数）。

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "test: live API smoke script (login -> device_list)"
```

---

## Milestone 3：登录态 + 登录页 + 路由守卫

### Task 3.1：authStore（Zustand + 持久化）

**Files:** Create `src/store/authStore.ts`, `src/store/__tests__/authStore.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { useAuth } from '../authStore';
test('setSession + clear', () => {
  useAuth.getState().setSession('tk', { id: '1', username: 'u', email: 'e' } as any);
  expect(useAuth.getState().token).toBe('tk');
  useAuth.getState().clear();
  expect(useAuth.getState().token).toBeNull();
});
```

- [ ] **Step 2: 失败 → 实现**

用 zustand + `@react-native-async-storage/async-storage`（`npx expo install @react-native-async-storage/async-storage`，web 自动用 localStorage）做持久化中间件，存 `token`/`user`，提供 `setSession`/`clear`/`hydrate`。

- [ ] **Step 3: 通过 + Commit**

Run: `npm test -- authStore` → PASS
```bash
git add -A && git commit -m "feat: persisted auth store (zustand)"
```

### Task 3.2：登录页

**Files:** Create `app/login.tsx`, `app/__tests__/login.test.tsx`

- [ ] **Step 1: 写失败测试（输入+提交调用 login，成功后置 session）**

mock `src/api/auth` 的 `login`，渲染页面，填邮箱/密码，按登录，断言 `login` 被调用且 store 有 token。用 `testID`：`login.email` / `login.password` / `login.submit`。

- [ ] **Step 2: 失败 → 实现页面**

还原原 App 登录视觉（顶部 Login 标题、Email/Password 输入、忘记密码链接占位、蓝色 Login 按钮、底部 "Login with mobile number" 占位）。提交：`const { token, user } = await login(email, pw); setSession(token, user); router.replace('/home')`；错误用 toast/文案显示。字段含 accessibilityIdentifier 对齐 `docs/editable-elements.json`（`auth.login.emailInput` 等）。

- [ ] **Step 3: 通过 + Commit**

Run: `npm test -- login` → PASS
```bash
git add -A && git commit -m "feat: login screen wired to real API"
```

### Task 3.3：路由守卫 + Provider 接线

**Files:** Modify `app/_layout.tsx`, `app/index.tsx`

- [ ] **Step 1: 接 Provider 与守卫**

`_layout.tsx`：包 `QueryClientProvider` + `PhoneFrame` + 启动时 `hydrate()`；根据 `useAuth().token` 决定可访问路由。`index.tsx`：`token ? <Redirect href="/home" /> : <Redirect href="/login" />`。

- [ ] **Step 2: 验证（web 导出 + 单测渲染不崩）**

Run: `npx tsc --noEmit && npx expo export -p web 2>&1 | tail -3`
Expected: 导出成功。

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: providers + auth route guard"
```

---

## Milestone 4：设备列表（首页）

### Task 4.1：DeviceCard 组件

**Files:** Create `src/components/DeviceCard.tsx` + 测试

- [ ] **Step 1: 失败测试（显示名、在线状态、点按回调）**

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { DeviceCard } from '../DeviceCard';
const dev = { physical_id: 'ZM1', device_name: 'Front', device_online: '1', device_type: '0' } as any;
test('shows name + online + onPress', () => {
  const fn = jest.fn();
  const { getByText } = render(<DeviceCard device={dev} onPress={fn} />);
  expect(getByText('Front')).toBeTruthy();
  fireEvent.press(getByText('Front'));
  expect(fn).toHaveBeenCalledWith('ZM1');
});
```

- [ ] **Step 2: 失败 → 实现**

卡片：缩略图占位（按 `device_model`/`product_id` 显示设备图，缺省用通用相机图）、名称、在线圆点（`isOnline` 绿/灰）、右侧箭头；点按 `onPress(device.physical_id)`。

- [ ] **Step 3: 通过 + Commit**

Run: `npm test -- DeviceCard` → PASS
```bash
git add -A && git commit -m "feat: device card component"
```

### Task 4.2：首页（TanStack Query 拉真实列表）

**Files:** Create `app/home.tsx` + 测试

- [ ] **Step 1: 失败测试（mock deviceList 返回 2 台，渲染 2 张卡）**

mock `src/api/devices` 的 `deviceList`，用 `QueryClientProvider` 包裹渲染，`findByText` 两个设备名。

- [ ] **Step 2: 失败 → 实现**

`useQuery(['devices'], () => deviceList(token))`；顶部标题 + 右上"加设备"入口（→ `/add-device`）；下拉刷新；空状态文案；点卡片 `router.push('/camera/'+id+'/live')`；加载/错误态。

- [ ] **Step 3: 通过 + Commit**

Run: `npm test -- home` → PASS
```bash
git add -A && git commit -m "feat: home device list from real API"
```

---

## Milestone 5：视频抽象 + 直播页

### Task 5.1：CameraVideoView（平台分叉）

**Files:** Create `src/components/CameraVideoView.web.tsx`, `.native.tsx`, `index.ts`, `src/native/LibCoreBridge.ts` + web 测试

- [ ] **Step 1: 失败测试（web 版显示占位文案）**

```tsx
import { render } from '@testing-library/react-native';
import { CameraVideoView } from '../CameraVideoView';
test('web shows placeholder', () => {
  const { getByText } = render(<CameraVideoView physicalId="ZM1" mode="live" />);
  expect(getByText(/手机 App 中查看|View in the app/i)).toBeTruthy();
});
```
（jest 默认解析 `.web.tsx`？否则在测试里直接从 `CameraVideoView.web` 导入。）

- [ ] **Step 2: 失败 → 实现**

`src/native/LibCoreBridge.ts`：定义 TS 接口（`start/stop/seek/talk` 与事件类型）+ 抛"未实现"的 web 桩（阶段②在原生实现）。
`CameraVideoView.web.tsx`：16:9 黑底 + 相机图标 + 文案"请在手机 App 中查看实时画面 / View live video in the mobile app"，含 `testID="camera.liveView"`（对齐 editable-elements）。
`CameraVideoView.native.tsx`：阶段②占位（先渲染同样占位，TODO 注释指向 modules/）。
`index.ts`：re-export（Metro 自动按平台选 `.web`/`.native`）。

- [ ] **Step 3: 通过 + Commit**

Run: `npm test -- CameraVideoView` → PASS
```bash
git add -A && git commit -m "feat: CameraVideoView abstraction (web placeholder + native stub)"
```

### Task 5.2：直播页

**Files:** Create `app/camera/[id]/live.tsx` + 测试

- [ ] **Step 1: 失败测试（渲染视频占位 + 控制栏按钮存在）**

mock 设备查询，渲染，断言出现 `camera.liveView` 占位与控制按钮（截图/录像/清晰度/对讲/云台）testID。

- [ ] **Step 2: 失败 → 实现**

布局还原原 App 直播页：顶部返回+设备名+设置入口（→ settings）；中部 `<CameraVideoView mode="live">`；控制栏（播放/暂停、截图、录像、清晰度 HD/SD、声音、对讲）+ 云台方向键（UI 即可，Web 下按钮 disabled 或提示"请在 App 中操作"）；底部"回放"入口（→ playback）。所有控制按钮带 testID/accessibilityLabel。

- [ ] **Step 3: 通过 + Commit**

Run: `npm test -- live` → PASS
```bash
git add -A && git commit -m "feat: live screen UI with video placeholder + controls"
```

---

## Milestone 6：回放页

### Task 6.1：回放页（时间轴 UI + 占位 + 录像日期/分段）

**Files:** Create `app/camera/[id]/playback.tsx` + 测试

- [ ] **Step 1: 失败测试（SD/云切换、时间轴渲染、视频占位）**

mock `playback` 接口返回示例录像段，渲染，断言时间轴元素与段落渲染、`CameraVideoView mode="playback"` 占位存在、SD/Cloud tab 可切换。

- [ ] **Step 2: 失败 → 实现**

顶部返回+设备名；SD/云 分段控件；日期选择（默认今天）；水平时间轴显示录像段（来自 `recordList`/`storageList`，按相对/绝对时间映射）；中部 `<CameraVideoView mode="playback">` 占位；点击段落仅更新选中态（Web 不播）。加载/空态。

- [ ] **Step 3: 通过 + Commit**

Run: `npm test -- playback` → PASS
```bash
git add -A && git commit -m "feat: playback screen (timeline + record list + placeholder)"
```

---

## Milestone 7：设备设置

### Task 7.1：设置页（读 device_list 字段，写 device_modify）

**Files:** Create `app/camera/[id]/settings.tsx` + 测试

- [ ] **Step 1: 失败测试（切换夜视调用 deviceModify）**

mock `deviceModify`，渲染设置页（注入一台设备），切换"夜视"开关，断言 `deviceModify(token, physical_id, { nightvision: ... })` 被调用。

- [ ] **Step 2: 失败 → 实现**

从 query 缓存/路由参数取该设备；用 `Cell` 列出：改名（弹输入，调 `deviceModify {device_name}`）、夜视 `nightvision`、移动侦测灵敏度 `motion_sensitivity`、声音侦测 `sound_detection`、画面翻转 `imageflip`、音量 `device_volume`；每次更改乐观更新 + 调 `deviceModify` + 失败回滚。底部"分享设备"入口（→ share）。

- [ ] **Step 3: 通过 + Commit**

Run: `npm test -- settings` → PASS
```bash
git add -A && git commit -m "feat: device settings read/write via device_modify"
```

---

## Milestone 8：设备分享

### Task 8.1：分享页

**Files:** Create `app/camera/[id]/share.tsx` + 测试

- [ ] **Step 1: 失败测试（输入邮箱+提交调用 shareAdd）**

mock `shareAdd`，输入对方邮箱，按分享，断言 `shareAdd(token, physical_id, email)` 被调用、成功提示出现。

- [ ] **Step 2: 失败 → 实现**

输入框（对方邮箱）+ 校验 + 分享按钮 → `shareAdd`；成功/失败文案。

- [ ] **Step 3: 通过 + Commit**

Run: `npm test -- share` → PASS
```bash
git add -A && git commit -m "feat: device share screen"
```

---

## Milestone 9：加设备（扫码占位）

### Task 9.1：加设备页

**Files:** Create `app/add-device.tsx` + 测试

- [ ] **Step 1: 失败测试（渲染扫码占位 + 手动输入入口）**

渲染，断言出现扫码区占位文案与"手动输入设备ID"输入框。

- [ ] **Step 2: 失败 → 实现**

Web 下：扫码区显示占位（"扫码添加需在手机 App 中进行"）+ 手动输入 `physical_id` 的表单（占位流程，提交先只做前端校验与提示，真实绑定后续阶段）。原生预留摄像头扫码（后续）。

- [ ] **Step 3: 通过 + Commit**

Run: `npm test -- add-device` → PASS
```bash
git add -A && git commit -m "feat: add-device screen (scan placeholder + manual input)"
```

---

## Milestone 10：账户 / 退出

### Task 10.1：账户页

**Files:** Create `app/account.tsx` + 测试

- [ ] **Step 1: 失败测试（点退出调用 logout 并清 session）**

mock `logout`，渲染，按"退出登录"，断言 `logout` 调用 + `useAuth().token` 为 null。退出按钮 `testID="settings.logoutButton"`（对齐 editable-elements）。

- [ ] **Step 2: 失败 → 实现**

显示当前用户邮箱/昵称；"退出登录"按钮：`await logout(token); clear(); router.replace('/login')`。

- [ ] **Step 3: 通过 + Commit**

Run: `npm test -- account` → PASS
```bash
git add -A && git commit -m "feat: account screen with logout"
```

---

## Milestone 11：Web CORS 代理（Linux）

### Task 11.1：代理服务

**Files:** Create `proxy/server.mjs`, `proxy/README.md`

- [ ] **Step 1: 写代理（转发到 ?url= 的目标，加 CORS 头）**

`proxy/server.mjs`（纯 Node http，无依赖）：监听 `PORT`（默认 8787）；对任意请求读取查询参数 `url`（目标完整地址），把请求方法/体转发过去，响应加 `Access-Control-Allow-Origin: *` 等头；处理 `OPTIONS` 预检。仅允许转发到 `*.iotek.ai` / `*.myzmodo.com`（白名单，防开放代理）。

- [ ] **Step 2: 验证（启动 + 经代理登录）**

Run:
```bash
node proxy/server.mjs &
curl -s -X POST "http://localhost:8787/?url=$(python3 -c "import urllib.parse;print(urllib.parse.quote('https://11-app-mop.iotek.ai/user/user_login'))")" \
  --data-urlencode "email=$ZMODO_TEST_EMAIL" --data-urlencode "password=<md5>" --data-urlencode "client=1" ... 
```
Expected: 返回 `result` 字段（经代理可达）。`README.md` 写明 Linux 上 `EXPO_PUBLIC_API_PROXY=http://<host>:8787/` 后 Web 预览即可连真实 API。

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: linux CORS proxy for web preview"
```

---

## Milestone 12：Web 端到端验证（Playwright）

### Task 12.1：e2e 截图/导航验证

**Files:** Create `e2e/web.spec.ts`, `playwright.config.ts`

- [ ] **Step 1: 写 Playwright 配置（webServer 启 expo web）**

`playwright.config.ts`：`webServer: { command: 'npx expo start --web --port 8081', url: 'http://localhost:8081', reuseExistingServer: true }`，`use.baseURL`。

- [ ] **Step 2: 写用例（登录→首页→直播占位→设置）**

`e2e/web.spec.ts`：访问 `/`；填 `login.email`/`login.password`（用 env 测试账号，经代理）→ 按 `login.submit`；等待首页设备卡出现（`findByText` 真实设备名或卡片 testID）；点第一张卡 → 断言 `camera.liveView` 占位可见；返回 → 进设置 → 断言设置项可见。每步 `page.screenshot()` 存 `e2e/__screenshots__/`。

- [ ] **Step 3: 运行（需代理在跑 + .env）**

Run:
```bash
node proxy/server.mjs & EXPO_PUBLIC_API_PROXY=http://localhost:8787/ npx playwright test
```
Expected: 全部用例通过；截图生成，人工核对视觉接近原 App。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "test: playwright web e2e (login -> list -> live -> settings)"
```

### Task 12.2：阶段① 收尾文档

**Files:** Create `README.md`

- [ ] **Step 1: 写运行说明**

`README.md`：如何在 macOS/Linux 跑 Web 预览（`.env` 配置、起代理、`npx expo start --web`）；如何跑测试（`npm test`、`node scripts/smoke-login.mjs`、playwright）；阶段②/③ 待办与 `CameraVideoView.native` / `modules/` 接入点说明。

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "docs: phase 1 run/verify instructions"
```

---

## 阶段②/③ 预告（各自单独成计划）

- **阶段②（macOS）**：`npx expo prebuild -p ios` → 在 `modules/` 写 Expo local native module 桥接 `LibCoreWrap`（`createRealPlay/startRealPlay/stop/destroy` + observer→事件）+ 原生视频视图组件；`CameraVideoView.native.tsx` 接上；`expo run:ios` 进模拟器；链接现有 `.a` 库（FFmpeg/LibCore/pjsip）并复用已验证的"模拟器平台标记剥离"流程。真画面需真机+账号验证。
- **阶段③（Linux 可编 JS / 原生需对应环境）**：用户提供 Android SDK 后，按 `LibCoreBridge` 同接口实现 Android 原生模块。

---

## 自查（Self-Review）

- **规格覆盖**：8 页全部有对应 Milestone（登录 M3 / 列表 M4 / 直播 M5 / 回放 M6 / 设置 M7 / 分享 M8 / 加设备 M9 / 账户 M10）；真实 API（M2 + 冒烟脚本）；host_list 路由（Task 2.3）；CORS 代理（M11）；视频抽象（Task 5.1）；Web 验证（M12）。✅
- **占位符扫描**：无 TBD/TODO 式空步骤；每个组件/接口给了真实代码或明确结构 + 验证命令。screens 的样式细节交由执行者按原 App 截图还原，但每步均有可运行的测试/导出验证。
- **类型一致**：`postForm(hostCategory, path, params)`、`deviceList(token,start,count)`、`deviceModify(token, physical_id, fields)`、`shareAdd(token, physical_id, email)`、`CameraVideoView{ physicalId, mode }`、`useAuth().{token,user,setSession,clear,hydrate}` 全计划一致。
- **凭证**：仅 `.env`，`.env.example` 提交键名，源码无明文。✅
