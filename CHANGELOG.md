# Changelog

All notable changes to this project are documented here.
Формат основан на [Keep a Changelog](https://keepachangelog.com/).

## [1.6.0] - 2026-10-09

### Added
- Hides the "Upgrade to Flickr Pro to hide these ads" banner (`.upgrade-to-pro-cta`).

## [1.5.0] - 2026-10-09

First public release / Первый публичный релиз.

### Added
- Hides the "Upgrade to Pro" modal and its backdrop on flickr.com before the first paint (no flicker).
- Restores page scrolling that the modal locks.
- Presses the modal's close button once so Flickr closes it itself.
- Leaves all other Flickr dialogs untouched.
- Optional `DEBUG` flag for console logging (filter by `FPR`).
