// src/econ-sim.js — L1 24h 經濟平衡模擬(獨立模組,純函式 + 可選 node CLI 入口)
// 設計:跑 86400 ticks(1 tick = 1 秒 = 24h);統計 gold/material/event/tradition 累積影響
// 用法:`node --input-type=module -e "import('./src/econ-sim.js').then(m => m.simulate24h())"` 或 node econ-sim-cli.mjs

import { RESOURCES, BUILDINGS, BUILDING_ORDER, MATERIAL_TYPES, ZONES } from './data.js'

const TICKS_PER_HOUR = 3600
const HOURS_PER_DAY = 24
const TICKS_PER_DAY = TICKS_PER_HOUR * HOURS_PER_DAY

// Mulberry32 RNG(deterministic;給定 seed → 結果可重現)
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

/** 套用 tradition bonus 到 baseRate */
function withTradition(baseRate, kind, traditions) {
  if (kind === 'mat') return baseRate * (1 + (traditions.hunt || 0) * 0.15);
  if (kind === 'gold') return baseRate * (1 + (traditions.hunt || 0) * 0.15);
  if (kind === 'xp') return baseRate * (1 + (traditions.hunt || 0) * 0.15);
  return baseRate
}

/** 套用 stage multiplier(Lv3+ ×1.2 容量/產量) */
function withStage(baseRate, level) {
  if (level >= 3) return baseRate * 1.2
  return baseRate
}

/** 套用 spec multiplier(yield ×1.5) */
function withSpecYield(baseRate, level, spec) {
  if (spec === 'yield' && level >= 3) return baseRate * 1.5
  return baseRate
}

/** 套用 seasonalMul(±20%) */
function withSeasonal(baseRate, sign) {
  return baseRate * (1 + sign * 0.2)
}

/**
 * 跑 24h 模擬
 * @param {object} [opts]
 * @param {Object<number>} [opts.levels] - 建築 level map(預設 Lv5 全部)
 * @param {Object<number>} [opts.traditions] - tradition 計數
 * @param {Object<number>} [opts.specs] - 專精(yield)map
 * @param {number} [opts.seed=42] - RNG seed
 * @param {boolean} [opts.events=true] - 是否套用 town events
 * @param {number} [opts.seasonalSign=1] - season_shift 方向(+1 或 -1)
 * @returns {object} 報告
 */
