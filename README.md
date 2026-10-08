# Flickr Pro Popup Remover

[Русская версия](README.ru.md)

A small userscript that removes the full-screen **"Upgrade to Pro"** popup that Flickr keeps showing while you browse photos — together with its dark backdrop — and does it **without flicker**.

> Not affiliated with or endorsed by Flickr. This script only hides an advertisement in your own browser; it does not bypass any paywall or unlock any Pro feature.

## Features

- Hides the Pro upsell modal and its backdrop before the browser paints it (no flash of the popup).
- Restores page scrolling, which the popup locks.
- Leaves every other Flickr dialog (share, edit, etc.) untouched.
- No dependencies, no network requests, no data collection. About 100 lines of readable code.

## Installation

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Firefox, Chrome, Edge, Safari)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [Greasemonkey](https://www.greasespot.net/) (Firefox)
2. Install the script:
   - **[Click here to install from GitHub](https://github.com/YOUR_GITHUB_USERNAME/flickr-pro-popup-remover/raw/main/flickr-pro-popup-remover.user.js)**
   - or from Greasy Fork: _link coming soon_
3. Open any Flickr photo page. The popup no longer appears.

## Requirements

A browser with CSS `:has()` support: Firefox 121+, Chrome/Edge 105+, Safari 15.4+.

## How it works

Flickr renders the popup as a `fluid-modal-view` element (containing an `upsell-modal-view`) next to a `fluid-modal-overlay` backdrop. The script:

1. injects CSS at `document-start` that hides any modal containing the upsell markup and keeps every backdrop invisible until it is confirmed to belong to a regular dialog;
2. watches the DOM with a `MutationObserver` (synchronously, before the frame is drawn) and reveals backdrops of regular dialogs;
3. presses the popup's close button once so Flickr tidies up its own state.

Flickr uses dynamically generated element ids (`yui_3_18_1_…`), so the script matches stable class names and link patterns instead.

## Configuration

Open the script in your userscript manager and set `DEBUG = true` to print what it does to the browser console (filter the console by `FPR`).

## Troubleshooting

- **The popup still appears.** Make sure only one Flickr-related popup script is enabled, and that your browser meets the requirements above. Flickr may have changed its markup — please open an issue.
- **Reporting a problem.** Set `DEBUG = true`, reload the page, and attach the `[FPR]` console lines plus a screenshot of the Inspector showing the popup's HTML (right-click the popup → Inspect).

## Contributing

Issues and pull requests are welcome. Please keep code comments in English first, Russian second.

## License

[MIT](LICENSE)
