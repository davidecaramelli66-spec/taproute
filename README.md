# TapRoute

Tap a map, get a snapped route and a distance, export a GPX. Built for personal
route planning — roughly the drawing-and-measuring half of Footpath.

## Run it on this Mac

```
node taproute/server.js
```

Then open http://localhost:8123

## What it does

- **Tap the map** to drop points. Each new leg snaps to real roads and paths.
- **Foot / Bike / Straight** — foot and bike snap to the matching network;
  straight draws direct lines (useful for beaches, fields, trackless ground).
- **Drag a point** to nudge the route; only the two adjacent legs re-route.
- **Tap a point** to delete it. **Tap the route line** to insert a point there.
- **Close loop** routes back to the start. **Out & back** mirrors the route.
- **Distance** in km and miles, plus estimated time from a pace you set.
- **Save** routes to this browser on this device; reopen or re-export later.
- **Export GPX** — a standard GPX 1.1 track file, ready for Strava, Komoot,
  WorkOutDoors, Garmin, or anything else that reads GPX.
- **Search** to jump to a place.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The whole app — markup, styles, logic. No build step. |
| `manifest.json` | Lets iOS treat it as an app when added to the Home Screen. |
| `server.js` | A ~20-line static file server for running it locally. |

## Services it uses

All free, no API keys, no accounts:

- **Map tiles** — OpenStreetMap, CyclOSM, OpenTopoMap
- **Route snapping** — FOSSGIS public OSRM (foot and bike profiles)
- **Place search** — Nominatim

These are community-funded servers. Fine for one person planning routes; they
are not for heavy or commercial use. If snapping ever fails, the leg falls back
to a dashed straight line and the app keeps working.

## Getting it on your phone

The app is three static files, so any free static host will serve it:

1. Put the folder on a host (GitHub Pages, Cloudflare Pages, Netlify).
2. Open the URL in Safari on your iPhone.
3. Share → **Add to Home Screen**. It then opens full-screen, no browser chrome.

Exported GPX files land in the **Files** app, where you can hand them to
whichever app you use on the watch.

## Known limits

- Saved routes live in that one browser's storage — they do not sync between
  your Mac and your phone. Use the GPX export to move a route.
- No elevation profile yet.
- No offline map caching; it needs a connection to draw tiles and snap routes.
