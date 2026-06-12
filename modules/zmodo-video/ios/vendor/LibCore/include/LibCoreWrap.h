//
//  libCoreWrap.h
//  Zmodo Zsight
//
//  Created by 钱长存 on 14-4-3.
//  Copyright (c) 2014年 Zmodo. All rights reserved.
//

/*
    ZMD_C_API void StartLocalPlay
 
 
 */

#import <Foundation/Foundation.h>
#include "ztypes.h"





@interface LibCoreWrap : NSObject

+ (LibCoreWrap *)sharedCore;

- (void)crear;

/**
 * @brief initialize.
 *
 * uuid : 设备唯一标识
 */
- (void)initialize:(NSInteger)isOldPlatform uuid:(NSString *)uuid;

/**
 * @brief uninitialize library.
 */
- (void)unInitialize:(NSInteger)isOldPlatform;

/**
 * @brief library version.
 */
- (NSString *)getVersion;

/**
 * @brief register event observer.
 */

- (void)registerEventObserver:(id)observer forKey:(id)key;

/**
 * @brief unregister event observer.
 */
- (void)unRegisterEventObserverForKey:(id)key;

/**
 * @brief unregister all system observer.
 */
- (void)unRegisterAllEventObservers;

/**
 * @brief connect to server.
 */
- (void)connectServer:(NSInteger)isOldPlatform paramDic:(id)paramsDict;


/**
 * @brief disconnect to access server.
 */
- (void)disConnectServer:(NSInteger)isOldPlatform;

/**
 * @brief create real play device object.
 * return the object handle.
 *
 * before start real play or do some operation like mute/unmute, unlock,
 * you must CreateRealPlay first.
 * same as CreatePlayBack, CreateCloudPlay.
 *
 * before you CreateRealPlay with same device_id and channel,
 * you must DestroyPlay first.
 * same as CreatePlayBack, CreateCloudPlay.
 *
 * videoType : 0 - H264, 1 - HEVC
 */

- (z_handle)createRealPlayWithPlatform:(NSInteger)isOldPlatform
                              deviceId:(NSString *)deviceId
                               channel:(NSInteger)channel
                        streamObserver:(id)observer
                             videoType:(DecodeType)videoType;

/**
 * @brief create play back device object.
 * return the object handle.
 */

- (z_handle)createPlayBackWithPlatform:(NSInteger)isOldPlatform
                              deviceId:(NSString *)deviceId
                               channel:(NSInteger)channel
                        streamObserver:(id)observer
                             videoType:(DecodeType)videoType;

/**
 * @brief create cloud play back device object.
 * return the object handle.
 */

- (z_handle)createCloudPlayWithPlatform:(NSInteger)isOldPlatform
                               deviceId:(NSString *)deviceId
                                channel:(NSInteger)channel
                         streamObserver:(id)observer
                              videoType:(DecodeType)videoType;
/**
 * @brief create new cloud play back device object.
 * return the object handle.
 * raplace (createCloudPlayWithPlatform:)  2018.8.24
 */
- (z_handle)createAppCloudPlayWithPlatform:(NSInteger)isOldPlatform
                               deviceId:(NSString *)deviceId
                                channel:(NSInteger)channel
                         streamObserver:(id)observer
                              videoType:(DecodeType)videoType;

/**
 * @brief create local video play back handle.
 */
- (z_handle)createLocalPlayWithPlatform:(NSInteger)isOldPlatform
                               deviceId:(NSString *)deviceId
                                channel:(NSInteger)channel
                         streamObserver:(id)observer
                              videoType:(DecodeType)videoType;
/**
 * @brief create device configer handle.
 */
- (z_handle)createConfigerHandleWithPlatform:(NSInteger)isOldPlatform
                                    deviceId:(NSString *)deviceId
                                     channel:(NSInteger)channel
                              streamObserver:(id)observer;


/**
 * @brief create doorbell playback handle.
 */
- (z_handle)createDoorbellPlayBackHandleWithPlatform:(NSInteger)isOldPlatform
                                            deviceId:(NSString *)deviceId
                                             channel:(NSInteger)channel
                                      streamObserver:(id)observer
                                           videoType:(DecodeType)videoType
                                          deviceType:(DeviceType)deviceType;

/**
 * @brief create alert video play handle.
 */
