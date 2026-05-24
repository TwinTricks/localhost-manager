import { browserAPI } from './lib/browser.js';
import {
  getProjects, saveProjects,
  getSettings, saveSettings,
  getDraft, saveDraft,
  getStatusCache,
  newProjectId,
  getDismissedBanners, dismissBanner,
  VALID_COLORS, VALID_SORTS,
} from './lib/storage.js';
import { faviconUrl } from './lib/ping.js';
import { applyIcons } from './lib/icons.js';

const $ = (id) => document.getElementById(id);
const els = {
  list: $('list'),
  empty: $('empty-state'),
  noResults: $('no-results'),
  search: $('search'),
  searchClear: $('search-clear'),
  refresh: $('refresh-btn'),
  theme: $('theme-btn'),
  settings: $('settings-btn'),
  openAll: $('open-all-btn'),
  sortBtn: $('sort-btn'),
  sortMenu: $('sort-menu'),
  addBtn: $('add-btn'),
  form: $('add-form'),
  formTitle: $('form-title'),
  fName: $('f-name'),
  fPort: $('f-port'),
  fPath: $('f-path'),
  fSave: $('f-save'),
  fCancel: $('f-cancel'),
  formWarning: $('form-warning'),
  formError: $('form-error'),
  toast: $('toast'),
  toastText: $('toast-text'),
  toastAction: $('toast-action'),
  rowTpl: $('project-row-tpl'),
  colorFilters: $('color-filters'),
  banner: $('quick-add-banner'),
  bannerUrl: $('banner-url'),
  bannerAdd: $('banner-add'),
  bannerDismiss: $('banner-dismiss'),
};

const state = {
  projects: [],
  statuses: {},
  settings: null,
  editingId: null,
  searchQuery: '',
  openMenuId: null,
  sortMenuOpen: false,
  colorFilter: null,
  pendingDelete: null, // { project, index, timer }
  quickAddPort: null,
  quickAddPath: '',
};

// ---------- Helpers ----------

function applyTheme(theme) {
  document.body.classList.remove('theme-light', 'theme-dark', 'theme-system');
  document.body.classList.add(`theme-${theme}`);
}

function showToast(message, { actionLabel = null, onAction = null, ms = 2000 } = {}) {
  els.toastText.textContent = message;
  els.toast.classList.remove('hidden');
  clearTimeout(showToast._t);

  if (actionLabel && onAction) {
    els.toastAction.textContent = actionLabel;
    els.toastAction.classList.remove('hidden');
    els.toastAction.onclick = () => {
      els.toast.classList.add('hidden');
      clearTimeout(showToast._t);
      try { onAction(); } catch (e) { console.warn(e); }
    };
  } else {
    els.toastAction.classList.add('hidden');
    els.toastAction.onclick = null;
  }

  showToast._t = setTimeout(() => {
    els.toast.classList.add('hidden');
    els.toastAction.onclick = null;
  }, ms);
}

function buildUrl(p) {
  const protocol = state.statuses[p.id]?.protocol || 'http';
  const path = p.path || '';
  return `${protocol}://localhost:${p.port}${path}`;
}

function findProject(id) {
  return state.projects.find((p) => p.id === id);
}

// ---------- Sorting / filtering ----------

function sortedProjects(projects) {
  // Always pinned first, regardless of sort mode (within group, apply sort).
  const sortMode = state.settings?.sortMode || 'manual';
  const sortFn = (a, b) => {
    if (sortMode === 'name') return a.name.localeCompare(b.name);
    if (sortMode === 'port') return a.port - b.port;
    if (sortMode === 'recent') {
      return (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0);
    }
    // manual: preserve array index
    return projects.indexOf(a) - projects.indexOf(b);
  };
  const pinned = projects.filter((p) => p.pinned).sort(sortFn);
  const others = projects.filter((p) => !p.pinned).sort(sortFn);
  return [...pinned, ...others];
}

function filteredProjects() {
  const q = state.searchQuery.trim().toLowerCase();
  let list = sortedProjects(state.projects);
  if (q) {
    list = list.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      String(p.port).includes(q) ||
      (p.path || '').toLowerCase().includes(q)
    );
  }
  if (state.colorFilter) {
    list = list.filter((p) => p.color === state.colorFilter);
  }
  return list;
}

