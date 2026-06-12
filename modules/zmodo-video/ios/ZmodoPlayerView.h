//
//  ZmodoPlayerView.h
//  ZmodoVideo
//
//  M2.1 — Live stream player backed by LibCoreWrap + NormalPlayView (YUV/OpenGL).
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * ZmodoPlayerView — a self-contained UIView that:
 *  - Opens a LibCoreWrap real-play session for a given device/channel.
 *  - Renders incoming YUV frames via NormalPlayView (OpenGL ES).
 *  - Reports lifecycle events through `onStreamEvent`.
 *
 * Usage (M2.2 will wire this to Expo/RN):
 *   ZmodoPlayerView *player = [[ZmodoPlayerView alloc] initWithFrame:frame];
 *   player.onStreamEvent = ^(NSString *type, NSString *message) { ... };
 *   [player startLiveWithDeviceId:@"..." channel:0 aesKey:nil
 *                        platform:0 videoType:0 deviceIp:@"1.2.3.4"
 *                            port:8080 connMode:5 token:nil];
 *   // later:
 *   [player stop];
 */
@interface ZmodoPlayerView : UIView

/**
 * Called on the main thread whenever stream state changes.
 *   type    — one of: "start" | "error" | "stop"
 *   message — nil for "start"/"stop"; error description / code string for "error".
 */
@property (nonatomic, copy, nullable) void (^onStreamEvent)(NSString *type, NSString * _Nullable message);

/**
 * Begin a live real-play session.
 *
 * @param deviceId   Physical device ID string.
 * @param channel    Channel index (0-based).
 * @param aesKey     Optional AES encryption key.  Pass nil if unused.
 * @param platform   0 = new platform, 1 = old platform  (passed to LibCoreWrap isOldPlatform).
 * @param videoType  0 = H.264 (DECODE_H264), 1 = H.265 (DECODE_H265).
 * @param deviceIp   UPNP/LAN IP of the device.  Pass nil / empty string for transfer-only.
 * @param port       Device port (upnpPort).
 * @param connMode   Bitmask from ReqConnMode enum: UPNP=0x01, LAN=0x02, TRANSFER=0x04.
 *                   Typical value: 5 (UPNP | TRANSFER).
 * @param token      Access-server token (currently unused by this view; pass nil).
 */
- (void)startLiveWithDeviceId:(NSString *)deviceId
                      channel:(NSInteger)channel
                       aesKey:(nullable NSString *)aesKey
                     platform:(NSInteger)platform
                    videoType:(NSInteger)videoType
                     deviceIp:(nullable NSString *)deviceIp
                         port:(NSInteger)port
                     connMode:(NSInteger)connMode
                        token:(nullable NSString *)token;

/**
 * Stop the current stream and release the LibCoreWrap handle.
 * Safe to call even if no stream is active.
 */
- (void)stop;

@end

NS_ASSUME_NONNULL_END
