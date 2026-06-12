//
//  NormalPlayView.m
//  Zmodo
//
//  Created by liweijie on 2017/1/5.
//  Copyright © 2017年 Zmodo. All rights reserved.
//
// ─── M1.2 STANDALONE ADAPTATION ──────────────────────────────────────────────
// STUBBED / REMOVED:
//   None — NormalPlayView.m contains ONLY OpenGL ES render code with no
//   app-specific dependencies beyond YUVFrame and the system GL/EAGL headers.
//
// ADDED:
//   1. Inline DLog macro (originally from BasicDefine.h/CommonDefine.h) so
//      the file compiles without importing the full app define headers.
//
// IMPORT NOTES:
//   - "YUVFrame.h": provided by LibCore/include/YUVFrame.h (vendored at
//     modules/zmodo-video/ios/vendor/LibCore/include/YUVFrame.h).
//     The Xcode target (M1.3) must add vendor/LibCore/include to HEADER_SEARCH_PATHS.
//   - OpenGLES/EAGL.h, OpenGLES/ES2/gl.h, OpenGLES/ES2/glext.h: system frameworks.
//
// FLAG FOR M1.3:
//   - Add vendor/LibCore/include to HEADER_SEARCH_PATHS so "YUVFrame.h" resolves.
//   - Link OpenGLES.framework (system).
//   - OpenGL ES is deprecated on iOS 12+ but remains functional; consider Metal
//     in a future milestone.
// ─────────────────────────────────────────────────────────────────────────────

#import "NormalPlayView.h"

#import <OpenGLES/EAGL.h>
#import <OpenGLES/ES2/gl.h>
#import <OpenGLES/ES2/glext.h>

// YUVFrame.h lives at vendor/LibCore/include/YUVFrame.h
// M1.3 must add vendor/LibCore/include to HEADER_SEARCH_PATHS.
#import "YUVFrame.h"

// Inline DLog (originally from BasicDefine.h / CommonDefine.h)
#ifndef DLog
#ifdef DEBUG
    #define DLog(fmt, ...) NSLog((@"%s [Line %d] " fmt), __PRETTY_FUNCTION__, __LINE__, ##__VA_ARGS__);
#else
    #define DLog(...)
#endif
#endif

#pragma mark - shaders

#define STRINGIZE(x) #x
#define STRINGIZE2(x) STRINGIZE(x)
#define SHADER_STRING(text) @ STRINGIZE2(text)

static NSString *const vertexShaderString = SHADER_STRING
(
 attribute vec4 position;
 attribute vec2 TexCoordIn;
 varying vec2 TexCoordOut;

 void main(void)
 {
     gl_Position = position;
     TexCoordOut = TexCoordIn;
 }
 );

static NSString *const yuvFragmentShaderString = SHADER_STRING
(
 varying lowp vec2 TexCoordOut;

 uniform sampler2D SamplerY;
 uniform sampler2D SamplerU;
 uniform sampler2D SamplerV;

 void main(void)
 {
     mediump vec3 yuv;
     lowp vec3 rgb;

     yuv.x = texture2D(SamplerY, TexCoordOut).r;
     yuv.y = texture2D(SamplerU, TexCoordOut).r - 0.5;
     yuv.z = texture2D(SamplerV, TexCoordOut).r - 0.5;

     rgb = mat3( 1,       1,         1,
                0,       -0.39465,  2.03211,
                1.13983, -0.58060,  0) * yuv;

     gl_FragColor = vec4(rgb, 1);
 }
 );

enum AttribEnum
{
    ATTRIB_VERTEX,
    ATTRIB_TEXTURE,
    ATTRIB_COLOR,
};

enum TextureType
{
    TEXY = 0,
    TEXU,
    TEXV,
    TEXC
};


static const GLfloat squareVertices[] = {
    -1.0f, -1.0f,
    1.0f, -1.0f,
    -1.0f,  1.0f,
    1.0f,  1.0f,
};


static const GLfloat coordVertices[] = {
    0.0f, 1.0f,
    1.0f, 1.0f,
    0.0f,  0.0f,
    1.0f,  0.0f,
};

