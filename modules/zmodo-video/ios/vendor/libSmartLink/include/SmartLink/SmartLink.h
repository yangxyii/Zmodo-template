//
//  SmartLink.h
//  SmartLink
//
//  Created by Alex Wang on 14-9-9.
//  Copyright (c) 2014年 zmodo. All rights reserved.
//
#ifndef __SMART_LINK_H__
#define __SMART_LINK_H__

#ifdef __cplusplus
extern "C" {
#endif

#import <Foundation/Foundation.h>

/* 系统语言ID定义：中文 */
#define SYS_LANG_CHINESE 1
/* 系统语言ID定义：英文 */
#define SYS_LANG_ENGLISH 2

@interface SmartLink : NSObject

/* 1. 初始化SmartLink模块 */
int SMART_LINK_Startup();

/* 2. 启动SmartLink模块：增加参数lang，为smartlink提示音语言，见SYS_LANG_CHINESE、SYS_LANG_ENGLISH */
int SMART_LINK_Run(char *ssid, char *pwd, int lang);

/* 3. 停止SmartLink模块 */
int SMART_LINK_Stop();

/* 4. 反初始化SmartLink模块 */
int SMART_LINK_Cleanup();

@end

#ifdef __cplusplus
}
#endif

#endif //__SMART_LINK_H__