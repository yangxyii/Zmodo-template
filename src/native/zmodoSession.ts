/**
 * zmodoSession.ts — web/jest no-op stub.
 *
 * On web and in Jest the native LibCore module is not available.
 * This file is the fallback when .native.ts is not selected by Metro/jest.
 */
import type { ConnectServerParams } from '../api/auth';

/**
 * No-op on web/jest — the access-server connect only matters on native iOS
 * where LibCore's TRANSFER relay requires authentication.
 */
export async function connectServer(_params: ConnectServerParams): Promise<void> {
  // no-op on web
}
