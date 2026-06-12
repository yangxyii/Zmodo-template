#ifndef ZMD_ZTYPES_H_
#define ZMD_ZTYPES_H_

// config
#define ZMD_NAMESPACE

#define BREAKPAD_NAMESPACE

#define LOG_TAG "libcore"

#ifdef _WIN32
  #ifndef WINVER                  // Allow use of features specific to Windows XP or later
    #define WINVER 0x0501
  #endif
  #ifndef WIN32_LEAN_AND_MEAN
    #define WIN32_LEAN_AND_MEAN   // Exclude rarely-used stuff from Windows headers
  #endif
#endif

#include <stdio.h>

#ifndef ANDROID_LOG_PRINT
#define ANDROID_LOG_PRINT // print Android Log
#endif

#ifdef ANDROID
  #ifdef ANDROID_LOG_PRINT
    #include <android/log.h>
    #define LOGI(...) __android_log_print(ANDROID_LOG_INFO,  LOG_TAG, __VA_ARGS__)
    #define LOGW(...) __android_log_print(ANDROID_LOG_WARN,  LOG_TAG, __VA_ARGS__)
    #define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)
  #else
    #define LOGI(...)
    #define LOGW(...)
    #define LOGE(...)
  #endif
#endif

#ifdef _WIN32
#define ZMD_API_EXPORT __declspec(dllexport)
#define ZMD_API_IMPORT __declspec(dllimport)
#else
#define ZMD_API_EXPORT __attribute__ ((visibility("default")))
#define ZMD_API_IMPORT 
#endif

#ifdef __cplusplus
#define ZMD_C_API_EXPORT extern "C" ZMD_API_EXPORT
#define ZMD_C_API_IMPORT extern "C" ZMD_API_IMPORT
#else
#define ZMD_C_API_EXPORT ZMD_API_EXPORT
#define ZMD_C_API_IMPORT ZMD_API_IMPORT
#endif

#ifdef LIBCORE_EXPORTS
#define ZMD_C_API ZMD_C_API_EXPORT
#else
#define ZMD_C_API ZMD_C_API_IMPORT
#endif

typedef long z_handle;

