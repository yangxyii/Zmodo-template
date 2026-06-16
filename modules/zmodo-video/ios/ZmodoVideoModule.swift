import ExpoModulesCore

public class ZmodoVideoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ZmodoVideo")

    View(ZmodoVideoView.self) {
      Events("onStreamEvent")

      // physicalId triggers startIfReady() via async dispatch so all other
      // props set in the same synchronous batch land first.
      Prop("physicalId") { (v: ZmodoVideoView, value: String) in
        v.physicalId = value
        DispatchQueue.main.async { v.startIfReady() }
      }
      Prop("channel")   { (v: ZmodoVideoView, value: Int) in v.channel = value }
      Prop("mode")      { (v: ZmodoVideoView, value: String) in v.mode = value }
      Prop("aesKey")    { (v: ZmodoVideoView, value: String?) in v.aesKey = value }
      Prop("platform")  { (v: ZmodoVideoView, value: Int) in v.platform = value }
      Prop("videoType") { (v: ZmodoVideoView, value: Int) in v.videoType = value }
      Prop("deviceIp")  { (v: ZmodoVideoView, value: String) in v.deviceIp = value }
      Prop("port")      { (v: ZmodoVideoView, value: Int) in v.port = value }
      Prop("connMode")  { (v: ZmodoVideoView, value: Int) in v.connMode = value }
      Prop("token")     { (v: ZmodoVideoView, value: String?) in v.token = value }
      Prop("startTime") { (v: ZmodoVideoView, value: String?) in v.startTime = value }
    }
  }
}