// ---------- Color filter pills ----------

function renderColorFilters() {
  const colorsInUse = Array.from(new Set(
    state.projects.map((p) => p.color).filter(Boolean)
  )).sort((a, b) => VALID_COLORS.indexOf(a) - VALID_COLORS.indexOf(b));

  if (colorsInUse.length === 0) {
    els.colorFilters.classList.add('hidden');
    els.colorFilters.innerHTML = '';
    state.colorFilter = null;
    return;
  }
  els.colorFilters.classList.remove('hidden');
  els.colorFilters.innerHTML = '';

  const makePill = (color) => {
    const b = document.createElement('button');
    b.className = 'filter-pill' + (state.colorFilter === color ? ' active' : '');
    b.dataset.color = color || '';
    if (color) {
      const dot = document.createElement('span');
      dot.className = 'pill-dot';
      dot.style.background = `var(--color-${color})`;
      b.appendChild(dot);
      b.appendChild(document.createTextNode(color));
    } else {
      b.textContent = 'All';
      if (state.colorFilter === null) b.classList.add('active');
    }
    return b;
  };

  els.colorFilters.appendChild(makePill(null));
  for (const c of colorsInUse) els.colorFilters.appendChild(makePill(c));
}

// ---------- Render rows ----------

function renderList() {
  const filtered = filteredProjects();

  els.list.innerHTML = '';

  if (state.projects.length === 0) {
    els.empty.classList.remove('hidden');
    els.noResults.classList.add('hidden');
    els.list.classList.add('hidden');
    renderColorFilters();
    return;
  }
  if (filtered.length === 0) {
    els.empty.classList.add('hidden');
    els.noResults.classList.remove('hidden');
    els.list.classList.add('hidden');
    renderColorFilters();
    return;
  }

  els.empty.classList.add('hidden');
  els.noResults.classList.add('hidden');
  els.list.classList.remove('hidden');

  const dragEnabled = !state.searchQuery && (state.settings?.sortMode === 'manual');

  for (const p of filtered) {
    const node = els.rowTpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = p.id;
    if (p.color) node.dataset.color = p.color;
    if (p.pinned) node.dataset.pinned = '1';
    node.classList.toggle('drag-disabled', !dragEnabled);
    node.draggable = dragEnabled;

    const status = state.statuses[p.id];
    const dot = node.querySelector('.status-dot');
    const favicon = node.querySelector('.favicon');
    if (status?.alive) {
      dot.dataset.status = 'alive';
      dot.title = `Alive · ${status.latency}ms`;
      if (status.hasFavicon) {
        const protocol = status.protocol || 'http';
        favicon.src = faviconUrl(p.port, protocol);
        favicon.classList.remove('hidden');
        dot.classList.add('hidden');
        favicon.onerror = () => {
          favicon.classList.add('hidden');
          dot.classList.remove('hidden');
        };
      }
    } else if (status && status.alive === false) {
      dot.dataset.status = 'dead';
      dot.title = 'Not reachable';
    } else {
      dot.dataset.status = 'unknown';
      dot.title = 'Status unknown';
    }

    const nameEl = node.querySelector('.name-text');
    nameEl.textContent = p.name;
    node.querySelector('.project-name').title = p.name;
    const pin = node.querySelector('.pin-glyph');
    if (p.pinned) pin.classList.remove('hidden');

    node.querySelector('.port').textContent = `:${p.port}`;
    node.querySelector('.path').textContent = p.path || '';
    node.querySelector('.latency').textContent = status?.alive && status.latency != null ? `${status.latency}ms` : '';

    const titleEl = node.querySelector('.project-title');
    if (status?.title && status.title !== p.name) {
      titleEl.textContent = status.title;
      titleEl.title = status.title;
      titleEl.classList.remove('hidden');
    }

    // Pin/Unpin label (preserve the leading icon span — only swap the label text)
    const pinBtn = node.querySelector('[data-action="toggle-pin"]');
    const pinLabel = pinBtn.querySelector('.menu-label');
    if (pinLabel) {
      pinLabel.textContent = p.pinned ? 'Unpin' : 'Pin';
    } else {
      pinBtn.textContent = p.pinned ? 'Unpin' : 'Pin';
    }

    // Color swatches mark active
    node.querySelectorAll('.swatch').forEach((sw) => {
      const c = sw.dataset.color || null;
      if (c === (p.color || null)) sw.classList.add('active');
    });

    els.list.appendChild(node);
  }

  applyIcons(els.list);
}