export function simulate24h(opts = {}) {
  const {
    levels = Object.fromEntries(BUILDING_ORDER.map(id => [id, BUILDINGS[id].startLevel + 5])),
    traditions = { hunt: 0 },
    specs = {},
    seed = 42,
    events = true,
    seasonalSign = 1,
  } = opts
  const rng = mulberry32(seed)

  const report = {
    ticks: TICKS_PER_DAY,
    goldEarned: 0,
    goldClick: 0,
    materialsEarned: {},
    potionsProduced: 0,
    townEventsTriggered: [],
    finalGoldCapacity: 0,
  }
  for (const r of MATERIAL_TYPES) report.materialsEarned[r] = 0

  let huntTradMul = (traditions.hunt || 0) * 0.15
  let seasonMul = seasonalSign * 0.2
  let activeEvents = []
  let potionTickCounter = 0
  const goldRateBase = withStage(levels.goldMine * 2, levels.goldMine)
  const goldRateWithSpec = withSpecYield(goldRateBase, levels.goldMine, specs.goldMine)
  const goldRate = withTradition(withSeasonal(goldRateWithSpec, seasonMul), 'gold', traditions)
  const monLevel = levels.monument

  // 每秒一次 tick;游標步進
  for (let t = 0; t < TICKS_PER_DAY; t++) {
    // 1. 公會素材整理(每秒 monLevel~3*monLevel 隨機,4 material types)
    if (monLevel > 0) {
      for (const m of MATERIAL_TYPES) {
        const gain = Math.max(1, Math.round(rng() * (1 + rng() * 2) * monLevel * (1 + huntTradMul) * (monLevel > 0 ? 1 : 1)))
        report.materialsEarned[m] += gain
      }
    }
    // 2. 市集產金
    if (levels.goldMine > 0) {
      const earn = Math.max(1, Math.round(goldRate * (1 + huntTradMul)))
      report.goldEarned += earn
    }
    // 3. 煉金工房產藥水
    if (levels.potionShop > 0) {
      const potionRate = withSpecYield(
        withTradition(withSeasonal(withStage(2 + (levels.potionShop - 1) * 2, levels.potionShop), seasonalSign), 'mat', traditions),
        levels.potionShop, specs.potionShop
      )
      potionTickCounter++
      const ticksNeeded = Math.max(1, 10 - (levels.potionShop - 1) * 2) // speed spec 影響略
      if (potionTickCounter >= ticksNeeded) {
        potionTickCounter = 0
        const amt = Math.max(1, Math.round(potionRate * (1 + (traditions.hunt || 0) * 0.15)))
        report.potionsProduced += amt
      }
    }
    // 4. 城鎮事件(平均每 180 ticks 觸發)
    if (events && activeEvents.length === 0 && rng() < 1 / 180) {
      const evt = pickRandomEvent(rng)
      activeEvents.push({ id: evt.id, remaining: evt.duration })
      report.townEventsTriggered.push({ tick: t, id: evt.id })
    }
    // 5. 推進 active events
    activeEvents = activeEvents.filter(e => { e.remaining--; return e.remaining > 0 }).slice(0, 1)
    // 6. 點擊(假設玩家在 idle 期間偶爾點;取經驗值 60 clicks/hour = 1/sec)
    if (rng() < 1 / 60) {
      report.goldClick += Math.max(1, Math.round(2 + levels.goldMine / 2))
    }
  }

  report.finalGold = (levels.goldMine > 0 ? goldRate : 0) * 3600 * HOURS_PER_DAY // 預期值
  return report
}

function pickRandomEvent(rng) {
  const events = [
    { id: 'medical_surge', duration: 60 },
    { id: 'caravan', duration: 90 },
    { id: 'night_raid', duration: 45 },
    { id: 'building_halt', duration: 30 },
    { id: 'rare_visitor', duration: 60 },
    { id: 'material_wave', duration: 120 },
    { id: 'season_shift', duration: 180 },
  ]
  return events[Math.floor(rng() * events.length)]
}

/** 格式化報告(給 CLI / 報告輸出) */
export function formatReport(report) {
  const lines = []
  lines.push('═'.repeat(50))
  lines.push(`24h 經濟模擬報告 (${report.ticks} ticks)`)
  lines.push('═'.repeat(50))
  lines.push(`金幣產出(produceTick):${report.goldEarned.toLocaleString()} 🪙`)
  lines.push(`金幣點擊(假設):${report.goldClick.toLocaleString()} 🪙`)
  lines.push(`總計:${(report.goldEarned + report.goldClick).toLocaleString()} 🪙/24h`)
  lines.push('')
  lines.push('素材整理:')
  for (const [k, v] of Object.entries(report.materialsEarned)) {
    lines.push(`  ${RESOURCES[k]?.icon || '?'} ${RESOURCES[k]?.name || k}: ${v.toLocaleString()}`)
  }
  lines.push('')
  lines.push(`藥水產出:${report.potionsProduced.toLocaleString()} 瓶`)
  lines.push('')
  lines.push(`城鎮事件觸發: ${report.townEventsTriggered.length} 次`)
  for (const e of report.townEventsTriggered.slice(0, 10)) {
    lines.push(`  tick ${e.tick.toLocaleString()}: ${e.id}`)
  }
  if (report.townEventsTriggered.length > 10) lines.push(`  ... 還有 ${report.townEventsTriggered.length - 10} 次`)
  lines.push('═'.repeat(50))
  return lines.join('\n')
}

// ─── Node CLI entry ─────────────────────────────────────────────────
if (typeof process !== 'undefined' && process.argv?.[1]?.endsWith('econ-sim.js')) {
  console.log(formatReport(simulate24h()))
}
