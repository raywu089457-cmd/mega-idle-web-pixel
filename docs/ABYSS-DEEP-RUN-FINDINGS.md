# Abyss Deep Run — Findings

> 任務 11:重跑 sim `--maxTicks=500000 --abyssTarget=20` 驗證 abyssBest ≥ 10

## 結果:abyssBest 卡在 1

| 指標 | 值 |
|---|---|
| Wall clock | 277.1 s(約 4.5 分鐘) |
| Total ticks | 500 000 |
| abyssBest | **1** ← 預期 ≥ 10 |
| Heroes in live combat | 15(全部進入 abyss) |
| advanced count | 4(ms 不足,無法升階) |
| magicStones | 0(全 500k ticks 沒掉任何 MS) |

## 根因分析

### 1. Abyss cfg `magicStoneChance` 過低(`src/expeditions.js:41`)

```js
cfg: {
  goldRange: [50 + depth * 20, 100 + depth * 40],
  magicStoneChance: 0.05 + depth * 0.02,  // depth 1 → 0.07
  xp: 30 + depth * 20,
  drops: ['healthPotion']
}
```

| depth | magicStoneChance |
|---|---|
| 1 | 0.07 |
| 10 | 0.25 |
| 50 | 1.05(cap) |
| 100 | 1.05(cap) |

但 sim 卡在 depth 1 — 永遠碰不到 0.25+ 區間。

### 2. Abyss combat 不走 finishLiveCombat(`src/combat.js:232`)

```js
export function finishLiveCombat(hero, lc, won) {
  if (lc.isAbyss) { impls.finishAbyssCombat(hero, lc, won); return; }
  // ... MS drop 在這裡 ...
}
```

Abyss combat 由 `finishAbyssCombat` 直接處理,**完全跳過 MS drop**。所以 abyss 戰鬥贏了也沒 MS。

### 3. 為何 depth 不前進?

Abyss depth 2 敵人:
- HP = 200 + 2×80 = 360
- ATK = 30 + 2×6 = 42

Hero Lv 80-114 +10 武器單回合打 30-50 傷害 → 約 8-12 round 才能擊殺。
敵方每 round 反擊 42 傷害 → hero HP 150-200,5 round 內危險。
加上 60-round timeout → 進入疲勞 → restTicks=6 → 休息。

**結果**:Heroes 贏 depth 1(→ depth 2)後,在 depth 2 卡住或死亡,abyssBest 永遠 = 1。

## 解決方案(下個 session)

### 方案 A:加 MS drop 到 finishAbyssCombat(`src/expeditions.js:62-78`)

```js
export function finishAbyssCombat(hero, lc, won) {
  if (won) {
    // ... depth advance ...
    // 加:ResourceSystem_add('magicStones', 1);  // 每次打贏 abyss 固定 +1 MS
  }
  // ... loss 一樣
}
```

### 方案 B:修改 abyss cfg(`src/expeditions.js:41`)

```js
magicStoneChance: 0.5 + depth * 0.01,  // depth 1 → 0.51,depth 50 → 1.0
```

### 方案 C:Sim 層修:同時派 50% 進 abyss + 50% 進 zone5 hard

讓 MS 與 depth 兩條線並行:
- 進 abyss → depth 進展
- 進 zone5 hard → MS 農(1.0 機率)
- heroes 輪流分配

方案 C 是 sim-only fix,不會動到 src/。但對於「測試 15 隻全部打 abyss depth 50」目標可能不夠。

## 當前狀態

- ✅ Abyss dispatch loop **正常運作**(hero 進入 live combat,enemy 正確生成)
- ✅ depth 1 可擊殺(abyssBest=1)
- ❌ depth 2+ 太硬,hero 一直輸
- ❌ Abyss 不產 MS,無法 advance class

**結論**:Abyss 系統功能上 work,但遊戲難度設計偏硬,15 隻 hero 在合理 tick 預算內無法推到 depth 10+。要在 LEGITIMATE 模式達到「abyssBest ≥ 10」,需要 §方案 A 或 §方案 B 修改源碼。

本任務暫時保留為「系統功能驗證通過、深度未達標」。