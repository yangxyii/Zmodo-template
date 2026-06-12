import { NativeModule, requireNativeModule } from 'expo';

declare class ZmodoVideoModule extends NativeModule<{}> {}

export default requireNativeModule<ZmodoVideoModule>('ZmodoVideo');