@interface NormalPlayView()
{
    EAGLContext             *_glContext;
    GLuint                  _framebuffer;
    GLuint                  _renderbuffer;
    GLuint                  _program;
    GLuint                  _textureYUV[3];
    GLuint                  _videoW;
    GLuint                  _videoH;
}

@property (atomic) GLsizei viewScale;

@end

@implementation NormalPlayView

+ (Class)layerClass
{
    return [CAEAGLLayer class];
}

- (id)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self)
    {
        [self p_opengles_Init];
        [self p_opengles_setupTexture];
        [self p_opengles_loadShader];
    }

    return self;
}

- (void)dealloc
{
    [self p_opengles_unInit];
}

- (void)layoutSubviews
{
    [super layoutSubviews];

    @synchronized(self)
    {
        [EAGLContext setCurrentContext:_glContext];
        [self p_opengles_unInitBuffer];
        [self p_opengles_initBuffer];
    }

    glViewport(0,
               0,
               self.bounds.size.width*_viewScale,
               self.bounds.size.height*_viewScale);
}

- (BOOL)p_opengles_Init
{
    CAEAGLLayer *eaglLayer = (CAEAGLLayer*) self.layer;

    eaglLayer.opaque = YES;
    eaglLayer.drawableProperties = [NSDictionary dictionaryWithObjectsAndKeys:
                                    [NSNumber numberWithBool:NO],kEAGLDrawablePropertyRetainedBacking,
                                    kEAGLColorFormatRGB565, kEAGLDrawablePropertyColorFormat,
                                    nil];
    self.contentScaleFactor = [UIScreen mainScreen].scale;
    _viewScale = [UIScreen mainScreen].scale;

    _glContext = [[EAGLContext alloc] initWithAPI:kEAGLRenderingAPIOpenGLES2];

    if(!_glContext || ![EAGLContext setCurrentContext:_glContext])
    {
        return NO;
    }

    [self p_opengles_initBuffer];

    return YES;
}

- (void)p_opengles_initBuffer
{
    glGenFramebuffers(1, &_framebuffer);
    glGenRenderbuffers(1, &_renderbuffer);

    glBindFramebuffer(GL_FRAMEBUFFER, _framebuffer);
    glBindRenderbuffer(GL_RENDERBUFFER, _renderbuffer);

    if (![_glContext renderbufferStorage:GL_RENDERBUFFER fromDrawable:(CAEAGLLayer *)self.layer])
    {
        DLog(@"attach渲染缓冲区失败");
    }

    glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_RENDERBUFFER, _renderbuffer);
    if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE)
    {
        DLog(@"创建缓冲区错误 0x%x", glCheckFramebufferStatus(GL_FRAMEBUFFER));
    }
}

- (void)p_opengles_unInitBuffer
{
    if (_framebuffer)
    {
        glDeleteFramebuffers(1, &_framebuffer);
    }

    if (_renderbuffer)
    {
        glDeleteRenderbuffers(1, &_renderbuffer);
    }

    _framebuffer = 0;
    _renderbuffer = 0;
}

- (void)p_opengles_unInit
{
    [self p_opengles_unInitBuffer];

    if (_program)
    {
        glDeleteProgram(_program);
        _program = 0;
    }

    if ([EAGLContext currentContext] == _glContext)
    {
        [EAGLContext setCurrentContext:nil];
    }

    _glContext = nil;
}

- (void)p_opengles_setupTexture
{
    if (_textureYUV[TEXY])
    {
        glDeleteTextures(3, _textureYUV);
    }

    glGenTextures(3, _textureYUV);

    if (!_textureYUV[TEXY] || !_textureYUV[TEXU] || !_textureYUV[TEXV])
    {
        DLog(@"<<<<<<<<<<<<纹理创建失败!>>>>>>>>>>>>");
        return;
    }

    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, _textureYUV[TEXY]);
    glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MAG_FILTER,GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MIN_FILTER,GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_2D, _textureYUV[TEXU]);
    glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MAG_FILTER,GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MIN_FILTER,GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

    glActiveTexture(GL_TEXTURE2);
    glBindTexture(GL_TEXTURE_2D, _textureYUV[TEXV]);
    glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MAG_FILTER,GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MIN_FILTER,GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
}

