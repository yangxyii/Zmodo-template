# 阶段② iOS 原生视频模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 让 RN App 在 iOS 真机上真正显示直播/回放视频——用一个 Expo 本地原生模块桥接 Zmodo 专有视频栈（LibCore P2P + FFmpeg 解码 + pjsip 对讲），复用原生 `LibCoreWrap` 与 `NormalPlayView`，把 `CameraVideoView.native` 从占位换成真画面。

**Architecture:** 新建 Expo 本地模块 `modules/zmodo-video`（Swift `Module` + Swift `ExpoView`，内嵌一个我们写的 ObjC `ZmodoPlayerView`，由桥接头暴露 `LibCoreWrap.h`/`NormalPlayView.h`/`YUVFrame.h`）。专有 `.a`/头文件从 `zmodo-template` 拷入 `modules/zmodo-video/ios/vendor/`，由模块 podspec 链接（vendored_libraries + `-ObjC` + 系统框架）。JS 侧实现 `LibCoreBridge`（`.native`）并接到现有 `CameraVideoView.native.tsx`。加入原生代码后改用**开发版构建**（`expo prebuild` + `expo run:ios`），Web 不变。

**Tech Stack:** Expo SDK 56 (expo-modules-core), Swift + Objective-C(++), CocoaPods, OpenGL ES 2.0(沿用原生渲染), LibCore/FFmpeg/pjsip 静态库, React Native New-Arch view component。

**依据规格：** `docs/superpowers/specs/2026-06-11-phase2-ios-native-video-design.md`
**分支：** 全程 `jiandev`（未经指令不合并 main）。每个 commit 结尾加 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。

**关于"测试"：** 原生 iOS 视频无法像 JS 那样单元测试；本计划的验证 = ①编译/链接通过 ②`expo run:ios` 装到真机 ③真机登录后打开在线摄像头**肉眼看到画面**。JS 侧改动仍保持 jest 绿（102 passing）。每个任务用真实命令 + 预期输出验证，频繁提交。

**必备环境（已确认具备）：** macOS + Xcode + CocoaPods、iPhone 真机、可登录账号 `ms201617@mailnesia.com`、一台在线摄像头（physical_id `ZMD19H2IHA01172`，`aes_key` 有值、`upnp_ip` 为空→走 transfer 中继模式）。

---

## 文件结构（本阶段创建/修改）

```
zmodo-temolate-react/
├─ app.config.ts                  # 加 video 模块的 config-plugin(链接设置) + ios.bundleIdentifier
├─ modules/zmodo-video/
│  ├─ expo-module.config.json     # 声明 ios 模块
│  ├─ index.ts                    # JS 入口: 导出 ZmodoVideoView + 命令/事件封装
│  ├─ src/ZmodoVideo.types.ts     # TS 类型(props/事件)
│  ├─ ios/
│  │  ├─ ZmodoVideo.podspec       # 链接 vendor 库 + -ObjC + 系统框架 + 头搜索路径
│  │  ├─ ZmodoVideoModule.swift   # Expo Module: 定义 View + AsyncFunction + Events
│  │  ├─ ZmodoVideoView.swift     # ExpoView, 内嵌 ZmodoPlayerView, 透传 props/事件
│  │  ├─ ZmodoPlayerView.h/.mm    # ObjC++ UIView: 持有 NormalPlayView + LibCoreWrap 观察者, 实现实播/回放/声音/对讲
│  │  ├─ ZmodoVideo-Bridging-Header.h  # 暴露 LibCoreWrap.h / NormalPlayView.h / YUVFrame.h / ztypes.h
│  │  ├─ render/                  # 从 zmodo-template 移植: NormalPlayView.h/.m, PlayVideoBaseView.h/.m(+依赖)
│  │  └─ vendor/                  # 拷入: LibCore(include+lib), FFmpeg(include+lib), pjsip, libSmartLink
├─ src/native/LibCoreBridge.native.ts  # 真实实现(调 modules/zmodo-video)
├─ src/native/LibCoreBridge.ts         # 现有接口(web 桩保留)
└─ src/components/CameraVideoView.native.tsx  # 渲染 ZmodoVideoView(替换占位)
```

---

