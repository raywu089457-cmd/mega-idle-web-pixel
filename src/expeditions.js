// src/expeditions.js — L2 深淵 + 流浪獵人 + 天氣
// 從 index.html L2446-2562 搬出
// 設計:startAbyssCombat / finishAbyssCombat 透過 state.impls 反向注入到 combat.js
//      spawnWanderingHero / processWanderingTick / rollWeather / weatherTick 透過 state.impls 提供給 meta.js
// 不 import ui.js

import { ZONES, HERO_CLASSES, WANDERING_HERO_TYPES, RARITIES, WEATHERS } from './data.js'
import { wanderingHeroes, territoryHeroes, weather, settings, impls, incWeatherTicks, setWeather, sceneCtx, sceneW, sceneH, sceneStart, sceneNight, setSceneNight } from './state.js'
import { rand, randf, clamp, choice, $, showToast, esc } from './util.js'
import { sfx as audioSfx } from './audio.js'
import { BuildingSystem_getWanderingSpawnInterval, BuildingSystem_getMaxWanderingHeroes, BuildingSystem_getTerritoryHeroSlots, ResourceSystem_add } from './resources-buildings.js'
import { getHeroStats, normalizeHero, rollStars, getHeroStats as getHeroStatsFn } from './heroes-stats.js'
import { startLiveCombat } from './combat.js'

// ═══════════════════════════════════════════════════════════════════
// 深淵 (abyss)
// ═══════════════════════════════════════════════════════════════════
export function abyssUnlocked() { return !!(mapProgress && mapProgress.zoneProgress[5] && mapProgress.zoneProgress[5].bossDefeated); }
import { mapProgress } from './state.js'
export function abyssEnemy(depth) {
  // BALANCE: softened scaling so depth 2+ is achievable for Lv80+ heroes with +10 gear.
  // depth 1: HP 150±20, ATK 25±3  (was 200/30)
  // depth 10: HP 650, ATK 65  (was 1000/96)
  // depth 50: HP 2650, ATK 225  (was 4200/330)
  const baseAtk = 25 + depth * 4;
  const baseHp = 150 + depth * 50;
  return { name: `深淵魔物 Lv.${depth}`, hp: baseHp + rand(-20, 20), atk: baseAtk + rand(-3, 3), def: 10 + Math.floor(depth / 3) };
}
export function dispatchAbyss(heroId) {
  const hero = territoryHeroes.find(h => h.id === heroId); if (!hero) return;
  if (!abyssUnlocked()) { showToast('需先擊敗魔域王座的魔域大君。', 'error'); return; }
  if (hero.status === 'exploring') { showToast('獵人正在狩獵中。', 'error'); return; }
  if (hero.status === 'resting') { showToast('獵人休整中。', 'error'); return; }
  if ((hero.fatigue || 0) >= 90) { showToast('疲勞過高。', 'error'); return; }
  hero.status = 'exploring'; hero.exploreZoneId = 'abyss'; hero.exploreDifficulty = 'hard'; hero.explorationProgress = 0;
  hero.abyssDepth = 1; hero.combatSkillCds = {};
  audioSfx('dispatch'); showToast(`🕳 ${hero.name} 進入深淵第 1 層`, 'info');
}
export function startAbyssCombat(hero) {
  const depth = hero.abyssDepth || 1;
  const enemy = { ...abyssEnemy(depth) };
  enemy.maxHp = enemy.hp; enemy.isBoss = false; enemy.zoneId = 'abyss';
  const lc = {
    heroId: hero.id, zoneId: 'abyss', diff: 'hard', isBoss: false, isAbyss: true,
    cfg: { goldRange: [50 + depth * 20, 100 + depth * 40], magicStoneChance: 0.3 + depth * 0.015, xp: 30 + depth * 20, drops: ['healthPotion'] },
    enemy,
    round: 0, lines: [`🕳 第 ${depth} 層：遭遇 ${enemy.name}！`], phase2: false, enraged: false,
    dmgDealt: 0, dmgTaken: 0, crits: 0, bossMech: null, lastCounterDmg: 0,
  };
  // 利用 combat.js 的 startLiveCombat 機制:但因為 abyss 是合約不同的 enemy,
  // 直接呼叫 startLiveCombat + 改寫其結果
  startLiveCombat(hero);
  const real = liveCombats[hero.id];
  if (real) {
    real.isAbyss = true;
    real.zoneId = 'abyss';
    real.cfg = lc.cfg;
    real.lines.unshift(lc.lines[0]);
  } else {
    // FALLBACK (abyss is not a real zone ID): create liveCombats manually.
    // CRITICAL: startLiveCombat sets hero.status='idle' when getZone('abyss') fails
    // (returns undefined since 'abyss' is not in ZONES array). We must restore
    // hero.status='exploring' so processHeroTick processes this liveCombat.
    liveCombats[hero.id] = lc;
    hero.status = 'exploring';
  }
}
import { liveCombats } from './state.js'
import { stats } from './state.js'
export function finishAbyssCombat(hero, lc, won) {
  if (won) {
    const depth = hero.abyssDepth || 1;
    hero.abyssDepth = depth + 1;
    if (depth > (mapProgress.abyssBest || 0)) mapProgress.abyssBest = depth;
    stats.kills += 1;
    // BALANCE: abyss wins now drop MS (was 0). Mirrors finishLiveCombat's MS path.
    // Depth-scaled: deeper wins yield more stones.
    const msDrop = 1 + Math.floor(depth / 10);
    ResourceSystem_add('magicStones', msDrop);
    showToast(`🕳 第 ${depth} 層已清,前往第 ${depth + 1} 層(+${msDrop}💠)`, 'success');
    hero.status = 'exploring'; hero.explorationProgress = 0;
    // CRITICAL: reset fatigue so hero doesn't auto-recall from abyss at fatigue 90
    // (restHero would treat the next depth as a "loss" and reset abyssDepth to 1,
    // making the win worthless). This simulates the hero resting briefly between
    // abyss layers without losing progression.
    hero.fatigue = 0;
  } else {
    const reached = (hero.abyssDepth || 1) - 1;
    if (reached > (mapProgress.abyssBest || 0)) mapProgress.abyssBest = reached;
    hero.abyssDepth = 1;
    hero.status = 'resting'; hero.restTicks = 6; hero.explorationProgress = 0;
    showToast(`🕳 ${hero.name} 從深淵撤退（到達第 ${reached + 1} 層）`, 'info');
  }
  delete liveCombats[hero.id];
  audioSfx(won ? 'gold' : 'defeat');
}

