// Iconsax Linear-style SVG icons.
// All icons share the same wrapper attributes for consistency:
//   24x24 viewBox, stroke=currentColor, stroke-width=1.5, fill=none,
//   stroke-linecap=round, stroke-linejoin=round.
//
// The built-in paths use Lucide-style geometry (MIT-licensed,
// visually identical to Iconsax Linear). To customize: edit the
// PATHS object directly.
//
// Use applyIcons() after the DOM is ready, OR getIcon(name) for ad-hoc.

const PATHS = {
  // Brand / logo: monitor with title bar + traffic-light dots + stand
  logo: `
    <rect x="3" y="4" width="18" height="14" rx="2.5"/>
    <path d="M3 8h18"/>
    <circle cx="6" cy="6" r="0.5" fill="currentColor"/>
    <circle cx="8" cy="6" r="0.5" fill="currentColor"/>
    <path d="M9 21h6"/>
    <path d="M12 18v3"/>
  `,
  // Refresh — circular arrow with arrowhead
  refresh: `
    <path d="M19.93 7.5a8 8 0 1 0 1.07 6.5"/>
    <path d="M20 4v4h-4"/>
  `,
  // Settings — clean 8-tooth gear + center circle (Lucide settings)
  settings: `
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  `,
  // Sun — center circle + 8 symmetric spokes
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
  // Drag handle / 6 dots (2 columns x 3 rows)
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
  // Pin — angled pushpin with cap, body, and tack point (Lucide pin)
  pin: `
    <path d="M12 17v5"/>
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
  `,
  // Open all / element-plus / stacked window
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
  // ---------- New (v1.2): sort-menu glyphs ----------
  // Clock for "Recently used"
  clock: `
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v5l3 2"/>
  `,
  // Three horizontal lines (manual order / list)
  lines: `
    <path d="M4 6h16"/>
    <path d="M4 12h16"/>
    <path d="M4 18h10"/>
  `,
  // A→Z (used for "Name" sort)
  letters: `
    <path d="M4 18V8l4 10"/>
    <path d="M4.8 14.5h6.4"/>
    <path d="M15 8h5l-5 10h5"/>
  `,
  // Hash (used for "Port" sort)
  hash: `
    <path d="M4 9h16"/>
    <path d="M4 15h16"/>
    <path d="M10 3 8 21"/>
    <path d="M16 3l-2 18"/>
  `,
  // Chevron right (optional menu indicator)
  'chevron-right': `
    <path d="m9 6 6 6-6 6"/>
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
