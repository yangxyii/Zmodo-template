//
//  YUVFrame.h
//  Zmodo Zsight
//
//  Created by 钱长存 on 13-6-13.
//  Copyright (c) 2013年 钱长存. All rights reserved.
//
#import <Foundation/Foundation.h>

@interface YUVFrame : NSObject
@property (strong, nonatomic) NSData *luma;
@property (strong, nonatomic) NSData *chromaB;
@property (strong, nonatomic) NSData *chromaR;
@property NSInteger width;
@property NSInteger height;
@end
