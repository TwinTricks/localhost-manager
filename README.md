# Localhost Manager

Bookmark localhost dev servers by **project name**, not by port.

## v2 — what's new (1.1.0)

- **Drag to reorder** projects (works in manual sort mode, no search active)
- **Pin favorites** — pinned projects sort to top with a pin glyph
- **Color labels** — tag projects with red / orange / yellow / green / blue / purple / gray; quick-filter pills appear above the list
- **Favicons** — alive servers show their `/favicon.ico` instead of the status dot
- **Title sniffing** — page `<title>` shown as a small third line under each row
- **Quick-add banner** — when popup opens on a `localhost:xxxx` tab not yet bookmarked, offer a 1-click add
- **Open all alive** — a stack icon in the header opens every alive project in background tabs
- **Keyboard shortcut** — `Ctrl+Shift+L` (`Cmd+Shift+L` on Mac) to open the popup (customizable at `chrome://extensions/shortcuts`)
- **Last-opened tracking + sort modes** — Manual / Recently used / Name A→Z / Port low→high
- **Toolbar badge** — shows count of alive servers (green; `9+` if more than 9, empty when 0)
- **Undo toast on delete** — 6-second window to restore a deleted project

## Features

- Add, edit, delete, duplicate projects (name + port + optional path)
- One-click open in a new tab
- Live status indicator (green = alive, red = dead, gray = unknown) with latency
- Favicons replace the status dot when reachable
- Auto-ping every 30 seconds (configurable 30s – 10min)
- Smart HTTP/HTTPS detection — tries both, remembers what worked
- Drag-to-reorder, pin favorites, color labels, color filter pills
- Page-title sniffing under each row
- Quick-add banner when viewing an un-bookmarked `localhost` tab
- Open-all-alive button (with confirmation past 8 tabs)
- Toolbar badge with live alive count
- Undo toast after delete (6-second window)
- Search/filter by name, port, or path
- Light / Dark / System theme
- Settings page with import/export JSON
- Keyboard shortcuts (`Ctrl+Shift+L` to open, Enter to save, Esc to cancel, `/` to focus search)
- Form draft autosave (closing the popup doesn't lose your work)
- Duplicate port warning
- Long-name truncation with tooltips
- Cross-browser ready (`browserAPI` shim works in Chrome, Edge, Brave, Firefox)

## Keyboard shortcut

Default: `Ctrl+Shift+L` (Windows / Linux) or `Cmd+Shift+L` (Mac).
Customize: open `chrome://extensions/shortcuts` and edit "Localhost Manager".

## Install (local development)

1. Open `chrome://extensions/` (or `edge://extensions/`).
2. Toggle **Developer mode** on.
3. Click **Load unpacked** → select this `localhost-manager` folder.
4. Pin the extension to the toolbar.

## Icons (one-time setup)

The manifest references `icons/icon16.png`, `icon48.png`, `icon128.png`. To generate them:

1. Open `icons/make-icons.html` in your browser (double-click the file).
2. Click **Download all three**.
3. Save the downloaded PNGs into the `icons/` folder.
4. Reload the extension at `chrome://extensions/`.

Without icons the extension still works — Chrome shows a default puzzle-piece icon.

## Icons (UI / in-popup)

The popup uses an inline SVG icon library at `lib/icons.js`. Default icons are hand-coded in **Iconsax Linear** visual style (24x24 viewBox, `currentColor` stroke at 1.5px, rounded line caps) using Lucide-style geometry, which is MIT-licensed and visually near-identical to Iconsax Linear.

### Overriding individual icons

You can swap any built-in icon for your own SVG without editing source code:

1. Save your SVG as `icons/ui/<name>.svg` inside the extension folder.
2. Reload the extension at `chrome://extensions/`.
3. Your file is auto-picked up the next time the popup is opened.

Each override file must be a complete `<svg>` element with a `viewBox="0 0 24 24"` and use `currentColor` for `stroke` / `fill` so it inherits the surrounding text color (light/dark theme aware).

### Supported icon names

`logo`, `refresh`, `settings`, `sun`, `moon`, `close`, `search`, `folder`, `more`, `drag`, `play`, `sort`, `pin`, `openAll`, `plus`, `check`, `copy`, `trash`, `edit`, `duplicate`, `external`, `clock`, `lines`, `letters`, `hash`, `chevron-right`.

The override directory is registered under `web_accessible_resources` in `manifest.json` (scoped to `icons/ui/*.svg` only — nothing else is exposed).

## Project schema

```ts
{
  id: string,              // uuid
  name: string,            // display name
  port: number,            // 1..65535
  path: string,            // optional, e.g. "/admin"
  createdAt: number,       // epoch ms
  pinned: boolean,         // v1.1 — default false
  color: string | null,    // v1.1 — one of red/orange/yellow/green/blue/purple/gray, default null
  lastOpenedAt: number | null, // v1.1 — epoch ms of last open, default null
}
```

Older 1.0.0 projects (missing the v1.1 fields) are silently migrated on read — no manual conversion needed.

## File map

```
localhost-manager/
├── manifest.json          MV3 config (+ commands for keyboard shortcut)
├── background.js          Service worker: alarms + ping cycle + badge updates
├── popup.html/css/js      Toolbar popup UI
├── options.html/css/js    Settings page (opens in a tab)
├── lib/
│   ├── browser.js         Chrome/Firefox API shim
│   ├── storage.js         Read/write projects, settings, drafts, banner state
│   └── ping.js            Port reachability + title fetcher + favicon check
└── icons/
    ├── make-icons.html    One-time icon generator
    └── icon{16,48,128}.png
```

## Permissions explained

- `storage` — saves your project list and settings locally
- `tabs` — opens projects in new tabs when you click them; reads current tab URL for quick-add detection
- `alarms` — runs the periodic ping cycle reliably
- `host_permissions: http(s)://localhost/*, http(s)://127.0.0.1/*` — pings local servers, fetches favicon/title

No new permissions added in v1.1 — favicon and title use the existing `host_permissions`.
No data ever leaves your machine.

## Edge cases handled

| Scenario | Behaviour |
|---|---|
| CORS-blocked port | Pings with `no-cors` mode |
| Self-signed HTTPS localhost | Falls back from http to https |
| Slow / hanging server | `AbortController` cancels after configurable timeout |
| Two projects on same port | Saves but warns on second confirm |
| Storage corruption | Try/catch + falls back to empty list |
| Service worker sleeping | Uses `chrome.alarms` (survives sleep) |
| Stale status on deleted project | Background prunes orphan statuses |
| Popup closed mid-edit | Form draft persisted in `storage.session` |
| Favicon fails / CORS-blocks | Silently falls back to colored status dot |
| Title fetch CORS-blocked | Title line just hidden |
| Drag during search | Drag handles hidden — search-filtered view never reorders the underlying array |
| Drag pinned over unpinned | Disallowed (the drop indicator simply doesn't appear) |
| Sort mode != manual | Drag-and-drop disabled to avoid confusing the user |
| Delete + restore race | Undo cancels the 6s timer, project re-inserted at its original index |
| Open-all > 8 tabs | Confirm dialog before opening |

## Future enhancements

- **Multiple paths per project** — e.g. `[ "/admin", "/api/docs" ]` with a path picker on click. Not in 1.1 to keep the schema flat; deferred for a future schema bump.

## Publishing to the Chrome Web Store

1. Zip the folder (excluding `make-icons.html` and `README.md` optionally).
2. Upload at https://chrome.google.com/webstore/devconsole.
3. Justify permissions:
   - `storage`: persist user's project list
   - `tabs`: open localhost URLs from the popup, detect current localhost tab for quick-add
   - `alarms`: periodic status checks
   - `host_permissions`: reach the user's local dev servers (ping + favicon + title)
4. Privacy policy: extension stores data locally, no remote transmission.

## License

MIT — do whatever you want.