typedef enum {
  ///////////////////////////////////////////////////////////////////////
  // These events is global, not refer with a certain device channel.
  ///////////////////////////////////////////////////////////////////////

  /* ConnectServer */
  Z_CONN_ACC_SRV_OK          ,  /* 登录接入服务器成功 */
  Z_CONN_ACC_SRV_FAILED      ,  /* 登录接入服务器失败 */
  Z_CONN_ACC_TOKEN_INVALID   ,  /* 登录接入服务器TOKEN无效 */
  Z_CONN_ACC_SRV_BROKEN      ,  /* 与接入服务器的连接异常断开 */
  /* DisConnectServer */
  Z_DISCONN_ACC_SRV_OK       ,  /* 断开接入服务器成功 */

  /* get message from access server */
  Z_RECV_PUSH_ALARM          ,  /* 接收到告警通知 */
#ifdef ANDROID
  Z_RECV_PUSH_ALARM_BACK     ,  /* Android 后台消息类型 */
#endif
  Z_RECV_FORCE_OFFLINE       ,  /* 接收强制下线通知 */
  Z_RECV_FRIEND_ADD          ,  /* 接收好友添加通知 */
  Z_REFRESH_DEVLIST          ,  /* 接收到刷新列表通知*/
  Z_MODE_CHANGE              ,  /* 模式切换通知 */
  Z_CHAT_NEW_MSG             ,  /* 收到客服新消息 */
  Z_RECV_WIFI_SIGNAL         ,  /* 接收到 WIFI 强度通知 */
  Z_RECV_SHARE_OPERATE       ,  /* 接收到分享操作通知 1-分享，2取消分享*/

  Z_RECV_COMMON_MSG          ,  /* common msg */

  /* ScanLanDevices */
  Z_SCAN_LAN_DEVICES_OK      ,  /* 扫描局域网设备结束 */
  Z_EZ_LINK_LISTEN_OK        ,
  Z_EZ_LINK_LISTEN_FAILED    ,
  Z_EZ_LINK_LISTEN_STOP      ,

  /* GetVideoInfo */
  Z_GET_VIDEO_INFO_OK        ,
  Z_GET_VIDEO_INFO_FAILED    ,
    
  /* GetMP4Name */
  Z_GET_MP4_NAME_OK          ,
  Z_GET_MP4_NAME_FAILED      ,

  /* H264ToMP4 */
  Z_H264_TO_MP4_OK           ,
  Z_H264_TO_MP4_FAILED       ,

  Z_HANDLE_IS_INVALID        ,  /* 对象句柄无效 */

  Z_GLOBAL_EVENT_BOUNDARY    ,  /* boundary */

  ///////////////////////////////////////////////////////////////////////
  // These events is not global, they are refer with a certain device channel.
  ///////////////////////////////////////////////////////////////////////

  /* DestroyHandle */
  Z_DESTROY_HANDLE_OK     ,     /* 释放对象成功 */

  /* StartPlay */
  Z_START_PLAY_OK            ,  /* 开始播放成功 */
  Z_START_PLAY_FAILED        ,  /* 开始播放失败 */
  Z_PLAY_BROKEN              ,  /* 播放中途被异常中断 */
  Z_PLAY_FINISH              ,  /* 播放结束 */

  /* PausePlay */
  Z_PAUSE_PLAY_OK            ,
  /* ResumePlay */
  Z_RESUME_PLAY_OK           ,
  Z_RESUME_PLAY_FAILED       ,
  /* StopPlay */
  Z_STOP_PLAY_OK             ,

  /* about bussiness */
  Z_CHANGE_STREAM_OK         ,
  Z_CHANGE_STREAM_FAILED     ,
  Z_OPEN_SOUND_OK            ,
  Z_OPEN_SOUND_FAILED        ,
  Z_CLOSE_SOUND_OK           ,
  Z_START_TALK_OK            ,
  Z_START_TALK_FAILED        ,
  Z_STOP_TALK_OK             ,
  Z_STOP_TALK_FAILED         ,
  Z_SEND_TALK_FAILED         ,
  Z_SD_QUERY_OK              ,
  Z_SD_QUERY_FAILED          ,
  Z_SD_OPERATE_OK            ,
  Z_SD_OPERATE_FAILED        ,

  /* StartRecord */
  Z_START_RECORD_OK          ,       /* 开始保存录像成功 */
  Z_START_RECORD_FAILED      ,       /* 开始保存录像失败 */
  Z_RECORD_BROKEN            ,       /* 录像中途异常中断 */
  /* StopRecord */
  Z_RECORD_OK                ,       /* 录像保存成功 */
  Z_RECORD_FAILED            ,       /* 录像保存失败 */

  /* GetRecordList */
  Z_GET_RECORD_DATE_OK       ,
  Z_GET_RECORD_DATE_FAILED   ,
  Z_GET_RECORD_LIST_OK       ,
  Z_GET_RECORD_LIST_FAILED   ,

  /* LAN config */
  Z_LAN_REMOTE_CTRL_OK          ,
  Z_LAN_REMOTE_CTRL_FAILED      ,

  Z_DOOR_LIGHT_CONTRL_OK        ,
  Z_DOOR_LIGHT_CONTRL_FAILED    ,

  /* PTZ */
  Z_PTZ_CONFIG_OK       ,       /* PTZ 设置成功 */
  Z_PTZ_CONFIG_FAILED   ,       /* PTZ 设置失败 */
  Z_QUERY_PTZ_PRESET_OK ,       /* 获取 PTZ 预置点成功 */
  Z_QUERY_PTZ_PRESET_FAILED,    /* 获取 PTZ 预置点失败 */

  /* DOORBELL */
  Z_ANSWER_DOORBELL_OK,         /* 门铃已接听应答成功 */
  Z_ANSWER_DOORBELL_FAILED,     /* 门铃已接听应到失败 */
  Z_DAYNIGHT_SWITCH_OK,         /* 日夜模式切换成功 */
  Z_DAYNIGHT_SWITCH_FAILED,     /* 日夜模式切换失败 */

  /* FLIP VIDEO IMAGE */
  Z_FLIP_VIDEO_IMAGE_OK,        /* 图像翻转操作成功 */
  Z_FLIP_VIDEO_IMAGE_FAILED,    /* 图像翻转操作失败 */

  /* IRCUT MODE */
  Z_SET_IRCUT_MODE_OK,          /* 设置红外开关参数成功 */
  Z_SET_IRCUT_MODE_FAILED,      /* 设置红外开关参数失败 */
  Z_GET_IRCUT_MODE_OK,          /* 获取红外开关参数成功 */
  Z_GET_IRCUT_MODE_FAILED,      /* 获取红外开关参数失败 */

  /* Accessory */
  Z_SEARCH_ACCESSORY_OK,        /* 搜索被动设备成功 */
  Z_SEARCH_ACCESSORY_FAILED,    /* 搜索被动设备失败 */

  Z_ADD_ACCESSORY_OK,           /* 添加被动设备成功 */
  Z_ADD_ACCESSORY_FAILED,       /* 添加被动设备失败 */

  Z_ADD_PRESET_POINT_OK,        /* 添加预置点成功 */
  Z_ADD_PRESET_POINT_FAILED,    /* 添加预置点失败 */

  Z_MODIFY_PRESET_POINT_OK,     /* 修改预置点成功 */
  Z_MODIFY_PRESET_POINT_FAILED, /* 修改预置点失败 */

  Z_REMOTE_RESET_OK,            /* 重置设备成功 */
  Z_REMOTE_RESET_FAILED,        /* 重置设备失败 */
    
  Z_OPRATE_BUZZER_OK,           /* 操作蜂鸣成功 */
  Z_OPRATE_BUZZER_FAILED,       /* 操作蜂鸣失败 */
    
  Z_SET_DETECTION_AREA_OK,      /* 设置侦测区域成功 */
  Z_SET_DETECTION_AREA_FAILED,  /* 设置侦测区域失败 */
  Z_GET_DETECTION_AREA_OK,      /* 获取侦测区域成功 */
  Z_GET_DETECTION_AREA_FAILED,  /* 获取侦测区域失败 */
    
  Z_WATERING_OPERATE_OK,        /* 设置浇水成功 */
  Z_WATERING_OPERATE_FAILED,    /* 设置浇水失败 */
    
  Z_OPERATE_CURTAIN_OK,         /* 操作窗帘成功 */
  Z_OPERATE_CURTAIN_FAILED,     /* 操作窗帘失败 */
    
  Z_GET_CURTAIN_OK,             /* 获取窗帘成功 */
  Z_GET_CURTAIN_FAILED,         /* 获取窗帘失败 */
    
  Z_OPRATE_DOORLOCKS_OK,        /* 操作门锁成功 */
  Z_OPRATE_DOORLOCKS_FAILED,    /* 操作门锁失败 */

  Z_COMMON_SET_OK,              /* 通用设置成功 */
  Z_COMMON_SET_FAILED,          /* 通用设置失败 */
  Z_COMMON_GET_OK,              /* 通用查询成功 */
  Z_COMMON_GET_FAILED,          /* 通用查询失败 */

  Z_PLAY_VOICE_OK,              /* 播放留言成功 */
  Z_PLAY_VOICE_FAILED,          /* 播放留言失败 */

  Z_ANSWER_CALL_OK,             /* 门铃来电应答成功 */
  Z_ANSWER_CALL_FAILED,         /* 门铃来电应答失败 */
  Z_REFUSE_CALL_OK,             /* 门铃来电拒绝成功 */
  Z_REFUSE_CALL_FAILED,         /* 门铃来电拒绝失败 */
  Z_HANGUP_OK,                  /* 门铃来电挂断成功 */
  Z_HANGUP_FAILED,              /* 门铃来电挂断失败 */

  /* Bluetooth */
  Z_BLUETOOTH_PAIRING_OK,       /* 蓝牙配对成功 */
  Z_BLUETOOTH_PAIRING_FAILED,   /* 蓝牙配对失败 */

  Z_CHANNEL_EVENT_BOUNDARY,     /* boundary */
} ZEventCode ;

