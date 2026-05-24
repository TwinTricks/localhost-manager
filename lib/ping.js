// Final simplification: bare fetch + AbortController with .abort() (no arg).
// .abort() produces a proper DOMException AbortError with .name === 'AbortError'.
// .abort('timeout') (which I used earlier) produced a string error with no .name.
//
// Matches the EXACT shape that works in the user's manual SW-console fetch:
//   fetch('http://127.0.0.1:3000/').then(r => r.status)

export async function pingPort(port, options = {}) {
  const timeoutMs = options.timeoutMs ?? 5000;
  const url = `http://127.0.0.1:${port}/`;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  console.log(`[ping] → ${url} (timeout ${timeoutMs}ms)`);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const latency = Math.round(performance.now() - start);
    console.log(`[ping] ← ${url} ✅ ALIVE ${latency}ms (status ${res.status})`);
    return {
      alive: true,
      latency,
      protocol: 'http',
      host: '127.0.0.1',
      status: res.status,
    };
  } catch (e) {
    const ms = Math.round(performance.now() - start);
    const errName = e?.name || (typeof e === 'string' ? e : 'error');
    console.log(`[ping] ← ${url} ❌ ${errName} (after ${ms}ms)`);
    return {
      alive: false,
      latency: null,
      error: errName,
      protocol: 'http',
      host: '127.0.0.1',
    };
  } finally {
    clearTimeout(tid);
  }
}

export async function fetchTitle(port, { timeoutMs = 3000 } = {}) {
  const url = `http://127.0.0.1:${port}/`;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match ? match[1].trim().slice(0, 80) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(tid);
  }
}

export async function checkFavicon(port, { timeoutMs = 1500 } = {}) {
  const url = `http://127.0.0.1:${port}/favicon.ico`;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(tid);
  }
}

export function faviconUrl(port, protocol = 'http') {
  return `${protocol}://127.0.0.1:${port}/favicon.ico`;
}
