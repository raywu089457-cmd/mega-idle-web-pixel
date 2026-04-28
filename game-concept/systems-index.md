# Systems Index: Idle Kingdom Builder

> **Status**: Draft
> **Created**: 2026-03-29
> **Last Updated**: 2026-03-29
> **Source Concept**: design/gdd/game-concept.md

---

## Overview

Idle Kingdom Builder is an idle/kingdom-builder/hero-collector hybrid. The core loop centers on passive resource production from the Ancient Monument, shop-based item crafting that wandering heroes auto-purchase, and active territory-hero exploration into increasingly difficult maps. The game has two hero types (Territory and Wandering), dual currencies (Gold and Ancient Magic Stones), and a building system that unlocks via kingdom progression.

Systems needed: resource management, hero stats/combat, shop economy, auto-AI for wandering heroes, map exploration, and guild tasks.

---

## Systems Enumeration

| # | System Name | Category | Priority | Status | Design Doc | Depends On |
|---|-------------|----------|----------|--------|------------|------------|
| 1 | Resource System | Economy | MVP | Designed / Approved | — | None |
| 2 | Save System | Persistence | MVP | Skeleton | — | None |
| 3 | UI System | Presentation | MVP | Not Started | — | None |
| 4 | Ancient Monument Production | Economy | MVP | Not Started | — | Resource System |
| 5 | Hero Stats System | Gameplay | MVP | Not Started | — | Resource System |
| 6 | Building System | Economy | MVP | Not Started | — | Resource System |
| 7 | Item System | Economy | MVP | Not Started | — | Resource System |
| 8 | Shop System | Economy | MVP | Not Started | — | Building System, Item System |
| 9 | Hero Recruitment & Management | Gameplay | MVP | Not Started | — | Hero Stats System, Building System |
| 10 | Enemy System | Gameplay | MVP | Not Started | — | Hero Stats System |
| 11 | Combat System | Gameplay | MVP | Not Started | — | Hero Stats System, Enemy System |
| 12 | Wandering Hero AI | Gameplay | MVP | Not Started | — | Hero Recruitment, Combat System, Shop System |
| 13 | Hero Training System | Economy | MVP | Not Started | — | Hero Stats System, Resource System |
| 14 | Map Exploration System | Gameplay | VS+ | Not Started | — | Combat System, Hero Recruitment, Enemy System |
| 15 | Guild System | Gameplay | Alpha | Not Started | — | Map Exploration, Enemy System |

---

## Categories

| Category | Description |
|----------|-------------|
| **Economy** | Resource creation and consumption, crafting, shops, currencies |
| **Gameplay** | Combat, AI, exploration, hero management |
| **Persistence** | Save/load, settings, profile |
| **Presentation** | UI, HUD, menus, notifications |

---

## Priority Tiers

| Tier | Definition | Target Milestone |
|------|------------|------------------|
| **MVP** | Required for the core loop to function | First playable prototype (6-8 weeks) |
| **Vertical Slice** | Required for one complete, polished area | +4 weeks |
| **Alpha** | All features present in rough form | +4 weeks |
| **Full Vision** | Polish, edge cases, nice-to-haves | +4 weeks |

---

## Dependency Map

### Foundation Layer (no dependencies)

1. **Resource System** — All economy and gameplay depends on currencies and materials existing
2. **Save System** — All persistent state depends on save/load infrastructure

### Core Layer (depends on foundation)

1. **UI System** — Player interaction layer, depends on save system for settings
2. **Ancient Monument Production** — Timer-based resource generation; depends on Resource System
3. **Hero Stats System** — Base stats (HP, ATK, DEF, Level) for all heroes; depends on Resource System
4. **Building System** — Construction and upgrade logic; depends on Resource System
5. **Item System** — Weapons, armor, potions as game objects; depends on Resource System

### Feature Layer (depends on core)

1. **Shop System** — Buildings consume materials to produce items; wandering heroes auto-purchase; depends on Building System, Item System
2. **Hero Recruitment & Management** — Territory hero slots (10 base) + Wandering hero roster (20 types); depends on Hero Stats System, Building System
3. **Enemy System** — Regular, Elite, Boss, World Boss enemies with scaled stats; depends on Hero Stats System
4. **Combat System** — Damage calculation, victory/defeat resolution; depends on Hero Stats System, Enemy System
5. **Hero Training System** — Training ground upgrades heroes; territory heroes cost kingdom gold, wandering heroes cost personal gold; depends on Hero Stats System, Resource System

### Advanced Feature Layer (depends on feature)

1. **Wandering Hero AI** — Auto-team formation (3-5), auto-combat on explored maps, auto-shopping; depends on Hero Recruitment, Combat System, Shop System
2. **Map Exploration System** — Territory heroes deploy to maps, difficulty scaling per zone, material rewards; depends on Combat System, Hero Recruitment, Enemy System
3. **Guild System** — Issue tasks, request World Boss hunts; depends on Map Exploration, Enemy System

---

## Recommended Design Order

| Order | System | Priority | Layer | Est. Effort |
|-------|--------|----------|-------|-------------|
| 1 | Resource System | MVP | Foundation | S |
| 2 | Save System | MVP | Foundation | S |
| 3 | UI System | MVP | Core | M |
| 4 | Ancient Monument Production | MVP | Core | S |
| 5 | Hero Stats System | MVP | Core | S |
| 6 | Building System | MVP | Core | M |
| 7 | Item System | MVP | Feature | S |
| 8 | Shop System | MVP | Feature | M |
| 9 | Hero Recruitment & Management | MVP | Feature | M |
| 10 | Enemy System | MVP | Feature | S |
| 11 | Combat System | MVP | Feature | M |
| 12 | Wandering Hero AI | MVP | Feature | L |
| 13 | Hero Training System | MVP | Feature | S |
| 14 | Map Exploration System | VS+ | Advanced | L |
| 15 | Guild System | Alpha | Advanced | M |

---

## Circular Dependencies

None found.

---

## High-Risk Systems

| System | Risk Type | Risk Description | Mitigation |
|--------|-----------|-----------------|------------|
| Wandering Hero AI | Design | Complex state machine with multiple simultaneous behaviors (auto-team, auto-combat, auto-shopping) | Prototype early, keep state machine simple |
| Combat System | Technical | Need to handle background/offline combat resolution correctly for idle mechanics | Design timer-based resolution with catch-up logic |
| Map Exploration System | Scope | Full map generation with difficulty scaling is larger than MVP scope | Defer to Vertical Slice, MVP uses static map zones |

---

## Progress Tracker

| Metric | Count |
|--------|-------|
| Total systems identified | 15 |
| Designed | 2 (Resource, UI) |
| Skeleton | 1 (Save) |
| Not Started | 12 |
| MVP systems designed | 0/13 |
| Vertical Slice systems designed | 0/1 |

## Prototype Status

| Prototype | Location | Status |
|-----------|----------|--------|
| Core Idle Loop | `prototype/` | **Working** - Resource production + Wandering Hero AI functional |

---

## Next Steps

- [ ] **PLAY TEST** the prototype at `prototype/` - run in Godot 4.6
- [ ] Provide feedback on core loop feel
- [ ] Design next system: Save System or Hero Stats System
- [ ] Add shop system to prototype
- [ ] Add building construction to prototype
