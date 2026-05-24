// Minimal ping — matches the exact fetch shape that worked in the user's
// console test: bare fetch(url), no options. One attempt per host.

// SINGLE bare fetch with manual timeout race. Just one host (localhost http).
// This matches the exact shape that succeeds in the SW console:
//   fetch('http://localhost:3000/').then(r => r.status)
//
// Logging is intentionally verbose during the debug phase so the user can
// open the service-worker console and see what's actually happening.
async function pingHostOnce(port, host, protocol, timeoutMs) {
  const url = `${protocol}://${host}:${port}/`;
  const start = performance.now();
  console.log(`[ping] → ${url} (timeout ${timeoutMs}ms)`);

  return new Promise((resolve) => {
    let done = false;
    const settle = (result) => {
      if (done) return;
      done = true;
      console.log(`[ping] ← ${url} ${result.alive ? '✅ ALIVE ' + result.latency + 'ms' : '❌ ' + result.error}`);
      resolve(result);
    };

    const tid = setTimeout(() => {
      settle({ alive: false, latency: null, error: 'timeout', protocol, host });
    }, timeoutMs);

    fetch(url)
      .then((res) => {
        clearTimeout(tid);
        settle({
          alive: true,
          latency: Math.round(performance.now() - start),
          protocol,
          host,
          status: res.status,
        });
      })
      .catch((e) => {
        clearTimeout(tid);
        settle({
          alive: false,
          latency: null,
          error: e?.name || e?.message || String(e) || 'fetch-error',
          protocol,
          host,
        });
      });
  });
}

export async function pingPort(port, options = {}) {
  const timeoutMs = options.timeoutMs ?? 3000;
  // Just one attempt: localhost http. Keep it simple — fewer connections,
  // faster results, easier to debug.
  return pingHostOnce(port, 'localhost', 'http', timeoutMs);
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
