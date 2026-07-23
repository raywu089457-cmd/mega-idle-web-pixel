// src/expedition-readiness.js — L1 遠征準備度檢查(§六 4)
// 設計:派遣前預檢查藥水庫存/隊伍組成/特定建築等級;score 0-100 + items 列出缺失項
// 不強制阻止派遣(玩家可忽略),只給提示

import { BuildingSystem_getLevel } from './resources-buildings.js'
import { getZone } from './combat.js'

const HARD_REQS = {
  // zoneId → [req array];每條: { check: () => boolean, label, severity: 'block' | 'warn' | 'tip' }
  5: [{ check: () => BuildingSystem_getLevel('altar') >= 5, label: '魔核研究所 Lv.5+', severity: 'warn', tip: '研究高階魔核以解析大君弱點' }],
  6: [{ check: () => BuildingSystem_getLevel('altar') >= 7, label: '魔核研究所 Lv.7+', severity: 'warn', tip: '噩夢迴廊需要更深層魔核解析' }],
  7: [{ check: () => BuildingSystem_getLevel('altar') >= 9, label: '魔核研究所 Lv.9+', severity: 'warn', tip: '深淵核心需要最高階魔核解析' }],
}

/**
 * @param {number} zoneId
 * @param {Array<{class:string,level:number}>} [heroes] - 派遣英雄陣容(可選)
 * @returns {{score:number, items:Array<{label:string, severity:string, passed:boolean, tip:string}>}}
 */
export function checkExpeditionReadiness(zoneId, heroes = []) {
  const items = [];

  // 1. 建築需求(每 zone)
  const zoneReqs = HARD_REQS[zoneId] || [];
  for (const req of zoneReqs) {
    const passed = req.check();
    items.push({ label: req.label, severity: req.severity, passed, tip: passed ? '' : req.tip });
  }

  // 2. 藥水庫存:每位英雄建議 1 瓶
  const potionCount = (typeof window !== 'undefined' && window.shopStock?.healthPotion) || 0;
  const heroCount = heroes.length || 1;
  const potionOk = potionCount >= heroCount;
  items.push({
    label: `治療藥水 ${potionCount}/${heroCount}`,
    severity: potionOk ? 'tip' : 'warn',
    passed: potionOk,
    tip: potionOk ? '藥水充足' : '煉金工房產量或庫存不足,容易因傷撤退',
  });

  // 3. 隊伍職業多樣性(≥ 2 種職業)
  if (heroes.length >= 2) {
    const classes = new Set(heroes.map(h => h.class));
    const diverse = classes.size >= 2;
    items.push({
      label: `職業多樣性 ${classes.size}/${Math.min(3, heroes.length)}`,
      severity: diverse ? 'tip' : 'warn',
      passed: diverse,
      tip: diverse ? '陣容多元,易應對各屬性怪物' : '單一職業陣容被剋屬性時易滅團,建議混搭',
    });
  }

  // 4. 怪物元素剋制(若 zone 有元素)
  const zone = getZone(zoneId);
  if (zone && zone.element && heroes.length) {
    // 簡化:若隊伍中有 1 位以上等級 >= zone.recommendedLevel*0.8 的英雄,視為有準備
    const recLevel = (typeof zone.recommendedLevel === 'function') ? zone.recommendedLevel('normal') : 1;
    const ready = heroes.some(h => h.level >= recLevel * 0.8);
    items.push({
      label: `建議等級 ≥ ${Math.round(recLevel * 0.8)}`,
      severity: ready ? 'tip' : 'warn',
      passed: ready,
      tip: ready ? '等級達標' : `等級偏低,建議 ${recLevel}+ 再挑戰`,
    });
  }

  // 計分:passed 比例 × 100,並依 severity 加權
  let weightSum = 0, passSum = 0;
  for (const it of items) {
    const w = it.severity === 'block' ? 3 : it.severity === 'warn' ? 2 : 1;
    weightSum += w;
    if (it.passed) passSum += w;
  }
  const score = weightSum > 0 ? Math.round((passSum / weightSum) * 100) : 100;

  return { score, items };
}

/** 給 UI 顯示的簡短文字總結 */
export function getReadinessLabel(score) {
  if (score >= 90) return '準備充分';
  if (score >= 70) return '尚可';
  if (score >= 50) return '勉強可戰';
  return '建議整備後再出發';
}
