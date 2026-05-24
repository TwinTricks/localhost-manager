// Iconsax Linear-style SVG icons.
// All icons share the same wrapper attributes for consistency:
//   24x24 viewBox, stroke=currentColor, stroke-width=1.5, fill=none,
//   stroke-linecap=round, stroke-linejoin=round.
// Use applyIcons() after the DOM is ready, OR getIcon(name) for ad-hoc.

const PATHS = {
  // Brand / logo: stacked monitor / window
  logo: `
    <rect x="3" y="4" width="18" height="14" rx="2.5"/>
    <path d="M3 8h18"/>
    <circle cx="6" cy="6" r="0.5" fill="currentColor"/>
    <circle cx="8" cy="6" r="0.5" fill="currentColor"/>
    <path d="M9 21h6"/>
    <path d="M12 18v3"/>
  `,
  // Refresh — circular arrow
  refresh: `
    <path d="M19.93 7.5a8 8 0 1 0 1.07 6.5"/>
    <path d="M20 4v4h-4"/>
  `,
  // Settings — gear
  settings: `
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
    <path d="M19.622 10.395l-1.097-2.65L20 6l-2-2-1.735 1.483-2.707-1.113L12.935 2h-1.954l-.632 2.401-2.645 1.115L6 4 4 6l1.453 1.789-1.08 2.657L2 11v2l2.401.655L5.516 16.3 4 18l2 2 1.791-1.46 2.606 1.072L11 22h2l.604-2.387 2.651-1.098C16.697 18.831 18 20 18 20l2-2-1.484-1.75 1.098-2.652 2.386-.62V11l-2.378-.605Z"/>
  `,
  // Theme / sun
  sun: `
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2"/>
    <path d="M12 20v2"/>
    <path d="m4.93 4.93 1.41 1.41"/>
    <path d="m17.66 17.66 1.41 1.41"/>
    <path d="M2 12h2"/>
    <path d="M20 12h2"/>
    <path d="m6.34 17.66-1.41 1.41"/>
    <path d="m19.07 4.93-1.41 1.41"/>
  `,
  // Moon / half-circle theme
  moon: `
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  `,
  // Close / X
  close: `
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  `,
  // Search / magnifier
  search: `
    <circle cx="11" cy="11" r="7"/>
    <path d="m20 20-3.5-3.5"/>
  `,
  // Folder for empty state
  folder: `
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
  `,
  // More / 3 dots horizontal
  more: `
    <circle cx="5" cy="12" r="1.25" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.25" fill="currentColor"/>
    <circle cx="19" cy="12" r="1.25" fill="currentColor"/>
  `,
  // Drag handle / 6 dots
  drag: `
    <circle cx="9" cy="5" r="1" fill="currentColor"/>
    <circle cx="9" cy="12" r="1" fill="currentColor"/>
    <circle cx="9" cy="19" r="1" fill="currentColor"/>
    <circle cx="15" cy="5" r="1" fill="currentColor"/>
    <circle cx="15" cy="12" r="1" fill="currentColor"/>
    <circle cx="15" cy="19" r="1" fill="currentColor"/>
  `,
  // Play / open
  play: `
    <path d="M6 4.5v15l13-7.5L6 4.5z"/>
  `,
  // Sort / arrow up-down
  sort: `
    <path d="M7 4v16"/>
    <path d="m4 7 3-3 3 3"/>
    <path d="M17 20V4"/>
    <path d="m14 17 3 3 3-3"/>
  `,
  // Pin — push pin
  pin: `
    <path d="m12 17 .01 5"/>
    <path d="M8 11.5V5h8v6.5l3 3.5H5l3-3.5z"/>
  `,
  // Open all / element-plus / multiple windows
  openAll: `
    <rect x="3" y="5" width="13" height="13" rx="2"/>
    <path d="M8 3h11a2 2 0 0 1 2 2v11"/>
  `,
  // Plus / add
  plus: `
    <path d="M12 5v14"/>
    <path d="M5 12h14"/>
  `,
  // Check / save
  check: `
    <path d="M20 6 9 17l-5-5"/>
  `,
  // Copy
  copy: `
    <rect x="9" y="9" width="11" height="11" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  `,
  // Trash / delete
  trash: `
    <path d="M3 6h18"/>
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
  `,
  // Edit / pencil
  edit: `
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
  `,
  // Duplicate
  duplicate: `
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  `,
  // External link / open in new
  external: `
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  `,
};

const SVG_OPEN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="icon-svg" aria-hidden="true">`;
const SVG_CLOSE = `</svg>`;

export function getIcon(name) {
  const inner = PATHS[name];
  if (!inner) {
    console.warn('[icons] unknown icon:', name);
    return '';
  }
  return SVG_OPEN + inner + SVG_CLOSE;
}

export function applyIcons(root = document) {
  const nodes = root.querySelectorAll('[data-icon]');
  nodes.forEach((el) => {
    const name = el.getAttribute('data-icon');
    if (!name) return;
    if (el.dataset.iconLoaded === '1') return;
    el.innerHTML = getIcon(name);
    el.dataset.iconLoaded = '1';
  });
}

export const ICON_NAMES = Object.keys(PATHS);
