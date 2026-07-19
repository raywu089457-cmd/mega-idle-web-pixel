// src/skills.js — L2 技能樹 runtime
// 從 index.html L911-1018 搬出(SKILL_TREE 表已搬到 data.js)
// 設計:純函式 + 資料副作用;showToast/sfx/renderAll 等 UI 副作用由 caller (ui.js) 負責
// 避免與 ui.js 形成循環

import { SKILL_TREE, baseClassOf } from './data.js';
import { territoryHeroes } from './state.js';
import { showToast } from './util.js';

// ─── 查詢類 (純函式) ─────────────────────────────────────────────────
export function getSkillApGain(_hero) { return 1; }
export function getHeroSkillPoints(hero) { return hero.skillPoints || 0; }
export function grantSkillPoints(hero, amount) { hero.skillPoints = (hero.skillPoints || 0) + amount; }
export function getHeroSkills(hero) { return hero.skills || []; }
export function getHeroSkillLevel(hero, skillId) { const s = (hero.skills || []).find(s => s.id === skillId); return s ? s.level : 0; }
export function getSkillDef(classKey, skillId) { const tree = SKILL_TREE[baseClassOf(classKey)] || []; return tree.find(s => s.id === skillId) || null; }

export function canLearnSkill(hero, skillId) {
  const def = getSkillDef(hero.class, skillId); if (!def) return false;
  const cur = getHeroSkillLevel(hero, skillId); if (cur >= def.maxLevel) return false;
  return (hero.skillPoints || 0) >= 1;
}

// ─── 修改類(資料副作用;UI 副作用由 caller 負責) ────────────────────
/**
 * @returns {{ok: boolean, message?: string, icon?: string, name?: string}}
 */
export function learnSkill(hero, skillId) {
  if (!canLearnSkill(hero, skillId)) { showToast('無法學習此技能。', 'error'); return { ok: false }; }
  hero.skillPoints = (hero.skillPoints || 0) - 1;
  const existing = (hero.skills || []).find(s => s.id === skillId);
  if (existing) { existing.level += 1; } else { if (!hero.skills) hero.skills = []; hero.skills.push({ id: skillId, level: 1 }); }
  const def = getSkillDef(hero.class, skillId);
  showToast(`學會了！ ${def.icon} ${def.name}`, 'success');
  return { ok: true, icon: def.icon, name: def.name };
}

/**
 * @returns {{ok: boolean, refunded?: number, message?: string}}
 */
export function resetSkills(heroId) {
  const hero = territoryHeroes.find(h => h.id === heroId); if (!hero) return { ok: false };
  const learned = (hero.skills || []).reduce((s, sk) => s + sk.level, 0);
  if (!learned) { showToast('尚未學習任何技能。', 'info'); return { ok: false }; }
  if (!confirm(`花費 5💠 重置 ${hero.name} 的全部技能，返還 ${learned} AP？`)) return { ok: false };
  // 5💠 費用由 caller 透過 ResourceSystem_spend 扣除(避免本檔 import resources-buildings)
  hero.skills = [];
  hero.skillPoints = (hero.skillPoints || 0) + learned;
  showToast(`${hero.name} 技能已重置，返還 ${learned} AP。`, 'success');
  return { ok: true, refunded: learned };
}

// ─── 戰鬥 buff 套用(純副作用在傳入 st 與 ctx) ──────────────────────
export function applyPassiveSkills(hero, st) {
  const skills = hero.skills || [];
  for (const sk of skills) {
    const def = getSkillDef(hero.class, sk.id); if (!def || def.type !== 'passive') continue;
    def.effect(st, sk.level);
  }
}

export function getActiveSkills(hero) { return (SKILL_TREE[baseClassOf(hero.class)] || []).filter(s => s.type === 'active'); }

export function tickSkillCds(hero) {
  const cds = hero.combatSkillCds; if (!cds) return;
  for (const k of Object.keys(cds)) { if (cds[k] > 0) cds[k] -= 1; }
}

export function applySkillBuffs(hero, st, ctx) {
  const buffs = ctx && ctx.skillBuffs; if (!buffs) return;
  for (const sid of Object.keys(buffs)) {
    if (buffs[sid] <= 0) { delete buffs[sid]; continue; }
    const def = getSkillDef(hero.class, sid); if (!def) { delete buffs[sid]; continue; }
    def.effect(st, getHeroSkillLevel(hero, sid));
    buffs[sid] -= 1;
  }
}

export function tryTriggerActiveSkill(hero, st, ctx) {
  const actives = getActiveSkills(hero); if (!actives.length) return;
  const cds = hero.combatSkillCds || {};
  for (const def of actives) {
    const lv = getHeroSkillLevel(hero, def.id);
    if (lv <= 0) continue;                 // 未學習的技能不觸發
    if ((cds[def.id] || 0) > 0) continue;  // 冷卻中
    if (Math.random() < 0.4) {
      if (!hero.combatSkillCds) hero.combatSkillCds = {};
      hero.combatSkillCds[def.id] = def.triggerRounds;
      def.effect(st, lv);
      // 持續型技能（duration > 1）：本回合已生效，剩餘回合掛到戰鬥狀態由 applySkillBuffs 套用
      if (def.duration > 1 && ctx) {
        if (!ctx.skillBuffs) ctx.skillBuffs = {};
        ctx.skillBuffs[def.id] = def.duration - 1;
      }
      if (ctx && ctx.lines) ctx.lines.push(`✦ ${hero.name} 發動 ${def.icon} ${def.name}！`);
    }
  }
}