- (z_handle)createAlertVideoPlayHandelWithPlatform:(NSInteger)isOldPlatform
                                          filePath:(NSString *)filePath
                                          deviceId:(NSString *)deviceId
                                           channel:(NSInteger)channel
                                    streamObserver:(id)observer
                                         videoType:(DecodeType)videoType;


/**
 * @brief create FastCloud play handle.
 */
- (z_handle)createFastCloudPlayHandelWithPlatform:(NSInteger)isOldPlatform
                                         filePath:(NSString *)filePath
                                         deviceId:(NSString *)deviceId
                                          channel:(NSInteger)channel
                                   streamObserver:(id)observer
                                        videoType:(DecodeType)videoType;

/**
 * @brief release object.
 *
 * after DestroyPlay, you will receive Z_DESTROY_PLAY_OK event,
 * then you can destruct the corresponding ChannelObserver.
 */
- (void)destroyPlay:(z_handle)handle;

/**
 * @brief start play, create stream connection with device.
 *
 * the time_out is measured by ms, not second.
 * same as StartPlayBack and StartCloudPlay.
 *req_conn_mode, the value is the enum ReqConnMode
 * value bit | ,
 *   bit0: UPNP
 *   bit1: LAN
 *   bit2: TRANSFER
 */

- (int)startRealPlayWithHandle:(z_handle)handle
                       timeout:(NSInteger)timeout
                     mediaType:(NSInteger)mediaType
                      deviceIp:(NSString *)deviceIp
                          port:(NSInteger)devicePort
                 req_conn_mode:(NSInteger)ReqConnMode;
/**
 *  SMS Real Play
 */
- (int)startRealPlaySmSWithHandle:(z_handle)handle
                          timeout:(NSInteger)timeout
                        mediaType:(NSInteger)mediaType
                         deviceIp:(NSString *)deviceIp
                             port:(NSInteger)devicePort
                            smsIp:(NSString *)smsIp
                          smsPort:(NSInteger)smsPort
                       encryptKey:(NSString *)encryptKey
                           tokenId:(NSString *)tokenId;

/**
 * @brief start play, create stream connection with device.
 */

- (int)startPlayBackWithHandle:(z_handle)handle
                       timeout:(NSInteger)timeout
                     startTime:(NSString *)startTime
                        upnpIp:(NSString *)upnpIp
                          port:(NSInteger)port
                      isRemote:(BOOL)isRemote;

/**
 * @brief start play, create stream connection with device.
 *  replace by (startAppCloudPlayWithHandle:)  changed on 2018-08-23
 */

- (int)startCloudPlayWithHandle:(z_handle)handle
                        timeout:(NSInteger)timeout
                            url:(NSString *)url;

/**
 * @brief start play, create stream connection with device.
 *  replace (startCloudPlayWithHandle:)  created on 2018-08-23
 */
- (void)startAppCloudPlayWithHandle:(z_handle)handle
                            timeout:(NSInteger)timeout
                          startTime:(NSString *)startTime
                           timeZone:(NSInteger)timeZone;

/**
 * @brief start fast cloud play.
 *
 *  json_params like :
 *  {
 *    "server_url": "rtmp://ip:port/playback/deviceId_channel?code=j8fbma6d422vqs19qnr9khs0p5",
 *    "start_time": "2018-08-08 08:08:08"
 *    "end_time"  : "2018-08-08 18:18:18"
 *    "encrypt"   : 1
 *    "speed"     : 2700
 *  }
 *  replace by (startFastCloudPlay2)  changed on 2018-08-23
 */
- (void)startFastCloudPlayWithHandle:(z_handle)handle
                             timeout:(NSInteger)timeout
                         json_params:(NSString *)json_params;

/**
 * @brief start fast cloud play.
 *
 *  json_params like :
 *  {
 *    "file_path": "rtmp://ip:port/playback/deviceId_channel?code=j8fbma6d422vqs19qnr9khs0p5",
 *    "start_time": "2018-08-08 08:08:08"
 *    "end_time"  : "2018-08-08 18:18:18"
 *  }
 *  replace (startFastCloudPlay)  created on 2018-08-23
 */
- (void)startFastCloudPlay2WithHandle:(z_handle)handle
                              timeout:(NSInteger)timeout
                          json_params:(NSString *)json_params;

/**
 * @brief start local playback.
 *
 * the start_time format is "hh:mm:ss", like "14:34:40"
 */
- (void)startLocalPlayWithHandle:(z_handle)handle
                        startTime:(NSString *)startTime;

