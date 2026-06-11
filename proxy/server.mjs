/**
 * proxy/server.mjs
 *
 * Minimal CORS proxy for the Zmodo/IOTEK web preview.
 *
 * Purpose: the browser cannot call the IOTEK backend directly because of CORS
 * restrictions. This proxy runs locally (or on any Node 20+ host), accepts the
 * same request the app would send, forwards it to the real backend, and returns
 * the response with permissive CORS headers so the browser accepts it.
 *
 * Usage:
 *   node proxy/server.mjs          # listens on PORT (default 8787)
 *   PORT=9000 node proxy/server.mjs
 *
 * The web app should be started with:
 *   EXPO_PUBLIC_API_PROXY=http://localhost:8787/ npx expo start --web
 *
 * Security: requests are only forwarded to hosts ending with .iotek.ai or
 * .myzmodo.com. All other targets are rejected with 403. This prevents the
 * proxy from acting as an open relay.
 */

import http from 'node:http';
import { URL } from 'node:url';

const PORT = process.env.PORT || 8787;

// ---------------------------------------------------------------------------
// Whitelist: only forward to these host suffixes
// ---------------------------------------------------------------------------
const ALLOWED_SUFFIXES = ['.iotek.ai', '.myzmodo.com'];

/**
 * Returns true if the hostname is whitelisted.
 * Exported so it can be unit-tested without starting the server.
 */
export function isAllowedHost(hostname) {
  return ALLOWED_SUFFIXES.some(
    (suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix),
  );
}

// ---------------------------------------------------------------------------
// CORS headers added to every response
// ---------------------------------------------------------------------------
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------
async function handleRequest(req, res) {
  // --- CORS preflight ---
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // --- Parse query string to get the target URL ---
  // The app sends:  GET/POST http://proxy/?url=<encoded target>
  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
  const target = reqUrl.searchParams.get('url');

  if (!target) {
    res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ error: 'Missing "url" query parameter' }));
    return;
  }

  // --- SSRF guard: parse and whitelist the target host ---
  let parsedTarget;
  try {
    parsedTarget = new URL(target);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ error: 'Invalid target URL' }));
    return;
  }

  if (!isAllowedHost(parsedTarget.hostname)) {
    res.writeHead(403, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(
      JSON.stringify({
        error: `Forbidden: host "${parsedTarget.hostname}" is not in the proxy whitelist`,
      }),
    );
    return;
  }

  // --- Collect the incoming request body ---
  const bodyChunks = [];
  for await (const chunk of req) {
    bodyChunks.push(chunk);
  }
  const bodyBuffer = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : undefined;

  // --- Build the forwarded fetch options ---
  const fetchOptions = {
    method: req.method,
    // Only forward Content-Type; avoid leaking other browser/proxy headers
    headers: {},
    // body is only valid for methods that carry a payload
    ...(bodyBuffer && bodyBuffer.length > 0 ? { body: bodyBuffer } : {}),
  };

  if (req.headers['content-type']) {
    fetchOptions.headers['Content-Type'] = req.headers['content-type'];
  }

  // --- Forward the request to the real backend ---
  let upstreamRes;
  try {
    upstreamRes = await fetch(target, fetchOptions);
  } catch (err) {
    console.error('[proxy] upstream network error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ error: 'Upstream network error', detail: err.message }));
    return;
  }

  // --- Relay the response ---
  const upstreamContentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';

  const responseHeaders = {
    ...CORS_HEADERS,
    'Content-Type': upstreamContentType,
  };

  res.writeHead(upstreamRes.status, responseHeaders);

  // Log after we have the status
  console.log(
    `[proxy] ${req.method} ${parsedTarget.hostname}${parsedTarget.pathname} → ${upstreamRes.status}`,
  );

  // Stream the upstream body back to the client
  const upstreamBody = await upstreamRes.arrayBuffer();
  res.end(Buffer.from(upstreamBody));
}

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------
const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error('[proxy] unhandled error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({ error: 'Internal proxy error' }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`[proxy] CORS proxy listening on http://localhost:${PORT}/`);
  console.log(`[proxy] Whitelisted hosts: ${ALLOWED_SUFFIXES.join(', ')}`);
});
