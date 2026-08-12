# RKN Associates — Website

**Version 5.0 · Ivory & Gold · Cinematic Hero Edition**
Rebuilt April 2026 · Static multi-page HTML

---

## What's Inside

```
rkn-associates/
├── index.html              ← Home (zoom parallax, 12+ stamp, blurred stats bg)
├── about.html              ← Heritage photo reveal hero, 3-photo leadership, 2×2 awards
├── services.html           ← Welding sparks Canvas hero
├── projects.html           ← Three.js 3D cloud hero (desktop) + CSS fallback (mobile)
├── contact.html            ← Animated Tamil Nadu map hero
├── 404.html                ← Themed error page
└── assets/
    ├── shared.css
    ├── shared.js
    ├── translations.js     ← 368 keys × 2 languages (EN + TA)
    ├── images.js           ← 54 project images + 14 misc assets (base64)
    ├── logo-transparent.png, logo-200.png, logo-512.png
    ├── favicon.ico
    └── favicon-{16,32,48,64,96,192,256}.png
```

## v5 Changes from v4

### Hero Redesigns — unique per page
- **Home** — existing zoom parallax kept; NEW radial vignette fix for text legibility over project images
- **About** — NEW "Museum Photo Reveal": heritage photo fades from B&W → color on scroll/load, 6 drifting gold particles
- **Services** — NEW "The Forge": Canvas particle system with 18 live welding sparks, warm orange glow, brushed metal texture
- **Projects** — NEW "Wall of Work": Three.js 3D image cloud with 48 project thumbnails, mouse parallax, scroll-driven zoom. Mobile fallback: CSS grid
- **Contact** — NEW "The Signal": animated SVG Tamil Nadu map drawing itself in gold, 7 project city dots

### Site-wide Additions
- **Custom gold ring cursor** (desktop) — 24px ring + 4px dot, expands to 48px on hover. Disabled on touch, respects reduced-motion
- **Image tilt** — landmark project tiles respond to cursor with 3D rotation
- **Spotlight glow** — soft gold radial glow follows cursor on dark sections

### Home Page Changes
- **Stats box** now has a blurred award ceremony photo background with dark overlay + warm gold tint
- **"12+ Architects" box** — Stamp/seal animation: two gold rings expand on scroll-in, text fades up after
- **Stats updated** — "3 Government Awards" → "4 Government Awards" everywhere
- **Portfolio section** — Radial vignette behind headline for legibility

### About Page — Leadership
- 3 photo cards with gold hairline frames (4:5 portrait)
- New order: Hussain Sahib (Founder) → Syed Hasan Kuddos Sahib (Co-Founder) → Hidhayaa (CEO)

### About Page — Recognition
- **2×2 grid, 4 award cards** (upgraded from 3-card row)
- Star Achiever 2009 — with ceremony photo
- Bharat Ratna Dr. MGR 2010 — with ceremony photo
- Viswa Jothi 2012 — elegant text-only treatment (double gold border, italic caption)
- **NEW** Business Excellence Award 2015 — with certificate exchange photo

### Content Updates
- **Email:** `hajihaz@gmail.com` → **`iamhajihaz@gmail.com`** everywhere
- **Credit:** `Allbee` → **`Allbee Solutions`**

---

## How to Deploy

Upload the entire folder to any static host (Netlify, Vercel, GitHub Pages, or cPanel/FTP to `public_html/`). Ensure `index.html` serves at root. Point `rknassociates.com` DNS at it. Done.

## Core Business Details

- **Primary phone:** +91 94894 86081
- **Secondary:** +91-44-2858 8653 (office landline), +91 94441 32481 (mobile)
- **Primary email:** iamhajihaz@gmail.com
- **Secondary email:** arkn_associates@hotmail.com
- **Address:** New No:21, Khana Bagh Street, Triplicane, Chennai 600005
- **GST:** Placeholder `33ABCDE1234F1Z5` — replace in `assets/translations.js` → `footer_gst` (both EN + TA)

## Technical Notes

- **External dependencies:** Google Fonts CDN + Three.js CDN (Projects page only, ~40KB on-demand)
- **First load:** ~8 MB (embedded image library). Cached after, subsequent pages near-instant
- **Mobile optimisations:** Three.js disabled (CSS fallback), sparks reduced, cursor/tilt/spotlight disabled on touch
- **Accessibility:** All motion respects `prefers-reduced-motion`

## Browser Support

Chrome, Safari, Edge, Firefox (last 2 versions) · iOS Safari 14+ · Android Chrome (current)

## Editing Later

- **Text:** `assets/translations.js` — edit both `en:` and `ta:` blocks
- **Phone/email:** search `+91 94894 86081` and `iamhajihaz@gmail.com` across files
- **GST:** `assets/translations.js` → `footer_gst` key

---

Design + build: **Allbee Solutions** · allbee.in
