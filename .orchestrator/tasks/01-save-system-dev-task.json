# Agent Handoff — Task 01: Save System

> **Task ID**: 01-save-system-dev
> **Agent Type**: save-system-engineer
> **Orchestrator Session**: `projects/mega-idle-web/.orchestrator/`
> **Created**: 2026-04-26

---

## Project Context

**Project**: mega-idle-web
**Type**: Browser-based idle kingdom builder — pure HTML + Canvas + Vanilla JS, no build step
**Spec**: `projects/mega-idle-web/docs/superpowers/specs/2026-04-26-idle-kingdom-web-design.md`
**Architecture**: `projects/mega-idle-web/docs/superpowers/specs/2026-04-26-idle-kingdom-web-design-ARCHITECTURE.md`
**Orchestrator Design**: `projects/mega-idle-web/docs/superpowers/specs/ORCHESTRATOR-DESIGN.md`

---

## Game Core Loop (from spec)

```
每秒 tick → 材料產出(1-3/秒/material) + 英雄戰鬥結算 → 存檔
     ↓
商店消耗材料 → 金幣收入 → 升級建築/英雄
```

---

## System Being Built: Save System

- **Description**: IndexedDB-based persistent storage for all game state
- **Tier**: 0 (foundation — all other systems depend on it)
- **Auto-save interval**: 30 seconds
- **Storage key**: `idleKingdomSave`

---

## Task Card Reference

Full task card: `.orchestrator/tasks/01-save-system-dev-task.json`

```json
{
  "id": "01-save-system-dev",
  "taskName": "save-system-dev",
  "agentType": "save-system-engineer",
  "dependsOn": [],
  "reportAt": "system-complete",
  "status": "pending"
}
```

---

## What to Read First

1. **Spec Section 7 — Save System**:
   `projects/mega-idle-web/docs/superpowers/specs/2026-04-26-idle-kingdom-web-design.md` (line 162-181)

2. **Spec Section 11 — Acceptance Criteria**:
   `projects/mega-idle-web/docs/superpowers/specs/2026-04-26-idle-kingdom-web-design.md` (line 237-245)
   Focus on:
   - [ ] 存檔到 IndexedDB，每 30 秒自動存

3. **Orchestrator COMMANDS** (to understand workflow):
   `projects/mega-idle-web/.orchestrator/COMMANDS.md`

---

## Save Data Structure (from spec §7)

```javascript
{
  version: 1,
  lastOnline: timestamp,       // Unix ms, used for offline calculation
  resources: {
    gold: number,
    magicStones: number,
    fruitPoor: number,
    waterDirty: number,
    woodRotten: number,
    ironRusty: number,
    herbLow: number
  },
  heroes: [...],                // hero objects array
  buildings: [...],             // building states array
  mapProgress: { zone: number, cleared: [] },
  monumentLevel: number,
  shopLevel: number
}
```

---

## Required API (implement in saveManager.js)

| Method | Returns | Description |
|--------|---------|-------------|
| `save(gameState)` | `Promise<void>` | Serialize and store gameState |
| `load()` | `Promise<GameState\|null>` | Load and deserialize, null if no save |
| `delete()` | `Promise<void>` | Delete save |
| `hasSave()` | `Promise<boolean>` | Check if save exists |
| `getLastOnline()` | `Promise<number\|null>` | Get lastOnline timestamp |

---

## Implementation Constraints

1. **Pure ES6+ JavaScript** — no imports, no build step
2. **No external dependencies** — use native IndexedDB API
3. **Error handling** — wrap all IDB operations in try/catch
4. **Singleton pattern** — export one `SaveManager` instance
5. **Version migration** — check `version` field, run migrate if needed

---

## Output Requirements

After implementation:

1. **Write output report** to:
   `.orchestrator/outputs/01-save-system-dev-output.md`

   Format:
   ```markdown
   # Task 01 — Save System Dev Report

   ## Status: ✅ Complete / ⚠️ Warning / ❌ Failed

   ## Changes Made
   - [file]: what was changed

   ## Architecture Decisions
   - decision: reason

   ## Questions / Assumptions
   - ...

   ## Next Step Recommendation
   - ...
   ```

2. **Update orchestration state**:
   - Read `.orchestrator/state/task-queue.json`
   - Mark task `01-save-system-dev` as `completed`
   - Write back to same file

---

## Workflow

```
1. Read spec §7 Save System
2. Read this handoff fully
3. Implement js/data/saveManager.js
4. Write output to .orchestrator/outputs/01-save-system-dev-output.md
5. Update .orchestrator/state/task-queue.json (mark completed)
6. Report back to orchestrator (parent agent)
```

---

## Notes

- This is the **first system** to be built — all other systems depend on saveSystem working correctly
- IDB operations are async — use async/await, return Promises
- `lastOnline` field is critical for offlineSystem (Tier 3) — must be stored as Unix timestamp in ms
- No encryption needed for this prototype (V1)
