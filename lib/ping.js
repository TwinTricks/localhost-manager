// Why this is more complex than it looks:
//
// Chrome's Private Network Access can hang fetches from chrome-extension://
// pages to http://localhost — the preflight times out instead of failing
// fast. We work around it by:
//   1. Trying 127.0.0.1 BEFORE localhost (IPv6 resolution of "localhost"
//      can hang while 127.0.0.1 is unambiguous IPv4).
//   2. Racing http and https attempts in parallel so a slow one doesn't
//      block a fast one.
//   3. Using cors mode (extension host_permissions bypass the CORS check
//      anyway) — this avoids the no-cors PNA preflight quirk.
//   4. Treating ANY response (including 4xx/5xx) as "alive" — server
//      is reachable, that's all we want to know.

async function pingOnce(port, { timeoutMs, host, protocol }) {
  const url = `${protocol}://${host}:${port}/?__lm=${Date.now()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  const start = performance.now();
  try {
    await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'follow',
    });
    return {
      alive: true,
      latency: Math.round(performance.now() - start),
      protocol,
      host,
    };
  } catch (e) {
    // CORS error in cors mode still means the server responded.
    // We can't tell CORS error from network failure from the error alone,
    // so we try a no-cors fallback — fast if the server is alive.
    if (e?.name !== 'AbortError') {
      const fbController = new AbortController();
      const fbTimer = setTimeout(() => fbController.abort('timeout'), Math.min(1200, timeoutMs));
      const fbStart = performance.now();
      try {
        await fetch(url, {
          method: 'GET',
          mode: 'no-cors',
          credentials: 'omit',
          signal: fbController.signal,
          cache: 'no-store',
        });
        return {
          alive: true,
          latency: Math.round(performance.now() - fbStart),
          protocol,
          host,
        };
      } catch {
        // both modes failed
      } finally {
        clearTimeout(fbTimer);
      }
    }
    return { alive: false, latency: null, error: e?.name || 'error', protocol, host };
  } finally {
    clearTimeout(timer);
  }
}

export async function pingPort(port, options = {}) {
  const opts = { timeoutMs: 3000, ...options };

  // Race multiple host/protocol combos in parallel. Cover:
  //   - 127.0.0.1 (IPv4)
  //   - [::1]     (IPv6, bracketed for fetch URL syntax)
  //   - localhost (whatever the SW resolver returns first)
  // Modern Node.js dev servers (Next.js, Vite ~5) bind only to IPv6 ::1
  // by default — so we MUST try IPv6 too.
  const attempts = [
    pingOnce(port, { ...opts, host: '127.0.0.1', protocol: 'http' }),
    pingOnce(port, { ...opts, host: '[::1]',      protocol: 'http' }),
    pingOnce(port, { ...opts, host: 'localhost',  protocol: 'http' }),
    pingOnce(port, { ...opts, host: '127.0.0.1', protocol: 'https' }),
    pingOnce(port, { ...opts, host: '[::1]',      protocol: 'https' }),
    pingOnce(port, { ...opts, host: 'localhost',  protocol: 'https' }),
  ];

  // First successful one wins; if all fail we'll resolve below
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

export async function checkFavicon(port, { timeoutMs = 1500, protocol = 'http', host = 'localhost' } = {}) {
  const url = `${protocol}://${host}:${port}/favicon.ico`;
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
