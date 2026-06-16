# 阶段② iOS 原生视频模块 — 设计文档

- 日期：2026-06-11
- 分支：jiandev（未经指令不合并 main）
- 项目：`/Users/jianzhang/zmodo-temolate-react`（Expo + react-native-web Zmodo App）
- 原生源：`/Users/jianzhang/Downloads/zmodo-template`

## 目标
让 RN App 在 **iOS 真机** 上真正显示直播/回放视频。当前 `CameraVideoView.native.tsx` 是占位桩，本阶段用一个 Expo 原生模块桥接 Zmodo 专有视频栈（LibCore P2P + FFmpeg 解码 + pjsip 对讲），把占位替换为真实画面。Web 端保持占位不变。

## 核心策略：复用原生 ObjC 代码，不重写
原生工程已分层好，直接复用：
- `LibCoreWrap`（ObjC 封装，调底层 C 库）— 链接复用，不重写
- `NormalPlayView`（OpenGL ES 2.0 的 YUV 渲染 UIView）— 移植复用，不自写 shader
- 调用时序照搬：`createRealPlay → setParams(aes_key) → startRealPlay → didReceiveImageDataY 回调帧 → stop → destroy`

我们只写一层薄 Expo 模块外壳。

## 架构
```
RN  CameraVideoView.native.tsx  (props: physicalId, channel, mode, ip/port/aesKey/platform/videoType/token)
        ↓
Expo 原生模块 modules/zmodo-video/  (Expo Modules API, Swift/ObjC)
  ├─ ZmodoVideoView : ExpoView  ← 内嵌移植的 NormalPlayView(OpenGL YUV 渲染)
  ├─ 方法: start / stop / pause / resume / seek / setQuality / openSound / closeSound / startTalk / stopTalk / destroy
  └─ 事件: streamStarted / streamError / streamStopped / soundOpened / talkStarted ...
        ↓ 链接
Library/ (从 zmodo-template 拷入): liblibcore.a, libGPAC4iOS.a, FFmpeg libav*/libsw*.a,
         pjsip lib*.a, libSmartLink, + include 头文件
```
JS 上层 `src/native/LibCoreBridge.ts` 接口不变；`.native` 实现从占位→真渲染。

## 关键约束与影响
1. **必须用开发版构建（Dev Build）**：自定义原生代码 Expo Go 无法加载。原生端改用 `expo prebuild` + `expo run:ios`。Web 预览不受影响。
2. **包体大**：`liblibcore.a` 单个 107MB（整套编解码引擎）+ FFmpeg/pjsip。原生包显著变大，是这类相机 App 固有成本。
3. **设备 arm64**：`.a` 是设备 arm64，真机直接用；模拟器需复用已验证的"剥离 Mach-O 平台标记"流程（见记忆 zmodo-simulator-build）。
4. **链接要求**：`OTHER_LDFLAGS=-ObjC`；`LIBRARY_SEARCH_PATHS`/`HEADER_SEARCH_PATHS` 指向拷入的 Library；系统框架 VideoToolbox / AVFoundation / AudioToolbox / CoreMedia / CoreGraphics / OpenGLES / CFNetwork / SystemConfiguration。

## 已验证的接口/数据事实
- LibCoreWrap 关键签名、StreamObserverProtocol（`didReceiveImageDataY:dataU:dataV:width:height:frameTime:token:`）、事件码（Z_START_PLAY_OK 等）已摸清（见调研报告）。
- 渲染必须用原生视图（OpenGL），不能把帧送回 JS（太慢）。
- `device_list` 返回的视频字段：`aes_key`（有值，例 DC3D…），`device_type`，`device_channel`，`time_zone`/`offset_seconds`，`if_cvr/support_cvr`（云回放可用）。
- **重要**：测试账号那台摄像头 `upnp_ip`/`upnp_port` 为空 → 远程设备，**直播走 transfer/中继模式**：需先 `initialize` + `connectServer`（带账号/登录上下文）让中继认到账号，`req_conn_mode` 含 TRANSFER 位；可能需 `startRealPlaySmS` 变体。第一次真机测试确定具体路径。

## 连接参数来源
- token：登录后已有。
- physical_id / aes_key / channel / platform / videoType / time_zone：来自 `device_list`（已在拉）。
- upnp_ip/port：本账号为空 → transfer 模式。

## 分步落地（先 LIVE 跑通最难关，再扩展）
1. **接入与编译**：拷 Library + 头文件进工程；写 Expo 模块骨架 + config plugin（链接设置/框架）；`expo prebuild -p ios` 能编过、`expo run:ios` 能装真机。
2. **LIVE 直播**：移植 `NormalPlayView`；模块接 `LibCoreWrap` 实播流程（含 transfer 模式）；`CameraVideoView.native` 接上；**真机+在线摄像头看到实时画面**（阶段②成败验证点）。
3. **回放**：SD（`createPlayBack`/`startPlayBack`）+ 云（`createAppCloudPlay`/`startAppCloudPlay`），接现有回放页时间轴。
4. **声音/对讲**：`openSound`/`closeSound`/`startTalk`/`stopTalk`/`talkSendData`。

## 验证（标准）
真机装开发版 → 登录测试账号 → 打开在线摄像头 → **看到真实直播画面**；再验回放、声音、对讲。需 Mac+Xcode+iPhone 真机+在线摄像头（均具备）。

## 不在本阶段
- Android 原生视频（阶段③，待 Android SDK）。
- 知识包提炼（阶段②完成后再做，那时视频模块是真能用的）。

## 风险
- 这是全项目最难、最不确定的一块（专有 C 库 + transfer 连接 + OpenGL 渲染移植）。第 1、2 步可能反复调。
- transfer/中继连接细节未知，第一次真机测试是关键验证。
- 大体积静态库链接、`-ObjC`、符号冲突等编译期问题常见，需逐个排。
