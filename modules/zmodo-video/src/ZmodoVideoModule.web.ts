import { registerWebModule, NativeModule } from 'expo';

// ZmodoVideoModule is not available on the web platform.
class ZmodoVideoModule extends NativeModule<{}> {}

export default registerWebModule(ZmodoVideoModule, 'ZmodoVideoModule');