// ---------- Menus ----------

function closeAllMenus() {
  document.querySelectorAll('.menu').forEach((m) => m.classList.add('hidden'));
  state.openMenuId = null;
  state.sortMenuOpen = false;
}

function toggleMenu(row, id) {
  const wasOpen = state.openMenuId === id;
  closeAllMenus();
  if (!wasOpen) {
    row.querySelector('.menu').classList.remove('hidden');
    state.openMenuId = id;
  }
}

// ---------- Form ----------

function showForm(project = null, prefill = null) {
  state.editingId = project?.id || null;
  els.formTitle.textContent = project ? 'Edit project' : 'Add project';
  els.fName.value = project?.name || prefill?.name || '';
  els.fPort.value = project?.port || prefill?.port || '';
  els.fPath.value = project?.path || prefill?.path || '';
  els.formWarning.classList.add('hidden');
  els.formError.classList.add('hidden');
  els.form.classList.remove('hidden');
  els.addBtn.parentElement.classList.add('hidden');
  els.fName.focus();
  els.fName.select();
}

function hideForm() {
  state.editingId = null;
  els.form.classList.add('hidden');
  els.addBtn.parentElement.classList.remove('hidden');
  saveDraft(null);
}

function validate() {
  const name = els.fName.value.trim();
  const portStr = els.fPort.value.trim();
  const path = els.fPath.value.trim();

  if (!name) return { error: 'Name is required.' };
  if (name.length > 50) return { error: 'Name is too long (max 50 chars).' };

  const port = Number(portStr);
  if (!portStr || !Number.isInteger(port) || port < 1 || port > 65535) {
    return { error: 'Port must be an integer between 1 and 65535.' };
  }

  let normalizedPath = path;
  if (normalizedPath && !normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }
  if (normalizedPath.length > 200) {
    return { error: 'Path is too long (max 200 chars).' };
  }

  const dupPort = state.projects.find(
    (p) => p.port === port && p.id !== state.editingId
  );
  const dupName = state.projects.find(
    (p) => p.name.toLowerCase() === name.toLowerCase() && p.id !== state.editingId
  );

  return {
    project: { name, port, path: normalizedPath },
    warning: dupName
      ? `A project named "${dupName.name}" already exists.`
      : dupPort
        ? `Port ${port} is also used by "${dupPort.name}".`
        : null,
  };
}

async function handleSave() {
  const result = validate();
  if (result.error) {
    els.formError.textContent = result.error;
    els.formError.classList.remove('hidden');
    return;
  }
  els.formError.classList.add('hidden');

  if (result.warning && !els.formWarning.dataset.acknowledged) {
    els.formWarning.textContent = result.warning + ' Click Save again to confirm.';
    els.formWarning.classList.remove('hidden');
    els.formWarning.dataset.acknowledged = 'true';
    return;
  }
  els.formWarning.classList.add('hidden');
  delete els.formWarning.dataset.acknowledged;

  if (state.editingId) {
    const idx = state.projects.findIndex((p) => p.id === state.editingId);
    if (idx >= 0) {
      state.projects[idx] = { ...state.projects[idx], ...result.project };
    }
  } else {
    state.projects.push({
      id: newProjectId(),
      ...result.project,
      createdAt: Date.now(),
      pinned: false,
      color: null,
      lastOpenedAt: null,
    });
  }
  await saveProjects(state.projects);
  hideForm();
  renderList();
  renderColorFilters();
  triggerPing();
}

// ---------- Actions ----------

async function openProject(p) {
  try {
    p.lastOpenedAt = Date.now();
    // Flush BEFORE opening the tab — the popup closes once the new tab
    // takes focus, so a non-awaited save would be dropped.
    await saveProjects(state.projects);
    await browserAPI.tabs.create({ url: buildUrl(p) });
  } catch (e) {
    showToast('Failed to open tab');
  }
}