## Milestone 0：开发版构建基线（先不加视频）

目的：在引入大体积库之前，先确认 RN 工程能 prebuild 出 iOS 原生工程并装上真机/模拟器。

### Task 0.1：prebuild 生成 iOS 原生工程

**Files:** Modify `app.config.ts`（加 `ios.bundleIdentifier`）；生成 `ios/`（gitignore 与否见 Step3）。

- [ ] **Step 1: 设 bundle id**

在 `app.config.ts` 的 `expo` 下加：
```ts
ios: {
  supportsTablet: true,
  bundleIdentifier: 'com.zmodo.rn.dev',
},
```

- [ ] **Step 2: 生成原生工程**

Run:
```bash
cd /Users/jianzhang/zmodo-temolate-react
npx expo prebuild -p ios --clean
```
Expected: 生成 `ios/`，`pod install` 自动跑完，无报错。

- [ ] **Step 3: gitignore 原生产物**

确认 `.gitignore` 含 `/ios` 与 `/android`（Expo prebuild 产物不入库，靠 config plugin 复现）。若未含则添加。

- [ ] **Step 4: 真机/模拟器跑基线**

Run（真机需先在 Xcode 配好签名团队；或先用模拟器）：
```bash
npx expo run:ios --device   # 选你的 iPhone；或去掉 --device 用模拟器
```
Expected: App 装上、能登录、看到首页设备列表（视频仍占位）。这验证 dev-build 通路 OK。

- [ ] **Step 5: Commit**

```bash
git add app.config.ts .gitignore
git commit -m "build(ios): set bundle id + prebuild baseline for dev build"
```

---

## Milestone 1：Expo 模块骨架 + 链接专有库（能编译）

目的：建一个**空但能编译链接**的原生视图模块（视图先显示纯色），把 107MB 的 `liblibcore.a` 等链进去并通过。这一步专治链接/符号问题。

### Task 1.1：创建本地 Expo 模块骨架

**Files:** Create `modules/zmodo-video/*`（用 CLI 生成后裁剪）

- [ ] **Step 1: 生成本地模块**

Run:
```bash
cd /Users/jianzhang/zmodo-temolate-react
npx create-expo-module@latest --local zmodo-video
```
交互里：name `zmodo-video`，含 View 组件。生成 `modules/zmodo-video/`（含 `ios/ZmodoVideoModule.swift`、`ios/ZmodoVideoView.swift`、`ios/ZmodoVideo.podspec`、`expo-module.config.json`、`index.ts`、`src/`）。Android 目录本阶段不动（可留生成的桩）。

- [ ] **Step 2: 重新 prebuild 让模块进 Pods**

Run:
```bash
npx expo prebuild -p ios --clean
```
Expected: `pod install` 把 `ZmodoVideo` 本地 pod 装上，无报错。

- [ ] **Step 3: 模块视图显示纯色 + 跑通**

确保生成的 `ZmodoVideoView.swift` 渲染一个有背景色的 UIView；在一个临时屏或直接 `CameraVideoView.native` 里渲染 `<ZmodoVideoView style={{flex:1}}/>`，`expo run:ios` 看到色块。
Expected: 真机/模拟器上看到该原生视图色块（证明 Expo 原生 view 通路 OK）。

- [ ] **Step 4: Commit**

```bash
git add modules/zmodo-video app.config.ts
git commit -m "feat(native): scaffold zmodo-video expo local module (colored view)"
```

### Task 1.2：拷入专有库 + 头文件

**Files:** Create `modules/zmodo-video/ios/vendor/...`, `modules/zmodo-video/ios/render/...`

- [ ] **Step 1: 拷静态库 + 头文件**

Run（只拷视频路径需要的；保留目录便于头文件相对引用）：
```bash
SRC=/Users/jianzhang/Downloads/zmodo-template
DST=/Users/jianzhang/zmodo-temolate-react/modules/zmodo-video/ios/vendor
mkdir -p "$DST"
cp -R "$SRC/Library/LibCore"            "$DST/LibCore"
cp -R "$SRC/Library/FFmpeg-3.3.3-iOS"   "$DST/FFmpeg"
cp -R "$SRC/Library/pjsipIOS"           "$DST/pjsip"
cp -R "$SRC/Library/libSmartLink"       "$DST/libSmartLink"
```

