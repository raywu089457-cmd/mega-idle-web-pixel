# Task 02 — Resource System Dev Report

## Status: ✅ Complete

## Changes Made

### New Files Created

| File | Description |
|------|-------------|
| `js/systems/resourceSystem.js` | Resource CRUD, capacity management, material production (1-3/tick) |
| `js/data/gameData.js` | Game data definitions: resources, buildings, heroes, zones, items |
| `js/main.js` | Game loop (1-sec tick), initialization, save coordination |
| `js/systems/heroSystem.js` | Territory + Wandering hero AI, combat, shopping |
| `index.html` | Game entry, HUD, nav, modals, UI controller |
| `css/style.css` | Medieval fantasy theme, responsive design |
| `manifest.json` | PWA manifest |
| `sw.js` | Service Worker for offline caching |

## Architecture Decisions

1. **Singleton pattern** — Each system exposes a singleton object via IIFE
2. **Event-driven UI** — Systems use listener callbacks, UI dispatches custom events
3. **1-second tick** — Per spec (2026-04-26), not 30 seconds from older docs
4. **Immutability** — Resource changes create new values, never mutate in place
5. **No build step** — Pure ES6+, all files loaded via script tags

## Resource Types Implemented

| ID | Name | Initial | Capacity |
|----|------|---------|----------|
| gold | Gold | 500 | 10,000 |
| magicStones | Ancient Magic Stones | 0 | 999 |
| fruitPoor | 劣等水果 | 0 | 500 |
| waterDirty | 髒水 | 0 | 500 |
| woodRotten | 腐朽木頭 | 0 | 500 |
| ironRusty | 鏽跡斑斑的鐵 | 0 | 500 |
| herbLow | 低等藥材 | 0 | 500 |

## Hero System Features

- **Territory Heroes**: owned, trainable, can explore maps
- **Wandering Heroes**: auto-spawn every 2 min, 60% fight / 30% shop / 10% leave
- **Combat**: simplified stat-based resolution, rewards gold + magic stones
- **Shopping**: random purchase from available items

## Questions / Assumptions

- Monument level assumed to be 1 for production (no upgrade persistence yet)
- Building state hardcoded defaults (need buildingSystem to persist upgrades)
- Map exploration not yet connected to tick system

## Next Step Recommendation

1. **Build shopSystem** (Tier 3) — material → gold conversion, item crafting
2. **Build mapSystem** (Tier 3) — zone exploration with territory heroes
3. **Build canvasRenderer** (Tier 5) — visual representation of kingdom

## Files Summary

```
mega-idle-web/
├── index.html              ✅ Complete (entry + UI)
├── manifest.json           ✅ Complete (PWA)
├── sw.js                   ✅ Complete (offline)
├── css/style.css           ✅ Complete (theme)
└── js/
    ├── main.js             ✅ Complete (loop + init)
    ├── data/
    │   ├── gameData.js     ✅ Complete (definitions)
    │   └── saveManager.js ✅ Complete (persistence)
    └── systems/
        ├── resourceSystem.js  ✅ Complete (resources)
        └── heroSystem.js      ✅ Complete (heroes)
```
