import ExpoModulesCore

public class ZmodoVideoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ZmodoVideo")

    View(ZmodoVideoView.self) {
    }
  }
}
