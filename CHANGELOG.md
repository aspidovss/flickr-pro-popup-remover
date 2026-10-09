# Changelog

All notable changes to this project are documented here.
Формат основан на [Keep a Changelog](https://keepachangelog.com/).

## [1.7.1] - 2026-10-09

### Fixed
- On `https://www.flickr.com/photos/…` pages the empty ad strip above the header (`.nav-ad-container`) no longer takes up space.

## [1.7.0] - 2026-10-09

### Added
- Hides the ad blocks on photo pages (`.photo-page-i-m-container`, `.moola-wrapper`, `[data-aaad]`, `.navad-timer-container`) without leaving an empty gap.
- README: screenshot-free description of the ad block structure; clarified that the script only hides elements and does not block network requests.

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
