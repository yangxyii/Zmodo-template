//
//  Video.h
//  cms

#import <UIKit/UIKit.h>


@class YUVFrame;
@interface VideoFrameExtractor : NSObject

@property (strong, nonatomic, readonly) YUVFrame *currentFrame;

- (BOOL)stepFrame:(BytePtr) pBuffer length: (int)nBufferLen;

//videoType : 0 - H264  1 - HEVC
+ (id)creatVideoFrameExtractor:(int)videoType;
+ (void)releaseVideoFrameExtractor:(VideoFrameExtractor *)video;

- (UIImage *)convertFrameToRGB;
@end
