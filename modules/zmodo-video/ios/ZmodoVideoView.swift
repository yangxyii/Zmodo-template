import ExpoModulesCore

class ZmodoVideoView: ExpoView {
  let player = ZmodoPlayerView()
  let onStreamEvent = EventDispatcher()

  // Props (set individually by the module's Prop closures)
  var physicalId: String = ""
  var channel: Int = 0
  var mode: String = "live"      // "live" | "playback"
  var aesKey: String? = nil
  var platform: Int = 0
  var videoType: Int = 0
  var deviceIp: String = ""
  var port: Int = 0
  var connMode: Int = 5
  var token: String? = nil
  var startTime: String? = nil

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    player.frame = bounds
    player.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(player)
    player.onStreamEvent = { [weak self] (type, message) in
      self?.onStreamEvent(["type": type, "message": message ?? ""])
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    player.frame = bounds
  }

  /// Called from the physicalId prop setter (via main-queue async dispatch) so
  /// that all other props set in the same synchronous batch have already landed
  /// before we attempt to open the stream.
  func startIfReady() {
    guard !physicalId.isEmpty else { return }
    if mode == "live" {
      player.startLive(
        withDeviceId: physicalId,
        channel: channel,
        aesKey: aesKey,
        platform: platform,
        videoType: videoType,
        deviceIp: deviceIp.isEmpty ? nil : deviceIp,
        port: port,
        connMode: connMode,
        token: token
      )
    }
    // Playback handled in M3
  }

  func stop() {
    player.stop()
  }
}
