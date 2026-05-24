async function pingOnce(port, { timeoutMs, host, protocol }) {
  const url = `${protocol}://${host}:${port}/`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  const start = performance.now();
  try {
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'follow',
    });
    return {
      alive: true,
      latency: Math.round(performance.now() - start),
      protocol,
    };
  } catch (e) {
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
    timeoutMs: 2000,
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
    const res = await fetch(url, { signal: controller.signal });
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
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-store',
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function faviconUrl(port, protocol = 'http') {
  return `${protocol}://localhost:${port}/favicon.ico`;
}
