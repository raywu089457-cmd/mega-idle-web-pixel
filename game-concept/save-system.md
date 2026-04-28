# Save System

> **Status**: Skeleton
> **Author**: Game Designer
> **Last Updated**: 2026-03-29
> **Implements Pillar**: Pillar 1 (Always Something Happening -- persistent state across sessions), Pillar 2 (Numbers Go Up -- permanent progression)
> **Design Order**: 2nd system (Foundation layer, no dependencies)

---

## Overview

[To be designed]

**Summary**: The Save System provides persistent local storage for all game state, enabling players to resume their kingdom across sessions. It handles auto-saves, manual saves, offline progress calculation, and save file migration.

**Key Considerations**:
- Local file-based storage (JSON or binary format)
- Auto-save interval: every 30 seconds (proposed)
- Manual save option available to player at any time
- Offline progress calculation on session resume
- Data migration path for future schema version changes
- Single-player only (no server dependency)

---

## Player Fantasy

[To be designed]

**What the player should FEEL**:
- "My kingdom persists and grows even when I'm away"
- "My progress is safe and will never be lost"
- "I can close the game confidently, knowing my work is saved"

---

## Detailed Design

### Core Rules

[To be designed]

**Proposed Rules**:
1. All game state is stored in a structured save data blob keyed by kingdom name
2. Local file storage (user's documents folder or app data directory)
3. Auto-save triggers every 30 seconds of active gameplay
4. Manual save is available via UI at any time
5. On session start, calculate offline progress delta and apply to save
6. Save data uses semantic versioning (schema version) to support migrations
7. Single-player only (no server or multiplayer dependency)

### States and Transitions

[To be designed]

| State | Entry Condition | Exit Condition | Behavior |
|-------|----------------|----------------|----------|
| IDLE | No active save/load operation | Save triggered or load requested | Display last known state |
| SAVING | Auto-timer fires OR manual save OR game closing | Write complete OR retry exhausted | Write to local file, show subtle indicator |
| LOADING | Session start OR player requests load | Save data loaded OR fallback to default | Read from local file, deserialize, apply |
| MIGRATING | Save schema version < current schema | Migration complete OR migration failed | Apply migration scripts in order |

### Interactions with Other Systems

[To be designed]

| System | Direction | Interface Contract |
|--------|-----------|--------------------|
| Resource System | Save System depends on Resource | Serializes/deserializes all resource quantities |
| Hero Stats System | Save System depends on Hero Stats | Serializes hero level, HP, ATK, DEF, XP |
| Building System | Save System depends on Building | Serializes building states, upgrade levels |
| Shop System | Save System depends on Shop | Serializes item库存, gold earned |
| Combat System | Save System depends on Combat | Serializes combat logs, victory counts |
| Map Exploration | Save System depends on Map | Serializes explored zones, cleared maps |
| UI System | UI System depends on Save System | Receives save confirmation/failure to show player |

---

## Formulas

[To be designed]

### Offline Progress Calculation

[To be designed -- proposed structure]

```
offline_seconds = current_time - last_save_time
offline_gold = gold_per_second * offline_seconds * offline_efficiency_multiplier
offline_materials = materials_per_minute * (offline_seconds / 60) * offline_efficiency_multiplier
```

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| offline_seconds | float | 0 to max_offline_seconds | calculated | Seconds since last save, capped at max |
| offline_efficiency_multiplier | float | 0.0 to 1.0 | tuning knob | Reduces offline earnings to encourage active play |
| gold_per_second | float | 0 to 10000 | calculated | Sum of all gold income sources |
| max_offline_seconds | int | 0 to 86400 (24h) | tuning knob | Maximum offline time to credit |

**Expected output range**: 0 to (income_rate * max_offline_seconds * efficiency)
**Edge case**: If offline_seconds > max_offline_seconds, credit only max_offline_seconds of progress

### Save Data Hash

[To be designed -- for integrity verification]

```
save_hash = SHA256(serialized_save_data + kingdom_id + schema_version)
```

---

## Edge Cases

[To be designed]

| Scenario | Expected Behavior | Rationale |
|----------|------------------|-----------|
| Save during combat resolution | Queue save until combat concludes | Prevent partial state writes |
| Save fails (network error) | Retry 3 times with exponential backoff, then notify player | Prevent data loss |
| Load fails (corrupted save) | Fall back to previous save, notify player | Graceful degradation |
| Offline progress > max offline cap | Credit max offline time only | Balance idle收益 |
| Schema version mismatch (save older than code) | Run migration chain | Forward compatibility |
| Schema version mismatch (save newer than code) | Block load, prompt for update | Prevent data corruption |
| Multiple devices loading same kingdom (multiplayer) | Server arbitrates; first successful write wins | Prevent race conditions |
| Server unreachable on startup | Load from local cache, mark session as "offline" | Maintain playability |
| Player closes game during save | OS-level file lock + write-atomicity | Prevent corrupted saves |

---

## Dependencies

[To be designed -- This system has NO dependencies. It is foundational.]

| System | Direction | Nature of Dependency |
|--------|-----------|---------------------|
| (None) | This system depends on nothing | Foundation layer -- all other systems depend on Save System |

**Inbound Dependencies** (systems that depend on Save System):
- Resource System
- Hero Stats System
- Building System
- Item System
- Shop System
- Combat System
- Map Exploration System
- UI System

---

## Tuning Knobs

[To be designed]

| Parameter | Proposed Value | Safe Range | Category | Effect of Increase | Effect of Decrease |
|-----------|--------------|------------|----------|-------------------|-------------------|
| auto_save_interval_seconds | 30 | 10-120 | Gate | More frequent saves (more data safety) | Fewer saves (less network traffic) |
| max_offline_seconds | 86400 (24h) | 3600-172800 | Gate | Longer offline credit (more forgiving) | Shorter offline credit (encourage active play) |
| offline_efficiency_multiplier | 0.5 | 0.0-1.0 | Curve | More offline earnings (more generous) | Fewer offline earnings (reward active play) |
| save_retry_count | 3 | 1-5 | Feel | More resilience to network blips | Faster failure notification |
| save_retry_backoff_ms | 1000 | 500-5000 | Feel | Longer between retries (less server stress) | Faster recovery from transient failures |

---

## Visual/Audio Requirements

[To be designed]

| Event | Visual Feedback | Audio Feedback | Priority |
|-------|----------------|---------------|----------|
| Auto-save triggered | Subtle disk icon flash in corner (0.5s) | None or soft click | Low |
| Manual save complete | Toast notification "Kingdom Saved" | Soft confirmation chime | Medium |
| Save failed | Red warning toast with retry option | Soft error tone | High |
| Offline progress applied | "+X Gold" floating text on resume | Coin clink cascade | Medium |
| Loading save | Progress spinner on main menu | None or ambient hum | Medium |

---

## UI Requirements

[To be designed]

| Information | Display Location | Update Frequency | Condition |
|-------------|-----------------|-----------------|-----------|
| Last save timestamp | Top-right corner (always visible) | After every save | Always |
| Save status indicator | Top-right corner (icon) | Real-time | Always during gameplay |
| Manual save button | Pause menu / Settings menu | On-demand | When menu open |
| Offline earnings summary | Splash screen on resume | Once per session | When offline time > 60s |
| Save error message | Modal overlay | Until dismissed | When save fails |
| Save conflict notification | Toast notification | Until acknowledged | When server state diverges |

---

## Acceptance Criteria

[To be designed]

- [ ] Game state persists across application restarts (cold start)
- [ ] Game state persists when device is power-cycled mid-session
- [ ] Auto-save triggers exactly once per 30-second interval during active play
- [ ] Manual save is accessible and completes within 2 seconds
- [ ] Offline progress is calculated and applied within 5 seconds of session start
- [ ] Offline progress is capped at 24 hours of credited time
- [ ] Server-authoritative state wins in any client-server conflict
- [ ] Save data survives schema version upgrades (forward migration works)
- [ ] Corrupted local save falls back to server state gracefully
- [ ] No data loss when game is force-closed during save operation
- [ ] All other systems (Resource, Hero, Building, Shop, Combat, Map) serialize/deserialize correctly through Save System
- [ ] Performance: Save operation completes within 500ms on typical hardware
- [ ] No hardcoded values in implementation -- all tuning knobs externalized

---

## Open Questions

[To be designed -- flagging conflicts between game concept and Save System requirements]

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| **Multiplayer vs Single-player conflict**: Game concept says "Single-player" with "Networking: None (local-only save data)", but Save System requirements specify "server-authoritative multiplayer". Which is correct? | Creative Director | TBD | Pending |
| **Kingdom ownership model**: If multiplayer, is kingdom shared or does each player have their own? If shared, how do we handle conflicting actions? | Game Designer | TBD | Pending |
| **Offline earnings source priority**: When multiple income sources exist (monument + wandering heroes + shops), what order are offline earnings calculated? | Game Designer | TBD | Pending |
| **Anti-exploit measures**: Should offline earnings be server-verified, or is client-trusted acceptable for MVP? | Technical Lead | TBD | Pending |
| **Save data size limits**: Is there a max save size? Max offline time to prevent abuse? | Game Designer | TBD | Pending |
| **Cross-device play**: Can a player continue on multiple devices? If so, how is conflict resolution handled? | Creative Director | TBD | Pending |
| **Backup and rollback**: Should we keep N previous saves for rollback, or overwrite oldest? | Game Designer | TBD | Pending |

---

*End of Save System Skeleton*
