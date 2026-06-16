//
//  PlayVideoBaseView.m
//  Zmodo
//
//  Created by liweijie on 2016/11/23.
//  Copyright © 2016年 Zmodo. All rights reserved.
//
// ─── M1.2 STANDALONE ADAPTATION ──────────────────────────────────────────────
// STUBBED / REMOVED (non-GL UI chrome, not needed by the render path):
//
//   1. #import "BasicDefine.h"  → REMOVED.
//      Only needed for IOS version macros / kGuestPWD / etc. — none used here.
//      The DLog macro is redefined inline below.
//
//   2. #import "CAHubLayer.h"  → REMOVED.
//      CAHubLayer is a loading-mask overlay (showMaskView / hideMaskView).
//      The `_maskLayer` ivar, `ppvb_setupSubViews` method, `startWaitAnimation`,
//      and `stopWaitAnimationWithTips:*` methods are all commented-out because
//      they use CAHubLayer and SVIndefiniteAnimatedViewEx. These methods are not
//      in the public header and are not called by the GL render path.
//      FLAG FOR M1.3: if a wait-spinner overlay is desired, restore CAHubLayer.
//
//   3. #import "SVIndefiniteAnimatedViewEx.h"  → REMOVED.
//      SVIndefiniteAnimatedViewEx is the spinning-circle wait animation.
//      Same as above — only used by ppvb_setupSubViews / startWaitAnimation /
//      stopWaitAnimationWithTips which are commented out.
//      FLAG FOR M1.3: restore if wait-spinner is desired.
//
//   4. kNotification_PlayVideoBaseView_Taped / kNotification_RestartVideo  → INLINED.
//      Originally from CommonClasses/Define/NotificationDefine.h. Both are simple
//      NSString #define macros with no further dependencies; inlined here.
//
// KEPT:
//   - setBackGroundImage: / removeBgView  (thumbnail / poster frame display)
//   - ppvb_addTapGestureRecognizer / oneFingerOneTapAction: (tap delegate)
//   - processFrameBuffer: (base no-op — overridden by NormalPlayView)
//   - clearBackGroundImageWithColor: (base no-op)
//   - layoutSubviews (backImageView resize)
//   - middleButtonAction: / stopWaitAnimationWithTips:withImage: reduced to
//     just the button-only path (no maskLayer calls) so the restart notification
//     still fires.
// ─────────────────────────────────────────────────────────────────────────────

#import "PlayVideoBaseView.h"

// Inline DLog (originally from BasicDefine.h / CommonDefine.h)
#ifndef DLog
#ifdef DEBUG
    #define DLog(fmt, ...) NSLog((@"%s [Line %d] " fmt), __PRETTY_FUNCTION__, __LINE__, ##__VA_ARGS__);
#else
    #define DLog(...)
#endif
#endif

// Inline notification names (originally from NotificationDefine.h)
#define kNotification_PlayVideoBaseView_Taped   @"Notification_PlayVideoBaseView_Taped"
#define kNotification_RestartVideo              @"Notification_RestartVideo"

// ---- CAHubLayer and SVIndefiniteAnimatedViewEx are STUBBED OUT ----
// The ppvb_setupSubViews / startWaitAnimation / stopWaitAnimationWithTips
// methods that used them are commented-out below.

@interface PlayVideoBaseView()

// @property (strong, nonatomic) SVIndefiniteAnimatedViewEx *waitAnimate;  // STUBBED
// @property (strong, nonatomic) CAHubLayer *maskLayer;                    // STUBBED
@property (strong, nonatomic) UIButton *middleButton;
@property (strong, nonatomic) UIImageView *backImageView;
@end


@implementation PlayVideoBaseView

- (instancetype)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self)
    {
        self.backgroundColor = [UIColor clearColor];
        [self ppvb_addTapGestureRecognizer];
    }

    return self;
}

- (UIImageView *)backImageView
{
    if (!_backImageView)
    {
        _backImageView = [[UIImageView alloc] initWithFrame:self.bounds];
        _backImageView.center = CGPointMake(self.bounds.size.width/2., self.bounds.size.height/2.);
        [self addSubview:_backImageView];
    }

    return _backImageView;
}

- (void)removeBgView
{
    self.backImageView.hidden = YES;
}