async function copyUrl(p) {
  try {
    await navigator.clipboard.writeText(buildUrl(p));
    showToast('URL copied');
  } catch {
    showToast('Copy failed');
  }
}

async function handleDelete(id) {
  const p = findProject(id);
  if (!p) return;

  // Cancel any prior pending undo
  if (state.pendingDelete) {
    finalizeDelete();
  }

  const idx = state.projects.findIndex((x) => x.id === id);
  if (idx < 0) return;
  const removed = state.projects.splice(idx, 1)[0];
  await saveProjects(state.projects);
  renderList();
  renderColorFilters();

  state.pendingDelete = {
    project: removed,
    index: idx,
    timer: setTimeout(finalizeDelete, 6000),
  };

  showToast(`Deleted "${removed.name}"`, {
    actionLabel: 'Undo',
    onAction: () => undoDelete(),
    ms: 6000,
  });
}

async function undoDelete() {
  if (!state.pendingDelete) return;
  clearTimeout(state.pendingDelete.timer);
  const { project, index } = state.pendingDelete;
  state.pendingDelete = null;
  // Re-insert at original position
  const insertAt = Math.min(index, state.projects.length);
  state.projects.splice(insertAt, 0, project);
  await saveProjects(state.projects);
  renderList();
  renderColorFilters();
  showToast('Restored');
}

function finalizeDelete() {
  if (!state.pendingDelete) return;
  const { project } = state.pendingDelete;
  clearTimeout(state.pendingDelete.timer);
  state.pendingDelete = null;
  browserAPI.runtime.sendMessage({ type: 'project-deleted', id: project.id }).catch(() => {});
  delete state.statuses[project.id];
}

async function handleDuplicate(p) {
  const copy = {
    id: newProjectId(),
    name: `${p.name} (copy)`,
    port: p.port,
    path: p.path || '',
    createdAt: Date.now(),
    pinned: false,
    color: p.color || null,
    lastOpenedAt: null,
  };
  state.projects.push(copy);
  await saveProjects(state.projects);
  renderList();
  renderColorFilters();
  showForm(copy);
}

async function togglePin(id) {
  const p = findProject(id);
  if (!p) return;
  p.pinned = !p.pinned;
  await saveProjects(state.projects);
  renderList();
}

async function setColor(id, color) {
  const p = findProject(id);
  if (!p) return;
  p.color = color || null;
  await saveProjects(state.projects);
  renderList();
  renderColorFilters();
}

async function triggerPing() {
  els.refresh.classList.add('spinning');
  try {
    const res = await browserAPI.runtime.sendMessage({ type: 'ping-all' });
    if (res?.ok) {
      for (const r of res.results) {
        state.statuses[r.id] = r;
      }
      renderList();
    }
  } catch (e) {
    console.warn('ping failed', e);
  } finally {
    setTimeout(() => els.refresh.classList.remove('spinning'), 400);
  }
}

async function openAllAlive() {
  const alive = state.projects.filter((p) => state.statuses[p.id]?.alive);
  if (alive.length === 0) {
    showToast('No alive servers');
    return;
  }
  if (alive.length > 8 && !confirm(`Open ${alive.length} tabs?`)) return;
  // Stamp lastOpenedAt and persist BEFORE opening tabs — once the new tabs
  // take focus the popup closes and any pending save is dropped.
  const now = Date.now();
  for (const p of alive) p.lastOpenedAt = now;
  await saveProjects(state.projects);
  for (const p of alive) {
    try {
      await browserAPI.tabs.create({ url: buildUrl(p), active: false });
    } catch (e) {
      console.warn('open failed', e);
    }
  }
}

// ---------- Drag and drop ----------

let dragState = null; // { id }

