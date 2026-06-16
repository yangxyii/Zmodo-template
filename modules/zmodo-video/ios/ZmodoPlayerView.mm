//
//  ZmodoPlayerView.mm   (Objective-C++)
//  ZmodoVideo
//
//  M2.1 — Live stream player backed by LibCoreWrap + NormalPlayView (YUV/OpenGL).
//
//  Key API references (all confirmed from actual headers before writing):
//    LibCoreWrap.h  — StreamObserverProtocol, createRealPlayWithPlatform:...,
//                     startRealPlayWithHandle:..., setParamsWithHandle:jsonParams:,
//                     stopPlayWithHandle:, destroyPlay:
//    YUVFrame.h     — luma/chromaB/chromaR (NSData), width/height (NSInteger)
//    ztypes.h       — z_handle (long), DecodeType (DECODE_H264/DECODE_H265),
//                     ZEventCode: Z_START_PLAY_OK, Z_START_PLAY_FAILED,
//                                 Z_PLAY_BROKEN, Z_STOP_PLAY_OK
//    PlayVideoBaseView.h — processFrameBuffer:(id)frame
//

#import "ZmodoPlayerView.h"
#import "NormalPlayView.h"
#import "LibCoreWrap.h"
#import "YUVFrame.h"
#import "ztypes.h"

// ---------------------------------------------------------------------------
// Class extension — adopt StreamObserverProtocol (all @optional, so no
// methods are required; we implement only the two we need).
// ---------------------------------------------------------------------------
@interface ZmodoPlayerView () <StreamObserverProtocol>

@property (nonatomic, strong) NormalPlayView *normalPlayView;

@end

// ---------------------------------------------------------------------------
// Static flag — LibCoreWrap initialize: is a one-shot global call per platform.
// We track whether it has already been called to avoid redundant initialisation
// across multiple ZmodoPlayerView instances within the same process.
// ---------------------------------------------------------------------------
static BOOL sLibCoreInitializedNewPlatform = NO;
static BOOL sLibCoreInitializedOldPlatform = NO;

// ---------------------------------------------------------------------------
@implementation ZmodoPlayerView
{
    z_handle   _handle;     // 0 = no active session
    NSInteger  _platform;   // saved so stop/dealloc can reference it
}

// ---------------------------------------------------------------------------
#pragma mark - Init / Layout
// ---------------------------------------------------------------------------

- (instancetype)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
        [self p_setupNormalPlayView];
    }
    return self;
}

- (instancetype)initWithCoder:(NSCoder *)coder
{
    self = [super initWithCoder:coder];
    if (self) {
        [self p_setupNormalPlayView];
    }
    return self;
}

- (void)p_setupNormalPlayView
{
    _handle   = 0;
    _platform = 0;

    NormalPlayView *pv = [[NormalPlayView alloc] initWithFrame:self.bounds];
    pv.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self addSubview:pv];
    self.normalPlayView = pv;
}

// ---------------------------------------------------------------------------
#pragma mark - Public API
// ---------------------------------------------------------------------------

- (void)startLiveWithDeviceId:(NSString *)deviceId
                      channel:(NSInteger)channel
                       aesKey:(nullable NSString *)aesKey
                     platform:(NSInteger)platform
                    videoType:(NSInteger)videoType
                     deviceIp:(nullable NSString *)deviceIp
                         port:(NSInteger)port
                     connMode:(NSInteger)connMode
                        token:(nullable NSString *)token
{
    // Stop any currently active session before starting a new one.
    [self stop];

    _platform = platform;

    // -----------------------------------------------------------------------
    // Step 1: initialise LibCoreWrap (global, once per platform per process).
    //   isOldPlatform: 0 = new platform, 1 = old platform.
    //   uuid: stable per-device identifier (matches what the Zmodo app uses).
    // -----------------------------------------------------------------------
    NSString *uuid = [[[UIDevice currentDevice] identifierForVendor] UUIDString] ?: @"";

    if (platform == 0 && !sLibCoreInitializedNewPlatform) {
        [[LibCoreWrap sharedCore] initialize:0 uuid:uuid];
        sLibCoreInitializedNewPlatform = YES;
    } else if (platform != 0 && !sLibCoreInitializedOldPlatform) {
        [[LibCoreWrap sharedCore] initialize:1 uuid:uuid];
        sLibCoreInitializedOldPlatform = YES;
    }

    // -----------------------------------------------------------------------
    // Step 2: create the real-play handle.
    //   DecodeType cast: the header signature is (DecodeType)videoType so we
    //   cast the NSInteger the caller supplies.
    // -----------------------------------------------------------------------
    _handle = [[LibCoreWrap sharedCore]
                   createRealPlayWithPlatform:platform
                                     deviceId:deviceId
                                      channel:channel
                               streamObserver:self
                                    videoType:(DecodeType)videoType];

    // -----------------------------------------------------------------------
    // Step 3: optionally set AES key (and audio_encrypt=0 default).
    //   JSON format confirmed from LiveVideoPlayInstrumens.m:
    //     {"aes_key":"<key>","audio_encrypt":0}
    // -----------------------------------------------------------------------
    if (aesKey.length > 0) {
        // Build param JSON manually to avoid pulling in MJExtension.
        NSString *jsonParams = [NSString stringWithFormat:
            @"{\"aes_key\":\"%@\",\"audio_encrypt\":0}", aesKey];
        [[LibCoreWrap sharedCore] setParamsWithHandle:_handle jsonParams:jsonParams];
    }

    // -----------------------------------------------------------------------
    // Step 4: start the stream.
    //   timeout: 30 000 ms (30 s) — matches Real_Play_TimeOut in the app.
    //   mediaType: 1 = SD (standard definition).  The RN bridge (M2.2) can
    //              expose a mediaType prop if needed; default to SD for now.
    //   deviceIp: fall back to empty string if nil (pure transfer mode).
    //   req_conn_mode: 5 (UPNP | TRANSFER) is the app's default; the caller
    //              supplies connMode so they can override.
    // -----------------------------------------------------------------------
    NSString *ip = (deviceIp.length > 0) ? deviceIp : @"";
    [[LibCoreWrap sharedCore] startRealPlayWithHandle:_handle
                                             timeout:30000
                                           mediaType:1
                                            deviceIp:ip
                                                port:port
                                       req_conn_mode:connMode];
}

