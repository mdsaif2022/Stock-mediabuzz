# FreeMediaBuzz

FreeMediaBuzz is a full-stack stock media platform built with React, Vite, TypeScript, Express, and Tailwind CSS. It lets users browse, preview, and download free media across categories (video, image, audio, templates, APKs), while admins can upload and manage content directly from the dashboard.

## Features

- **Modern SPA** – React 18, Vite, React Router 6, Radix UI, Tailwind CSS.
- **Integrated backend** – Express server sharing a single dev port with the client.
- **Media database** – In-memory JSON store with CRUD routes for uploads and metadata.
- **Video & audio previews** – Custom players with hover previews, seek controls (single click: ±10s, double-click: ±30s), fullscreen, and lazy loading.
- **App-specific enhancements** – Upload app icons, feature screenshots, and toggle their visibility on the download page.
- **Download proxy** – Server-side proxy for file downloads (including Cloudinary) with CORS-safe tracking.
- **Shared types** – `@shared/api` definitions reused by both client and server.
- **Authentication scaffold** – Mock auth context with login/signup UI and dashboard routes.
- **Responsive UI** – Fully responsive header, mobile navigation, cards, and admin tables.

## Project Structure

```
client/             # React SPA
  components/       # Layout, header, UI primitives, media players
  pages/            # Route pages (Index, Browse, Admin, etc.)
  hooks/            # Custom hooks (intersection observer, video thumb extractor)
  lib/              # API helpers, shared utilities

server/             # Express API
  routes/           # media, download, upload, admin, users, etc.
  data/             # JSON storage for media, users, settings

shared/             # Shared TypeScript interfaces
```

## Getting Started

```bash
pnpm install
pnpm dev      # starts Vite + Express on the same port
```

### Other scripts

```bash
pnpm build    # production build
pnpm start    # serve the built client + server
pnpm test     # run Vitest unit tests
```

## Admin Media Uploads

- Drag-and-drop uploads for files or provide direct URLs.
- For APKs, admins can upload an app icon and feature screenshots.
- Screenshots can be reordered, edited, and toggled on/off for end users.
- Metadata (icon URL, screenshots, showScreenshots) is stored alongside the media record.

## Download Page

- Video: custom player with play/pause, seek controls (single click: ±10s, double-click: ±30s), fullscreen.
- Audio: dedicated audio player with seek controls (single click: ±10s, double-click: ±30s).
- APK: displays app icon and screenshot gallery (grid on desktop, swipeable carousel on mobile) with a modal lightbox.

## Environment

The starter runs solely on local JSON files. To integrate a database or real auth, replace the placeholder routes in `server/routes` with your own persistence layer and security middleware.

## Recent Updates

### Navigation & Controls
- **Fixed browser/phone back button navigation** – Removed interfering custom history sync code. Browser back button now properly navigates through the app history (Home → Browse → Media Detail and back).
- **Enhanced seek controls** – Added double-click support for faster seeking:
  - Single click: seeks backward/forward by 10 seconds
  - Double-click: seeks backward/forward by 30 seconds
  - Improved validation to handle edge cases (invalid duration, unloaded media)

### Player Improvements
- VideoPlayer and AudioPlayer now have robust seek controls that work even when media metadata hasn't fully loaded
- Better handling of edge cases where duration might be 0, NaN, or Infinity

## License

MIT – feel free to reuse or adapt for your own projects.