- (GLuint)p_opengles_compileShader:(NSString*)shaderString withType:(GLenum)shaderType
{
    if (!shaderString)
    {
        DLog(@"Error loading shader");
        exit(1);
    }

    GLuint shaderHandle = glCreateShader(shaderType);

    const char * shaderStringUTF8 = [shaderString UTF8String];
    int shaderStringLength = [shaderString length];
    glShaderSource(shaderHandle, 1, &shaderStringUTF8, &shaderStringLength);

    glCompileShader(shaderHandle);

    GLint compileSuccess;
    glGetShaderiv(shaderHandle, GL_COMPILE_STATUS, &compileSuccess);
    if (compileSuccess == GL_FALSE)
    {
        GLchar messages[256];
        glGetShaderInfoLog(shaderHandle, sizeof(messages), 0, &messages[0]);
        NSString *messageString = [NSString stringWithUTF8String:messages];
        NSLog(@"%@", messageString);
        exit(1);
    }

    return shaderHandle;
}

- (void)p_opengles_loadShader
{
    GLuint vertexShader = [self p_opengles_compileShader:vertexShaderString withType:GL_VERTEX_SHADER];
    GLuint fragmentShader = [self p_opengles_compileShader:yuvFragmentShaderString withType:GL_FRAGMENT_SHADER];

    _program = glCreateProgram();
    glAttachShader(_program, vertexShader);
    glAttachShader(_program, fragmentShader);

    glBindAttribLocation(_program, ATTRIB_VERTEX, "position");
    glBindAttribLocation(_program, ATTRIB_TEXTURE, "TexCoordIn");

    glLinkProgram(_program);
    GLint linkSuccess;
    glGetProgramiv(_program, GL_LINK_STATUS, &linkSuccess);
    if (linkSuccess == GL_FALSE)
    {
        GLchar messages[256];
        glGetProgramInfoLog(_program, sizeof(messages), 0, &messages[0]);
        NSString *messageString = [NSString stringWithUTF8String:messages];
        DLog(@"<<<<着色器连接失败 %@>>>", messageString);
    }

    if (vertexShader)
    {
        glDeleteShader(vertexShader);
    }

    if (fragmentShader)
    {
        glDeleteShader(fragmentShader);
    }

    glUseProgram(_program);

    GLuint textureUniformY = glGetUniformLocation(_program, "SamplerY");
    GLuint textureUniformU = glGetUniformLocation(_program, "SamplerU");
    GLuint textureUniformV = glGetUniformLocation(_program, "SamplerV");
    glUniform1i(textureUniformY, 0);
    glUniform1i(textureUniformU, 1);
    glUniform1i(textureUniformV, 2);
}

- (void)p_opengles_render
{
    [EAGLContext setCurrentContext:_glContext];
    CGSize size = self.bounds.size;
    glViewport(0, 0, size.width*_viewScale, size.height*_viewScale);

    // Update attribute values
    glVertexAttribPointer(ATTRIB_VERTEX, 2, GL_FLOAT, 0, 0, squareVertices);
    glEnableVertexAttribArray(ATTRIB_VERTEX);

    glVertexAttribPointer(ATTRIB_TEXTURE, 2, GL_FLOAT, 0, 0, coordVertices);
    glEnableVertexAttribArray(ATTRIB_TEXTURE);
    // Draw
    glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
    glBindRenderbuffer(GL_RENDERBUFFER, _renderbuffer);
    [_glContext presentRenderbuffer:GL_RENDERBUFFER];
}

