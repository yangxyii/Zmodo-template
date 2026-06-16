//
//  ZmodoSession.h
//  ZmodoVideo
//
//  M2.3 — Access-server session manager.
//
//  LibCoreWrap's connectServer: is ASYNCHRONOUS: it merely *initiates* the
//  connection.  The result arrives later as a global EventObserver event
//  (Z_CONN_ACC_SRV_OK / Z_CONN_ACC_SRV_FAILED / Z_CONN_ACC_TOKEN_INVALID).
//
//  Cameras without a LAN IP can only stream via the TRANSFER relay, which
//  requires the access-server login to have *completed* first — otherwise
//  startRealPlay fails with "Not login access server".  This singleton:
//    1. registers a single EventObserver for the new platform,
//    2. tracks whether the access server is currently logged in,
//    3. lets callers (the connect bridge / the player) wait for that state.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Completion for +connectWithParams:completion:.
///   success — YES if Z_CONN_ACC_SRV_OK arrived.
///   code    — the raw ZEventCode (or -1 timeout / -2 superseded) on failure.
///   message — optional detail string from the event payload.
typedef void (^ZmodoConnectCompletion)(BOOL success, NSInteger code, NSString * _Nullable message);

@interface ZmodoSession : NSObject

/// Shared instance.  Registers the LibCoreWrap EventObserver on first access.
+ (instancetype)shared;

/// YES once Z_CONN_ACC_SRV_OK has been received and not since broken/disconnected.
+ (BOOL)isAccessServerConnected;

/**
 * Connect to the Zmodo access server (new platform / isOldPlatform = 0).
 *
 * @param params      Dictionary with keys: acc_srv_ip (NSString),
 *                    acc_srv_port (NSNumber), token_id, client_id,
 *                    encrypt_key?, encrypt_key_id?, cid ("0").
 * @param completion  Called on the main thread when the async connect
 *                    succeeds, fails, or times out (~20s).  May be nil.
 */
+ (void)connectWithParams:(NSDictionary *)params
               completion:(nullable ZmodoConnectCompletion)completion;

/**
 * Run `onConnected` as soon as the access server is logged in.  If already
 * connected, runs it (on the main thread) right away.  Otherwise queues it
 * until the next Z_CONN_ACC_SRV_OK, or calls `onFailure` if the connection
 * fails / the timeout elapses first.  All callbacks run on the main thread.
 */
- (void)whenAccessServerConnectedRun:(void (^)(void))onConnected
                             failure:(nullable void (^)(NSInteger code, NSString * _Nullable message))onFailure
                             timeout:(NSTimeInterval)timeout;

@end

NS_ASSUME_NONNULL_END