/**
 * @brief start alert video play.
 *
 * the startTime format is "hh:mm:ss" like "14:34:40"
 */
- (void)startAlertVideoPlayWithHandle:(z_handle)handle
                             filePath:(NSString *)filePath
                            startTime:(NSString *)startTime;

/**
 * @brief pause streaming, not release connection.
 */
- (void)pausePlayWithHandle:(z_handle)handle;

/**
 * @brief resume streaming, not release connection.
 */
- (void)resumePlayWithHandle:(z_handle)handle;

/**
 * @brief stop streaming, release connection sync.
 *
 */
- (void)stopPlayWithHandle:(z_handle)handle;


/**
 * @brief stop streaming, release connection async.
 *
 */
- (void)stopLocalPlayBackWithHandle:(z_handle)handle;



/**
 * @brief get sd card record video list from sd card playback device.
 *
 * the date must like this: "2014-09-29"
 */
- (void)getRecordListWithHandle:(z_handle)handle
                          upnpIP:(NSString *)upnpIP
                        upnpPort:(NSInteger)upnpPort
                           date:(NSString *)date
                       isRemote:(BOOL)isRemote;
/**
 * @brief change stream media type.
 */
- (void)changeStreamWithHandle:(z_handle)handle mediaType:(int)mediaType;

/**
 * @brief open sound.
 */
- (int)openSoundWithHandle:(z_handle)handle;

/**
 * @brief close sound.
 */
- (int)closeSoundWithHandle:(z_handle)handle;

/**
 * @brief start talk.
 */
- (int)startTalkWithHandle:(z_handle)handle;

/**
 * @brief stop talk.
 */
- (int)stopTalkWithHandle:(z_handle)handle;

/**
 * @brief send talk audio data.
 */
- (int)talkSendDataWithHandle:(z_handle)handle
                         data:(BytePtr)pBuffer
                       length:(int)bufferLen;

/**
 * @brief set log options.
 * call this method after Initialize
 */
- (int)setLogOptionWithLogHeader:(NSString *)logHeader
                         logPath:(NSString *)logPath
                       upLoadUrl:(NSString *)uploadUrl;

/**
 * @brief query SD state.
 */
- (void)querySDStatus:(z_handle)handle;

/**
 * @brief sd operate instructions.
 * @param op_type, 1: format sd, 2: clear sd data
 *
 * WARNING!!!
 * this api is dangerous, Make sure you really want to do it!
 */
- (void)operateSDWithHandle:(z_handle)handle operationType:(int)opType;

/**
 * @brief ptz config.
 *
 * @param ptz_cmd ptz控制命令字
 * @param para0   左右转速  0-使用系统默认
 * @param para1   上下转速  0-使用系统默认
 */
- (void)ptzConfigWithHandle:(z_handle)handle
                     ptzCmd:(PtzCmd)ptzCmd
                      para0:(unsigned short)para0
                      para1:(unsigned short)para1;


/**
 * @brief remote control.
 * @param cmd 参考遥控器控制指令定义
 * @param action 0-按下，1-松开
 */

- (void)remoteContrlWithHandle:(z_handle)handle
                           cmd:(int)cmd
                        action:(int)action;

/**
 * @brief query ptz preset.
 */
- (void)queryPtzPresetWithHandle:(z_handle)handle;

/**
 * @brief answer doorbell call.
 */
- (void)answerDoorbellWithHandle:(z_handle)handle;

/**
 * @brief device switch day or night mode.
 */
- (void)dayNightSwitchWithHandle:(z_handle)handle;

/**
 * @brief start record current realplay video.
 *
 * the handle is get from CreateRealPlay()
 */
- (void)startRecordWithHandle:(z_handle)handle
                      filePath:(NSString *)filePath
                timeZoneOffset:(int)timeZoneOffset;

/**
 * @brief stop record realplay video.
 */
- (void)stopRecordWithHandle:(z_handle)handle;


/**
 * @brief start local audio record.
 */
- (int)startAudioRecordWithFilePath:(NSString *)filePath;

/**
 * @brief stop local audio record.
 */
- (int)stopAudioRecord;

/**
 * @brief save local audio record data.
 */
- (int)audioRecorderSaveDataWithData:(BytePtr)pBuffer
                       length:(int)bufferLen;


/**
 * @brief get recorded video info.
 */
- (void)getVideoInfo:(NSString *)filePath;

/**
 * @brief get MP4 video info.
 */
