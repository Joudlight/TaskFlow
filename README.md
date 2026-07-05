# Flow — a static, offline-first task manager

A production-quality to-do list PWA built with plain HTML5, CSS3, and vanilla
JavaScript (ES6+). No frameworks, no build step, no backend, no dependencies.
Open `index.html` directly in a browser, or host it for free on GitHub Pages.

## Deploy to GitHub Pages (2 minutes)

1. Create a new GitHub repository and push everything in this folder to it.
2. On GitHub: **Settings → Pages → Source → Deploy from a branch**, pick `main` and `/ (root)`.
3. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.
4. **Update these placeholders** to your real URL (search-and-replace `your-username.github.io/flow-todo-app`):
   - `index.html` — `<link rel="canonical">`, `og:url`, `og:image`, `twitter:image`
   - `manifest.json` — nothing to change here
   - `robots.txt` — the `Sitemap:` line
   - `sitemap.xml` — the `<loc>` value
5. Optional: swap `icons/og-image.png` and the app icons for your own branding (see `generate_icons.py`-style approach, or just replace the PNGs directly — same filenames).

That's it — no npm install, no build command, nothing to compile.

## Run locally

Just open `index.html` in a browser. For the service worker (offline support)
to register, use a local server rather than `file://` in Chrome/Edge — e.g.
`python3 -m http.server` from this folder, then visit `http://localhost:8000`.
The app itself (tasks, calendar, timer, etc.) works fine directly from
`file://` too; only the offline-caching service worker needs `http(s)://`.

## What's included

- **Tasks** — title, description, notes (mini-markdown), priority, due date/time,
  category, tags, estimated duration, progress, color, subtasks, recurrence
  (daily/weekly/monthly/custom days), a lightweight "depends on" link, file
  attachments (images + PDF, with client-side thumbnailing), favorites, pins,
  archive, trash with undo/restore, templates, duplicate.
- **Quick Add** with natural-language parsing — try "Team sync tomorrow 4pm",
  "Finish report next Friday", "Water plants in 2 days", "Standup every Monday".
- **Search, filters, sort, grouping, drag-and-drop reorder, multi-select + bulk actions.**
- **Calendar** — month / week / agenda views, click a day to add a task, drag a
  task chip to another day to reschedule.
- **Focus timer (Pomodoro)** — custom durations, short/long breaks, auto-start,
  session history, daily/weekly/monthly focus-time stats, distraction-free mode.
- **Dashboard** — completion stats, streaks, a weekly bar chart, a category
  donut chart, and a priority breakdown, all hand-rolled SVG (no chart library).
- **Quotes** — 126 original motivational lines across 7 themes, daily rotation,
  favorite/copy/share.
- **Notifications** — due-soon reminders, daily planning reminder, configurable lead time.
- **Import/export** — JSON, CSV, and a full-state backup/restore file.
- **Sharing** — native Web Share, copy link, and a self-generated QR code
  (the QR encoder was verified cell-for-cell against a reference implementation
  during development — see the comment in `js/utils/qrcode.js`).
- **Printing** — a dedicated print stylesheet for the current view.
- **Theming** — light/dark/auto (system), 7 accent colors, 3 text sizes, compact
  density, high-contrast mode, reduced-motion support.
- **Sound effects** — synthesized with the Web Audio API (no audio files),
  toggle + volume control.
- **Achievements** — 14 badges, confetti celebration when a day's tasks are cleared.
- **Command palette** (Ctrl/Cmd+K) and keyboard shortcuts (see in-app Help).
- **Full PWA** — installable, offline-capable, app icons, splash behavior via
  manifest, versioned service worker with cache-first assets and an offline fallback page.
- **Accessibility** — semantic landmarks, skip link, focus trapping in dialogs,
  visible focus states, ARIA live regions for toasts/search results, reduced-motion
  and high-contrast support, large touch targets.
- **SEO** — semantic headings, meta description/keywords, canonical link, Open
  Graph + Twitter Card tags, JSON-LD structured data, `robots.txt`, `sitemap.xml`.
- **Everything persists to `localStorage`** — no account, no login, no server.

## What's intentionally simplified

A handful of items from the original spec were scoped down so the rest could
be genuinely solid rather than everything being a shallow stub:

- **Task dependencies** are a single "depends on" reference (tracked and shown),
  not a full multi-dependency graph with a blocking visualizer.
- **QR code generation** supports versions 1–5 (comfortably fits any realistic
  URL) at one error-correction level — it was verified against a reference
  encoder rather than guessed at, but if you ever need very long URLs, Copy
  Link is the always-reliable fallback shown right next to it.
- **CSV import** matches columns by header name with sensible defaults; it
  doesn't do fuzzy/AI column mapping.
- **Attachments** are capped at 3MB per file and images are automatically
  downscaled, because everything lives in `localStorage`, which most browsers
  cap around 5–10MB total for the whole site.
- **Quotes**: 126 original lines (not literally attributed to real people, to
  avoid ever mis-quoting anyone) rather than a scraped set of "hundreds."

None of these are half-finished — they're deliberately-bounded versions of the
feature. Happy to extend any of them further on request.

## Project structure

```
index.html            Main app shell (all four views + every modal)
offline.html           Offline fallback page for the service worker
manifest.json           PWA manifest
service-worker.js       Precache + offline strategy
robots.txt / sitemap.xml   SEO
css/                    variables → base → layout → components → animations,
                        plus calendar.css, pomodoro.css, dashboard.css, print.css
js/utils/               helpers, date parsing, storage, CSV, QR code
js/state/store.js       Single source of truth: task model, CRUD, persistence, pub/sub
js/features/            One file per feature (theme, sounds, tasks, calendar,
                        pomodoro, dashboard, quotes, notifications, shortcuts,
                        import/export, share, print, achievements, onboarding…)
js/app.js               Bootstraps everything, view switching, service worker registration
icons/                  App icons (generated), favicon, OG image
```

All JavaScript uses plain `<script defer>` tags (no ES modules), specifically
so the app also works when opened directly via `file://` — ES modules are
blocked by CORS under `file://` in Chromium-based browsers.

**No `/fonts`, `/sounds`, or `/images` folders**: text uses the OS's own
system font stack (crisp, zero network requests, perfect offline reliability)
and sound effects are synthesized on the fly with the Web Audio API rather
than shipped as files — both deliberate choices to keep the app fast and
dependency-free. `/assets` was in the original folder plan but ended up
unused for the same reason, so it was left out rather than shipped empty.

## Browser support

Built for current evergreen browsers (Chrome, Edge, Firefox, Safari). Uses
`color-mix()` with a static fallback declared first, so older browsers get a
solid tint color instead of the dynamic one — nothing breaks either way.
