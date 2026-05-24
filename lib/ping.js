// Keep this dead simple: a bare fetch with just an abort signal.
// Adding mode/credentials/cache options has caused some Chrome versions
// to reject extension fetches to localhost. Bare fetch works the same way
// a normal browser-tab fetch does.

async function pingOnce(port, { timeoutMs, host, protocol }) {
  const url = `${protocol}://${host}:${port}/`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  const start = performance.now();
  try {
    await fetch(url, { signal: controller.signal });
    return {
      alive: true,
      latency: Math.round(performance.now() - start),
      protocol,
      host,
    };
  } catch (e) {
    return {
      alive: false,
      latency: null,
      error: e?.name || 'error',
      protocol,
      host,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function pingPort(port, options = {}) {
  const opts = { timeoutMs: 3000, ...options };

  // Try the most common locations in parallel; first success wins.
  const attempts = [
    pingOnce(port, { ...opts, host: 'localhost',  protocol: 'http' }),
    pingOnce(port, { ...opts, host: '127.0.0.1',  protocol: 'http' }),
    pingOnce(port, { ...opts, host: '[::1]',      protocol: 'http' }),
    pingOnce(port, { ...opts, host: 'localhost',  protocol: 'https' }),
  ];

  return new Promise((resolve) => {
    let pending = attempts.length;
    let lastResult = null;
    attempts.forEach((p) => {
      p.then((res) => {
        if (res.alive) {
          resolve(res);
        } else {
          lastResult = res;
        }
      }).catch(() => {}).finally(() => {
        pending--;
        if (pending === 0) {
          resolve(lastResult || { alive: false, error: 'unreachable' });
        }
      });
    });
  });
}

export async function fetchTitle(port, { timeoutMs = 3000, protocol = 'http', host = 'localhost' } = {}) {
  const url = `${protocol}://${host}:${port}/`;
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

export async function checkFavicon(port, { timeoutMs = 1500, protocol = 'http', host = 'localhost' } = {}) {
  const url = `${protocol}://${host}:${port}/favicon.ico`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
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
