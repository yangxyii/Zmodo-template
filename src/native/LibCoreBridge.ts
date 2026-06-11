/**
 * LibCoreBridge — TypeScript interface for the future Zmodo native LibCore module.
 * Phase-1 stub: the real native binding is wired in a later iOS milestone.
 */

export type StreamMode = 'live' | 'playback';

export interface StreamEvent {
  type: 'start' | 'data' | 'stop' | 'error';
  message?: string;
}

export interface LibCoreBridge {
  /** Begin streaming.  For live mode omit startTime; for playback supply an ISO-8601 string. */
  start(opts: {
    physicalId: string;
    channel?: number;
    mode: StreamMode;
    startTime?: string;
  }): Promise<void>;

  /** Stop the current stream. */
  stop(): Promise<void>;

  /** Seek to a point in a playback stream. */
  seek(startTime: string): Promise<void>;

  /** Open two-way audio from device → phone. */
  startTalk(): Promise<void>;

  /** Close two-way audio. */
  stopTalk(): Promise<void>;

  /**
   * Switch stream quality.
   * @param mediaType 1 = main stream (HD), 2 = sub stream (SD)
   */
  setQuality(mediaType: 1 | 2): Promise<void>;

  /**
   * Subscribe to stream events.
   * @returns an unsubscribe function — call it to clean up.
   */
  addListener(cb: (e: StreamEvent) => void): () => void;
}

/**
 * Phase-1 stub exported for web / JS environments where the native LibCore
 * module is not yet available.  Most methods no-op; `start` throws so callers
 * know they cannot actually stream from this environment.
 */
export const libCoreBridge: LibCoreBridge = {
  async start() {
    throw new Error('LibCore native module not available on this platform yet');
  },
  async stop() {},
  async seek() {},
  async startTalk() {},
  async stopTalk() {},
  async setQuality() {},
  addListener() {
    return () => {};
  },
};