- (void)stop
{
    if (_handle != 0) {
        [[LibCoreWrap sharedCore] stopPlayWithHandle:_handle];
        [[LibCoreWrap sharedCore] destroyPlay:_handle];
        _handle = 0;
    }
}

// ---------------------------------------------------------------------------
#pragma mark - Dealloc
// ---------------------------------------------------------------------------

- (void)dealloc
{
    [self stop];
}

// ---------------------------------------------------------------------------
#pragma mark - StreamObserverProtocol
// ---------------------------------------------------------------------------

/**
 * Called on a LibCoreWrap worker thread for each decoded video frame.
 * Parameters confirmed from LibCoreWrap.h StreamObserverProtocol:
 *   y / u / v — id (typed as NSData in practice; matches YUVFrame.luma etc.)
 *   width / height — NSInteger
 *   frameTime — int
 *   token — id
 */
- (void)didReceiveImageDataY:(id)y
                       dataU:(id)u
                       dataV:(id)v
                       width:(NSInteger)width
                      height:(NSInteger)height
                   frameTime:(int)frameTime
                       token:(id)token
{
    // Build a YUVFrame and hand it to the OpenGL renderer on the main thread.
    // Confirmed from LiveVideoPlayInstrumens.m lines 809-816: y/u/v are
    // assigned directly to luma/chromaB/chromaR (all NSData).
    YUVFrame *frame  = [[YUVFrame alloc] init];
    frame.luma       = (NSData *)y;
    frame.chromaB    = (NSData *)u;
    frame.chromaR    = (NSData *)v;
    frame.width      = width;
    frame.height     = height;

    NormalPlayView *pv = self.normalPlayView;
    dispatch_async(dispatch_get_main_queue(), ^{
        [pv processFrameBuffer:frame];
    });
}

/**
 * Called on a LibCoreWrap worker thread for stream lifecycle events.
 * Signature confirmed from LibCoreWrap.h StreamObserverProtocol:
 *   code    — int  (ZEventCode values from ztypes.h)
 *   content — const char *
 *   length  — int
 *   handle  — z_handle
 *
 * Status code mapping (all enum values confirmed from ztypes.h):
 *   Z_START_PLAY_OK    → "start"
 *   Z_START_PLAY_FAILED → "error"
 *   Z_PLAY_BROKEN      → "error"
 *   Z_STOP_PLAY_OK     → "stop"
 */
- (void)didReceiveStreamStatus:(int)code
                       content:(const char *)content
                        length:(int)length
                        handle:(z_handle)handle
{
    __weak __typeof__(self) weakSelf = self;

    switch (code) {
        case Z_START_PLAY_OK: {
            dispatch_async(dispatch_get_main_queue(), ^{
                if (weakSelf.onStreamEvent) {
                    weakSelf.onStreamEvent(@"start", nil);
                }
            });
            break;
        }

        case Z_START_PLAY_FAILED:
        case Z_PLAY_BROKEN: {
            // Surface the raw status code as a string; the RN layer can map it.
            NSString *codeStr = [NSString stringWithFormat:@"%d", code];
            // Also include content if present.
            NSString *detail = nil;
            if (content && length > 0) {
                detail = [[NSString alloc] initWithBytes:content
                                                  length:(NSUInteger)length
                                                encoding:NSUTF8StringEncoding];
            }
            NSString *message = detail.length > 0
                ? [NSString stringWithFormat:@"%@ — %@", codeStr, detail]
                : codeStr;

            dispatch_async(dispatch_get_main_queue(), ^{
                if (weakSelf.onStreamEvent) {
                    weakSelf.onStreamEvent(@"error", message);
                }
            });
            break;
        }

        case Z_STOP_PLAY_OK: {
            dispatch_async(dispatch_get_main_queue(), ^{
                if (weakSelf.onStreamEvent) {
                    weakSelf.onStreamEvent(@"stop", nil);
                }
            });
            break;
        }

        default:
            // Other codes (Z_PAUSE_PLAY_OK, Z_RESUME_PLAY_OK, etc.) are
            // silently ignored — the RN API surface only needs start/error/stop.
            break;
    }
}

@end
