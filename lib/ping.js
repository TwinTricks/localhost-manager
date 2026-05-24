// Minimal ping — matches the exact fetch shape that worked in the user's
// console test: bare fetch(url), no options. One attempt per host.

async function pingHostOnce(port, host, protocol, timeoutMs) {
  const url = `${protocol}://${host}:${port}/`;
  const start = performance.now();

  // Race the fetch against a timeout — but using Promise.race rather than
  // AbortController, because passing a signal seems to interact badly with
  // Chrome's extension fetch path on some setups.
  const fetchPromise = (async () => {
    try {
      await fetch(url);
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
        error: e?.name || e?.message || String(e) || 'fetch-error',
        protocol,
        host,
      };
    }
  })();

  const timeoutPromise = new Promise((resolve) =>
    setTimeout(() => resolve({
      alive: false,
      latency: null,
      error: 'timeout',
      protocol,
      host,
    }), timeoutMs)
  );

  return Promise.race([fetchPromise, timeoutPromise]);
}

export async function pingPort(port, options = {}) {
  const timeoutMs = options.timeoutMs ?? 3000;

  // Try localhost first (matches what the browser tab does), then 127.0.0.1.
  // Sequential, not parallel, to keep connection count low.
  const r1 = await pingHostOnce(port, 'localhost', 'http', timeoutMs);
  if (r1.alive) return r1;

  const r2 = await pingHostOnce(port, '127.0.0.1', 'http', timeoutMs);
  if (r2.alive) return r2;

  const r3 = await pingHostOnce(port, 'localhost', 'https', timeoutMs);
  if (r3.alive) return r3;

  return r1; // return the first (most representative) failure
}

export async function fetchTitle(port, { timeoutMs = 3000, protocol = 'http', host = 'localhost' } = {}) {
  const url = `${protocol}://${host}:${port}/`;
  const fetchPromise = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const text = await res.text();
      const match = text.match(/<title[^>]*>([^<]*)<\/title>/i);
      return match ? match[1].trim().slice(0, 80) : null;
    } catch {
      return null;
    }
  })();
  const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs));
  return Promise.race([fetchPromise, timeoutPromise]);
}

export async function checkFavicon(port, { timeoutMs = 1500, protocol = 'http', host = 'localhost' } = {}) {
  const url = `${protocol}://${host}:${port}/favicon.ico`;
  const fetchPromise = (async () => {
    try {
      const res = await fetch(url);
      return res.ok;
    } catch {
      return false;
    }
  })();
  const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), timeoutMs));
  return Promise.race([fetchPromise, timeoutPromise]);
}

export function faviconUrl(port, protocol = 'http') {
  return `${protocol}://localhost:${port}/favicon.ico`;
}
