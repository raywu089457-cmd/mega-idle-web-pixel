// src/traditions.js — L1 重建傳統選擇(§六 5)
// 設計:5 種 tradition 取代「全產出 +10%/片」的線性 shards;每次重建選 1 種,累積同 tradition 給越強 bonus
// state.prestige.traditions = { commerce, forge, hunt, scholar, pioneer } 各 0..N
// 不修改 shards 欄位(向後兼容老存檔),bonus 只看 traditions
import { prestige } from './state.js'

export const TRADITIONS = Object.freeze({
  commerce: { id: 'commerce', name: '商業傳統', icon: '💰',
    desc: '商店營收 +25%/次;獵人消費回流村莊經濟',
    bonus: { shopRevenueMul: 0.25 } },
  forge:    { id: 'forge',    name: '鍛造傳統', icon: '⚒️',
    desc: '精良/傳說裝備出現率 +8%/次(累積);鐵匠/皮甲/飾品 品質提升',
    bonus: { gearTierBoost: 0.08 } },
  hunt:     { id: 'hunt',     name: '狩獵傳統', icon: '🏹',
    desc: '戰鬥金幣/經驗/素材 +15%/次;取代舊 shards 線性加成',
    bonus: { matMul: 0.15, goldMul: 0.15, xpMul: 0.15 } },
  scholar:  { id: 'scholar',  name: '學術傳統', icon: '📚',
    desc: '技能 AP +1/次 + 技能經驗 +10%/次;技能成長加速',
    bonus: { skillXpMul: 0.10, apBonus: 1 } },
  pioneer:  { id: 'pioneer',  name: '開拓傳統', icon: '🗺',
    desc: 'boss 戰前置條件寬鬆 1 階(easy+hard 即開 boss);新區域更快可達',
    bonus: { bossGateEase: 1 } },
})
export const TRADITION_ORDER = ['commerce', 'forge', 'hunt', 'scholar', 'pioneer']

/** 該 tradition 的累計 count(老存檔 traditions undefined → 0) */
export function getTraditionCount(id) {
  return prestige?.traditions?.[id] || 0
}

/** 全部 tradition 累計 */
export function getTotalTraditions() {
  return TRADITION_ORDER.reduce((s, id) => s + getTraditionCount(id), 0)
}

/** 給定 bonus key,加總所有 tradition 該 key 的 multiplier(假設線性累積) */
export function getTraditionBonus(key) {
  let sum = 0
  for (const id of TRADITION_ORDER) {
    const t = TRADITIONS[id]
    if (t.bonus[key]) sum += t.bonus[key] * getTraditionCount(id)
  }
  return sum
}

/** 該 tradition 的效果文字(給 achievement / 重建 UI 用) */
export function getTraditionSummary(id) {
  const t = TRADITIONS[id]
  const c = getTraditionCount(id)
  if (!c) return `${t.icon} ${t.name} (未選)`
  const effectLines = Object.entries(t.bonus).map(([k, v]) => {
    const sign = v > 0 ? '+' : ''
    const pct = typeof v === 'number' ? `${sign}${Math.round(v * 100)}%/次 × ${c} = ${sign}${Math.round(v * c * 100)}%` : `${v}/次 × ${c}`
    return `${k}: ${pct}`
  }).join('; ')
  return `${t.icon} ${t.name} × ${c} — ${effectLines}`
}
