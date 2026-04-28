# UI System

> **Status**: In Design
> **Author**: Game Designer
> **Last Updated**: 2026-03-29
> **Implements Pillar**: Pillar 1 (Always Something Happening), Pillar 2 (Numbers Go Up)

---

## Overview

The UI System provides all player-facing interface elements for the Idle Kingdom Builder. It creates a **glanceable, low-friction interface** where players can monitor their kingdom's prosperity with minimal clicks. The design follows an **overlay panel architecture** — the kingdom map is always visible, with panels sliding in when players need to interact with specific systems.

**Design Philosophy:**
- **Idle-Friendly**: Information is visible at a glance, not buried in menus
- **Satisfying Feedback**: Resource gains feel rewarding through thoughtful animation
- **Minimal Navigation**: Maximum 2 clicks to reach any system
- **2D Pixel Art Style**: 32x32 base resolution, medieval fantasy palette

**Screen Architecture:**
| Screen | Type | Layers |
|--------|------|--------|
| HUD (Top Bar) | Always visible | Base layer |
| Kingdom Map | Always visible (background) | Base layer |
| Resource Panel | Overlay (expanded HUD) | Overlay layer |
| Building Panel | Overlay panel | Overlay layer |
| Hero Panel | Overlay panel | Overlay layer |
| Map Panel | Overlay panel | Overlay layer |
| Combat Result Modal | Modal | Modal layer |
| Guild Panel | Full-screen modal | Modal layer |
| Settings Menu | Full-screen modal | Modal layer |
| Welcome Back Modal | Modal (on resume) | Modal layer |

---

## Player Fantasy

**"Your kingdom's prosperity at a glance."**

Players should feel:
- **Reassured**: The HUD shows resources always ticking upward — progress is happening
- **In Control**: With 2 clicks, they can intervene in any system
- **Rewarded**: Every resource gain has satisfying visual and audio feedback
- **Unhurried**: No rushing to click — information persists, notifications batch

**Reference UI Patterns:**
- Adventure Capitalist: Clean top-bar resources, minimal click navigation
- Cookie Clicker: Satisfying floating numbers on resource gains
- Kingdom (Noam Kroll): Persistent kingdom view with overlay interactions

---

## Detailed Design

### Core Rules

**1. Navigation Architecture**
- Kingdom Map is ALWAYS the background — never obscured completely
- Panels slide in from edges (right: Building/Hero/Map, left: Guild)
- Modals center with dimmed background
- "X" button or click-outside to close panels
- ESC key closes any open panel/modal

**2. Layer Stack**
```
Layer 0: Kingdom Map (parallax background, always visible)
Layer 1: HUD Top Bar (fixed, always visible)
Layer 2: Overlay Panels (semi-transparent ~90% opacity, dim map behind)
Layer 3: Modals (full-screen dim, centered content)
Layer 4: Notifications/Toasts (top-right, highest)
```

**3. Resource Display Rules**
- Gold: Always visible in HUD, shows current / max capacity
- Ancient Magic Stones: Second in HUD, smaller than gold
- Materials: Collapsed icons in HUD, expand to full panel on click
- Numbers animate smoothly (count up/down over 300ms)
- Production rate shown as "+X per 30s" in expanded view

**4. Notification Batching Rules**
- Resource ticks batch per material type per 30-second cycle
- Multiple same-type events within batch window = single aggregated toast
- Toasts stack vertically, oldest on top
- Maximum 3 visible toasts; older ones fade out
- "+X Gold" toasts never batch (gold gains are more exciting)

**5. Animation Standards**
| Animation | Duration | Easing |
|-----------|----------|--------|
| Panel slide in | 200ms | ease-out |
| Panel slide out | 150ms | ease-in |
| Number counter | 300ms | ease-in-out |
| Floating number | 1000ms | ease-out (rise) |
| Toast appear | 150ms | ease-out |
| Toast fade out | 200ms | ease-in |
| Button hover | 100ms | linear |
| Capacity warning pulse | 500ms | loop |

---

### Screen Specifications

#### Screen 1: HUD (Top Bar)

**Position:** Top of screen, full width, height 48px

**Elements (left to right):**
| Element | Width | Content |
|---------|-------|---------|
| Kingdom Name | 120px | Text: player's kingdom name |
| Gold Display | 100px | Icon + "12,345 / 10,000" |
| Magic Stones | 80px | Icon + "234" |
| Material Icons | 5 × 32px | Collapsed icons (tap to expand) |
| Menu Button | 48px | Hamburger icon (opens Settings) |

**States:**
- Normal: Standard display
- Warning (80% capacity): Gold/material icon pulses orange
- Critical (90% capacity): Gold/material icon pulses red
- Overflow (100%): Red flash effect on overflow event

#### Screen 2: Resource Panel (Expanded HUD)

