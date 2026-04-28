# Task 03 — Shop System Dev Report

## Status: ✅ Complete

## Changes Made

### New Files Created

| File | Description |
|------|-------------|
| `js/systems/shopSystem.js` | Shop crafting, wandering hero purchases, auto-production |
| `js/systems/mapSystem.js` | Zone exploration, rewards calculation, zone unlocking |
| `js/systems/offlineSystem.js` | Offline progress calculation (8h cap, 50% efficiency) |

### Updated Files

| File | Changes |
|------|---------|
| `js/main.js` | Integrated shopSystem, mapSystem, offlineSystem into game loop |
| `index.html` | Added script tags for new systems, updated welcome-back modal format |
| `css/style.css` | Added `.note` style for offline earnings cap indicator |

## Architecture Decisions

1. **Shop System**: Materials consumed to craft items → wandering heroes auto-purchase → gold to kingdom
2. **Map System**: Exploration progress based on hero stats (ATK+DEF)/2, 100 progress = zone cleared
3. **Offline System**: 8-hour cap, 50% efficiency, wandering heroes estimated at 50 gold/minute

## Shop System Features

- `craftItem(itemId)` — deduct materials, add to inventory
- `processShopping(hero)` — wandering hero purchases from stock
- `processAutoProduction()` — higher shop levels auto-produce items
- Inventory capacity: 100 per item type

## Map System Features

- `startExploration(heroId, zoneId)` — send hero to explore
- `processExplorations()` — progress tick, completion rewards
- 5 zones with increasing difficulty (1-5 stars)
- Zone unlock: clearing zone N unlocks zone N+1

## Offline System Features

- `calculateOfflineProgress(lastOnline, returnTime)` — full offline calculation
- `previewOfflineEarnings()` — preview without applying
- `markOffline()` / `markOnline()` — lifecycle tracking
- 50% efficiency multiplier on offline production

## Next Step Recommendation

1. **visual-canvas** (Tier 5) — Canvas rendering for kingdom view, heroes, floating numbers
2. **Building Panel UI** — allow upgrading buildings
3. **Hero Panel UI** — show territory/wandering heroes with actions

## Files Summary

```
mega-idle-web/
├── index.html              ✅ Complete
├── manifest.json           ✅ Complete
├── sw.js                   ✅ Complete
├── css/style.css           ✅ Complete
└── js/
    ├── main.js             ✅ Complete (all systems integrated)
    ├── data/
    │   ├── gameData.js    ✅ Complete
    │   └── saveManager.js ✅ Complete
    └── systems/
        ├── resourceSystem.js  ✅ Complete
        ├── heroSystem.js     ✅ Complete
        ├── shopSystem.js     ✅ Complete (new)
        ├── mapSystem.js      ✅ Complete (new)
        └── offlineSystem.js  ✅ Complete (new)
```