- [ ] **Step 2: 拷渲染类（移植 NormalPlayView + 父类及其依赖）**

Run:
```bash
SRC=/Users/jianzhang/Downloads/zmodo-template/CommonClasses/UI/ViewControllers/VideoPlay/views
DST=/Users/jianzhang/zmodo-temolate-react/modules/zmodo-video/ios/render
mkdir -p "$DST"
cp "$SRC/NormalPlayView.h" "$SRC/NormalPlayView.m" "$DST/"
cp "$SRC/PlayVideoBaseView.h" "$SRC/PlayVideoBaseView.m" "$DST/"
```
然后编译时按报错补齐 `PlayVideoBaseView` 引用到的少量依赖（加载动画/工具类）——优先**精简**：把 `PlayVideoBaseView` 里与 GL 渲染无关的 UI（等待动画、tap 手势、背景图）裁掉，只保留 `processFrameBuffer:` 渲染链所需。若裁剪复杂，则连同依赖一起拷入 `render/`。记录裁了什么。

- [ ] **Step 3: Commit**

```bash
git add modules/zmodo-video/ios/vendor modules/zmodo-video/ios/render
git commit -m "chore(native): vendor LibCore/FFmpeg/pjsip + port GL render views"
```
（注意：`liblibcore.a` 107MB，确认 git 能提交大文件；如超限改用 git-lfs 或在 README 注明手动放置——本阶段先直接提交，超限再转 lfs。）

### Task 1.3：podspec 链接配置 + 桥接头

**Files:** Modify `modules/zmodo-video/ios/ZmodoVideo.podspec`；Create `modules/zmodo-video/ios/ZmodoVideo-Bridging-Header.h`

- [ ] **Step 1: 写 podspec 链接段**

在 `ZmodoVideo.podspec` 加（路径相对 podspec 所在 `ios/`）：
```ruby
s.vendored_libraries =
  'vendor/LibCore/lib/liblibcore.a',
  'vendor/LibCore/lib/libGPAC4iOS.a',
  'vendor/FFmpeg/lib/libavcodec.a','vendor/FFmpeg/lib/libavformat.a',
  'vendor/FFmpeg/lib/libavutil.a','vendor/FFmpeg/lib/libswscale.a',
  'vendor/pjsip/lib-all/libpj-arm-apple-darwin9.a',
  'vendor/pjsip/lib-all/libpjlib-util-arm-apple-darwin9.a',
  'vendor/pjsip/lib-all/libpjnath-arm-apple-darwin9.a',
  'vendor/libSmartLink/libSmartLink_armv7_i386_release.a'
s.frameworks = 'VideoToolbox','AVFoundation','AudioToolbox','CoreMedia',
               'CoreGraphics','OpenGLES','CFNetwork','SystemConfiguration'
s.pod_target_xcconfig = {
  'OTHER_LDFLAGS' => '-ObjC',
  'HEADER_SEARCH_PATHS' =>
    '"$(PODS_TARGET_SRCROOT)/ios/vendor/LibCore/include" ' \
    '"$(PODS_TARGET_SRCROOT)/ios/vendor/FFmpeg/include" ' \
    '"$(PODS_TARGET_SRCROOT)/ios/vendor/pjsip/include" ' \
    '"$(PODS_TARGET_SRCROOT)/ios/render"',
  'SWIFT_OBJC_BRIDGING_HEADER' => '$(PODS_TARGET_SRCROOT)/ios/ZmodoVideo-Bridging-Header.h',
  'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64',  # 库为 arm64
  'VALID_ARCHS' => 'arm64',
}
s.source_files = 'ios/**/*.{h,m,mm,swift}'
```
（具体键以编译报错为准微调；模拟器若要跑，按记忆 zmodo-simulator-build 做平台标记剥离。）

- [ ] **Step 2: 写桥接头**

`ZmodoVideo-Bridging-Header.h`:
```objc
#import "LibCoreWrap.h"
#import "YUVFrame.h"
#import "ztypes.h"
#import "NormalPlayView.h"
#import "ZmodoPlayerView.h"
```

- [ ] **Step 3: prebuild + 编译验证链接**