**Trigger:** Click/tap on HUD or materials section

**Position:** Expands downward from HUD, max-height 300px

**Content:**
| Section | Information Shown |
|---------|------------------|
| Gold | Current / Max, "+X per tick" rate, "Full in ~X min" |
| Magic Stones | Current, "+X from exploration" rate |
| Materials (each) | Current / Max, production rate, capacity bar |
| Overflow Warnings | Red indicators for full resources |

**Close:** Click anywhere outside or click HUD again

#### Screen 3: Kingdom Map

**Position:** Full screen background (below HUD and panels)

**Elements:**
| Element | Description |
|---------|-------------|
| Kingdom Center | Central building cluster (Castle, Tavern, shops) |
| Ancient Monument | Prominent, glowing, particles on production tick |
| Exploration Map | Dark areas around kingdom, reveal on explore |
| Hero Markers | Small icons showing hero positions |
| Wandering Hero Caravan | Animated sprite moving through kingdom |

**Interactions:**
- Tap explored map zone → Shows zone info panel
- Tap exploration area → "Send Heroes" confirmation
- Tap kingdom center → Opens Building Panel

#### Screen 4: Building Panel

**Trigger:** Tap kingdom center or tap Building icon in HUD

**Position:** Slides in from right edge, width 400px, full height minus HUD

**Sections:**
| Section | Content |
|---------|---------|
| Header | "Kingdom Buildings" + Kingdom Level |
| Castle | Level, hero capacity (10+X), upgrade button |
| Tavern | Level, hero count, "Recruit" button |
| Training Ground | Level, training costs, select hero to train |
| Shops (5) | Woodcutter, Armor, Weapon, Potion, Guild — each with: Level, Production rate, Upgrade cost |

**Building Card Layout:**
```
[Icon] [Name] Lv.X
      [Status: Producing / Idle / Upgrading]
      [Production Rate: +X/tick]
      [Upgrade Cost: X Gold + Y Materials]
      [UPGRADE Button] (enabled/disabled based on resources)
```

**Close:** X button or click on map

#### Screen 5: Hero Panel

**Trigger:** Tap Hero icon in HUD

**Position:** Slides in from right edge, width 450px

**Tabs:**
| Tab | Content |
|-----|---------|
| Territory Heroes (預設) | 10 slots, assigned heroes with stats, "Explore" button |
| Wandering Heroes | 20 hero types, visiting status, auto-shopping indicators |

**Territory Hero Card:**
```
[Portrait] [Name] [Class]
Lv.X | HP: XXX | ATK: XX | DEF: XX
[Explore] [Train] [Rest]
Status: [Idle / Exploring / Resting]
```

**Wandering Hero Card:**
```
[Portrait] [Name] [Class] [Team: X/5]
Lv.X | HP: XXX | ATK: XX | DEF: XX
Status: [Shopping / Fighting / Passing Through]
```

**Hero Selection for Exploration:**
- Tap "Explore" on hero → Shows Map Panel with zone selection
- Select zone → Confirm team composition → Start exploration

**Close:** X button or click on map

#### Screen 6: Map Panel

**Trigger:** Tap "Explore" on hero or tap exploration area

**Position:** Slides in from right, width 350px

**Content:**
| Section | Description |
|---------|-------------|
| Current Zone | Zone number, difficulty rating, recommended level |
| Explored Zones | List with clear status (Easy/Medium/Hard/Victory) |
| Available Zones | Unexplored areas, tap to see preview |
| Active Explorations | Territory heroes currently deployed, progress timer |

**Zone Info Card:**
```
Zone X: [Name]
Difficulty: ★★☆☆☆ (scales with zone number)
Rewards:
  - Gold: X-Y
  - Ancient Magic Stones: Z% chance
  - Materials: [Drop table]
  - Upgrade Materials: [Drop table]
Recommended Team: Lv.X+
[DEPLOY] or [TEAM FULL — Upgrade Castle]
```

**Close:** X button or tap outside

#### Screen 7: Combat Result Modal

**Trigger:** Auto-appears after exploration completes

**Position:** Center screen, 400px × 300px modal

**Content:**
```
[Victory! / Defeat]
Zone X Exploration Complete

Team: [Hero portraits]
Rewards:
  + XXX Gold
  + X Ancient Magic Stones
  + [Material icons with counts]
  [ITEM NAME] (rare drop, if any)

[COLLECT] Button
```

**Animation:** Modal scales in with slight bounce, rewards animate in one by one

#### Screen 8: Guild Panel

**Trigger:** Tap Guild Hall building or Guild icon

**Position:** Full-screen modal (higher priority than overlay panels)

**Sections:**
| Section | Content |
|---------|---------|
| Quest Board | 3-5 available tasks, refresh timer |
| World Boss | Current boss, damage dealt, summon button |
| Material Exchange | Sell materials for Gold |

