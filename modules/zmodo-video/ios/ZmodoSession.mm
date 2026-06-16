//
//  ZmodoSession.mm  (Objective-C++)
//  ZmodoVideo
//
//  M2.3 — Access-server session manager (async connect + readiness gating).
//
//  Key API references (all confirmed from vendor headers):
//    LibCoreWrap.h
//      - (void)initialize:(NSInteger)isOldPlatform uuid:(NSString *)uuid;
//      - (void)connectServer:(NSInteger)isOldPlatform paramDic:(id)paramsDict;
//      - (void)registerEventObserver:(id)observer forKey:(id)key;   // EventObserverProtocol
//    ztypes.h  (global event codes reported via didReceiveEvent:content:length:)
//      Z_CONN_ACC_SRV_OK / Z_CONN_ACC_SRV_FAILED / Z_CONN_ACC_TOKEN_INVALID /
//      Z_CONN_ACC_SRV_BROKEN / Z_DISCONN_ACC_SRV_OK
//
//  paramDic keys (confirmed from AppData+AccessServer.m lines 123-142):
//    acc_srv_ip (NSString), acc_srv_port (NSNumber), token_id, client_id,
//    encrypt_key?, encrypt_key_id?, cid ("0").
//

#import "ZmodoSession.h"
#import "LibCoreWrap.h"
#import "ztypes.h"
#import <UIKit/UIKit.h>

// ---------------------------------------------------------------------------
// External init guards — shared with ZmodoPlayerView.mm to avoid double-init.
// ---------------------------------------------------------------------------
extern BOOL sLibCoreInitializedNewPlatform;
extern BOOL sLibCoreInitializedOldPlatform;

static NSString *const kZmodoEventObserverKey = @"ZmodoSession";

// ---------------------------------------------------------------------------
// A single queued "run when the access server is connected" request.
// ---------------------------------------------------------------------------
@interface ZmodoConnWaiter : NSObject
@property (nonatomic, copy)   void (^onConnected)(void);
@property (nonatomic, copy, nullable) void (^onFailure)(NSInteger code, NSString * _Nullable message);
@property (nonatomic, assign) BOOL fired;
@end
@implementation ZmodoConnWaiter
@end

// ---------------------------------------------------------------------------
@interface ZmodoSession () <EventObserverProtocol>
@property (atomic, assign)   BOOL accessServerConnected;
/// Waiters queued while not yet connected.  Mutated only on the main queue.
@property (nonatomic, strong) NSMutableArray<ZmodoConnWaiter *> *waiters;
/// Completion for the most recent +connectWithParams:completion: call.
@property (nonatomic, copy, nullable) ZmodoConnectCompletion connectCompletion;
@property (nonatomic, assign) BOOL connectCompletionFired;
@end

@implementation ZmodoSession

// ---------------------------------------------------------------------------
#pragma mark - Singleton
// ---------------------------------------------------------------------------

+ (instancetype)shared
{
    static ZmodoSession *sShared = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sShared = [[ZmodoSession alloc] init];
        [sShared p_registerObserver];
    });
    return sShared;
}

- (instancetype)init
{
    if ((self = [super init])) {
        _accessServerConnected = NO;
        _waiters = [NSMutableArray array];
    }
    return self;
}

- (void)p_registerObserver
{
    // The observer is global (one per process, new platform).  LibCoreWrap
    // dispatches didReceiveEvent: on a worker thread; we hop to main below.
    [[LibCoreWrap sharedCore] registerEventObserver:self forKey:kZmodoEventObserverKey];
}

+ (BOOL)isAccessServerConnected
{
    return [ZmodoSession shared].accessServerConnected;
}

// ---------------------------------------------------------------------------
#pragma mark - Connect
// ---------------------------------------------------------------------------

+ (void)connectWithParams:(NSDictionary *)params
               completion:(nullable ZmodoConnectCompletion)completion
{
    [[ZmodoSession shared] p_connectWithParams:params completion:completion];
}