- (void)H264toMP4:(NSString *)fileName;


/**
 * @brief get MP4 video info.
 * @brief mp4 outputlocationpath
 */
- (void)H264toMP4:(NSString *)fileName outputPath:(NSString*)outputPath;

/**
 * @brief scan lan devices.
 */
- (void)scanLanDevices;

/**
 * @brief listen device's broadcast result after ez-link.
 * @param timeout common value is 30*1000ms,
 * if it is -1, mean listen forever.
 */
- (void)startEzLinkListen:(int)timeOut;

/**
 * @brief stop ez link listen.
 */
- (void)stopEzLinkListen;

/**
 * @brief playing devices.
 */
- (NSArray *)playingDevices;

/**
 * @brief bluetooth pairing.
 * ZSP 协议短连接, 请使用独立的 handle
 */
- (void)BluetoothPairing:(z_handle)handle;

/**
 * @brief convert yuv to rgb.
 * Notice!
 * rgb_buf must allocate and free by caller self,
 * and its size must equal or bigger than width*height*3
 *
 * this is a sync interface, not async.
 */

- (BOOL)yuv2Rgb24WithY:(char *)y
                     u:(char *)u
                     v:(char *)v
              srcWidth:(int)srcWidth
             srcHeight:(int)srcHeight
                rgbBuf:(char *)rgbBuf
              dstWidth:(int)dstWidth
             dstHeight:(int)dstHeight;

/**
 * @brief save rgb data to bmp format file.
 *
 * this is a sync interface, not async.
 */

- (BOOL)saveAsBmpWithRgbData:(const char*)rgbData
                       width:(int)width
                      height:(int)height
                        path:(const char *)picPath;


/**
 * @brief flip video image.
 *
 * @param mode 翻转模式 (0:正常，1:翻转，2:镜像，3:镜像翻转)
 */
- (void)flipVideoImageWithHandle:(z_handle)handle mode:(int)mode;

/**
 * @brief set IRCut mode
 *
 * @param mode 红外模式 (0:自动模式，1:红外模式，2:可见光模式)
 */
- (void)setIRCutModeWithHandle:(z_handle)handle mode:(int)mode;

/**
 * @brief get IRCut mode
 */
- (void)getIRCutModeWithHandle:(z_handle)handle;

/**
 * @brief Reset device.
 * @param op_type, 1: 软复位, 2: 重启
 * @channel:通道号
 */
- (void)resetDeviceWithHandle:(z_handle)handle opType:(int)opType channel:(int)channel;

/**
 * @brief operate buzzer.
 * @param op_type, 1: 开始, 2: 停止
 * @param passiveId 被动设备ID
 */
- (void)buzzerOperateWithHandle:(z_handle)handle opType:(int)opType passiveId:(NSString *)passiveId;

/**
 * @brief SetDetectionArea.
 * @param json_area_params的格式：
 {"data_type": 0,"x": 1,"y": 2,"width": 50,"height": 100}
 {"data_type":1,"point0":{"x":0,"y":0},"point1":{"x":1,"y":1},"point2":{"x":2,"y":2},"point3":{"x":3,"y":3},"point4":{"x":4,"y":4},"point5":{"x":5,"y":5},"point6":{"x":6,"y":6},"point7":{"x":7,"y":7}}
 */
- (void)setDetectionAreaWithHandle:(z_handle)handle
                    jsonAreaParams:(NSString *)jsonAreaParams
                           channel:(int)channel
                        physicalId:(NSString *)physicalId;
/**
 * @brief GetDetectionArea.
 */
- (void)GetDetectionAreaWithHandle:(z_handle)handle channel:(int)channel physicalId:(NSString *)physicalId;


- (void)WateringOperateWithHandle:(z_handle)handle op_type:(int)op_type physicalId:(NSString *)physicalId hole_id:(int)hole_id time:(int)time;

- (void)OperateCurtainWithHandle:(z_handle)handle op_type:(int)op_type is_curtain:(int)is_curtain;
- (void)GetCurtainWithHandle:(z_handle)handle;

/**
 * @brief Door locks.
 * @param op_type, 0:开锁 , 1:取消开锁
 * @param passiveId 被动设备ID
 */
- (void)DoorLocksWithHandle:(z_handle)handle opType:(int)opType passiveId:(NSString *)passiveId;