**Quest Card:**
```
[Quest Name]
"Defeat X enemies in Zone Y"
Reward: XXX Gold + XX Materials
Progress: 3/10 enemies
[ACCEPT] or [IN PROGRESS]
```

**World Boss Card:**
```
[World Boss Name]
HP: ████████░░ 80%
Your Contribution: XXX damage
Rewards: XXX Gold + XX Magic Stones
[ATTACK] (costs nothing, auto-resolves)
```

**Close:** X button (only way — ESC disabled for this screen)

#### Screen 9: Settings Menu

**Trigger:** Tap hamburger menu in HUD

**Position:** Full-screen modal

**Sections:**
| Section | Options |
|---------|---------|
| Audio | Music Volume, SFX Volume, Mute All |
| Notifications | Enable/Disable toasts, Sound alerts |
| Game | [Save Game], [Load Game], [New Game] |
| About | Version, Credits |

**Save/Load:**
- Single save slot (future: multiple slots)
- Shows last saved timestamp
- Auto-save indicator ("Saved X seconds ago")

#### Screen 10: Welcome Back Modal

**Trigger:** On game resume after being away

**Position:** Center screen, 450px × 400px

**Content:**
```
Welcome Back, [Kingdom Name]!

You were away for: X hours Y minutes

While you were gone:
  + XXX Gold (from wandering hero purchases)
  + XX Ancient Magic Stones
  + XX Materials (from Ancient Monument)
  + X Explorations completed

[COLLECT ALL] Button
```

**Animation:** Resources count up rapidly one by one, satisfying "ka-ching" sound

---

### Visual Design System

**Color Palette:**
| Color | Hex | Usage |
|-------|-----|-------|
| Gold | #FFD700 | Gold icons, gold text, prosperity indicators |
| Magic Purple | #9B59B6 | Magic stone icons, premium elements |
| Wood Brown | #8B4513 | Building frames, panel backgrounds |
| Parchment | #F5DEB3 | Text backgrounds, modal backgrounds |
| Text Dark | #2C1810 | Primary text |
| Text Light | #F5F5DC | Secondary text on dark backgrounds |
| Warning Orange | #FF8C00 | 80% capacity warnings |
| Danger Red | #DC143C | 90%+ warnings, overflow alerts |
| Success Green | #27AE60 | Victory, positive feedback |
| Button Blue | #3498DB | Primary action buttons |
| Button Hover | #2980B9 | Button hover state |

**Typography:**
| Element | Font | Size | Style |
|---------|------|------|-------|
| Kingdom Name | Pixel Font | 24px | Bold |
| Resource Values | Pixel Font | 18px | Normal |
| Panel Headers | Pixel Font | 20px | Bold |
| Body Text | Pixel Font | 14px | Normal |
| Button Labels | Pixel Font | 16px | Bold |
| Notifications | Pixel Font | 14px | Normal |

**Pixel Art Standards:**
- Base resolution: 32x32 for UI icons
- Font rendering: Crisp pixel font (no anti-aliasing)
- Sprite scaling: Integer multiples only (1x, 2x, 3x)
- Panel borders: 4px pixel art frames
- Button states: 3 states (normal, hover, pressed)

---

## Formulas

**F1: Resource Display Formatting**
```
display_value = format_number(value, show_decimals=false)
display_capacity = format_number(max_capacity, show_decimals=false)
display_string = "{current} / {max}" (e.g., "12,345 / 10,000")
```

**F2: Production Rate Calculation**
```
rate_per_second = total_production_per_tick / tick_interval
display_rate = "+{rate} per {tick_interval}s"
```

**F3: Capacity Percentage**
```
capacity_percent = (current / max) * 100
warning_threshold = 80
critical_threshold = 90
```

**F4: Notification Batching**
```
batch_key = resource_type + floor(current_time / batch_window)
batch_count[batch_key]++
if batch_count[batch_key] > 1:
  display = "+{total_amount} ({batch_count}x batched)"
```

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| Panel open when timer fires | Panel stays open, toast appears above panel |
| Multiple panels opened simultaneously | Only newest panel is interactive, older ones dim |
| Resource spent while panel open | Panel updates immediately, no close |
| Hero dies during exploration (if implemented) | Modal interrupts any screen, must acknowledge |
| Wandering hero visits while in settings | Shopping event queues, shows after settings close |
| Game crash during save | Recovery on next launch via backup file |
| Resolution change mid-game | UI scales, no restart required |
| Very long kingdom name | Truncate with "..." at 15 characters |
| 100+ toasts queued | Older toasts fade as new ones appear, max 3 visible |

---

## Dependencies