- (void)setBackGroundImage:(UIImage *)image
{
    self.backImageView.hidden = NO;
    if(image){
        [self.backImageView setImage:image];
    }else{
        [self.backImageView setImage:[self imageWithBlackColor]];
        self.backImageView.backgroundColor = [UIColor blackColor];
    }
}

- (UIImage*)imageWithBlackColor
{
    CGRect rect = CGRectMake(0.0f, 0.0f, 1.0f, 1.0f);
    UIGraphicsBeginImageContext(rect.size);
    CGContextRef context = UIGraphicsGetCurrentContext();

    CGContextSetFillColorWithColor(context, [[UIColor blackColor] CGColor]);
    CGContextFillRect(context, rect);

    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();

    return image;
}

// STUBBED OUT — uses CAHubLayer + SVIndefiniteAnimatedViewEx (not available standalone)
// FLAG FOR M1.3: restore if wait-spinner overlay is desired.
//
// - (void)ppvb_setupSubViews
// {
//     _maskLayer = [[CAHubLayer alloc] initWithFrame:self.bounds];
//     _maskLayer.backgroundColor = [UIColor clearColor].CGColor;
//     [self.layer addSublayer:_maskLayer];
//
//     _waitAnimate = [[SVIndefiniteAnimatedViewEx alloc] initWithFrame:CGRectMake(0, 0, 120, 120)
//                                                          strokeColor:[UIColor whiteColor]
//                                                               radius:45.
//                                                      strokeThickness:5];
//     [_waitAnimate stopAnimating];
//     [self addSubview:_waitAnimate];
//
//     _waitAnimate.center = CGPointMake(self.frame.size.width*0.5, self.frame.size.height*0.5);
// }

// STUBBED OUT — uses CAHubLayer + SVIndefiniteAnimatedViewEx
// - (void)startWaitAnimation { ... }
// - (void)stopWaitAnimationWithTips:(NSString *)tips { ... }

// Reduced: maskLayer call removed; button (restart notification) path kept.
- (void)stopWaitAnimationWithTips:(NSString *)tips withImage:(UIImage *)image
{
    // [_waitAnimate stopAnimating];    // STUBBED (no SVIndefiniteAnimatedViewEx)
    // [_maskLayer hideMaskViewWithTips:tips image:image];  // STUBBED (no CAHubLayer)

    if (_middleButton && [_middleButton superview])
    {
        [_middleButton removeFromSuperview];
        _middleButton = nil;
    }

    if (image)
    {
        UIButton *button = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, image.size.width, image.size.height)];
        button.center = CGPointMake(self.frame.size.width*0.5, self.frame.size.height*0.5);
        [self addSubview:button];
        _middleButton = button;
        [_middleButton addTarget:self action:@selector(middleButtonAction:) forControlEvents:UIControlEventTouchUpInside];
    }
}

- (void)ppvb_addTapGestureRecognizer
{
    UITapGestureRecognizer *oneFingerOneTaps =
    [[UITapGestureRecognizer alloc] initWithTarget:self
                                            action:@selector(oneFingerOneTapAction:)];

    [oneFingerOneTaps setNumberOfTapsRequired:1];
    [oneFingerOneTaps setNumberOfTouchesRequired:1];

    [self addGestureRecognizer:oneFingerOneTaps];
}

- (void)oneFingerOneTapAction:(id)sender
{
    [[NSNotificationCenter defaultCenter] postNotificationName:kNotification_PlayVideoBaseView_Taped object:nil userInfo:@{@"ChannelIndex":@(self.channel)}];

    if ([self.baseViewDelegate respondsToSelector:@selector(playVideoBaseViewTaped:)])
    {
        [self.baseViewDelegate playVideoBaseViewTaped:self];
    }
}

- (void)middleButtonAction:(UIButton *)button
{
    [[NSNotificationCenter defaultCenter] postNotificationName:kNotification_RestartVideo object:nil];
}

- (void)clearBackGroundImageWithColor:(UIColor *)color
{
    // Base no-op; overridden by NormalPlayView (GL clear)
}

- (void)processFrameBuffer:(id)frame
{
    // Base no-op; overridden by NormalPlayView (GL render)
}

- (void)layoutSubviews
{
    [super layoutSubviews];

    _backImageView.frame = self.bounds;

    if (_middleButton)
    {
        _middleButton.center = CGPointMake(self.frame.size.width*0.5, self.frame.size.height*0.5);
    }
}
@end