/**
 * @brief door light control.
 * @param light_switch light开关 1-开, 2-关, 3-自动 默认-2
 * @param white_switch 白炽灯开关, 1-开, 2-关 默认-开
 * @param breath_switch 呼吸功能开关, 1-开, 2-关 默认-关
 */

- (void)doorLightContrlWithHandle:(z_handle)handle
                      lightSwitch:(int)lightSwitch
                      whiteSwitch:(int)whiteSwitch
                     breathSwitch:(int)breathSwitch
                                r:(int)r
                                g:(int)g
                                b:(int)b
                           upnpIp:(NSString *)upnpIp
                         upnpPort:(int)upnpPort;


/**
 * @brief search lan accessory.
 * @ return json string like
 * {
 *   "accessorys": [
 *     {
 *       "id": "1111",
 *       "type": "0x0001",
 *     },
 *     {
 *       "id": "2222",
 *       "type": "0x0002",
 *     }
 *   ]
 * }
 */
- (void)searchAccessoryWithHandle:(z_handle)handle;

/**
 * @brief add accessory.
 * @ json string like
 * {
 *   "accessorys": [
 *     {
 *       "id": "1111",
 *       "name": "device1",
 *       "pwd": "12233344445555566666677777774444"
 *     },
 *     {
 *       "id": "2222",
 *       "name": "device2",
 *       "pwd": "12233344445555566666677777774444"
 *     }
 *   ]
 * }
 *
 * Notice! pwd is encrypted by md5
 */


- (void)addAccessoryWithHandle:(z_handle)handle accessories:(NSString *)jsonAccessories;


/**
 * @brief add preset point.
 *  Req
 *    {
 *      "name": "preset_1",
 *      "bindDevice": "1308000xxx",
 *    }
 *
 *  Resp
 *    {
 *      "name": "preset_1",
 *      "bindDevice": "1308000xxx",
 *      "index": 256,
 *      "status": 1,
 *      "position": 200,
 *    }
 *
 * ZSP 协议短连接, 请使用独立的 handle
 */
 -(void)addPresetPointWithHandle:(z_handle)handle presetPoint:(NSString *)presetPoint;

/**
 * @brief modify preset point.
 *  Req
 *    {
 *      "name": "preset_1",
 *      "new_name": "preset_2",
 *      "bindDevice": "1308000xxx",
 *    }
 *
 *  Resp: (0-成功, -1-失败,-2-同步服务器失败)
 *
 * ZSP 协议短连接, 请使用独立的 handle
 */

-(void)modifyPresetPointWithHandle:(z_handle)handle presetPoint:(NSString *)presetPoint;


/**
 * @brief start doorbell call play.
 */

- (void)startCallPlayWithHandle:(z_handle)handle
                       timeout:(NSInteger)timeout
                       transIp:(NSString *)transIp
                     transPort:(NSInteger)transPort
                       regCode:(NSString *)regCode;
/**
 * @brief answer call.
 * @Param hanle DEV_REAL_PLAY
 */

- (void)answerCallWithHandle:(z_handle)handle;

/**
 * @brief refuse call.
 * @Param hanle DEV_REAL_PLAY
 */
- (void)refuseCallWithHandle:(z_handle)handle;

/**
 * @brief hang up call.
 * @Param hanle DEV_REAL_PLAY
 */
- (void)hangUpWithHandle:(z_handle)handle;

/**
 * @brief Play Voice.
 * @Param hanle DEV_REAL_PLAY
 */
- (void)playVoiceWithHandle:(z_handle)handle
                 messageId:(NSString *)messageId;

/**
 <#Description#>

 @param key 密钥
 @param input <#input description#>
 @param input_length <#input_length description#>
 @param output <#output description#>
 @return <#return value description#>
 */
- (int)desEncryptEnc:(const unsigned char*)key
               input:(const unsigned char*)input
        input_length:(int)input_length
              output:(unsigned char*)output;

/**
 <#Description#>

 @param key <#key description#>
 @param input <#input description#>
 @param input_length <#input_length description#>
 @param output <#output description#>
 */
- (void)desEncryptDec:(const unsigned char*) key
                input:(const unsigned char*) input
         input_length:(int)input_length
               output:(unsigned char*)output;


/**
 * @brief search device record date.
 * param date must like this: "2015-01-01"
 * return json string like
 * {
 *   "record_date": [
 *     { "date": "2016-01-21" },
 *     { "date": "2016-01-22" },
 *   ]
 * }
 * ZSP 协议短连接, 请使用独立的 handle
 */

