import ExpoModulesCore

public class ZmodoVideoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ZmodoVideo")

    // -----------------------------------------------------------------------
    // connectServer — M2.3
    //
    // Called from JS after a successful login so that LibCoreWrap's
    // TRANSFER relay (access server) is authenticated before any stream
    // is started.  Without this call startRealPlay returns
    // Z_START_PLAY_FAILED "Not login access server" for cameras that have
    // no LAN IP (connMode = 4 / TRANSFER only).
    //
    // Expected params keys (all String unless noted):
    //   token_id       — login token
    //   client_id      — user ID
    //   acc_srv_ip     — access server host IP
    //   acc_srv_port   — port as Int (JS passes number, cast to NSNumber here)
    //   encrypt_key    — optional
    //   encrypt_key_id — optional
    //   cid            — "0" for Zmodo
    // -----------------------------------------------------------------------
    // connectServer is ASYNCHRONOUS in LibCoreWrap: it only initiates the
    // login.  ZmodoSession watches the global EventObserver and invokes our
    // completion when Z_CONN_ACC_SRV_OK / _FAILED / _TOKEN_INVALID arrives (or
    // a ~20s timeout).  We bridge that to the JS Promise so callers can await
    // the *real* result and see the failure code if it fails.
    AsyncFunction("connect") { (params: [String: Any], promise: Promise) in
      // Build the NSDictionary that ZmodoSession / LibCoreWrap expects.
      // JS can send numbers or strings; guard-cast port to NSNumber.
      var dict: [String: Any] = params
      if let portAny = params["acc_srv_port"] {
        if let portInt = portAny as? Int {
          dict["acc_srv_port"] = NSNumber(value: portInt)
        } else if let portStr = portAny as? String, let portInt = Int(portStr) {
          dict["acc_srv_port"] = NSNumber(value: portInt)
        }
      }
      ZmodoSession.connect(withParams: dict) { (success, code, message) in
        if success {
          promise.resolve(true)
        } else {
          promise.reject(
            "E_ACC_CONNECT",
            "access server connect failed (code=\(code))" + (message.map { ": \($0)" } ?? "")
          )
        }
      }
    }

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