- (void)p_connectWithParams:(NSDictionary *)params
                 completion:(nullable ZmodoConnectCompletion)completion
{
    dispatch_async(dispatch_get_main_queue(), ^{
        // A new connect supersedes any still-pending completion so its JS
        // promise never hangs.
        if (self.connectCompletion && !self.connectCompletionFired) {
            ZmodoConnectCompletion old = self.connectCompletion;
            old(NO, -2, @"superseded by a newer connect");
        }
        self.connectCompletion = completion;
        self.connectCompletionFired = NO;

        // Initialize LibCoreWrap once per process (new platform), guarded by
        // the same flag ZmodoPlayerView.mm uses.
        NSString *uuid = [[[UIDevice currentDevice] identifierForVendor] UUIDString] ?: @"";
        if (!sLibCoreInitializedNewPlatform) {
            [[LibCoreWrap sharedCore] initialize:0 uuid:uuid];
            sLibCoreInitializedNewPlatform = YES;
        }

        // Kick off the asynchronous access-server login.  The result arrives
        // in didReceiveEvent: below.
        [[LibCoreWrap sharedCore] connectServer:0 paramDic:params];

        // Safety net: if neither OK nor FAILED ever arrives, fail the
        // completion after 20s so the JS promise resolves.
        __weak __typeof__(self) weakSelf = self;
        ZmodoConnectCompletion captured = completion;
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(20.0 * NSEC_PER_SEC)),
                       dispatch_get_main_queue(), ^{
            __strong __typeof__(weakSelf) strongSelf = weakSelf;
            if (!strongSelf) { return; }
            // Only fire if THIS connect's completion is still the pending one.
            if (strongSelf.connectCompletion == captured && !strongSelf.connectCompletionFired) {
                strongSelf.connectCompletionFired = YES;
                if (captured) { captured(NO, -1, @"access server connect timed out"); }
            }
        });
    });
}

// ---------------------------------------------------------------------------
#pragma mark - Readiness gating
// ---------------------------------------------------------------------------

- (void)whenAccessServerConnectedRun:(void (^)(void))onConnected
                             failure:(nullable void (^)(NSInteger, NSString *))onFailure
                             timeout:(NSTimeInterval)timeout
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if (self.accessServerConnected) {
            if (onConnected) { onConnected(); }
            return;
        }

        ZmodoConnWaiter *waiter = [[ZmodoConnWaiter alloc] init];
        waiter.onConnected = onConnected;
        waiter.onFailure   = onFailure;
        waiter.fired       = NO;
        [self.waiters addObject:waiter];

        if (timeout > 0) {
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(timeout * NSEC_PER_SEC)),
                           dispatch_get_main_queue(), ^{
                if (waiter.fired) { return; }
                waiter.fired = YES;
                [self.waiters removeObject:waiter];
                if (waiter.onFailure) {
                    waiter.onFailure(-1, @"timed out waiting for access server");
                }
            });
        }
    });
}

/// Drain every queued waiter as success.  Main queue only.
- (void)p_fulfillWaiters
{
    NSArray<ZmodoConnWaiter *> *pending = [self.waiters copy];
    [self.waiters removeAllObjects];
    for (ZmodoConnWaiter *w in pending) {
        if (w.fired) { continue; }
        w.fired = YES;
        if (w.onConnected) { w.onConnected(); }
    }
}

/// Drain every queued waiter as failure.  Main queue only.
- (void)p_failWaitersWithCode:(NSInteger)code message:(NSString *)message
{
    NSArray<ZmodoConnWaiter *> *pending = [self.waiters copy];
    [self.waiters removeAllObjects];
    for (ZmodoConnWaiter *w in pending) {
        if (w.fired) { continue; }
        w.fired = YES;
        if (w.onFailure) { w.onFailure(code, message); }
    }
}

- (void)p_fireConnectCompletionSuccess:(BOOL)success code:(NSInteger)code message:(NSString *)message
{
    if (self.connectCompletion && !self.connectCompletionFired) {
        self.connectCompletionFired = YES;
        ZmodoConnectCompletion c = self.connectCompletion;
        c(success, code, message);
    }
}

// ---------------------------------------------------------------------------
#pragma mark - EventObserverProtocol (new platform)
// ---------------------------------------------------------------------------

- (void)didReceiveEvent:(int)code content:(const char *)content length:(int)length
{
    NSString *detail = nil;
    if (content && length > 0) {
        detail = [[NSString alloc] initWithBytes:content
                                          length:(NSUInteger)length
                                        encoding:NSUTF8StringEncoding];
    }

    dispatch_async(dispatch_get_main_queue(), ^{
        switch (code) {
            case Z_CONN_ACC_SRV_OK:
                self.accessServerConnected = YES;
                [self p_fireConnectCompletionSuccess:YES code:code message:detail];
                [self p_fulfillWaiters];
                break;

            case Z_CONN_ACC_SRV_FAILED:
            case Z_CONN_ACC_TOKEN_INVALID:
                self.accessServerConnected = NO;
                [self p_fireConnectCompletionSuccess:NO code:code message:detail];
                [self p_failWaitersWithCode:code message:detail];
                break;

            case Z_CONN_ACC_SRV_BROKEN:
            case Z_DISCONN_ACC_SRV_OK:
                self.accessServerConnected = NO;
                break;

            default:
                // Other global events (alarms, dev-list refresh, …) are not
                // needed for M2.3 and are ignored here.
                break;
        }
    });
}

@end
