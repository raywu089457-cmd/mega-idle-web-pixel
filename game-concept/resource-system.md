# Resource System

> **Status**: In Design
> **Author**: Designer
> **Last Updated**: 2026-03-29
> **Implements Pillar**: Pillar 2: Numbers Go Up

## Overview

The Resource System is the central economy layer of the game, responsible for tracking and managing all in-game currencies and materials. As an idle kingdom-building game, the core responsibility is ensuring the satisfaction of "numbers going up" — resources accumulate continuously whether the player is online or not.

**Resource Types:**
| Resource | Use Case | Acquisition |
|----------|----------|-------------|
| **Gold Coins** | Building construction, hero recruitment, training | Wandering heroes purchase items, exploration rewards |
| **Ancient Magic Stones** | Upgrading Ancient Resource Producer, purchasing rare upgrade materials | Exploration random drops |
| **5 Base Materials** | Shop crafting | Ancient Resource Producer timer-based production |
| **Upgrade Materials** | Upgrading Ancient Resource Producer | Exploration drops, Ancient Shop purchase |

**Player Interaction:**
- Passive: Watching resources accumulate automatically (from Ancient Producer, wandering hero purchases)
- Active: Spending gold on building/training, spending magic stones on upgrades

**Single-Player Architecture:**
- All resources are local to the player's kingdom
- Local save/load with no server dependency

## Player Fantasy

**"Your kingdom's treasury overflows."**

The player feels two emotions simultaneously:

**1. 休閒舒適 — The Comfort of Watching Numbers Grow**
- Opening the game after hours away to see resources accumulated
- Watching wandering heroes automatically purchase items, coins flowing in
- The gentle satisfaction of a self-sustaining economy that hums along

**2. 策略深度 — The Strategy of Smart Allocation**
- Deciding whether to spend gold on more heroes or better equipment
- Balancing short-term gains (buying a shop) vs. long-term growth (saving for monument upgrade)
- Choosing when to send heroes to explore for Ancient Magic Stones vs. grinding gold
- The strategic tension between "buy now" vs. "save for something better"

**Reference games that nail this feeling:**
- Adventure Capitalist: The satisfying idle accumulation with light optimization
- Cookie Clicker: The dopamine of watching numbers grow while making occasional strategic choices

The fantasy is **prosperity on your terms** — the resources flow automatically, but the player directs where they go.

## Detailed Design

### Core Rules

#### 1. Resource Types

