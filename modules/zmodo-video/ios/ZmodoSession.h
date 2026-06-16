//
//  ZmodoSession.h
//  ZmodoVideo
//
//  M2.3 — Connect to Zmodo access server after login.
//
//  After a successful login, the JS layer calls connect: with the credentials
//  returned by the login API.  This triggers LibCoreWrap initialize: (guarded
//  against double-init) + connectServer:paramDic: so that TRANSFER-mode live
//  streams ("Not login access server") work for cameras without a LAN IP.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * ZmodoSession — lightweight singleton wrapper around LibCoreWrap's
 * access-server lifecycle.
 *
 * +connect:  must be called once after login (new-platform / isOldPlatform=0).
 *            It is idempotent: calling it a second time re-connects if needed.
 */
@interface ZmodoSession : NSObject

/**
 * Connect to the Zmodo access server.
 *
 * @param params  Dictionary with the following keys (all NSString unless noted):
 *   "token_id"        — login token
 *   "client_id"       — user ID (string)
 *   "acc_srv_ip"      — userconn host IP (from host_list["user_conn"][0], split on ":")
 *   "acc_srv_port"    — userconn port (NSNumber)
 *   "encrypt_key"     — optional encryption key from login data
 *   "encrypt_key_id"  — optional encryption key ID from login data
 *   "cid"             — client app ID string (always "0" for Zmodo)
 *
 * Calling this also runs LibCoreWrap initialize: (new-platform, guarded).
 */
+ (void)connectWithParams:(NSDictionary *)params;

@end

NS_ASSUME_NONNULL_END