- (void)p_opengles_resetTextureWithWidth:(CGFloat)width Height:(CGFloat)height
{
    _videoW = width;
    _videoH = height;
    void *_blackData = malloc(width*height*2);

    [EAGLContext setCurrentContext:_glContext];
    glBindTexture(GL_TEXTURE_2D, _textureYUV[TEXY]);
    glTexImage2D(GL_TEXTURE_2D,
                 0,
                 GL_RED_EXT,
                 width,
                 height,
                 0,
                 GL_RED_EXT,
                 GL_UNSIGNED_BYTE,
                 _blackData);
    glBindTexture(GL_TEXTURE_2D, _textureYUV[TEXU]);
    glTexImage2D(GL_TEXTURE_2D,
                 0,
                 GL_RED_EXT,
                 width/2,
                 height/2,
                 0,
                 GL_RED_EXT,
                 GL_UNSIGNED_BYTE,
                 _blackData + (int)(width * height));

    glBindTexture(GL_TEXTURE_2D, _textureYUV[TEXV]);
    glTexImage2D(GL_TEXTURE_2D,
                 0,
                 GL_RED_EXT,
                 width/2,
                 height/2,
                 0,
                 GL_RED_EXT,
                 GL_UNSIGNED_BYTE,
                 _blackData + (int)(width * height * 5 / 4));
}

- (void)processFrameBuffer:(id)frame
{
    [super processFrameBuffer:frame];

    YUVFrame *yuvFrame = (YUVFrame *)frame;

    assert(yuvFrame.luma.length == yuvFrame.width * yuvFrame.height);
    assert(yuvFrame.chromaB.length == (yuvFrame.width * yuvFrame.height) / 4);
    assert(yuvFrame.chromaR.length == (yuvFrame.width * yuvFrame.height) / 4);

    const NSUInteger frameWidth = yuvFrame.width;
    const NSUInteger frameHeight = yuvFrame.height;

    const UInt8 *pixels[3] = { yuvFrame.luma.bytes, yuvFrame.chromaB.bytes, yuvFrame.chromaR.bytes };

    // Align pixel transfer for non-8-aligned widths to prevent green/rainbow artifacts
    // liweijie 2015.9.14
    int n = frameWidth%8;
    if (n != 0)
    {
        glPixelStorei(GL_UNPACK_ALIGNMENT, 1);
    }
    else
    {
        glPixelStorei(GL_UNPACK_ALIGNMENT, 4);
    }

    @synchronized(self)
    {
        if (frameWidth != _videoW || frameHeight != _videoH)
        {
            [self p_opengles_resetTextureWithWidth:frameWidth Height:frameHeight];
        }

        [EAGLContext setCurrentContext:_glContext];

        glBindTexture(GL_TEXTURE_2D, _textureYUV[TEXY]);
        glTexSubImage2D(GL_TEXTURE_2D,
                        0,
                        0,
                        0,
                        (GLsizei)frameWidth,
                        (GLsizei)frameHeight,
                        GL_RED_EXT,
                        GL_UNSIGNED_BYTE,
                        pixels[0]);

        glBindTexture(GL_TEXTURE_2D, _textureYUV[TEXU]);
        glTexSubImage2D(GL_TEXTURE_2D,
                        0,
                        0,
                        0,
                        (GLsizei)frameWidth/2,
                        (GLsizei)frameHeight/2,
                        GL_RED_EXT,
                        GL_UNSIGNED_BYTE,
                        pixels[1]);

        glBindTexture(GL_TEXTURE_2D, _textureYUV[TEXV]);
        glTexSubImage2D(GL_TEXTURE_2D,
                        0,
                        0,
                        0,
                        (GLsizei)frameWidth/2,
                        (GLsizei)frameHeight/2,
                        GL_RED_EXT,
                        GL_UNSIGNED_BYTE,
                        pixels[2]);

        @try {
            [self p_opengles_render];
        }
        @catch (NSException *exception){
         }
        @finally {
            return;
        }
    }
}

- (void)clearBackGroundImageWithColor:(UIColor *)color
{
    CGFloat red,green,blue,alph;
    [color getRed:&red green:&green blue:&blue alpha:&alph];

    if ([self window])
    {
        [EAGLContext setCurrentContext:_glContext];
        glClearColor(red, green, blue, alph);
        glClear(GL_COLOR_BUFFER_BIT);
        glBindRenderbuffer(GL_RENDERBUFFER, _renderbuffer);
        [_glContext presentRenderbuffer:GL_RENDERBUFFER];
    }
}
@end