function attachDnD() {
  els.list.addEventListener('dragstart', (e) => {
    const row = e.target.closest('.project-row');
    if (!row || row.classList.contains('drag-disabled')) {
      e.preventDefault();
      return;
    }
    // Avoid drag on button targets
    if (e.target.closest('.open-btn, .menu-btn, .menu')) {
      e.preventDefault();
      return;
    }
    dragState = { id: row.dataset.id };
    row.classList.add('dragging');
    try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', row.dataset.id); } catch {}
  });

  els.list.addEventListener('dragend', () => {
    document.querySelectorAll('.project-row').forEach((r) => {
      r.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
    });
    dragState = null;
  });

  els.list.addEventListener('dragover', (e) => {
    if (!dragState) return;
    const row = e.target.closest('.project-row');
    if (!row || row.dataset.id === dragState.id) return;

    // Enforce pinned/unpinned segregation
    const dragP = findProject(dragState.id);
    const overP = findProject(row.dataset.id);
    if (!dragP || !overP) return;
    if (!!dragP.pinned !== !!overP.pinned) return;

    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch {}
    const rect = row.getBoundingClientRect();
    const before = (e.clientY - rect.top) < rect.height / 2;
    document.querySelectorAll('.project-row').forEach((r) => {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
    row.classList.add(before ? 'drag-over-top' : 'drag-over-bottom');
  });

  els.list.addEventListener('drop', async (e) => {
    if (!dragState) return;
    const row = e.target.closest('.project-row');
    if (!row || row.dataset.id === dragState.id) return;
    const dragP = findProject(dragState.id);
    const overP = findProject(row.dataset.id);
    if (!dragP || !overP) return;
    if (!!dragP.pinned !== !!overP.pinned) return;

    e.preventDefault();
    const rect = row.getBoundingClientRect();
    const before = (e.clientY - rect.top) < rect.height / 2;

    // Move in underlying state.projects array
    const fromIdx = state.projects.findIndex((p) => p.id === dragP.id);
    const [moved] = state.projects.splice(fromIdx, 1);
    let toIdx = state.projects.findIndex((p) => p.id === overP.id);
    if (!before) toIdx += 1;
    state.projects.splice(toIdx, 0, moved);

    await saveProjects(state.projects);
    renderList();
  });
}

// ---------- Quick-add banner ----------

async function maybeShowQuickAddBanner() {
  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const url = tabs?.[0]?.url;
    if (!url) return;
    const u = new URL(url);
    const host = u.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') return;
    const port = Number(u.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) return;

    // Don't show if project for this port already exists
    if (state.projects.some((p) => p.port === port)) return;

    const dismissed = await getDismissedBanners();
    const bannerKey = `port:${port}`;
    if (dismissed.includes(bannerKey)) return;

    state.quickAddPort = port;
    state.quickAddPath = u.pathname && u.pathname !== '/' ? u.pathname : '';
    els.bannerUrl.textContent = `localhost:${port}`;
    els.banner.classList.remove('hidden');
  } catch (e) {
    console.warn('quick-add detect failed', e);
  }
}

// ---------- Init ----------

async function init() {
  try {
    applyIcons(); // hydrate icons in static HTML before first paint
    state.settings = await getSettings();
    applyTheme(state.settings.theme);

    state.projects = await getProjects();
    state.statuses = await getStatusCache();
    renderList();
    renderColorFilters();

    const draft = await getDraft();
    if (draft) {
      showForm(draft.editingId ? findProject(draft.editingId) : null);
      if (draft.name) els.fName.value = draft.name;
      if (draft.port) els.fPort.value = draft.port;
      if (draft.path) els.fPath.value = draft.path;
    }

    // Don't block first render; run in background
    maybeShowQuickAddBanner();

    if (state.settings.autoPingOnPopupOpen) {
      triggerPing();
    }
  } catch (e) {
    console.error('init failed', e);
  }
}

// ---------- Event wiring ----------

attachDnD();

els.list.addEventListener('click', (e) => {
  const row = e.target.closest('.project-row');
  if (!row) return;
  const id = row.dataset.id;
  const p = findProject(id);
  if (!p) return;

  if (e.target.closest('.drag-handle')) {
    return; // drag handle: not a click target
  }
  if (e.target.closest('.open-btn')) {
    openProject(p);
    return;
  }
  if (e.target.closest('.menu-btn')) {
    toggleMenu(row, id);
    return;
  }
  const swatch = e.target.closest('.swatch');
  if (swatch && row.contains(swatch)) {
    closeAllMenus();
    setColor(id, swatch.dataset.color || null);
    return;
  }
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action) {
    closeAllMenus();
    if (action === 'edit') showForm(p);
    if (action === 'duplicate') handleDuplicate(p);
    if (action === 'copy-url') copyUrl(p);
    if (action === 'toggle-pin') togglePin(id);
    if (action === 'delete') handleDelete(id);
    return;
  }
  // Click anywhere else on the row (not buttons) → open
  if (e.target.classList.contains('status-dot') ||
      e.target.classList.contains('favicon') ||
      e.target.closest('.project-info')) {
    openProject(p);
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu') && !e.target.closest('.menu-btn') && !e.target.closest('#sort-btn')) {
    closeAllMenus();
  }
});

