# Zmodo React Native (+ Web) 转换 — 设计文档

- 日期：2026-06-10
- 项目位置：`/Users/jianzhang/zmodo-temolate-react`
- 来源：`/Users/jianzhang/Downloads/zmodo-template`（IOTEK No-Code 原生 iOS Zmodo 相机 App 模板）

## 1. 目标

把原生 iOS Zmodo 相机 App 的**核心摄像头相关页面**用 React Native（Expo）重建，使其：

1. 能以 **Web 形式**渲染（react-native-web），在 No-Code 平台里以"手机预览"出现，**可跑在 Linux 上**。
2. 同一套代码可构建 **iOS / Android 原生 App**，真实用户安装后能绑定设备、看直播/回放。
3. 摄像头相关功能"一模一样"——UI、交互、数据与原 App 一致。

## 2. 关键约束与现实（已与用户确认）

- **最终部署目标是 Linux**。iOS 模拟器/原生编译只能在 macOS 上做（Apple 限制）；Linux 只能承担 Web 预览 + JS 打包 + 后续 Android。
- **视频流是专有原生栈**（FFmpeg + LibCore P2P + pjsip），无法用 JS 复刻，只能桥接原生模块。原生 ViewController 无法渲染到 Web。
- **Web 上视频不要求工作**：视频区在 Web 显示占位（"请在手机 App 中查看"）即可；真实视频在原生端实现。
- **平台顺序**：iOS 先行；Android SDK 由用户后续提供，届时按同接口补齐。
- **无本地测试摄像头**，但有真实测试账号（见 §4），账号下有 7 台真实设备。

## 3. 已实测验证的事实（动工前已用真实后端跑通）

基地址 `https://11-app-mop.iotek.ai`（注意：模板默认是 `22-`，本项目用 `11-`）。

| 接口 | 方法/格式 | 结果 |
|---|---|---|
| `/user/user_login` | POST，表单编码，`email` + `password=md5(明文)` + `client=1` + `client_uuid` + `client_version` + `language` + `platform` + `app_version` + `offset_second` | ✅ `result:"ok"`，返回 `token`、`data.id`、`host_list` |
| `/device/device_list` | POST，表单编码，`token` + `start` + `count` | ✅ `result:"ok"`，`data` 为设备数组，账号下 7 台（6 摄像头 `device_type:0` + 1 NVR `device_type:1`）|

- 成功判定：`result == "ok"`；token 失效码 `1002`；其余为错误码 + `error` 文案。
- 登录返回 `host_list`：`app_access` / `alerts` / `user_mng` / `device_add` / `file_server` 等，每类含多个 host。**API 层登录后必须缓存 host_list，按接口类别路由，而非写死单一域名。**
- 设备关键字段：`physical_id`、`device_name`、`device_online`、`device_on`、`device_type`、`device_model`/`product_id`（缩略图）、`permission`（JSON：`rb`实时/`pb`回放/`al`告警/`vdownload`下载）、`aes_key`/`upnp_ip`/`upnp_port`（流媒体）、设置类 `nightvision`/`motion_sensitivity`/`sound_detection`/`imageflip`/`device_volume` 等。

## 4. 凭证处理

- 测试账号、密码、基地址放入项目根 `.env`（**gitignore，不提交**）。
- 设计文档与源码**不含明文密码/token**；通过环境变量读取。
- `.env.example` 提交，列出需要的键名（不含值）。

## 5. 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | Expo（最新 SDK）+ TypeScript | 一套代码出 Web / iOS / Android |
| Web 渲染 | react-native-web（Expo 内置）| RN 组件 → 浏览器 DOM，跑 Linux |
| 路由 | Expo Router（文件路由）| Web + 原生通用 |
| 服务端状态 | TanStack Query | 设备列表/详情的缓存与刷新 |
| 客户端状态 | Zustand | 登录态、UI 态 |
| 样式 | RN StyleSheet + 主题 token | 还原原 App 视觉，Web 兼容 |
| 数据层 | 自研 IOTEK API 客户端（host_list 路由）+ Linux CORS 代理（仅 Web）| 真实数据，满足"连真实 API" |

## 6. 页面范围（核心 7 + 设置/分享，共 8）