Run:
```bash
npx expo prebuild -p ios --clean && npx expo run:ios --device
```
Expected: 链接通过、App 起来（视图仍色块）。**这一步是 Milestone 1 的关键验证**——证明 107MB 库 + `-ObjC` 链接成功、无重复符号。常见问题：重复符号→调整链接顺序/去掉冲突库；缺符号→补系统框架。逐个排，记录解法。

- [ ] **Step 4: Commit**

```bash
git add modules/zmodo-video/ios/ZmodoVideo.podspec modules/zmodo-video/ios/ZmodoVideo-Bridging-Header.h
git commit -m "build(native): link LibCore/FFmpeg/pjsip in module podspec (-ObjC, frameworks)"
```

---

## Milestone 2：LIVE 直播（核心成败点）

### Task 2.1：ObjC++ 播放视图 ZmodoPlayerView（实播流程 + 渲染 + 事件）

**Files:** Create `modules/zmodo-video/ios/ZmodoPlayerView.h` / `.mm`

- [ ] **Step 1: 头文件接口**

`ZmodoPlayerView.h`:
```objc
#import <UIKit/UIKit.h>
@interface ZmodoPlayerView : UIView
// 事件回调(由 Swift 视图设置, 转发给 RN)
@property (nonatomic, copy) void(^onStreamEvent)(NSString *type, NSString *message);
// 连接参数(来自 device_list + login)
- (void)startLiveWithDeviceId:(NSString *)deviceId
                      channel:(NSInteger)channel
                       aesKey:(NSString *)aesKey
                     platform:(NSInteger)platform
                    videoType:(NSInteger)videoType
                     deviceIp:(NSString *)deviceIp
                         port:(NSInteger)port
                    connMode:(NSInteger)connMode
                        token:(NSString *)token;
- (void)stop;
- (void)setSound:(BOOL)on;
- (void)startTalk; - (void)stopTalk;
@end
```

- [ ] **Step 2: 实现实播链 + 渲染 + 观察者**

`ZmodoPlayerView.mm`（要点，照搬调研里的时序）：
- `init`: 内嵌一个 `NormalPlayView` 充满 bounds；`[[LibCoreWrap sharedCore] initialize:platform uuid:...]` 必要时 `connectServer`（transfer 模式需要：传登录上下文/token，使中继认到账号）。
- `startLive...`: `z_handle h = [core createRealPlayWithPlatform:platform deviceId:deviceId channel:channel streamObserver:self videoType:videoType];` → 若 aesKey 非空 `[core setParamsWithHandle:h jsonParams:@"{\"aes_key\":\"...\"}"];` → `connMode`（`upnp_ip` 空→TRANSFER 位，例 4/5）→ `[core startRealPlayWithHandle:h timeout:30000 mediaType:1 deviceIp:deviceIp port:port req_conn_mode:connMode];`
- 实现 `StreamObserverProtocol`：`didReceiveImageDataY:dataU:dataV:width:height:frameTime:token:` → 包成 `YUVFrame` → `[self.normalPlayView processFrameBuffer:frame];`；`didReceiveStreamStatus:` → 映射 Z_START_PLAY_OK/FAILED/BROKEN/STOP → `self.onStreamEvent(@"start"/@"error"/@"stop", msg)`。
- `stop`: `stopPlayWithHandle` + `destroyPlay`，置 handle 为 0。
- 音频/对讲：`openSound/closeSound/startTalk/stopTalk`（M4 再细化，先留方法）。

（实现以 `zmodo-template` 的 `LiveVideoPlayInstrumens.m` 为权威参照逐行对照。）

- [ ] **Step 3: 编译**

Run: `npx expo run:ios --device`
Expected: 编译通过（功能未接前可先不调用）。

- [ ] **Step 4: Commit**

```bash
git add modules/zmodo-video/ios/ZmodoPlayerView.h modules/zmodo-video/ios/ZmodoPlayerView.mm
git commit -m "feat(native): ZmodoPlayerView — live play sequence + YUV render + events"
```

### Task 2.2：Expo View + Module 暴露给 JS

**Files:** Modify `modules/zmodo-video/ios/ZmodoVideoView.swift`, `ZmodoVideoModule.swift`, `index.ts`, `src/ZmodoVideo.types.ts`

