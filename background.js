import { browserAPI } from './lib/browser.js';
import { getProjects, getSettings, setStatus, clearStatusForId } from './lib/storage.js';
import { pingPort, fetchTitle, checkFavicon } from './lib/ping.js';

const ALARM_NAME = 'lm-ping-cycle';

async function setupAlarm() {
  const settings = await getSettings();
  const periodInMinutes = Math.max(0.5, settings.pingIntervalSeconds / 60);
  await browserAPI.alarms.clear(ALARM_NAME);
  await browserAPI.alarms.create(ALARM_NAME, { periodInMinutes });
}

async function enrichAlive(port, protocol) {
  // Run both in parallel; both may individually fail (CORS, etc.) — degrade silently.
  const [hasFavicon, title] = await Promise.all([
    checkFavicon(port, { protocol, timeoutMs: 1500 }).catch(() => false),
    fetchTitle(port, { protocol, timeoutMs: 1500 }).catch(() => null),
  ]);
  return { hasFavicon, title };
}

async function updateBadge(aliveCount) {
  try {
    if (aliveCount <= 0) {
      await browserAPI.action.setBadgeText({ text: '' });
      return;
    }
    const text = aliveCount > 9 ? '9+' : String(aliveCount);
    await browserAPI.action.setBadgeText({ text });
    await browserAPI.action.setBadgeBackgroundColor({
      color: aliveCount > 0 ? '#22c55e' : '#9ca3af',
    });
  } catch (e) {
    console.warn('[badge] failed', e);
  }
}

async function pingAll() {
  const [projects, settings] = await Promise.all([getProjects(), getSettings()]);
  console.log(`[pingAll] starting, ${projects.length} projects`);
  const results = [];
  // Sequential: parallel fetches to localhost seem to hit some kind of
  // SW connection/throttling issue. Sequential one-at-a-time works reliably.
  for (const p of projects) {
    const res = await pingPort(p.port, { timeoutMs: settings.pingTimeoutMs });
    let extras = { hasFavicon: false, title: null };
    if (res.alive) {
      extras = await enrichAlive(p.port, res.protocol || 'http');
    }
    const status = { ...res, ...extras, checkedAt: Date.now() };
    await setStatus(p.id, status);
    results.push({ id: p.id, ...status });
  }
  const aliveCount = results.filter((r) => r.alive).length;
  console.log(`[pingAll] done, ${aliveCount} alive of ${projects.length}`);
  await updateBadge(aliveCount);
  return results;
}

async function pruneOrphanStatuses() {
  try {
    const projects = await getProjects();
    const validIds = new Set(projects.map((p) => p.id));
    const cache = (await browserAPI.storage.session.get('status')).status || {};
    let changed = false;
    for (const id of Object.keys(cache)) {
      if (!validIds.has(id)) {
        delete cache[id];
        changed = true;
      }
    }
    if (changed) await browserAPI.storage.session.set({ status: cache });
  } catch {}
}

browserAPI.runtime.onInstalled.addListener(async () => {
  await setupAlarm();
});

browserAPI.runtime.onStartup.addListener(async () => {
  await setupAlarm();
});

browserAPI.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    try {
      await pruneOrphanStatuses();
      await pingAll();
    } catch (e) {
      console.warn('[alarm] cycle failed', e);
    }
  }
});

browserAPI.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'local' && changes.settings) {
    await setupAlarm();
  }
});

browserAPI.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'ping-all') {
    pingAll().then((results) => sendResponse({ ok: true, results }))
             .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
  if (msg?.type === 'ping-one') {
    (async () => {
      try {
        const settings = await getSettings();
        const res = await pingPort(msg.port, { timeoutMs: settings.pingTimeoutMs });
        let extras = { hasFavicon: false, title: null };
        if (res.alive) {
          extras = await enrichAlive(msg.port, res.protocol || 'http');
        }
        const status = { ...res, ...extras, checkedAt: Date.now() };
        if (msg.id) await setStatus(msg.id, status);
        sendResponse({ ok: true, status });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true;
  }
  if (msg?.type === 'project-deleted' && msg.id) {
    clearStatusForId(msg.id).finally(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});