// Buttons
els.addBtn.addEventListener('click', () => showForm());
els.fCancel.addEventListener('click', hideForm);
els.fSave.addEventListener('click', handleSave);

[els.fName, els.fPort, els.fPath].forEach((input) => {
  input.addEventListener('input', () => {
    saveDraft({
      editingId: state.editingId,
      name: els.fName.value,
      port: els.fPort.value,
      path: els.fPath.value,
    });
    if (!els.formWarning.classList.contains('hidden')) {
      els.formWarning.classList.add('hidden');
      delete els.formWarning.dataset.acknowledged;
    }
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') { e.preventDefault(); hideForm(); }
  });
});

els.refresh.addEventListener('click', triggerPing);
els.settings.addEventListener('click', () => browserAPI.runtime.openOptionsPage());
els.openAll.addEventListener('click', openAllAlive);

els.theme.addEventListener('click', async () => {
  const order = ['system', 'light', 'dark'];
  const next = order[(order.indexOf(state.settings.theme) + 1) % order.length];
  state.settings.theme = next;
  applyTheme(next);
  await saveSettings(state.settings);
  showToast(`Theme: ${next}`);
});

// Sort menu
els.sortBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const wasOpen = state.sortMenuOpen;
  closeAllMenus();
  if (!wasOpen) {
    els.sortMenu.classList.remove('hidden');
    state.sortMenuOpen = true;
  }
});

els.sortMenu.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-sort]');
  if (!btn) return;
  const sort = btn.dataset.sort;
  if (!VALID_SORTS.includes(sort)) return;
  state.settings.sortMode = sort;
  await saveSettings(state.settings);
  closeAllMenus();
  renderList();
  const label = btn.querySelector('.menu-label')?.textContent || btn.textContent.trim();
  showToast(`Sort: ${label}`);
});

// Color filter pills
els.colorFilters.addEventListener('click', (e) => {
  const pill = e.target.closest('.filter-pill');
  if (!pill) return;
  const color = pill.dataset.color || null;
  state.colorFilter = color || null;
  renderColorFilters();
  renderList();
});

// Search
els.search.addEventListener('input', () => {
  state.searchQuery = els.search.value;
  els.searchClear.classList.toggle('hidden', !state.searchQuery);
  renderList();
});
els.searchClear.addEventListener('click', () => {
  els.search.value = '';
  state.searchQuery = '';
  els.searchClear.classList.add('hidden');
  renderList();
  els.search.focus();
});

document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
    e.preventDefault();
    els.search.focus();
  }
  if (e.key === 'Escape' && !els.form.classList.contains('hidden')) {
    hideForm();
  }
});

// Banner buttons
els.bannerAdd.addEventListener('click', () => {
  if (state.quickAddPort == null) return;
  els.banner.classList.add('hidden');
  showForm(null, { name: '', port: state.quickAddPort, path: state.quickAddPath });
});
els.bannerDismiss.addEventListener('click', () => {
  els.banner.classList.add('hidden');
  if (state.quickAddPort != null) {
    dismissBanner(`port:${state.quickAddPort}`).catch(() => {});
  }
});

// React to status updates from background
browserAPI.storage.onChanged.addListener((changes, area) => {
  if (area === 'session' && changes.status) {
    state.statuses = changes.status.newValue || {};
    renderList();
  }
  if (area === 'local' && changes.projects) {
    state.projects = changes.projects.newValue || [];
    renderList();
    renderColorFilters();
  }
});

init();