| ID | Resource Name | Type | Icon Color | Max Capacity (Base) |
|----|--------------|------|-----------|---------------------|
| `gold` | Gold Coins | Currency | Yellow (#FFD700) | 10,000 (expandable) |
| `magic_stone` | Ancient Magic Stones | Premium Currency | Purple (#9B59B6) | 999 |
| `fruit_poor` | 劣等水果 | Material | Red (#E74C3C) | 500 |
| `water_dirty` | 髒水 | Material | Brown (#8B4513) | 500 |
| `wood_rotten` | 腐朽木頭 | Material | Tan (#D2691E) | 500 |
| `iron_rusty` | 鏽跡斑斑的鐵 | Material | Gray (#7F8C8D) | 500 |
| `herb_low` | 低等藥材 | Material | Green (#27AE60) | 500 |
| `upgrade_mat_t1` | 初級升級材料 | Upgrade Material | Blue (#3498DB) | 100 |
| `upgrade_mat_t2` | 中級升級材料 | Upgrade Material | Cyan (#1ABC9C) | 50 |
| `upgrade_mat_t3` | 高級升級材料 | Upgrade Material | Gold (#F39C12) | 20 |

#### 2. Resource Generation Rules

**A. Ancient Resource Producer (遠古資源製造器)**
- Produces base materials automatically every 30 seconds
- Production is passive — no player action required
- Each production tick generates: 1-3 of each material type (random within range)
- Production rate increases with monument level (see Formulas section)

**B. Wandering Hero Purchases**
- When a wandering hero purchases from a shop, gold flows to kingdom treasury
- Gold amount = item's sale price
- Instant addition to kingdom gold pool

**C. Exploration Rewards**
- When a territory hero completes a map:
  - 100% of any Ancient Magic Stones found → kingdom treasury
  - Gold reward based on map difficulty
  - Material drops based on map loot table
- When a wandering hero completes a map:
  - 20% of any Ancient Magic Stones found → kingdom treasury
  - 80% kept by the wandering hero (for their personal upgrades)

**D. Guild Tasks**
- Completing guild tasks grants gold and/or upgrade materials
- World Boss defeat rewards: large gold pile + guaranteed Ancient Magic Stones

#### 3. Resource Spending Rules

**A. Gold Spending**
| Action | Cost |
|--------|------|
| Build new building | 500-5000 gold (varies by building) |
| Upgrade building | 1000-10000 gold |
| Train territory hero | 200 gold |
| Recruit new territory hero | 1000 gold |
| Speed up production | 50 gold (skip wait) |

**B. Ancient Magic Stone Spending**
| Action | Cost |
|--------|------|
| Upgrade Ancient Resource Producer | 10 / 25 / 50 / 100 / 200 T1/T2/T3 materials |
| Purchase rare upgrade materials (Ancient Shop) | 5-50 magic stones per item |

**C. Spending Confirmation**
- All resource spends require confirmation (prevent accidental spending)
- Insufficient resources → action greyed out with tooltip showing deficit

#### 4. Resource Capacity & Overflow

**Soft Cap System:**
- Base capacity is 10,000 gold / 500 materials (expandable via Kingdom Vault building)
- When at capacity, production continues but excess is lost
- **UI Warning**: When resources reach 90% capacity, show warning indicator
- **Overflow Protection**: Production ticks that would exceed capacity are lost (not banked)

**Kingdom Vault Building** (unlocks at Castle Level 2):
- Each level adds +5,000 gold capacity and +100 material capacity per slot
- Material-specific vaults (separate capacity per material type)

#### 5. Resource Display Rules

**HUD Display:**
- Always show: Gold (current / max capacity)
- Tap to expand: All currencies with current/max values
- Animated number counters when values change
- "+X" floating text on resource gain
- Red flash on resource loss

**Notification Thresholds:**
- 50% capacity: Subtle indicator
- 80% capacity: Warning indicator (yellow)
- 90% capacity: Alert indicator (orange)
- 100% capacity: Overflow warning (red) + "Spend resources!" prompt

### States and Transitions

The Resource System itself has no player-facing states (it's always "on"). However, individual resources have capacity states:

#### Resource Capacity States

| State | Condition | Visual Indicator | Player Action |
|-------|-----------|-----------------|----------------|
| **Normal** | value < 80% capacity | None | None required |
| **Warning** | 80% ≤ value < 90% | Yellow border | Consider spending |
| **Critical** | 90% ≤ value < 100% | Orange pulse | Urgently spend |
| **Overflow** | value = 100% | Red flash | Must spend or lose |
| **Locked** | max_capacity = 0 | Grayed out | Upgrade Kingdom Vault |

#### Resource Transaction Types

| Transaction Type | Source | Destination | Notification |
|-----------------|--------|-------------|--------------|
| `production_tick` | System | Kingdom | Silent (continuous) |
| `wandering_purchase` | Wandering Hero | Kingdom | "+X Gold" popup |
| `exploration_reward` | Map | Kingdom | Loot summary modal |
| `guild_task_reward` | Guild | Kingdom | Task completion modal |
| `building_cost` | Kingdom | System | "-X Gold" with building name |
| `training_cost` | Kingdom | System | "-X Gold" with hero name |
| `upgrade_cost` | Kingdom | System | "-X Gold/Materials" |

#### Offline Progress (Idle Core)

When player returns after being away:
1. Calculate time delta since last session
2. Run accumulated production ticks (capped at 8 hours = 960 ticks max)
3. Run accumulated wandering hero actions (simplified: assume average efficiency)
4. Show "Welcome Back" summary: "While you were away: +X Gold, +Y Materials"

### Interactions with Other Systems

| System | Direction | Interface |
|--------|-----------|-----------|
| **Ancient Monument Production** | Depends on | Receives: production_rate_multiplier (from monument level). Produces: materials to kingdom pool |
| **Building System** | Depends on | Receives: gold cost deduction, material cost deduction. Sends: gold income when shops sell items |
| **Shop System** | Depends on | Receives: material inputs consumed. Sends: gold output from item sales |
| **Hero Stats System** | Depends on | Receives: training cost deduction (gold), hero stat bonuses (if equipment buffs resources) |
| **Hero Recruitment & Management** | Depends on | Receives: recruitment gold cost. Sends: none |
| **Combat System** | Depends on | Receives: exploration reward gold/materials. Sends: none |
| **Map Exploration System** | Depends on | Receives: hero deployment (not resource cost). Sends: Ancient Magic Stone drops (100% from territory, 20% from wandering) |
| **Wandering Hero AI** | Depends on | Receives: none. Sends: gold from purchases, 20% of magic stones from combat |
| **Hero Training System** | Depends on | Receives: training gold cost (territory) / personal gold cost (wandering). Sends: hero stat upgrades |
| **Guild System** | Depends on | Receives: task completion gold/material rewards. Sends: none |
| **Save System** | Depends on | Receives: save/load kingdom resources. Sends: full resource state for persistence |
| **UI System** | Feeds | Sends: all resource values for HUD display, notifications, tooltips |

**Data Flow per Production Tick (every 30 seconds):**
```
ProductionTick:
  if monument_level >= 1:
    for each material_type:
      amount = random(base_amount_min, base_amount_max) * monument_rate_multiplier
      kingdom_resources[material_type] += amount
      if kingdom_resources[material_type] > capacity[material_type]:
        overflow = kingdom_resources[material_type] - capacity
        kingdom_resources[material_type] = capacity
        trigger_overflow_warning(material_type, overflow)
```

## Formulas

### F1: Material Production Per Tick

```
material_output = floor(random(base_min, base_max) * monument_level * vault_bonus)
```

| Variable | Value | Source |
|----------|-------|--------|
| base_min | 1 | constant |
| base_max | 3 | constant |
| monument_level | 1-10 | Ancient Monument upgrade level |
| vault_bonus | 1.0 + (vault_level * 0.1) | Kingdom Vault building |

**Expected output range**: 1-6 materials per tick at monument level 1, up to 10-60 at level 10 with vault bonus

Note: "up to 10-30 at level 10" assumes Vault Level 0. With Vault Level 10 (vault_bonus = 2.0), the max becomes 20-60.

### F2: Gold Capacity

```
gold_capacity = base_capacity + (vault_level * 5000)
```

| Variable | Value | Source |
|----------|-------|--------|
| base_capacity | 10,000 | constant |
| vault_level | 0-10 | Kingdom Vault level |

**Expected output range**: 10,000 (no vault) to 60,000 (vault level 10)

### F3: Material Capacity Per Type

```
material_capacity[material_type] = base_material_capacity + (vault_level * 100)
```

| Variable | Value | Source |
|----------|-------|--------|
| base_material_capacity | 500 | constant |
| vault_level | 0-10 | Kingdom Vault level |

### F4: Ancient Magic Stone Drop (Territory Hero Exploration)

```
stones_found = random() < drop_chance ? random_int(stones_min, stones_max) : 0
kingdom_stones += stones_found  # 100% contribution
```

| Variable | Value |
|----------|-------|
| drop_chance | 0.30 (30% per exploration) |
| stones_min | 1 |
| stones_max | 5 (scales with map difficulty) |

### F5: Ancient Magic Stone Drop (Wandering Hero Exploration)

```
stones_found = random() < drop_chance ? random_int(stones_min, stones_max) : 0
wanderer_personal_stones += stones_found * 0.80  # 80% kept
kingdom_stones += stones_found * 0.20  # 20% contribution
```

### F6: Offline Progress Calculation

```
offline_ticks = min(floor((current_time - last_save_time) / tick_interval), max_ticks)
max_ticks = 960  # 8 hours worth of ticks (30 sec each)
offline_production = offline_ticks * average_tick_output
```

**Catch-up rule**: Player receives 100% of offline production (no penalty — idle game friendliness)

### F7: Production Overflow (Lost Resources)

```
if current_amount + produced > capacity:
  overflow = current_amount + produced - capacity
  current_amount = capacity
  log_overflow(resource_type, overflow)
```

**Design rationale**: Overflow is lost, not banked. This creates gentle pressure to spend resources and upgrade capacity buildings.

## Edge Cases

| Scenario | Expected Behavior | Rationale |
|----------|------------------|-----------|
| Player has 0 gold, tries to build | Building button disabled, tooltip shows "Need X more gold" | Prevents frustration |
| Player has 0 Ancient Magic Stones, tries to upgrade monument | Upgrade button disabled, shows cost | Clear feedback |
| Production tick when at 100% capacity | Resources lost, UI flashes red warning | Creates urgency to spend |
| Player offline for 24+ hours | Capped at 8 hours (960 ticks), "Welcome Back" shows summary | Prevents exploit, reasonable limit |
| Simultaneous spend and gain on same resource | Spend resolves first, then gain | Prevents negative balance |
| Wandering hero defeats enemy while player is in shop UI | Event queued, processed when player returns to map | No interruption |
| Multiple wandering heroes purchase same tick | Each purchase resolves sequentially, all gold adds to pool | Normal transaction ordering |
| Negative resource value attempted | Clamp to 0, log error | Safety check |
| Floating point precision on large numbers | Use integer math (gold in whole units, no decimals) | Clean display, no rounding errors |
| Server-client desync on resources | Client shows optimistic UI, server validates on next sync (500ms interval) | Responsive feel, server authority |
| New player (first launch) | Start with: 500 gold, 0 magic stones, 0 materials | Tutorial balance |

**Exploit Prevention:**
- Server-authoritative resource state — clients cannot modify resources directly
- All resource changes go through server validation
- Anti-cheat: Production ticks only accumulate when server is running (no time-warp exploits)

## Dependencies

**Upstream Dependencies (none — this is a Foundation system):**
- None. Resource System is the foundation layer.

**Downstream Dependents (systems that consume this system's data):**
| System | Dependency Type | Interface Consumed |
|--------|-----------------|-------------------|
| Ancient Monument Production | Hard | Reads: monument_level. Produces: materials to kingdom pool |
| Building System | Hard | Reads: gold/material quantities. Writes: gold spent on buildings |
| Shop System | Hard | Reads: materials (input), gold (output) |
| Hero Training System | Hard | Reads: gold for territory heroes |
| Combat System | Hard | Reads: exploration gold/material rewards |
| Map Exploration | Hard | Reads: Ancient Magic Stone drops (100% from territory, 20% from wandering) |
| Wandering Hero AI | Hard | Writes: gold from purchases, 20% magic stones from combat |
| Guild System | Hard | Reads: gold/material rewards from tasks |
| UI System | Hard | Reads: all resource values for display |
| Save System | Hard | Reads/writes: full resource state for persistence |

## Tuning Knobs

| Parameter | Current Value | Safe Range | Effect of Increase | Effect of Decrease |
|-----------|--------------|------------|-------------------|-------------------|
| `tick_interval` | 30 sec | 10-120 sec | Faster resource feel, more UI updates | Slower pace, fewer decisions |
| `base_material_min` | 1 | 1-10 | More resources per tick | Less resources, longer grind |
| `base_material_max` | 3 | 2-20 | Higher ceiling per tick | Lower ceiling, slower growth |
| `gold_capacity_base` | 10,000 | 5,000-100,000 | Longer to fill, more storage | Fill faster, spend more often |
| `material_capacity_base` | 500 | 100-5,000 | Longer to fill per type | Fill faster per material |
| `vault_capacity_bonus` | +5,000 gold / +100 mat per level | 1,000-20,000 | More capacity per vault level | Slower capacity scaling |
| `magic_stone_drop_chance` | 30% | 10%-60% | More rare currency | Rarer currency, longer upgrades |
| `magic_stone_drop_min` | 1 | 1-5 | Minimum per drop | Lower minimum |
| `magic_stone_drop_max` | 5 | 3-20 | Maximum per drop | Lower maximum |
| `wandering_stone_contribution` | 20% | 10%-50% | More magic stones to kingdom | Less kingdom income, more to wanderers |
| `offline_cap_hours` | 8 hours | 1-24 hours | More offline earnings | Less offline earnings |
| `overflow_penalty` | N/A | N/A | Removed — overflow is always 100% lost | N/A |

## Visual/Audio Requirements

| Event | Visual Feedback | Audio Feedback | Priority |
|-------|----------------|---------------|----------|
| Resource tick (materials produced) | "+X" floats up from resource icon, counter animates up | Soft "ding" chime (varies by material) | High |
| Gold gained (wandering purchase) | Gold icon pulses, "+X Gold" with coin icon | Coin clink sound | High |
| Gold spent (building/trained) | Gold counter animates down, red "-X" | Coin spending sound (lighter) | High |
| Capacity reached | Resource icon flashes red, border pulses | Warning tone (1 sec) | Medium |
| Overflow warning (90%+) | Orange/red indicator on resource | None (silent warning) | Medium |
| Ancient Magic Stone gained | Purple sparkle effect, larger "+X" popup | Magical chime (premium feel) | High |
| Offline progress summary | "Welcome Back" modal with all gains listed | Soft music sting | Medium |
| Insufficient funds | Button shakes, tooltip shows deficit | Soft "thud" | Low |

**UI Animation Standards:**
- Number counters animate smoothly (count up/down over 300ms)
- Resource gain/loss shows delta (+50, -200) not just final value
- Overflow warning uses attention-grabbing pulse (2 sec duration)

## UI Requirements

### HUD (Always Visible)

| Information | Display Location | Update Frequency | Condition |
|-------------|-----------------|-----------------|-----------|
| Gold (current / max) | Top bar, left | Real-time | Always |
| Ancient Magic Stones | Top bar, left (after gold) | Real-time | Always |
| Material icons (5 types) | Collapsed by default, tap to expand | Real-time | Always |
| Capacity warning indicators | Next to each resource | On capacity change | When > 80% |

### Resource Tooltip (Tap/Hover)

| Information | Display |
|-------------|---------|
| Current amount | Large number |
| Capacity | " / Max: X" in smaller text |
| Production rate | "+X per tick" or "+X per 30 sec" |
| Time until full (if gaining) | "Full in ~X minutes" |
| Overflow status | Red "OVERFLOWING!" if at max |

### Notification Toasts

| Event | Toast Content | Duration |
|-------|--------------|----------|
| Gold gained | "+X Gold" with coin icon | 2 sec |
| Gold spent | "-X Gold" with building/action icon | 2 sec |
| Material gained | "+X [Material Name]" | 1.5 sec |
| Ancient Magic Stone gained | "+X Ancient Magic Stones" with sparkle | 3 sec |
| Capacity warning | "[Resource] is X% full!" | 4 sec |
| Overflow | "[Resource] is full! Resources being lost!" | Persistent until resolved |

### Welcome Back Modal

- Shows total offline time
- Lists all resources gained during absence
- "Collect" button to dismiss and add resources to pool
- Animated count-up of each resource type

## Acceptance Criteria

### Functional Criteria

- [ ] **AC1**: When Ancient Resource Producer ticks, correct materials are added to kingdom pool
- [ ] **AC2**: Material amounts never exceed their capacity (clamp at max)
- [ ] **AC3**: Gold spending deducts correct amount and blocks action if insufficient
- [ ] **AC4**: Ancient Magic Stones drop with 30% probability on exploration completion
- [ ] **AC5**: Territory heroes contribute 100% of magic stones to kingdom
- [ ] **AC6**: Wandering heroes contribute 20% of magic stones to kingdom, keep 80%
- [ ] **AC7**: Offline progress calculates correct ticks (capped at 8 hours)
- [ ] **AC8**: Welcome Back modal shows accurate offline earnings
- [ ] **AC9**: UI updates resource display within 100ms of any change
- [ ] **AC10**: Capacity warning indicators appear at 80% and 90% thresholds
- [ ] **AC11**: Overflow is logged when resources exceed capacity

### Performance Criteria

- [ ] **PERF1**: Resource tick processing completes within 5ms
- [ ] **PERF2**: UI remains responsive with 1000+ resource transactions queued
- [ ] **PERF3**: Save/load of resource state completes within 100ms

### Edge Case Criteria

- [ ] **EDGE1**: No negative resource values possible under any circumstance
- [ ] **EDGE2**: Simultaneous spend+gain resolves spend first
- [ ] **EDGE3**: Overflow resources are logged but do not wrap or cause errors

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| Should there be a "speed up production" option for impatient players? | Design | MVP | Add as optional gold sink |
| Do upgrade materials have tiers beyond T3? | Design | Alpha | Reserve T4/T5 for late game |
| Should there be a way to convert gold to magic stones (or vice versa)? | Design | Post-MVP | No — keep currencies separate |
| What's the exact gold reward formula per map difficulty? | Balance | MVP | Scale with map zone: base_gold * zone_number |
| Should wandering heroes be able to gift materials to kingdom? | Design | Post-MVP | No — keep systems separate |
