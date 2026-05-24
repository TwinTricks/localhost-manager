// Try `cors` mode first because Chrome's Private Network Access blocks
// no-cors fetches to private addresses (localhost/127.0.0.1) on a preflight
// that the server never answers — the fetch then hangs until our timeout.
// With cors mode + host_permissions, the request goes through directly.
async function pingOnce(port, { timeoutMs, host, protocol }) {
  const url = `${protocol}://${host}:${port}/?__lm=${Date.now()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'follow',
    });
    // Any HTTP response (even 4xx/5xx) means the server is alive.
    return {
      alive: true,
      latency: Math.round(performance.now() - start),
      protocol,
      status: res.status,
    };
  } catch (e) {
    // TypeError "Failed to fetch" can mean: server down, CORS error, network refused.
    // For unreachable servers we get a fast TypeError; for CORS we ALSO get TypeError
    // but only AFTER the server responded. Distinguishing requires reading the wire.
    // Fall back to a no-cors GET — it bypasses CORS entirely. If it succeeds quickly,
    // the server is alive (just CORS-restricted).
    if (e?.name !== 'AbortError') {
      try {
        const fallbackController = new AbortController();
        const fallbackTimer = setTimeout(() => fallbackController.abort('timeout'), Math.min(1500, timeoutMs));
        const fbStart = performance.now();
        try {
          await fetch(url, {
            method: 'GET',
            mode: 'no-cors',
            credentials: 'omit',
            signal: fallbackController.signal,
            cache: 'no-store',
          });
          return {
            alive: true,
            latency: Math.round(performance.now() - fbStart),
            protocol,
          };
        } finally {
          clearTimeout(fallbackTimer);
        }
      } catch {
        // both modes failed — server is genuinely unreachable
      }
    }
    return {
      alive: false,
      latency: null,
      error: e?.name || 'error',
      protocol,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function pingPort(port, options = {}) {
  const opts = {
    timeoutMs: 3000,
    host: 'localhost',
    ...options,
  };

  const http = await pingOnce(port, { ...opts, protocol: 'http' });
  if (http.alive) return http;

  const https = await pingOnce(port, { ...opts, protocol: 'https' });
  if (https.alive) return https;

  return { ...http, error: http.error || 'unreachable' };
}

export async function fetchTitle(port, { timeoutMs = 3000, protocol = 'http' } = {}) {
  const url = `${protocol}://localhost:${port}/`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
    });
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match ? match[1].trim().slice(0, 80) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function checkFavicon(port, { timeoutMs = 1500, protocol = 'http' } = {}) {
  const url = `${protocol}://localhost:${port}/favicon.ico`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal,
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function faviconUrl(port, protocol = 'http') {
  return `${protocol}://localhost:${port}/favicon.ico`;
}
