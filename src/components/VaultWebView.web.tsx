import React from 'react';

export interface VaultWebViewProps {
  uri: string;
}

export function VaultWebView({ uri }: VaultWebViewProps) {
  return React.createElement('iframe', {
    src: uri,
    title: 'Vault',
    style: { border: 0, width: '100%', height: '100%' },
  });
}
