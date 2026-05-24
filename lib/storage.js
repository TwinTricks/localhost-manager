import { browserAPI } from './browser.js';

const PROJECTS_KEY = 'projects';
const SETTINGS_KEY = 'settings';
const DRAFT_KEY = 'form-draft';
const STATUS_KEY = 'status';
const BANNER_DISMISSED_KEY = 'banner-dismissed';

export const VALID_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'];
export const VALID_SORTS = ['manual', 'recent', 'name', 'port'];

export const DEFAULT_SETTINGS = Object.freeze({
  pingIntervalSeconds: 30,
  pingTimeoutMs: 2000,
  theme: 'system',
  autoPingOnPopupOpen: true,
  sortMode: 'manual',
});

function isValidProject(p) {
  return p
    && typeof p === 'object'
    && typeof p.id === 'string'
    && typeof p.name === 'string'
    && Number.isInteger(p.port)
    && p.port >= 1 && p.port <= 65535;
}

function migrateProject(p) {
  return {
    id: p.id,
    name: p.name,
    port: p.port,
    path: typeof p.path === 'string' ? p.path : '',
    createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
    pinned: typeof p.pinned === 'boolean' ? p.pinned : false,
    color: (typeof p.color === 'string' && VALID_COLORS.includes(p.color)) ? p.color : null,
    lastOpenedAt: typeof p.lastOpenedAt === 'number' ? p.lastOpenedAt : null,
  };
}

export async function getProjects() {
  try {
    const res = await browserAPI.storage.local.get(PROJECTS_KEY);
    const list = res[PROJECTS_KEY];
    if (!Array.isArray(list)) return [];
    return list.filter(isValidProject).map(migrateProject);
  } catch (e) {
    console.error('[storage] read projects failed', e);
    return [];
  }
}

export async function saveProjects(projects) {
  await browserAPI.storage.local.set({ [PROJECTS_KEY]: projects });
}

export async function getSettings() {
  try {
    const res = await browserAPI.storage.local.get(SETTINGS_KEY);
    const merged = { ...DEFAULT_SETTINGS, ...(res[SETTINGS_KEY] || {}) };
    if (!VALID_SORTS.includes(merged.sortMode)) merged.sortMode = 'manual';
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings) {
  await browserAPI.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function getDraft() {
  try {
    const res = await browserAPI.storage.session.get(DRAFT_KEY);
    return res[DRAFT_KEY] || null;
  } catch {
    return null;
  }
}

export async function saveDraft(draft) {
  try {
    if (draft === null) {
      await browserAPI.storage.session.remove(DRAFT_KEY);
    } else {
      await browserAPI.storage.session.set({ [DRAFT_KEY]: draft });
    }
  } catch (e) {
    console.warn('[storage] draft save failed', e);
  }
}

export async function getStatusCache() {
  try {
    const res = await browserAPI.storage.session.get(STATUS_KEY);
    return res[STATUS_KEY] || {};
  } catch {
    return {};
  }
}

export async function setStatus(projectId, status) {
  try {
    const cache = await getStatusCache();
    cache[projectId] = status;
    await browserAPI.storage.session.set({ [STATUS_KEY]: cache });
  } catch (e) {
    console.warn('[storage] status save failed', e);
  }
}

export async function clearStatusForId(projectId) {
  try {
    const cache = await getStatusCache();
    delete cache[projectId];
    await browserAPI.storage.session.set({ [STATUS_KEY]: cache });
  } catch {}
}

export async function getStorageUsageBytes() {
  try {
    return await browserAPI.storage.local.getBytesInUse(null);
  } catch {
    return 0;
  }
}

export async function getDismissedBanners() {
  try {
    const res = await browserAPI.storage.session.get(BANNER_DISMISSED_KEY);
    const v = res[BANNER_DISMISSED_KEY];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export async function dismissBanner(key) {
  try {
    const list = await getDismissedBanners();
    if (!list.includes(key)) {
      list.push(key);
      await browserAPI.storage.session.set({ [BANNER_DISMISSED_KEY]: list });
    }
  } catch {}
}

export function newProjectId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
