
#ifndef YUVOSDMixerT_H
#define YUVOSDMixerT_H


#include "CharSet.h"
#include <stdbool.h>
//#include "Utility.h"
//#include "CriticalSection.h"
#ifdef	WIN32
#include <Time.h>
#else

#include <time.h>	
	
#endif
#define null 0
//typedef int bool;
#define false 0
#define true 1
long FONT_HEIGHT;
long FONT_BASE_WIDTH;
enum
{
	YUV_FMT_YV12 = 0, 
	YUV_FMT_I420 = 1, 
	YUV_FMT_YUYV = 2, 
	YUV_FMT_YVYU = 3, 
	YUV_FMT_UYVY = 4, 
};

enum
{
	FONT_SIZE_12 = 0, 
	FONT_SIZE_16 = 1, 
	FONT_SIZE_24 = 2, 
};

enum
{
	TIME_FMT_BASE	= 0x9000, 
	TIME_FMT_YEAR4	= TIME_FMT_BASE + 1, 
	TIME_FMT_YEAR2	= TIME_FMT_BASE + 2, 
	TIME_FMT_MONTH3	= TIME_FMT_BASE + 3, 
	TIME_FMT_MONTH2	= TIME_FMT_BASE + 4, 
	TIME_FMT_DAY	= TIME_FMT_BASE + 5, 
	TIME_FMT_WEEK3	= TIME_FMT_BASE + 6, 
	TIME_FMT_CWEEK1	= TIME_FMT_BASE + 7, 
	TIME_FMT_HOUR24	= TIME_FMT_BASE + 8, 
	TIME_FMT_HOUR12	= TIME_FMT_BASE + 9, 
	TIME_FMT_MINUTE	= TIME_FMT_BASE + 10, 
	TIME_FMT_SECOND	= TIME_FMT_BASE + 11, 
};

enum
{
	MAX_TEXT_LENGTH	= 128, 
	MAX_TEXT_COUNT	= 4, 
	MAX_MASK_COUNT	= 4, 
};

//////////////////////////////////////////////////////////////////////////

typedef struct YUVOsdRect
{
	long    left;
	long    top;
	long    right;
	long    bottom;
}YUVOsdRect;

typedef struct TextConfig
{
	bool bEnable;
	unsigned long x;
	unsigned long y;
	unsigned long dwFontSize;

	bool bAdjustFontLuma;	//	auto adjust font color per 32 frames. two color, white and black.
	unsigned char byFontLuma;		//	the value of Y
	unsigned char byReserve[3];
	union
	{
		char szText[MAX_TEXT_LENGTH];
		unsigned char tFormat[MAX_TEXT_LENGTH];
	};
}TextConfig;

typedef struct MaskConfig
{
	bool bEnable;
	YUVOsdRect rtMask;
}MaskConfig;

typedef struct MixerConfig
{
	TextConfig timeConfig;
	TextConfig textConfig[MAX_TEXT_COUNT];
	MaskConfig maskConfig[MAX_MASK_COUNT];
}MixerConfig;

typedef struct YUVImage
{
	unsigned char* lpYUVImage;
	unsigned long dwPitch;
	unsigned long dwHeight;
	unsigned long dwYUVFmt;
}YUVImage;


typedef struct DrawParam
{
	unsigned char* pY;
	unsigned long x;
	unsigned long y;
	long lWidth;
	long lHeight;

	long lFrameIndex;
	long lCounter;			//	字符内有效点的计数，
	unsigned long dwYShift;
	bool bAdjustFontLuma;	//	自动调整字符亮度，

	unsigned char byLuma;			//	暂存字符亮度, 
	unsigned char byFontLuma;		//	如不自动调整，要设置的字符亮度
	unsigned char byReserve[2];
}DrawParam;

enum
{
	COLOR_SWITCH_FACTOR = (0x0001 << 7) - 1, 
};

typedef struct YUVImageEx 
{
	unsigned char* lpYUVImage;
	unsigned long dwPitch;
	unsigned long dwHeight;
	unsigned long dwYUVFmt;
	unsigned long dwYShift;
}YUVImageEx;

#define ERROR_SUCCESS 0
#define ERROR_INVALID_PARAMETER 1
#define ERROR_NOT_SUPPORTED 2
//template <unsigned long dwUnique>
long m_lCurrentFrame;
unsigned long i;
unsigned long k;
unsigned long j;

unsigned char m_timeLuma[MAX_TEXT_LENGTH];
unsigned char m_textLuma[MAX_TEXT_COUNT][MAX_TEXT_LENGTH];

//函数声明
typedef void (*FunDrawPoint)(long x, long y ,unsigned long dwContext);
 void TextPrintEx(const char* lpszText, const TextConfig textConfig, const YUVImageEx yuvImage, unsigned char* lpLuma);
 void TextPrint(unsigned char* pBuffer, unsigned long dwPitch, unsigned long dwHeight, long x, long y, const char* lpszText, bool bAdjustFontLuma, unsigned char byFontLuma, unsigned char* lpLuma, unsigned long dwYStep, unsigned char* pASC, unsigned char* pHZK);
 void MatchDotMatrix(char* pTxt, unsigned long dwTxtWidth, unsigned long dwTxtHeight, FunDrawPoint funCallBack, unsigned long dwContext);
 void _DrawPoint(long x, long y, unsigned long dwContext);
 void DrawMask(unsigned char* pY, unsigned char* pU, unsigned char* pV, unsigned long dwPitch, unsigned long dwHeight, const YUVOsdRect rtMask);
 void DrawMask1(unsigned char* pBuffer, unsigned long dwPitch, unsigned long dwHeight, unsigned long dwShift, const YUVOsdRect rtMask);
 void _BuildOSDTime(char *pszTime, size_t nBufferSize, const unsigned char *pInputFormat, struct tm *pTMTime);
unsigned long MixOSD(const MixerConfig *pConfig, const YUVImage *pYUVImage);

unsigned char* AddOSDTime(char *TStr, char *pTemp,const char* pY, const char* pU, const char* pV,unsigned long yuvWidth, unsigned long yuvHeight);

#endif
