//
//  ZmodoSession.mm  (Objective-C++)
//  ZmodoVideo
//
//  M2.3 — Access-server connect after login.
//
//  Key API references (all confirmed from vendor headers):
//    LibCoreWrap.h
//      - (void)initialize:(NSInteger)isOldPlatform uuid:(NSString *)uuid;
//      - (void)connectServer:(NSInteger)isOldPlatform paramDic:(id)paramsDict;
//
//  paramDic keys (confirmed from AppData+AccessServer.m lines 123-142):
//    acc_srv_ip    — NSString   access server IP
//    acc_srv_port  — NSNumber   access server port
//    token_id      — NSString   login token
//    client_id     — NSString   user ID
//    encrypt_key   — NSString   (optional)
//    encrypt_key_id — NSString  (optional)
//    cid           — NSString   "0" for Zmodo
//

#import "ZmodoSession.h"
#import "LibCoreWrap.h"
#import <UIKit/UIKit.h>

// ---------------------------------------------------------------------------
// External statics — shared with ZmodoPlayerView.mm to avoid double-init.
// Both files are compiled into the same pod target, so these externs link.
// ---------------------------------------------------------------------------
extern BOOL sLibCoreInitializedNewPlatform;
extern BOOL sLibCoreInitializedOldPlatform;

// ---------------------------------------------------------------------------
@implementation ZmodoSession

+ (void)connectWithParams:(NSDictionary *)params
{
    // -------------------------------------------------------------------
    // Step 1: initialize LibCoreWrap once per platform per process.
    // We use the same static flags as ZmodoPlayerView.mm so a second call
    // (e.g. when the player starts before connect is called) is a no-op.
    // -------------------------------------------------------------------
    NSString *uuid = [[[UIDevice currentDevice] identifierForVendor] UUIDString] ?: @"";

    // New platform (isOldPlatform = 0).
    if (!sLibCoreInitializedNewPlatform) {
        [[LibCoreWrap sharedCore] initialize:0 uuid:uuid];
        sLibCoreInitializedNewPlatform = YES;
    }

    // -------------------------------------------------------------------
    // Step 2: connect to the access server.
    // The dictionary is already built by the JS/Swift caller and passed
    // straight through to LibCoreWrap — no transformation needed.
    // -------------------------------------------------------------------
    [[LibCoreWrap sharedCore] connectServer:0 paramDic:params];
}

@end