1. **登录** — 邮箱/密码；注册、忘记密码入口（入口先占位）。
2. **首页 / 设备(摄像头)列表** — 缩略图、在线状态、点进直播。
3. **直播页** — 控制栏 / 云台 / 对讲 / 清晰度等 UI 全做；视频区 Web 占位、原生真画面。
4. **回放页** — SD + 云、时间轴；视频区同上。
5. **加设备** — 扫码流程；Web 上扫码占位。
6. **设备设置** — 改名、夜视、移动侦测灵敏度、声音侦测、报警等（对接 `/device/device_modify` 类接口）。
7. **设备分享** — 分享给其他用户。
8. **账户 / 退出登录**。

## 7. 视频抽象（关键设计）

统一组件 `<CameraVideoView device mode="live|playback" …>`，平台分叉：

- **`.web.tsx`**：占位图 + 状态文案；不加载流。
- **`.native.tsx`**（阶段②/③）：承载原生视频视图，调 `LibCoreBridge.start/stop/seek/talk`，监听帧/事件回调。
- JS 上层只认统一接口与 props；三端 UI 完全一致，仅视频实现按平台分叉。
- 原生模块 TS 接口 `src/native/LibCoreBridge.ts` 先定义类型与桩，iOS 实现落在 `modules/`。

## 8. 项目结构

```
zmodo-temolate-react/
├─ app/                # Expo Router 页面：login, home, camera/[id]/live, camera/[id]/playback,
│                      #   add-device, camera/[id]/settings, camera/[id]/share, account
├─ src/
│  ├─ api/             # IOTEK 客户端：login, deviceList, deviceModify, share…；host_list 路由；类型
│  ├─ components/      # 通用 UI + CameraVideoView(.web/.native) + 手机预览外框
│  ├─ store/           # Zustand（auth / device）
│  ├─ theme/           # 颜色/字号 token（还原蓝色主色 + 白卡片）
│  └─ native/          # LibCoreBridge TS 接口与桩
├─ modules/            # 阶段② iOS 原生模块（Expo local module / config plugin）
├─ proxy/              # Linux 上的 CORS 转发代理（仅 Web 预览用）
├─ .env.example        # 需要的环境变量键名
└─ docs/               # 设计文档 / 规格
```

## 9. 阶段与验证策略

| 阶段 | 内容 | 运行环境 | 现在能验证到 |
|---|---|---|---|
| **① Web 预览**（本次主交付）| 全部 8 页 RN 实现；Web 构建跑起来、套手机框、导航/表单全通；真实 API（经代理）拉登录+设备列表+设置；视频占位 | Linux + 本机浏览器 | ✅ UI / 导航 / 表单 / 真实数据链路 |
| **② iOS 原生视频** | iOS 原生模块桥接 LibCore；`expo run:ios` 进模拟器/真机 | macOS（本机）| ⚠️ 接口可验，真画面需设备 |
| **③ Android 原生视频** | 用户提供 Android SDK 后按同接口补 | Linux 编 JS / 真机 | 待 SDK |

验证手段：
- API 层有可独立运行的脚本/测试，用真实账号跑 `login → device_list → device_modify(只读类)`，断言 `result==ok`。
- Web 预览用浏览器驱动（Playwright/截图）逐页核对渲染与导航。
- 阶段② 在本机用 iOS 模拟器构建运行，验证桥接编译与接口；真实直播画面待真机。

## 10. 不在本次范围

- 完整 App 的其余 ~360 个页面（门锁/温控/灌溉/人脸等非摄像头核心模块）。
- 真实直播/回放画面在无设备环境下的验证（留待用户提供设备）。
- Android 原生视频（待 SDK）。
- 推送通知、应用内购买/计费、广告 SDK。

## 11. 风险

- **CORS**：浏览器直连被拦——靠 Linux 代理解决；已知方案，低风险。
- **host_list 路由复杂度**：需准确复刻多 host + token 刷新逻辑；以原 App `ZSWebInterface` 为准。
- **原生桥接（阶段②）**：需在 Mac 上链接现有 `.a` 库（FFmpeg/LibCore/pjsip）；模拟器需做与原生项目相同的平台标记处理（已有经验）。真画面验证受限于无设备。
- **视觉还原度**：以原 App 截图为基准逐页比对。