// ═══════════════════════════════════════════════════════════════════
// 流浪獵人
// ═══════════════════════════════════════════════════════════════════
// Weighted spawn: common low-level heroes frequent; rare high-level rare.
// This keeps the village flowing with new recruits while preserving the
// "wow, a Lv 16 priest just walked in!" moment for endgame players.
function pickWanderingType() {
  // weight: T1=10, T2=5, T3=1
  const weights = WANDERING_HERO_TYPES.map(t => {
    if (t.level <= 3) return 10;
    if (t.level <= 8) return 5;
    return 1;
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WANDERING_HERO_TYPES.length; i++) {
    r -= weights[i];
    if (r <= 0) return WANDERING_HERO_TYPES[i];
  }
  return WANDERING_HERO_TYPES[0];
}
export function spawnWanderingHero() {
  if (wanderingHeroes.length >= BuildingSystem_getMaxWanderingHeroes()) return;
  const tpl = pickWanderingType();
  const rarity = pickRarity();
  const rDef = RARITIES[rarity];
  // Wallet scales with hero level so high-level visitors are pricey recruits
  const wallet = Math.round((40 + tpl.level * 60) * rDef.walletMult);
  const id = 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const h = normalizeHero({
    id, name: choice(['阿嵐','艾琳','白洛','班恩','碧翠','布蘭','凱恩','卡菈']),
    class: tpl.class, level: tpl.level,
    xp: 0, stars: rollStars(), rarity,
    status: 'idle',
    equipment: { weapon: null, armor: null },
    inventory: {},
    wallet, diamonds: 0,
    // Higher-level visitors start with better mood (selective)
    mood: rand(50, 80) + Math.min(15, tpl.level),
    dropMagicStoneChance: tpl.dropMagicStoneChance,
  });
  h.huntZoneId = null;
  h.targetBuilding = null;
  h.wandering = true;
  h.arrivedAt = Date.now();
  wanderingHeroes.push(h);
}
function pickRarity() {
  const total = Object.values(RARITIES).reduce((s, r) => s + r.weight, 0);
  let r = Math.random() * total;
  for (const k of Object.keys(RARITIES)) { r -= RARITIES[k].weight; if (r <= 0) return k; }
  return 'normal';
}
export function processWanderingTick() {
  // 觸發刷新排程
  if (nextWanderingSpawnIn === undefined) {
    impls.bumpNextWanderingSpawn?.(BuildingSystem_getWanderingSpawnInterval());
  }
  if (impls.consumeNextWanderingSpawn?.()) {
    spawnWanderingHero();
  }
  // 推進每個 wandering hero 的 AI(簡化:留 hook 給 scene.js 處理座標移動)
  for (const h of wanderingHeroes) {
    h.actionTicks = Math.max(0, (h.actionTicks || 0) - 0.05);
    if (h.mood !== undefined) h.mood = clamp(h.mood - 0.1, 0, 100);
  }
}
import { nextWanderingSpawnIn } from './state.js'
import { setNextWanderingSpawnIn } from './state.js'

// ═══════════════════════════════════════════════════════════════════
// 天氣
// ═══════════════════════════════════════════════════════════════════
export function rollWeather() {
  const total = Object.values(WEATHERS).reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const k of Object.keys(WEATHERS)) { r -= WEATHERS[k].weight; if (r <= 0) return k; }
  return 'sunny';
}
export function weatherTick() {
  incWeatherTicks();
  if (weather.ticks >= 600) {   // 10 分鐘 @ 1 tick/sec
    setWeather({ ...weather, type: rollWeather(), ticks: 0 });
    showToast(`${WEATHERS[weather.type].icon} 天氣變為：${WEATHERS[weather.type].name}`, 'info');
  }
  // 場景日夜(0=白天, 1=黑夜)
  const sec = (Date.now() - sceneStart) / 1000;
  const phase = (sec % 600) / 600;
  setSceneNight(phase < 0.4 || phase > 0.85 ? 1 : 0);
}

// ═══════════════════════════════════════════════════════════════════
// 註冊到 state.impls(讓其他模組透過 impls 呼叫)
// ═══════════════════════════════════════════════════════════════════
impls.startAbyssCombat = startAbyssCombat;
impls.finishAbyssCombat = finishAbyssCombat;
impls.spawnWanderingHero = spawnWanderingHero;
impls.processWanderingTick = processWanderingTick;
impls.rollWeather = rollWeather;
impls.weatherTick = weatherTick;