typedef enum {
  MEDIA_TYPE_LD       = 0,      // 流畅
  MEDIA_TYPE_SD       = 1,      // 标清
  MEDIA_TYPE_HD       = 2,      // 高清
} MediaType;

typedef enum {
  OP_CLOSE  = 0,
  OP_OPEN   = 1,
  OP_PAUSE  = 0,
  OP_RESUME = 1,
} OpType;

typedef enum {
  UPNP     = 0,
  LAN      = 1,
  TRANSFER = 2,
} ReqConnMode;

typedef enum {
  DEV_REAL_PLAY   = 0,
  DEV_PLAY_BACK   = 1,
  DEV_CLOUD_PLAY  = 2,
  DEV_LAN_SETTING = 3,
  DEV_APP_CLOUD_PLAY = 4,
  DEV_FAST_PLAY = 5,
} DeviceType;

typedef enum {
  SOFTWARE_DECODE = 0,
  HARDWARE_DECODE = 1,
  RGB_DECODE      = 2,
} DecodeMode;

typedef enum {
  DECODE_H264 = 0,
  DECODE_H265 = 1,
} DecodeType;

/* PT CONTROL COMMOND */
typedef enum {
  CMD_STOP          = 0,
  CMD_LEFT,                  //左
  CMD_RIGHT,                 //右
  CMD_UP,                    //上
  CMD_DOWN,                  //下
  CMD_CALL_CRIUSE   = 0x12,  //呼叫巡航
  CMD_AUTOSCAN      = 0x13,
  CMD_CALLPRESET    = 0x15,
  CMD_CALL_KINDSCAN = 0x16,  //呼叫花样扫描
  CMD_FOCUSFAR      = 0x23,
  CMD_FOCUSNAER     = 0x24,
  CMD_IRISOPEN      = 0x25,
  CMD_IRISCLOSE     = 0x26,
  CMD_ZOOMTELE      = 0x27,
  CMD_ZOOMWIDE      = 0x28,
  CMD_SET_CRIUSE_P  = 0x32,  //设置巡航点
  CMD_SETPRESET     = 0x35,
  CMD_CRIUSE,
  CMD_CLRPRESET,
  CMD_STOPSCAN,
  CMD_SET_DWELLTIME,
  CMD_KINDSCAN_START,
  CMD_KINDSCAN_END,
  CMD_CLRCRIUES_LINE,
  CMD_CLR_SCAN_LINE,
  CMD_CLR_KINDSCAN,
} PtzCmd;