- [ ] **Step 1: Swift ExpoView 包 ObjC 播放视图**

`ZmodoVideoView.swift`：持有 `ZmodoPlayerView`；定义 props：`physicalId, channel, mode, aesKey, platform, videoType, deviceIp, port, connMode, token, startTime`；定义事件 `onStreamEvent`。当 props 齐备且 `mode=='live'` 时调用 `player.startLive(...)`；卸载时 `player.stop()`。把 `player.onStreamEvent` 转成 Expo 事件。

- [ ] **Step 2: Module 定义**

`ZmodoVideoModule.swift`：
```swift
public class ZmodoVideoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ZmodoVideo")
    View(ZmodoVideoView.self) {
      Events("onStreamEvent")
      Prop("physicalId") { (v: ZmodoVideoView, s: String) in v.physicalId = s }
      // ... 其余 props
    }
    AsyncFunction("stop") { /* 可选: 命令式停止 */ }
  }
}
```

- [ ] **Step 3: JS 入口 + 类型**

`index.ts` 用 `requireNativeView('ZmodoVideo')` 导出 `ZmodoVideoView`；`src/ZmodoVideo.types.ts` 定义 props/事件 TS 类型。

- [ ] **Step 4: 编译**

Run: `npx expo run:ios --device` → 编译通过。

- [ ] **Step 5: Commit**

```bash
git add modules/zmodo-video
git commit -m "feat(native): expose ZmodoVideoView + module to JS"
```

### Task 2.3：接到 RN（LibCoreBridge.native + CameraVideoView.native）+ 真机看直播

**Files:** Create `src/native/LibCoreBridge.native.ts`；Modify `src/components/CameraVideoView.native.tsx`

- [ ] **Step 1: CameraVideoView.native 渲染原生视图**

把占位换成 `<ZmodoVideoView ...>`，props 从传入的 `physicalId/mode` + 通过 query 拿到的设备字段（aes_key/channel/platform/videoType/upnp_ip/port）+ token 组装；`connMode`：`upnp_ip` 为空→`4`(TRANSFER)，否则→`5`(全部)。订阅 `onStreamEvent` 显示连接中/失败态。保留：当原生模块不可用（Expo Go/web）时回退占位（用 try/require 或 `NativeModulesProxy` 探测）。

- [ ] **Step 2: 真机端到端验证（关键）**

Run:
```bash
npx expo run:ios --device
```
然后真机里：登录 `ms201617@mailnesia.com` → 设备列表点在线摄像头(ZMD19H2IHA01172) → 直播页。
Expected: **看到实时画面**。若黑屏：看 `onStreamEvent` 报的码——
- `error`/连接失败 → 多半是 connMode/transfer 路径或 `connectServer` 未带账号上下文；对照 `LiveVideoPlayInstrumens.m` 的 transfer 分支补 `connectServer` 参数。
- 有 start 但无帧 → aes_key/videoType 不匹配，核对 device 字段。
记录现象与解法。这是阶段②的 go/no-go 验证点。

- [ ] **Step 3: Commit**

```bash
git add src/native/LibCoreBridge.native.ts src/components/CameraVideoView.native.tsx
git commit -m "feat: wire native live video into CameraVideoView (real device verified)"
```

### Task 2.4：JS 测试保持绿 + 画质切换

**Files:** Modify `app/__tests__/live.test.tsx`（确保 mock 原生模块），`CameraVideoView.native.tsx`

- [ ] **Step 1: jest 不加载原生**

`__mocks__` 或 jest moduleNameMapper 把 `modules/zmodo-video` / `ZmodoVideoView` 映射为占位组件（同 CameraVideoView.web 套路），确保 `npm test` 不触原生。

- [ ] **Step 2: 画质切换**

`live.quality` 切 LD/SD/HD → 重启流 `mediaType`(1 主/2 子)。`changeStreamWithHandle:mediaType:` 或重 start。真机验证清晰度变化。

- [ ] **Step 3: 验证 + Commit**

Run: `npm test 2>&1 | tail -6`（全绿）+ 真机验证。
```bash
git add -A && git commit -m "feat(live): quality switch + keep jest green with native mock"
```