- (void)getRecordDateWithHandle:(z_handle)handle
                         upnpIP:(NSString *)upnpIP
                       upnpPort:(NSInteger)upnpPort
                           startDate:(NSString *)startDate
                      endDate:(NSString *)endDate
                       timeout:(NSInteger)timeout
                       isRemote:(BOOL)isRemote;



/**
 * @brief set paramters.
 *
 * optional api, use between CreateDeviceHandle
 * and StartRealPlay | StartPlayBack | StartCloudPlay |
 * StartLocalPlay | StartCallPlay | StartDoorbellPlayBack
 *
 *  json_params like :
 *  {
 *    "aes_key" : "12341234",
 *  }
 *
 */

- (void)setParamsWithHandle:(z_handle)handle
                 jsonParams:(NSString *)jsonParams;

/**
 * @brief add preset point via Access Server.
 * @param:
 *      physicalId : 门磁ID
 *      presetName : 预置点名字
 *
 * 请使用独立的 handle
 */
-(void)addPresetPointExWithHandle:(z_handle)handle physicalId:(NSString *)physicalId presetName:(NSString *)presetName;

/**
 * @brief modify preset point via Access Server.
 *@param:
 *      presetName  :   预置点名字
 *      physicalId  :   门磁ID
 *      newName : 预置点新名字
 * 请使用独立的 handle
 */

-(void)modifyPresetPointExWithHandle:(z_handle)handle physicalId:(NSString *)physicalId presetName:(NSString *)presetName newName:(NSString *)newName;


/**
 * @brief oprate watering.
 * @param op_type, 1: 开始, 2: 停止，3：获取浇水状态
 * @param deviceId, 灌溉设备的ID
 * @param hole_id, 出水口序号，从0开始
 * @param water_time, 浇水时间
 * @callback {"op_type": 1}
 * 当op_type为3时，返回如下：
 * {
 *   "op_type": 1,
 *   "result_tasks": [{"hole_id ":"0","watering":"1","from":"0","time":"30","cost_time":"15" },{"hole_id":"1","watering":"0"}]
 * }
 * note：
 * from：task from
 * 0：trigger from device
 * 1：trigger fron app
 * xxx：schedule trigger，the value is schedule_id，bigger than 100
 */
- (void)wateringOperateWithHandle:(z_handle)handle
                          op_type:(int)op_type
                         deviceId:(NSString *)deviceId
                          hole_id:(int)hole_id
                       water_time:(int)water_time;

/****************** 2018.8.16 温控设备相关指令 ************************/
/**
 * @brief common set cmd via Access Server
 * @param: json_param: 包含具体的指令和参数信息
 *                     op_type, 1: 设置温控器风机运转
 *                                 fan_mode, 具体见微享通信协议
 *                              2: 设置温控器通风孔矫正
 */
- (void)setCommonDevice:(z_handle)handle
             jsonParams:(NSString *)jsonParams;


/**
 * @brief common get cmd via Access Server
 * @param json_param: 包含具体的指令和参数信息
 *                     op_type, 1: 获取温控器当前的所有状态
 * @callback 具体见微享通信协议
 */
- (void)getCommonDevice:(z_handle)handle
             jsonParams:(NSString *)jsonParams;


- (NSData*)AddVideoOSD:(NSString*)timeStr dataY:(id)y
                                          dataU:(id)u
                                          dataV:(id)v
                                           width:(NSInteger)width
                                           height:(NSInteger)height;




@end

@protocol StreamObserverProtocol
@optional
- (void)didReceiveStreamStatus:(int)code
                       content:(const char *)content
                        length:(int)length
                        handle:(z_handle)handle;
- (void)didReceiveRawData:(NSData *)data token:(id)token;
- (void)didReceiveImageDataY:(id)y
                       dataU:(id)u
                       dataV:(id)v
                       width:(NSInteger)width
                      height:(NSInteger)height
                   frameTime:(int)frameTime
                       token:(id)token;
- (void)didReceiveAudioData:(id)data token:(id)token;
- (void)didReceiveAbsoluteTime:(int)frameTime;
@end

@protocol EventObserverProtocol
@optional
- (void)didReceiveEvent:(int)code
                content:(const char *)content
                 length:(int)length;
- (void)didReceiveEvent_oldPlatform:(int)code
                            content:(const char *)content
                             length:(int)length;
@end