| System | Direction | Interface Consumed |
|--------|-----------|-------------------|
| Resource System | Depends on | Gold, Magic Stones, Materials (current values, capacity, rates) |
| Save System | Depends on | Save confirmation, Load game state |
| Building System | Depends on | Building states, upgrade availability |
| Hero System | Depends on | Hero stats, locations, states |
| Combat System | Depends on | Combat results, rewards |
| Map System | Depends on | Zone info, exploration progress |
| Audio System | Triggers | Sound events for UI interactions |

---

## Tuning Knobs

| Parameter | Default | Range | Effect |
|-----------|--------|-------|--------|
| `toast_duration_ms` | 2000 | 1000-5000 | How long toasts stay visible |
| `toast_max_visible` | 3 | 1-5 | Maximum simultaneous toasts |
| `batch_window_sec` | 30 | 10-120 | Time window for batching notifications |
| `panel_slide_duration_ms` | 200 | 100-400 | Panel animation speed |
| `number_animate_duration_ms` | 300 | 100-600 | Number counter animation speed |
| `floating_number_duration_ms` | 1000 | 500-2000 | How long "+X" floats up |
| `warning_pulse_interval_ms` | 500 | 250-1000 | Capacity warning pulse speed |

---

## Visual/Audio Requirements

| Event | Visual Feedback | Audio Feedback | Priority |
|-------|----------------|---------------|----------|
| Panel open | Panel slides in, background dims | Soft "whoosh" | High |
| Panel close | Panel slides out, background restores | Soft "whoosh" out | Medium |
| Resource gain | Floating "+X" rises and fades | Soft "ding" (varies by type) | High |
| Gold gain | Gold icon pulses, larger floating text | Coin clink | High |
| Capacity warning | Icon pulses orange/red | None (silent) | Medium |
| Overflow event | Screen edge flashes red briefly | Warning tone | Medium |
| Button hover | Slight scale up (1.05x), brightness increase | None | Low |
| Button press | Scale down (0.95x), color darken | Soft "click" | Low |
| Exploration complete | Modal scales in with bounce | Victory chime | High |
| Welcome back | Resources count up rapidly | "Ka-ching" progression | Medium |

---

## UI Requirements

| Screen | Open Method | Close Method | Data Refresh |
|--------|------------|-------------|--------------|
| HUD | Always visible | N/A | Real-time |
| Resource Panel | Tap HUD | Tap outside | Real-time |
| Building Panel | Tap kingdom center | X, outside, ESC | On open |
| Hero Panel | Tap hero icon | X, outside, ESC | On open |
| Map Panel | Tap explore | X, outside, ESC | On open |
| Combat Result | Auto on completion | Collect button | One-time |
| Guild Panel | Tap guild | X only | On open |
| Settings | Tap menu | X, outside, ESC | On open |
| Welcome Back | Auto on resume | Collect button | One-time |

---

## Acceptance Criteria

- [ ] **AC1**: All 10 screens are implemented and accessible
- [ ] **AC2**: HUD always shows gold, magic stones, and material icons
- [ ] **AC3**: Tapping resources expands to detailed Resource Panel
- [ ] **AC4**: Panels slide in/out with 200ms animation
- [ ] **AC5**: Numbers animate smoothly over 300ms
- [ ] **AC6**: Toasts batch per resource type per 30-second window
- [ ] **AC7**: Capacity warnings appear at 80% (orange) and 90% (red)
- [ ] **AC8**: All buttons have hover and press states
- [ ] **AC9**: ESC key closes any open panel/modal (except Guild)
- [ ] **AC10**: Welcome Back modal appears on game resume
- [ ] **AC11**: Settings menu allows save/load/new game
- [ ] **AC12**: UI scales cleanly at different resolutions
- [ ] **AC13**: No clicks required beyond 2 to reach any system

---

## Open Questions

| Question | Owner | Priority | Notes |
|----------|-------|----------|-------|
| Multiple save slots? | Design | Medium | MVP = 1 slot, future = 3 slots |
| Screen shake on big events? | Design | Low | Recommend subtle shake on boss defeat |
| Particle effects density? | Art | Low | MVP = minimal particles |
| Fullscreen vs windowed? | Tech | Medium | Default to windowed, fullscreen option |
| Keyboard shortcuts? | UX | Low | MVP = none, future = hotkeys |

---

## Progress Tracker

| Metric | Count |
|--------|-------|
| Total screens | 10 |
| Screen 1 (HUD) | Implemented |
| Screen 2 (Resource Panel) | Implemented |
| Screen 3 (Kingdom Map) | Implemented |
| Screen 4 (Building Panel) | Implemented |
| Screen 5 (Hero Panel) | Implemented |
| Screen 6 (Map Panel) | Implemented |
| Screen 7 (Combat Result Modal) | Implemented |
| Screen 8 (Guild Panel) | Implemented |
| Screen 9 (Settings) | Implemented |
| Screen 10 (Welcome Back) | Implemented |
