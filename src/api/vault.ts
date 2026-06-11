import { hostFor } from './hostStore';

const DEFAULT_VDR_WEB = 'https://storage.meshare.com';

export function vaultWebUrl(token: string, language = 'en'): string {
  let base = hostFor('vdr_web_address');
  if (!base || !/vdr|storage/i.test(base)) base = DEFAULT_VDR_WEB;
  return `${base}/zmd?token=${encodeURIComponent(token)}&language=${encodeURIComponent(language)}`;
}
