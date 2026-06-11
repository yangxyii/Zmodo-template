# Zmodo CORS Proxy

A minimal Node.js HTTP proxy that adds permissive CORS headers so the Expo web preview can reach the real IOTEK backend from the browser.

## Why is this needed?

Browsers enforce the Same-Origin Policy. The IOTEK API servers (`*.iotek.ai`) do not return `Access-Control-Allow-Origin` headers, so any `fetch()` call from the web app is blocked. Running this proxy locally resolves that: the app talks to `localhost` (same origin, or a host you control), and the proxy forwards the request to IOTEK with the CORS headers added on the way back.

## How to run

### 1. Start the proxy

```bash
# Default port 8787
node proxy/server.mjs

# Or specify a custom port
PORT=9000 node proxy/server.mjs
```

The proxy will log each forwarded request to stdout:

```
[proxy] CORS proxy listening on http://localhost:8787/
[proxy] Whitelisted hosts: .iotek.ai, .myzmodo.com
[proxy] POST 11-app-mop.iotek.ai /user/user_login → 200
```

### 2. Start the web app with the proxy URL

```bash
EXPO_PUBLIC_API_PROXY=http://localhost:8787/ npx expo start --web
```

Or add it to your `.env` file (which is gitignored):

```
EXPO_PUBLIC_API_PROXY=http://localhost:8787/
```

Then run the app normally:

```bash
npx expo start --web
```

## How the proxy works

The app's API layer (`src/api/http.ts`) builds URLs like:

```
http://localhost:8787/?url=https%3A%2F%2F11-app-mop.iotek.ai%2Fuser%2Fuser_login
```

The proxy:
1. Reads the `url` query parameter (the full IOTEK URL).
2. Checks the target hostname against a whitelist — only hosts ending with `.iotek.ai` or `.myzmodo.com` are allowed.
3. Forwards the request (same HTTP method, `Content-Type` header, and body).
4. Returns the upstream response with `Access-Control-Allow-Origin: *` added so the browser accepts it.
5. Handles CORS preflight (`OPTIONS`) requests with a `204` response.

## Security: SSRF whitelist

The proxy will refuse to forward requests to any host **not** ending with `.iotek.ai` or `.myzmodo.com`. This prevents it from being used as an open relay to reach internal network resources or arbitrary internet hosts.

Requests to non-whitelisted targets receive a `403 Forbidden` JSON response.

## Important notes

- **Development / preview only** — this proxy is intentionally simple and not hardened for production. Do not expose it on a public network or use it as a general-purpose proxy.
- **No authentication** — add network-level access controls (firewall, VPN) if you need to restrict who can use it.
- **Node 20+** is required (uses global `fetch` and `for await...of` on the request stream).
- The proxy does **not** need to be installed into the main project; it has **no npm dependencies** and runs directly with `node`.