---

## Milestone 3：回放（SD + 云）

### Task 3.1：ZmodoPlayerView 加回放

**Files:** Modify `modules/zmodo-video/ios/ZmodoPlayerView.{h,mm}`, Swift view, JS

- [ ] **Step 1: SD/云回放方法**

加 `startPlaybackSD(deviceId,channel,aesKey,platform,videoType,upnpIp,port,startTime,isRemote)` 与 `startCloud(deviceId,channel,aesKey,platform,videoType,startTime,timeZone)`：分别 `createPlayBack`/`createAppCloudPlay` → `setParams(aes_key)` → `startPlayBack`(startTime `yyyy-MM-dd HH:mm:ss`)/`startAppCloudPlay`(timeZone offset)。`pause/resume/seek`：`pausePlayWithHandle`/`resumePlayWithHandle`/重 start 到新 startTime。

- [ ] **Step 2: 接回放页**

`CameraVideoView.native` `mode==='playback'` 时按 SD/云走对应方法；接现有回放页时间轴/告警(点告警 seek 到该时间)。

- [ ] **Step 3: 真机验证 + Commit**

真机：回放页选时间/点告警 → 看到回放画面。
```bash
git add -A && git commit -m "feat(playback): SD + cloud playback via native module (device verified)"
```

---

## Milestone 4：声音 + 对讲

### Task 4.1：openSound / startTalk

**Files:** Modify `ZmodoPlayerView.mm`, Swift view, JS（live 的 sound/talk 按钮）

- [ ] **Step 1: 实现**

`setSound:` → `openSound/closeSound`；`startTalk/stopTalk` → 同名 LibCore 方法 + 麦克风采集 `talkSendDataWithHandle`（用 AudioToolbox/AVAudioEngine 采 PCM）。事件映射 Z_OPEN_SOUND_OK/Z_START_TALK_OK。

- [ ] **Step 2: 接 live 控制栏**

`live.sound` 切静音、`live.talk` 按住说话 → 调原生。

- [ ] **Step 3: 真机验证 + Commit**

真机：开声音能听到、对讲对端能收到。
```bash
git add -A && git commit -m "feat(audio): live sound + two-way intercom via native module"
```

---

## Milestone 5：收尾

### Task 5.1：文档 + 大库处理

- [ ] **Step 1: README 原生构建说明**

写：`expo prebuild -p ios` + `expo run:ios --device`；签名团队设置；模拟器需平台标记剥离(指向记忆/脚本)；大库若转 git-lfs 的说明。

- [ ] **Step 2: 确认 jest 全绿 + web 仍可构建**

Run: `npm test 2>&1 | tail -4` 与 `npx expo export -p web 2>&1 | tail -3`。

- [ ] **Step 3: Commit + 推 jiandev**

```bash
git add -A && git commit -m "docs: phase 2 native build instructions"
git push origin jiandev
```

---

## 阶段③预告（Android，待 SDK）
用户提供 Android 版 LibCore/FFmpeg/pjsip 后，按同 `LibCoreBridge` 接口实现 `modules/zmodo-video/android`。本阶段不做。

---

## 自查（Self-Review）

- **规格覆盖**：dev-build(M0)、链接专有库(M1)、LIVE(M2)、回放 SD+云(M3)、声音/对讲(M4)、transfer 模式(M2 Task2.1/2.3 明确)、复用 NormalPlayView/LibCoreWrap(M1.2/M2.1)、Web 不受影响+jest 绿(M2.4/M5) 均有任务覆盖。✅
- **占位符扫描**：无 TBD 空步骤；原生步骤因"装真机看画面"无法纯单测，已用编译+真机肉眼验证替代并写明每步预期与排错方向（这是原生视频的现实，非偷懒）。
- **类型/命名一致**：`ZmodoVideoView`/`ZmodoPlayerView`/`ZmodoVideoModule`/`LibCoreBridge.native`/`onStreamEvent` 全计划一致；连接参数命名(aesKey/platform/videoType/connMode/upnpIp/port/token)一致。
- **风险已标注**：链接符号冲突、transfer 连接细节、大库体积、模拟器限制——均在对应任务写了排查方向。
