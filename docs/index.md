---
title: Localhost Manager — Privacy Policy
---

# Privacy Policy — Localhost Manager

**Last updated:** May 24, 2026
**Extension:** Localhost Manager
**Publisher:** TwinTechies

## Summary

Localhost Manager **does not collect, store, transmit, sell, or share** any personal information, browsing data, or user content. Everything happens entirely on your local machine. There are no servers, no analytics, no telemetry, no ads.

## What data the extension handles

Localhost Manager stores the following **locally in your browser** (via `chrome.storage.local`) for the extension to function:

- A list of project entries you create: name, port number, optional path, optional color label, optional pinned flag
- Your preferences (theme, sort mode, ping interval, etc.)
- Session-only cache of which servers are currently reachable (in `chrome.storage.session`, cleared on browser restart)

The extension periodically connects to `localhost` URLs **on your own computer** to check if your dev servers are running and to fetch their favicon and page title. These connections never leave your machine — they stay on the loopback interface.

## What we do NOT do

- ❌ We do not collect personally identifiable information
- ❌ We do not collect browsing history
- ❌ We do not collect cookies, credentials, or form data
- ❌ We do not transmit any data to any server (we don't operate any)
- ❌ We do not use analytics or telemetry
- ❌ We do not sell, share, or transfer data to third parties
- ❌ We do not use the data for any purpose unrelated to the extension's stated function

## Permissions explained

| Permission | Purpose |
|---|---|
| `storage` | Saves your project list and preferences on your device only |
| `tabs` | Opens projects you click in a new browser tab; reads current tab URL to detect localhost for "quick add" banner |
| `alarms` | Schedules periodic server-reachability checks |
| `host_permissions: http(s)://localhost/*, http(s)://127.0.0.1/*` | Pings only your local dev servers; cannot access any external URL |

The host permissions are **scoped narrowly to localhost and 127.0.0.1** — the extension is technically incapable of accessing any external website.

## Data retention and deletion

All extension data lives in your browser's local storage. You can delete it at any time by:

- Removing the extension (uninstalls all data automatically), or
- Using the extension's built-in "Delete all projects" / "Reset settings" buttons in Settings

## Source code

This extension is open source. The full source code is available at:
[github.com/TwinTricks/localhost-manager](https://github.com/TwinTricks/localhost-manager)

You can verify the privacy claims above by reading the code yourself.

## Children's privacy

This extension is a general-purpose developer tool and is not directed at children under 13. We do not knowingly collect any data, so no children's data could be collected.

## Changes to this policy

Any changes will be reflected in this document with an updated "Last updated" date. Material changes will be highlighted in extension update notes on the Chrome Web Store listing.

## Contact

Questions, concerns, or bug reports:

- **Email:** twinntricks@gmail.com
- **GitHub Issues:** [github.com/TwinTricks/localhost-manager/issues](https://github.com/TwinTricks/localhost-manager/issues)
- **Publisher:** TwinTechies

## Legal

This extension is provided "as is" without warranty of any kind. Use at your own discretion. Licensed under MIT.