/* REMOTE CONTROL COMMOND */
#define GUI_INVALID_KEY           0x0fffffff
#define GUI_DIGIT0_KEY            0x10000000
#define GUI_DIGIT1_KEY            0x10000001
#define GUI_DIGIT2_KEY            0x10000002
#define GUI_DIGIT3_KEY            0x10000003
#define GUI_DIGIT4_KEY            0x10000004
#define GUI_DIGIT5_KEY            0x10000005
#define GUI_DIGIT6_KEY            0x10000006
#define GUI_DIGIT7_KEY            0x10000007
#define GUI_DIGIT8_KEY            0x10000008
#define GUI_DIGIT9_KEY            0x10000009
#define GUI_DIGIT10PLUS_KEY       0x1000000a
#define GUI_BACKSPACE_KEY         0x1000000b
#define GUI_LEFT_KEY              0x10000010
#define GUI_RIGHT_KEY             0x10000011
#define GUI_UP_KEY                0x10000012
#define GUI_DOWN_KEY              0x10000013
#define GUI_ENTER_KEY             0x10000014
#define GUI_POWER_KEY             0x10000020
#define GUI_MANUAL_REC_KEY        0x10000021
#define GUI_4_SCREEN_KEY          0x10000022
#define GUI_FUNCTION_KEY          0x10000023
#define GUI_MAINMENU_KEY          0x10000024
#define GUI_ESC_KEY               0x10000025
#define GUI_PTZ_KEY               0x10000030
#define GUI_BACKUP_KEY            0x10000031
#define GUI_TV_VGA_SWITCH_KEY     0x10000032
#define GUI_CLEAR_ALARM_KEY       0x10000033
#define GUI_CHANNELPOLL_KEY       0x10000034
#define GUI_PLAY_PAUSE_KEY        0x10000035
#define GUI_STOPPLAY_KEY          0x10000036
#define GUI_FASTREWIND_KEY        0x10000037
#define GUI_FASTFORWARD_KEY       0x10000038
#define GUI_SHIFT_KEY             0x10000042
#define GUI_LOGOUT_KEY            0x10000040
#define GUI_1_SCREEN_KEY          0x10000041


#endif  // ZMD_ZTYPES_H_
