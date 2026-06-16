//
//  PlayVideoBaseView.h
//  Zmodo
//
//  Created by liweijie on 2016/11/23.
//  Copyright © 2016年 Zmodo. All rights reserved.
//
// ─── M1.2 STANDALONE ADAPTATION ───────────────────────────────────────────────
// Copied verbatim from CommonClasses/UI/ViewControllers/VideoPlay/views/
// No changes required — header has no app-specific imports.
// ──────────────────────────────────────────────────────────────────────────────

#import <UIKit/UIKit.h>

@protocol PlayVideoBaseViewDelegate;

@interface PlayVideoBaseView : UIView

@property (weak, nonatomic) id<PlayVideoBaseViewDelegate> baseViewDelegate;

@property (assign, nonatomic) NSInteger channel;

//- (void)startWaitAnimation;
//- (void)stopWaitAnimationWithTips:(NSString *)tips;
//- (void)stopWaitAnimationWithTips:(NSString *)tips withImage:(UIImage *)image;

- (void)setBackGroundImage:(UIImage *)image;
- (void)removeBgView;

- (void)clearBackGroundImageWithColor:(UIColor *)color;
- (void)processFrameBuffer:(id)frame;

@end

@protocol PlayVideoBaseViewDelegate <NSObject>

- (void)playVideoBaseViewTaped:(id)sender;

@end
