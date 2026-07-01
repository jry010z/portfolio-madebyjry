# (MADEBYJRY)® OS — Portfolio Site

## Owner
JRY / madebyjry — editor, content manager, designer (site replaces jry.world).

## Concept
Retro desktop-OS portfolio (inspired by fuji.gg) in a bold Swiss-poster theme:
RED background, BLACK Helvetica (Anton) type, pixel UI font (VT323), cream retro chrome.
Boot screen with "PRESS START", desktop launcher icons, draggable .exe windows,
Windows-style taskbar + START menu.

## Sections / Apps
- My Work: Finder-style with categories Thumbnails / Shorts / Long-form / Designs (API-driven)
- Network: creators & brands with avatars, names, followers
- Contact: social links only (X, Discord, Instagram)
- About: bio + stats
- Studio (Admin): passcode-gated, add/delete Work & Clients

## Tech
- Backend: FastAPI + MongoDB. Collections: work, network. Seeded on startup.
  Endpoints: /api/work (+?category), /api/network, /api/admin/verify, POST/DELETE guarded by X-Admin-Passcode.
- Frontend: React, framer-motion (window drag), lucide-react icons.
- Admin passcode via backend .env ADMIN_PASSCODE (default jry2026).

## Done
- 2026-07-01: MVP macOS-style build (tested 14/14 backend, frontend flows pass).
- 2026-07-01: Rebranded (JRY)->(MADEBYJRY); full retro red/black poster theme redesign.

## Backlog / Next
- P1: Let JRY upload images directly (object storage) instead of pasting URLs.
- P1: Day/Night theme toggle (fuji-style).
- P2: Reorder work/clients via drag; per-item video embeds.
- P2: Skip boot screen on repeat visits (localStorage).
- P2: Sound FX on click/boot for extra retro feel.
