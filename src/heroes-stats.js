// src/heroes-stats.js — L2 獵人屬性 / 技能套用 / 訓練 / 招募 / 進階職業
// 從 index.html L1323-1578 搬出 + advanceClass 從 data.js L717-726 搬入
// 設計:不 import combat.js / inventory.js / ui.js;sfx + showToast 副作用 inline(音訊+toast 不形成循環)
// renderAll 由 caller 負責

import { HERO_CLASSES, ADV_CLASSES, HUNTER_NAMES, RARITIES, TRAITS, AFFIXES, GEAR_SETS, ITEMS, CLASS_NAMES_ZH, gearTierMult, baseClassOf, advClassFor } from './data.js'
import { territoryHeroes, wanderingHeroes, liveCombats, partyCombats, mapProgress, weather, activeExplorations, setActiveExplorations } from './state.js'
import { applyPassiveSkills, grantSkillPoints, getSkillApGain } from './skills.js'
import { getAchievementBonuses, getCombatGoldMultiplier, getXpMultiplier } from './bonuses.js'
import { ResourceSystem_spend, ResourceSystem_add, BuildingSystem_getLevel, BuildingSystem_getTerritoryHeroSlots } from './resources-buildings.js'
import { rand, choice, clamp, uid, showToast, fmt } from './util.js'
import { sfx } from './audio.js'

// ═══════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════
export function getEquipBonuses(eq) {
  // Equipment instances store { id, iid, tier, affix, plus, name, icon }; stats come from ITEMS by id,
  // so pre-fix saves with plain {id,name,icon} equipment automatically gain stats (tier undefined → ×1).
  const out = { atk: 0, def: 0, hp: 0, crit: 0, msFind: 0, affix: null };
  if (!eq || !eq.id) return out;
  const def = ITEMS[eq.id];
  const plus = eq.plus || 0;
  const tmult = gearTierMult(eq.tier);
  if (def) {
    out.atk += Math.round((def.atk || 0) * tmult);
    out.def += Math.round((def.def || 0) * tmult);
    out.hp += Math.round((def.hp || 0) * tmult);
    out.crit += (def.crit || 0) * tmult;
    out.msFind += (def.msFind || 0) * tmult;
  }
  if (def?.type === 'weapon') out.atk += plus * 3;
  if (def?.type === 'armor') { out.def += plus * 3; out.hp += plus * 15; }
  if (def?.type === 'accessory') { out.atk += plus * 2; out.hp += plus * 8; out.crit += plus * 0.015; }
  if (eq.affix) out.affix = AFFIXES.find(a => a.id === eq.affix) || null;
  return out;
}
export function getHeroTraits(hero) { return [hero?.trait, hero?.trait2].map(id => TRAITS.find(t => t.id === id)).filter(Boolean); }
export function getHeroTrait(hero) { return getHeroTraits(hero)[0] || null; }
export function randomTraitExcluding(...ids) {
  const pool = TRAITS.filter(t => !ids.includes(t.id));
  return (pool.length ? choice(pool) : choice(TRAITS)).id;
}
export function rerollTrait(heroId, slot) {
  const hero = territoryHeroes.find(h => h.id === heroId); if (!hero) return;
  if (slot === 2 && !hero.trait2) { showToast('Lv.15 解鎖第二特質。', 'info'); return; }
  if (!ResourceSystem_spend({ magicStones: 2 })) { showToast('魔核不足（需 2💠）。', 'error'); return; }
  const next = randomTraitExcluding(hero.trait, hero.trait2);
  if (slot === 2) hero.trait2 = next; else hero.trait = next;
  sfx('click'); showToast(`特質重骰為「${TRAITS.find(t => t.id === next)?.name}」`, 'success');
}
export function getHeroStats(hero) {
  const cls = HERO_CLASSES[hero.class] || HERO_CLASSES.warrior;
  const lvl = hero.level || 1;
  let atk = hero.atk ?? (cls.baseAtk + (lvl - 1) * 3);
  let def = hero.def ?? (cls.baseDef + (lvl - 1) * 2);
  let maxHp = hero.maxHp ?? (cls.baseHp + (lvl - 1) * 10);
  let crit = 0.05, msFind = 0;
  atk += BuildingSystem_getLevel('weaponShop');
  def += BuildingSystem_getLevel('armorShop');
  const ach = getAchievementBonuses();
  atk += ach.atk; def += ach.def;
  const affixes = [];
  for (const slot of ['weapon', 'armor', 'accessory']) {
    const b = getEquipBonuses(hero.equipment?.[slot]);
    atk += b.atk; def += b.def; maxHp += b.hp; crit += b.crit; msFind += b.msFind;
    if (b.affix) affixes.push(b.affix);
  }
  const st = { atk, def, maxHp, crit, msFind, goldMult: getCombatGoldMultiplier(), xpMult: getXpMultiplier() };
  // Star rank: 1~5 stars adjust the whole combat body (3 stars = baseline).
  const starMult = 1 + (((hero.stars || 3) - 3) * 0.08);
  st.atk = Math.max(1, Math.round(st.atk * starMult));
  st.def = Math.max(0, Math.round(st.def * starMult));
  st.maxHp = Math.max(1, Math.round(st.maxHp * starMult));
  // Innate hunter traits (second slot unlocks at Lv.15).
  for (const tr of getHeroTraits(hero)) tr.apply(st);
  // Advanced class bonus (轉職)
  const advB = ADV_CLASSES[hero.class]?.bonus;
  if (advB) {
    if (advB.atk) st.atk = Math.round(st.atk * (1 + advB.atk));
    if (advB.def) st.def = Math.round(st.def * (1 + advB.def));
    if (advB.hp) st.maxHp = Math.round(st.maxHp * (1 + advB.hp));
    if (advB.crit) st.crit += advB.crit;
    if (advB.msFind) st.msFind += advB.msFind;
  }
  // Gear affixes & set bonuses
  for (const af of affixes) af.effect(st);
  applySetBonusesLocal(hero, st);
  // Apply passive skills
  applyPassiveSkills(hero, st);
  // Fatigue: long hunts without rest lower combat performance.
  const fatigue = hero.fatigue || 0;
  if (fatigue >= 90) { st.atk = Math.max(1, Math.round(st.atk * 0.7)); st.def = Math.round(st.def * 0.7); }
  else if (fatigue >= 70) { st.atk = Math.max(1, Math.round(st.atk * 0.85)); st.def = Math.round(st.def * 0.85); }
  // Weather effects
  if (weather.type === 'fog') st.msFind += 0.1;
  if (weather.type === 'snow') st.xpMult *= 1.1;
  return st;
}
function applySetBonusesLocal(hero, st) {
  const equipped = ['weapon', 'armor', 'accessory'].map(s => hero.equipment?.[s]?.id).filter(Boolean);
  hero.activeSets = [];
  for (const set of GEAR_SETS) {
    if (set.pieces.every(p => equipped.includes(p))) { set.effect(st); hero.activeSets.push(set); }
  }
}

