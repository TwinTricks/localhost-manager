import { browserAPI } from './lib/browser.js';
import {
  getProjects, saveProjects,
  getSettings, saveSettings, DEFAULT_SETTINGS,
  getStorageUsageBytes,
  newProjectId,
} from './lib/storage.js';

const $ = (id) => document.getElementById(id);

const els = {
  theme: $('theme'),
  pingInterval: $('ping-interval'),
  pingTimeout: $('ping-timeout'),
  autoPing: $('auto-ping'),
  exportBtn: $('export-btn'),
  importBtn: $('import-btn'),
  importFile: $('import-file'),
  importResult: $('import-result'),
  resetBtn: $('reset-btn'),
  wipeBtn: $('wipe-btn'),
  statCount: $('stat-count'),
  statBytes: $('stat-bytes'),
  toast: $('toast'),
};

function applyTheme(theme) {
  document.body.classList.remove('theme-light', 'theme-dark', 'theme-system');
  document.body.classList.add(`theme-${theme}`);
}

function toast(msg, ms = 2200) {
  els.toast.textContent = msg;
  els.toast.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.add('hidden'), ms);
}

function formatBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

async function refreshStats() {
  const projects = await getProjects();
  const bytes = await getStorageUsageBytes();
  els.statCount.textContent = projects.length;
  els.statBytes.textContent = formatBytes(bytes);
}

async function loadSettings() {
  const s = await getSettings();
  applyTheme(s.theme);
  els.theme.value = s.theme;
  els.pingInterval.value = s.pingIntervalSeconds;
  els.pingTimeout.value = s.pingTimeoutMs;
  els.autoPing.checked = !!s.autoPingOnPopupOpen;
}

async function persistSettings() {
  const interval = Math.max(30, Math.min(600, Number(els.pingInterval.value) || 30));
  const timeout = Math.max(500, Math.min(10000, Number(els.pingTimeout.value) || 2000));
  const settings = {
    theme: els.theme.value,
    pingIntervalSeconds: interval,
    pingTimeoutMs: timeout,
    autoPingOnPopupOpen: els.autoPing.checked,
  };
  await saveSettings(settings);
  applyTheme(settings.theme);
  els.pingInterval.value = interval;
  els.pingTimeout.value = timeout;
}

els.theme.addEventListener('change', async () => {
  await persistSettings();
  toast('Settings saved');
});

[els.pingInterval, els.pingTimeout].forEach((el) =>
  el.addEventListener('change', async () => {
    await persistSettings();
    toast('Settings saved');
  })
);

els.autoPing.addEventListener('change', async () => {
  await persistSettings();
});

// Export
els.exportBtn.addEventListener('click', async () => {
  const projects = await getProjects();
  const settings = await getSettings();
  const payload = {
    app: 'localhost-manager',
    version: 1,
    exportedAt: new Date().toISOString(),
    projects,
    settings,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `localhost-manager-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Exported');
});

// Import
els.importBtn.addEventListener('click', () => els.importFile.click());

els.importFile.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  els.importFile.value = '';

  if (file.size > 5 * 1024 * 1024) {
    toast('File too large (max 5MB)');
    return;
  }

  let data;
  try {
    const text = await file.text();
    data = JSON.parse(text);
  } catch {
    els.importResult.textContent = '✗ Invalid JSON file.';
    return;
  }

  if (!data || data.app !== 'localhost-manager' || !Array.isArray(data.projects)) {
    els.importResult.textContent = '✗ File is not a Localhost Manager export.';
    return;
  }

  const valid = data.projects.filter(
    (p) => p && typeof p.name === 'string'
        && Number.isInteger(p.port) && p.port >= 1 && p.port <= 65535
  );

  if (valid.length === 0) {
    els.importResult.textContent = '✗ No valid projects found in file.';
    return;
  }

  const existing = await getProjects();
  const existingKeys = new Set(existing.map((p) => `${p.name.toLowerCase()}|${p.port}|${p.path || ''}`));
  const merged = [...existing];
  let added = 0, skipped = 0;
  for (const p of valid) {
    const key = `${p.name.toLowerCase()}|${p.port}|${p.path || ''}`;
    if (existingKeys.has(key)) { skipped++; continue; }
    merged.push({
      id: newProjectId(),
      name: String(p.name).slice(0, 50),
      port: p.port,
      path: typeof p.path === 'string' ? p.path.slice(0, 200) : '',
      createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
    });
    added++;
  }
  await saveProjects(merged);
  els.importResult.textContent = `✓ Imported ${added} project(s), skipped ${skipped} duplicate(s).`;
  refreshStats();
  toast('Import complete');
});

// Reset
els.resetBtn.addEventListener('click', async () => {
  if (!confirm('Reset all settings to defaults? Your projects will be kept.')) return;
  await saveSettings({ ...DEFAULT_SETTINGS });
  await loadSettings();
  toast('Settings reset');
});

els.wipeBtn.addEventListener('click', async () => {
  if (!confirm('Delete ALL projects? This cannot be undone.')) return;
  if (!confirm('Are you absolutely sure? Type-yes-in-your-head and click OK.')) return;
  await saveProjects([]);
  await refreshStats();
  toast('All projects deleted');
});

// React to external changes
browserAPI.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.projects || changes.settings)) {
    refreshStats();
  }
});

loadSettings();
refreshStats();