// ═══════════════════════════════════════════════════════════════════
// HERO CREATION / XP
// ═══════════════════════════════════════════════════════════════════
export function xpNeed(level) { return 80 + (level - 1) * 60; }
export function rollStars() {
  const r = Math.random();
  if (r < 0.05) return 1;
  if (r < 0.25) return 2;
  if (r < 0.70) return 3;
  if (r < 0.92) return 4;
  return 5;
}
export function randomTrait() { return choice(TRAITS).id; }
export function normalizeHero(h) {
  const cls = HERO_CLASSES[h.class] || HERO_CLASSES.warrior;
  h.id = h.id || uid();
  h.level = h.level || 1;
  h.xp = h.xp || 0;
  h.stars = clamp(h.stars || rollStars(), 1, 5);
  h.rarity = h.rarity in RARITIES ? h.rarity : 'normal';
  h.trait = h.trait || randomTrait();
  h.fatigue = clamp(h.fatigue || 0, 0, 100);
  h.mood = h.mood == null ? 70 : clamp(h.mood, 0, 100);
  h.maxHp = h.maxHp || (cls.baseHp + (h.level - 1) * 10);
  h.hp = h.hp == null ? h.maxHp : h.hp;
  h.atk = h.atk || (cls.baseAtk + (h.level - 1) * 3);
  h.def = h.def || (cls.baseDef + (h.level - 1) * 2);
  h.status = h.status || 'idle';
  h.equipment = h.equipment || { weapon: null, armor: null, accessory: null };
  if (!('accessory' in h.equipment)) h.equipment.accessory = null;
  h.inventory = (h.inventory && !Array.isArray(h.inventory)) ? h.inventory : {};
  h.wallet = h.wallet || 0;
  h.diamonds = h.diamonds || 0;
  h.explorationProgress = h.explorationProgress || 0;
  h.exploreZoneId = h.exploreZoneId || null;
  h.exploreDifficulty = h.exploreDifficulty || null;
  h.restTicks = h.restTicks || 0;
  h.autoPotion = h.autoPotion !== false;
  // 城內可視 AI（流浪獵人在場景中走動、進店、打怪用）
  h.sx = h.sx == null ? 120 + rand(-8, 8) : h.sx;
  h.sy = h.sy == null ? 344 : h.sy;
  h.aiState = h.aiState || 'arrive';
  h.targetX = h.targetX == null ? null : h.targetX;
  h.targetY = h.targetY == null ? null : h.targetY;
  h.actionTicks = h.actionTicks || 0.6;
  h.gearAtk = h.gearAtk || 0;
  h.opponentId = h.opponentId || null;
  h.effects = Array.isArray(h.effects) ? h.effects : [];
  h.huntZoneId = h.huntZoneId || null;
  h.deadTicks = h.deadTicks || 0;
  h.inside = false;   // 進店/休息時不在場景繪製（瞬態，不存檔）
  h.bubble = null;    // 對話泡泡（瞬態）
  // 技能系統
  if (!Array.isArray(h.skills)) h.skills = [];
  h.skillPoints = h.skillPoints || 0;
  h.combatSkillCds = h.combatSkillCds || {};
  return h;
}
export function generateHero(classKey, level = 1, customName) {
  const cls = HERO_CLASSES[classKey] || HERO_CLASSES.warrior;
  const name = customName || choice(HUNTER_NAMES);
  return normalizeHero({
    id: uid(), name, class: classKey in HERO_CLASSES ? classKey : 'warrior', level,
    xp: 0, status: 'idle', equipment: { weapon: null, armor: null }, inventory: {},
    wallet: 0, diamonds: 0, dropMagicStoneChance: 0.1,
  });
}
export function grantXp(hero, amount) {
  const gain = Math.max(1, Math.round(amount * getXpMultiplier()));
  hero.xp += gain;
  let ups = 0;
  let trait2Gained = false;
  while (hero.xp >= xpNeed(hero.level)) {
    hero.xp -= xpNeed(hero.level);
    hero.level += 1; ups += 1;
    const growth = 1 + (((hero.stars || 3) - 1) * 0.12);
    hero.maxHp += Math.round(10 * growth);
    hero.atk += Math.round(3 * growth);
    hero.def += Math.round(2 * growth);
    hero.hp = getHeroStats(hero).maxHp;
    grantSkillPoints(hero, getSkillApGain(hero));
    if (hero.level >= 15 && !hero.trait2) {
      hero.trait2 = randomTraitExcluding(hero.trait);
      trait2Gained = true;
    }
  }
  if (ups > 0) { sfx('level'); showToast(`${hero.name} 升到了 Lv.${hero.level}！`, 'success'); }
  if (trait2Gained) showToast(`✨ ${hero.name} 覺醒了第二特質「${TRAITS.find(t => t.id === hero.trait2)?.name}」！`, 'success');
  return ups;
}
export function trainCost(hero) { return { gold: Math.round((80 + hero.level * 60) * (1 + (((hero.stars || 3) - 1) * 0.25))) }; }
export function HeroSystem_trainHero(heroId) {
  const hero = territoryHeroes.find(h => h.id === heroId); if (!hero) return false;
  if (!ResourceSystem_spend(trainCost(hero))) return false;
  grantXp(hero, 50 + hero.level * 15);
  return true;
}
export function trainHero(heroId) {
  if (HeroSystem_trainHero(heroId)) { sfx('click'); showToast('訓練完成，經驗提升！', 'success'); }
  else showToast('金幣不足，無法訓練。', 'error');
}
export function usePotion(hero, silent) {
  if ((hero.inventory.healthPotion || 0) <= 0) return false;
  const st = getHeroStats(hero);
  if (hero.hp >= st.maxHp) return false;
  hero.inventory.healthPotion -= 1;
  hero.hp = Math.min(st.maxHp, hero.hp + Math.ceil(st.maxHp * (ITEMS.healthPotion.healPct || 0.3)));
  if (!silent) { sfx('heal'); showToast(`${hero.name} 使用了生命藥水`, 'info'); }
  return true;
}
export function restHero(heroId) {
  const hero = territoryHeroes.find(h => h.id === heroId); if (!hero) return;
  if (hero.partyId && partyCombats[hero.partyId]) { showToast('組隊戰鬥中，無法單獨召回。', 'info'); return; }
  if (hero.exploreZoneId === 'abyss') {
    const reached = (hero.abyssDepth || 1) - 1;
    if (reached > (mapProgress.abyssBest || 0)) mapProgress.abyssBest = reached;
    hero.abyssDepth = 1;
    showToast(`🕳 ${hero.name} 撤離深淵（本次到達第 ${reached + 1} 層）。`, 'info');
  }
  delete liveCombats[hero.id];
  hero.partyId = null;
  hero.status = 'resting'; hero.restTicks = Math.max(hero.restTicks, 4);
  hero.exploreZoneId = null; hero.exploreDifficulty = null; hero.explorationProgress = 0;
  syncActiveExplorations();
}
export function recallHero(heroId) { restHero(heroId); showToast('獵人已返回獵魔村休整。', 'info'); }
export function recallAllHeroes() {
  const out = territoryHeroes.filter(h => h.status === 'exploring' && !h.partyId);
  if (!out.length) { showToast('目前沒有可召回的獵人（組隊戰鬥中無法召回）。', 'info'); return; }
  for (const h of out) restHero(h.id);
  sfx('click'); showToast(`🏠 已召回 ${out.length} 位獵人。`, 'success');
}
export function recruitCost(w) { return { gold: 60 + (w.level || 1) * 45 }; }
export function recruitWanderingHero(heroId) {
  const idx = wanderingHeroes.findIndex(h => h.id === heroId); if (idx < 0) return;
  if (territoryHeroes.length >= BuildingSystem_getTerritoryHeroSlots()) { showToast('獵人空位不足，請升級酒館。', 'error'); return; }
  const w = wanderingHeroes[idx];
  if (!ResourceSystem_spend(recruitCost(w))) { showToast('金幣不足，無法招募。', 'error'); return; }
  wanderingHeroes.splice(idx, 1);
  const hero = normalizeHero({ ...w, id: uid(), status: 'idle', equipment: { weapon: null, armor: null }, inventory: {}, exploreZoneId: null, exploreDifficulty: null, explorationProgress: 0 });
  territoryHeroes.push(hero);
  sfx('recruit'); showToast(`${hero.name} 加入了獵魔村！`, 'success');
}

// ═══════════════════════════════════════════════════════════════════
// 進階職業 (從 data.js 搬入)
// ═══════════════════════════════════════════════════════════════════
export function canAdvance(hero) { return !!advClassFor(hero.class) && (hero.level || 1) >= 20; }
export function advanceClass(heroId) {
  const hero = territoryHeroes.find(h => h.id === heroId); if (!hero) return;
  const advKey = advClassFor(hero.class);
  if (!advKey) { showToast(CLASS_LINEAGE[hero.class] ? '已是進階職業。' : '無法轉職。', 'info'); return; }
  if ((hero.level || 1) < 20) { showToast('需要 Lv.20 才能轉職。', 'error'); return; }
  if (!ResourceSystem_spend({ magicStones: 20 })) { showToast('魔核不足（需 20💠）。', 'error'); return; }
  hero.class = advKey;
  hero.hp = Math.min(hero.hp, getHeroStats(hero).maxHp);
  sfx('level'); showToast(`⬆ ${hero.name} 轉職為 ${ADV_CLASSES[advKey].name}！（${ADV_CLASSES[advKey].desc}）`, 'success');
}
import { CLASS_LINEAGE } from './data.js'

// ═══════════════════════════════════════════════════════════════════
// 探索清單同步(只 filter heroes,無外部依賴;從 combat.js 搬入以避免循環)
// ═══════════════════════════════════════════════════════════════════
export function syncActiveExplorations() {
  const filtered = territoryHeroes.filter(h => h.status === 'exploring' && h.exploreZoneId && h.exploreDifficulty);
  setActiveExplorations(filtered);
}
