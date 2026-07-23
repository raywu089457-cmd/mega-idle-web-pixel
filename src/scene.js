// src/scene.js — L2 Canvas 場景 + 城內 AI(流浪獵人 + 村民 + 怪區) + 建築擺位 + 點擊熱區
// 從 index.html L2744-3566 完整搬出
// 不 import ui.js;render 函式會被 ui.js 觸發;scene 本身的 hotspot 處理會呼叫 ui.js 的 openPanel(透過 import 注入)

import { RESOURCES, MATERIAL_TYPES, RARITIES, HERO_CLASSES, CLASS_NAMES_ZH, WEATHERS } from './data.js'
import { sceneCtx, sceneCanvas, sceneW, sceneH, sceneStart, sceneNight, hoverHotspot, placementPick, buildingPlots, floatState, villagerNPCs, wildMonsters, tombstones, wanderingHeroes, mapProgress, weather, activeExplorations, stats, shopStock, setBuildingPlots, setPlacementPick, setSceneCtx, setSceneStart, setSceneNight, setHoverHotspot, setPendingDailyReward, impls, nextWanderingSpawnIn, setNextWanderingSpawnIn, BW_LEAVE_CHANCE } from './state.js'
import { $, esc, showToast, showModal, hideModal, rand, randf, clamp, choice, uid, fmt, timeAgo } from './util.js'
import { sfx } from './audio.js'
import { gainGold, ResourceSystem_add, BuildingSystem_getLevel, BuildingSystem_getGoldRate, BuildingSystem_getWanderingSpawnInterval } from './resources-buildings.js'
import { stageProductionRate } from './building-effects.js'
import { getHeroStats, usePotion, grantXp, normalizeHero } from './heroes-stats.js'
import { getCombatGoldMultiplier } from './bonuses.js'
import { defaultTeams } from './combat-party.js'
import { setActivePanel, activePanel, setHeroSubTab, heroSubTab, setShopFilter, shopFilter } from './state.js'
import { openPanel, renderHUD, renderAll } from './ui.js'
import { cam, WORLD, SCENE_W, SCENE_H, setCam, recenterCam, isAtHome, gateAt, gateStatus, smartDiff, zoneOf, serviceZoneOf, drawWorldRing, drawGates, ROAD_GRAPH, getWaypoint, pathFind, nearestWaypoint } from './scene-map.js'
import { getQueueSlotOffset } from './queue-points.js'
import { getUnlockedDecorationsForBuilding } from './region-unlocks.js'
import { getEventMul } from './town-events.js'
import { townEvent } from './state.js'

const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ═══════════════════════════════════════════════════════════════════
// 場景 hotspot / 建築擺位配置
// ═══════════════════════════════════════════════════════════════════
const SCENE_HOTSPOTS = [
  { id: 'tavern', name: '獵人酒館', hint: '招募流浪獵人 / 查看獵人', x: 8, y: 148, w: 58, h: 62 },
  { id: 'guild', name: '獵魔公會', hint: '點擊收金與素材', x: 88, y: 112, w: 66, h: 82 },
  { id: 'market', name: '市集', hint: '收取市集金幣', x: 176, y: 152, w: 56, h: 58 },
  { id: 'forge', name: '鐵匠鋪', hint: '製作/強化武器', x: 14, y: 236, w: 62, h: 58 },
  { id: 'alchemy', name: '煉金工房', hint: '藥水與倉庫', x: 90, y: 242, w: 62, h: 54 },
  { id: 'research', name: '魔核研究所', hint: '成就 / 村莊重建', x: 166, y: 236, w: 62, h: 58 },
  { id: 'gate', name: '獵場門', hint: '前往狩獵地圖', x: 92, y: 306, w: 56, h: 44 },
  { id: 'restaurant', name: '餐廳', hint: '獵人用餐(村莊收入)', x: 58, y: 174, w: 30, h: 32 },
  { id: 'drinkShop', name: '飲料店', hint: '獵人買飲料(村莊收入)', x: 154, y: 182, w: 24, h: 30 },
];
const PLOT_COORDS = [
  { x: 16, y: 164 }, { x: 96, y: 132 }, { x: 184, y: 166 }, { x: 62, y: 188 }, { x: 158, y: 194 },
  { x: 22, y: 252 }, { x: 100, y: 258 }, { x: 178, y: 252 }, { x: 96, y: 314 },
];
const PLOT_BUILDINGS = ['tavern', 'guild', 'market', 'restaurant', 'drinkShop', 'forge', 'alchemy', 'research', 'gate'];
const PLOT_NAMES = { tavern: '獵人酒館', guild: '獵魔公會', market: '市集', restaurant: '餐廳', drinkShop: '飲料店', forge: '鐵匠鋪', alchemy: '煉金工房', research: '魔核研究所', gate: '獵場門' };
const BUILDING_TO_SCENE = { tavern: 'tavern', monument: 'guild', goldMine: 'market', restaurant: 'restaurant', drinkShop: 'drinkShop', weaponShop: 'forge', potionShop: 'alchemy', altar: 'research' };
const DEFAULT_PLOT_OF = Object.fromEntries(PLOT_BUILDINGS.map((b, i) => [b, i]));

// ═══════════════════════════════════════════════════════════════════
// 怪區 + 建築錨點
// ═══════════════════════════════════════════════════════════════════
const HUNT_ZONES = [
  { id: 'field', name: '村郊原野', minLv: 1, maxLv: 5, x: 6, y: 310, w: 94, h: 46, spawn: 4, ground: 'rgba(58,84,44,0.72)',
    monsters: [
      { kind: 'slime', name: '史萊姆', color: '#5fbf5f', hp: 30, atk: 4, def: 1, gold: [8, 18], xp: 7 },
      { kind: 'rat', name: '啃齒鼠', color: '#a08a6a', hp: 22, atk: 6, def: 0, gold: [6, 15], xp: 5 },
    ],
    nightMonsters: [
      { kind: 'wisp', name: '夜遊怨靈', color: '#6ad3e0', hp: 40, atk: 9, def: 1, gold: [14, 26], xp: 11, debuff: 'poison' },
    ],
  },
  { id: 'woods', name: '霧林小徑', minLv: 4, maxLv: 9, x: 152, y: 310, w: 82, h: 46, spawn: 3, ground: 'rgba(38,58,48,0.78)',
    monsters: [
      { kind: 'wolf', name: '腐狼', color: '#8a8f7a', hp: 55, atk: 9, def: 2, gold: [18, 34], xp: 14, debuff: 'bleed' },
      { kind: 'bat', name: '灰燼蝠', color: '#9b59b6', hp: 36, atk: 12, def: 1, gold: [14, 30], xp: 12, debuff: 'poison' },
    ],
    nightMonsters: [
      { kind: 'bat', name: '嗜血蝠', color: '#c0392b', hp: 48, atk: 14, def: 1, gold: [22, 40], xp: 16, debuff: 'poison' },
    ],
  },
  { id: 'ridge', name: '荒嶺隘口', minLv: 8, maxLv: 14, x: 160, y: 60, w: 74, h: 44, spawn: 3, ground: 'rgba(52,44,52,0.82)',
    monsters: [
      { kind: 'golem', name: '碎石魔像', color: '#7d6b5d', hp: 110, atk: 14, def: 6, gold: [36, 62], xp: 26, debuff: 'bleed' },
      { kind: 'wisp', name: '荒嶺怨靈', color: '#6ad3e0', hp: 72, atk: 18, def: 2, gold: [30, 54], xp: 22, debuff: 'poison' },
    ],
    // Level-scaled monsters: HP/ATK scale with hero level beyond zone baseline
    nightMonsters: [
      { kind: 'scaledBeast', name: '暗影巨獸', color: '#5d2a5d', hp: 120, atk: 22, def: 5, gold: [50, 80], xp: 35, scalePerLevel: { hp: 12, atk: 2, def: 1 }, debuff: 'bleed' },
    ],
  },
  // ─── NEW: Lv 15+ zone (post-ridge, scales infinitely with hero level) ───
  { id: 'void', name: '虛空裂隙', minLv: 15, maxLv: 999, x: 16, y: 100, w: 80, h: 44, spawn: 3, ground: 'rgba(20,12,32,0.85)',
    monsters: [
      { kind: 'voidling', name: '虛空行者', color: '#7c5cff', hp: 180, atk: 28, def: 8, gold: [80, 140], xp: 60, scalePerLevel: { hp: 18, atk: 3, def: 2 }, debuff: 'poison' },
      { kind: 'abyssEye', name: '深淵之眼', color: '#ff5c7c', hp: 240, atk: 36, def: 6, gold: [120, 200], xp: 90, scalePerLevel: { hp: 24, atk: 4, def: 1 }, debuff: 'bleed' },
      { kind: 'soulReaver', name: '噬魂者', color: '#c0c0ff', hp: 320, atk: 44, def: 10, gold: [200, 320], xp: 140, scalePerLevel: { hp: 32, atk: 5, def: 2 }, debuff: 'poison' },
    ],
  },
];
const ANCHOR_BASE = {
  tavern: { x: 37, y: 212 }, guild: { x: 121, y: 200 }, market: { x: 204, y: 206 },
  forge: { x: 44, y: 298 }, alchemy: { x: 120, y: 300 }, research: { x: 198, y: 298 },
  gate: { x: 120, y: 346 },
  drink: { x: 166, y: 214 },
};
const ANCHOR_PLOT_KEY = { drink: 'drinkShop' };
const BUILDING_ANCHORS = {};
for (const k of Object.keys(ANCHOR_BASE)) {
  Object.defineProperty(BUILDING_ANCHORS, k, {
    get() { const d = plotDelta(ANCHOR_PLOT_KEY[k] || k); return { x: ANCHOR_BASE[k].x + d.dx, y: ANCHOR_BASE[k].y + d.dy }; },
  });
}

// 城內主動技能(原 L2981)
const SKILL_DEFS = {
  whirlwind: { name: '旋風斬', cd: 6, color: '#ffb84d' },
  shieldwall: { name: '盾牆', cd: 10, color: '#8ecbff' },
  firerain: { name: '烈焰火雨', cd: 8, color: '#ff6b4a' },
  frostbolt: { name: '寒冰箭', cd: 5, color: '#9be7ff' },
  backstab: { name: '背刺', cd: 5, color: '#ff9f43' },
  smokebomb: { name: '煙霧彈', cd: 10, color: '#c8c8c8' },
  pierce: { name: '貫穿箭', cd: 6, color: '#7dffa8' },
  eagleeye: { name: '鷹眼', cd: 10, color: '#ffe08a' },
  holyheal: { name: '聖光術', cd: 7, color: '#7dffa8' },
  smite: { name: '神聖懲擊', cd: 5, color: '#fff3b0' },
};
const EFFECTS = {
  poison: { label: '☠ 中毒', color: '#b678ff', dur: 4, dps: 3 },
  bleed: { label: '🩸 流血', color: '#ff6b6b', dur: 3, dps: 2.5 },
  shield: { label: '🛡 盾牆', color: '#8ecbff', dur: 3, dps: 0 },
  smoke: { label: '💨 煙霧', color: '#c8c8c8', dur: 2.5, dps: 0 },
  eagle: { label: '🦅 鷹眼', color: '#ffe08a', dur: 4, dps: 0 },
};

// ═══════════════════════════════════════════════════════════════════
// 建築擺位(9 個 plot,任兩棟可交換)
// ═══════════════════════════════════════════════════════════════════
export function plotNameOf(k) { return PLOT_NAMES[k] || k; }
function plotDelta(sceneKey) {
  const cur = PLOT_COORDS[buildingPlots[sceneKey] ?? DEFAULT_PLOT_OF[sceneKey]] || PLOT_COORDS[0];
  const def = PLOT_COORDS[DEFAULT_PLOT_OF[sceneKey]] || PLOT_COORDS[0];
  return { dx: cur.x - def.x, dy: cur.y - def.y };
}
function swapBuildingPlots(a, b) {
  const t = buildingPlots[a]; buildingPlots[a] = buildingPlots[b]; buildingPlots[b] = t;
  sfx('click'); showToast(`⇄ ${plotNameOf(a)} 與 ${plotNameOf(b)} 交換了位置`, 'success'); renderAll(); saveGame();
}
export function resetBuildingPlots() {
  setBuildingPlots({ ...DEFAULT_PLOT_OF });
  setPlacementPick(null);
  sfx('click'); showToast('建築擺設已恢復預設。', 'info'); renderAll(); saveGame();
}
export function pickPlacement(sceneKey) {
  if (placementPick === null) { setPlacementPick(sceneKey); showToast(`擺設模式:再點另一棟建築與「${plotNameOf(sceneKey)}」交換位置`, 'info'); }
  else if (placementPick === sceneKey) { setPlacementPick(null); showToast('已取消擺設選擇。', 'info'); }
  else { swapBuildingPlots(placementPick, sceneKey); setPlacementPick(null); }
  renderAll();
}

// ═══════════════════════════════════════════════════════════════════
// 村民 NPC(農夫/礦工/學徒)
// ═══════════════════════════════════════════════════════════════════
const VILLAGER_DEFS = [
  { kind: 'farmer', name: '農夫', color: '#7a9a4a', res: 'fruitPoor', path: [{ x: 60, y: 214 }, { x: 204, y: 208 }], x: null, y: null, target: 1 },
  { kind: 'miner', name: '礦工', color: '#8a8a96', res: 'ironRusty', path: [{ x: 200, y: 296 }, { x: 44, y: 296 }], x: null, y: null, target: 1 },
  { kind: 'apprentice', name: '學徒', color: '#7890c9', res: 'herbLow', path: [{ x: 121, y: 202 }, { x: 198, y: 296 }], x: null, y: null, target: 1 },
];
// 初始化 villagerNPCs
for (const v of VILLAGER_DEFS) villagerNPCs.push(v);

export function getVillagerNPCs() { return villagerNPCs; }
function updateVillagers(dt) {
  for (const v of villagerNPCs) {
    if (v.x == null) { v.x = v.path[0].x; v.y = v.path[0].y; }
    const p = v.path[v.target];
    const dx = p.x - v.x, dy = p.y - v.y, dist = Math.hypot(dx, dy);
    if (dist < 1.5) {
      const amount = 1 + Math.floor(BuildingSystem_getLevel('monument') / 3);
      ResourceSystem_add(v.res, amount);
      if (Math.random() < 0.35) { const cp = sceneToClient(v.x, v.y - 8); spawnFloat(`${RESOURCES[v.res].icon}+${amount} ${v.name}`, cp.x, cp.y, '#c8e6a0'); }
      v.target = (v.target + 1) % v.path.length;
    } else {
      const step = Math.min(dist, 16 * dt);
      v.x += dx / dist * step; v.y += dy / dist * step;
    }
  }
}
function drawVillagers(c, t) {
  for (const v of villagerNPCs) {
    if (v.x == null) continue;
    const x = Math.round(v.x), y = Math.round(v.y);
    const bob = reduceMotion ? 0 : Math.round(Math.sin(t * 6 + x) * 1);
    c.fillStyle = v.color; c.fillRect(x - 2, y - 5 + bob, 5, 5);
    c.fillStyle = '#f0c8a0'; c.fillRect(x - 2, y - 9 + bob, 5, 4);
    c.fillStyle = v.color; c.fillRect(x - 3, y - 11 + bob, 7, 2);
    if (v.kind === 'miner') { c.fillStyle = '#6b4a2f'; c.fillRect(x + 3, y - 8 + bob, 1, 6); c.fillRect(x + 2, y - 8 + bob, 3, 1); }
    if (v.kind === 'farmer') { c.fillStyle = '#c8e6a0'; c.fillRect(x + 3, y - 6 + bob, 2, 3); }
    if (v.kind === 'apprentice') { c.fillStyle = '#f4d03f'; c.fillRect(x + 3, y - 6 + bob, 2, 2); }
  }
}

// ═══════════════════════════════════════════════════════════════════
// 怪區野怪 spawn / 復活
// ═══════════════════════════════════════════════════════════════════
export function getWildMonsters() { return wildMonsters; }
function huntZoneById(id) { return HUNT_ZONES.find(z => z.id === id) || HUNT_ZONES[0]; }
function bestHuntZone(h) {
  const lv = h.level || 1;
  const z = HUNT_ZONES.find(z => lv >= z.minLv && lv <= z.maxLv);
  if (z) return z;
  return lv < HUNT_ZONES[0].minLv ? HUNT_ZONES[0] : HUNT_ZONES[HUNT_ZONES.length - 1];
}
// Compute level-scaled monster stats: base + (highest hero level in zone − zone minLv) × scalePerLevel
function scaleMonsterStats(t, zone, idx, isNightPool = false) {
  // Find the highest-level wandering hero currently in this zone
  let maxLvInZone = 0;
  for (const h of wanderingHeroes) {
    if (h.huntZoneId === zone.id && h.level > maxLvInZone) maxLvInZone = h.level;
  }
  const overshoot = Math.max(0, maxLvInZone - zone.minLv);
  const s = t.scalePerLevel || {};
  let hp = (t.hp || 0) + (s.hp || 0) * overshoot;
  let atk = (t.atk || 0) + (s.atk || 0) * overshoot;
  const def = (t.def || 0) + (s.def || 0) * overshoot;
  // §六 3 night_raid 事件:夜怪 HP/ATK +30%(套用到 night monster pool)
  if (sceneNight > 0.5 && isNightPool) {
    const boost = getEventMul(townEvent, 'nightZoneBoost'); // 0.3
    if (boost > 0) {
      hp = Math.round(hp * (1 + boost));
      atk = Math.round(atk * (1 + boost));
    }
  }
  // Slight variety per instance to avoid deterministic feel
  const jitter = (idx * 7) % 11;
  return {
    hp: hp + Math.round(jitter * 0.5),
    maxHp: hp + Math.round(jitter * 0.5),
    atk: atk + Math.floor(jitter / 4),
    def: def + Math.floor(jitter / 6),
  };
}
function ensureWildMonsters() {
  for (const z of HUNT_ZONES) {
    const inZone = wildMonsters.filter(m => m.zone === z.id);
    for (let i = inZone.length; i < z.spawn; i++) {
      const isNightPool = sceneNight > 0.5 && !!z.nightMonsters;
      const pool = isNightPool ? z.monsters.concat(z.nightMonsters) : z.monsters;
      const t = choice(pool);
      const isNight = isNightPool && z.nightMonsters.includes(t);
      const scaled = scaleMonsterStats(t, z, i, isNight);
      wildMonsters.push({
        id: uid(), zone: z.id, kind: t.kind, name: t.name, color: t.color, debuff: t.debuff || null,
        x: z.x + 8 + rand(0, z.w - 18), y: z.y + 12 + rand(0, z.h - 24),
        hp: scaled.hp, maxHp: scaled.maxHp, atk: scaled.atk, def: scaled.def, gold: t.gold, xp: t.xp,
        alive: true, respawnTicks: 0, flash: 0,
      });
    }
  }
}
export function sceneToClient(x, y) {
  if (!sceneCanvas) return { x: 0, y: 0 };
  const rect = sceneCanvas.getBoundingClientRect();
  // 世界座標 → 螢幕座標(扣掉相機平移;home 相機 (0,0) 時等同原公式)
  return { x: rect.left + (x - cam.x) / sceneW * rect.width, y: rect.top + (y - cam.y) / sceneH * rect.height };
}
function wanderingHeroAt(x, y) {
  for (let i = wanderingHeroes.length - 1; i >= 0; i--) {
    const h = wanderingHeroes[i];
    if (h.aiState === 'gone' || h.aiState === 'dead' || h.inside) continue;
    if (Math.abs(h.sx - x) <= 7 && Math.abs(h.sy - 5 - y) <= 9) return h;
  }
  return null;
}
function setWanderingTarget(h, state, x, y) {
  h.aiState = state;
  h.finalTargetX = x + rand(-5, 5);
  h.finalTargetY = y + rand(-3, 3);
  h.actionTicks = 0;
  // 主動線路徑(走 ROAD_GRAPH BFS,§七 推薦)。若無路點鄰近或 BFS 失敗則 fallback 直線 — 行為與改動前相同。
  if (h.sx == null) h.sx = 120;
  if (h.sy == null) h.sy = 196;
  const fromWp = nearestWaypoint(h.sx, h.sy);
  const toWp = nearestWaypoint(h.finalTargetX, h.finalTargetY);
  let trail = null;
  if (fromWp && toWp) {
    trail = (fromWp.id === toWp.id) ? [fromWp.id] : pathFind(fromWp.id, toWp.id);
  }
  if (trail && trail.length >= 2) {
    h.wpTrail = trail;
    h.wpTrailIndex = 1; // trail[0] = fromWp 所在,trail[1] 是要前往的下一個路點
    const next = getWaypoint(trail[1]);
    h.targetX = next.x + rand(-2, 2);
    h.targetY = next.y + rand(-2, 2);
  } else {
    h.wpTrail = null; h.wpTrailIndex = 0;
    h.targetX = h.finalTargetX; h.targetY = h.finalTargetY;
  }
}
function moveActor(h, dt, speed = 26) {
  if (h.targetX == null) return true;
  const dx = h.targetX - h.sx, dy = h.targetY - h.sy;
  const dist = Math.hypot(dx, dy);
  if (dist < 1.2) {
    // 抵達當前 subtarget — 嘗試遞進路點 trail;否則 fall back 到最終目標。
    if (h.wpTrail && h.wpTrailIndex < h.wpTrail.length - 1) {
      h.wpTrailIndex++;
      const next = getWaypoint(h.wpTrail[h.wpTrailIndex]);
      if (next) {
        h.targetX = next.x + rand(-2, 2);
        h.targetY = next.y + rand(-2, 2);
        return false; // 還在 trail 中,不算到終點
      }
    }
    // trail 結束或無 trail — 走向原本最終目標(可能就 1-2 px 之差)
    if (h.wpTrail) {
      h.targetX = h.finalTargetX ?? h.targetX;
      h.targetY = h.finalTargetY ?? h.targetY;
      h.wpTrail = null; h.wpTrailIndex = 0;
    }
    return true;
  }
  const step = Math.min(dist, speed * dt);
  h.sx += dx / dist * step; h.sy += dy / dist * step;
  return dist - step < 1.2;
}
function setBubble(h, text, dur = 2.2) { h.bubble = { text, t: dur }; }
function decideWanderingNeed(h) {
  const st = getHeroStats(h);
  if ((h.mood ?? 70) < 20) { setBubble(h, '沒勁…想回去了'); setWanderingTarget(h, 'leaving', BUILDING_ANCHORS.gate.x, BUILDING_ANCHORS.gate.y); return; }
  if (h.hp < st.maxHp * 0.45 || h.fatigue > 75 || (h.mood ?? 70) < 40) { h.effects = []; setWanderingTarget(h, 'toRest', BUILDING_ANCHORS.tavern.x, BUILDING_ANCHORS.tavern.y); return; }
  if ((h.mood ?? 70) < 60 && BuildingSystem_getLevel('drinkShop') > 0 && h.wallet >= salePrice(10, 'potion')) { setWanderingTarget(h, 'toDrink', BUILDING_ANCHORS.drink.x, BUILDING_ANCHORS.drink.y); return; }
  if ((h.inventory.healthPotion || 0) === 0 && h.wallet >= salePrice(25, 'potion')) { setWanderingTarget(h, 'toShopAlchemy', BUILDING_ANCHORS.alchemy.x, BUILDING_ANCHORS.alchemy.y); return; }
  if (h.wallet >= salePrice(120, 'gear') && (h.gearAtk || 0) < 6) { setWanderingTarget(h, 'toShopForge', BUILDING_ANCHORS.forge.x, BUILDING_ANCHORS.forge.y); return; }
  const z = bestHuntZone(h);
  h.huntZoneId = z.id;
  setWanderingTarget(h, 'toHunt', z.x + z.w / 2, z.y + z.h / 2);
}
import { salePrice } from './inventory.js'

// ═══════════════════════════════════════════════════════════════════
// 商店交易(村莊金庫收入)
// ═══════════════════════════════════════════════════════════════════
function tryEnterShop(h, shopId) {
  const busy = wanderingHeroes.some(o => o !== h && o.inside && o.shopId === shopId);
  if (busy) {
    h.aiState = 'queue'; h.queueFor = shopId; h.actionTicks = 1.5; setBubble(h, '排隊中…');
    // §七 2:排隊點 — 依目前排隊人數分配 slot,避免全擠在門口
    const queueIdx = wanderingHeroes.filter(o => o !== h && o.aiState === 'queue' && o.queueFor === shopId).length;
    const offset = getQueueSlotOffset(shopId, queueIdx);
    if (offset) {
      const a = BUILDING_ANCHORS[shopId];
      if (a) { h.sx = a.x + offset.dx; h.sy = a.y + offset.dy; }
    }
    return;
  }
  h.aiState = 'inShop'; h.shopId = shopId; h.inside = true; h.actionTicks = randf(0.8, 1.4);
}
function buyPotionAtShop(h) {
  const price = salePrice(25, 'potion');
  const st = getHeroStats(h);
  if (shopStock.healthPotion <= 0) { setBubble(h, '缺貨?真是的…'); h.mood = clamp((h.mood ?? 70) - 8, 0, 100); return; }
  if (h.wallet < price) { setBubble(h, '太貴了吧…'); h.mood = clamp((h.mood ?? 70) - 5, 0, 100); return; }
  h.wallet -= price; shopStock.healthPotion -= 1;
  gainGold(price); stats.shopRevenue = (stats.shopRevenue || 0) + price;
  h.inventory.healthPotion = (h.inventory.healthPotion || 0) + 1;
  h.mood = clamp((h.mood ?? 70) + 4, 0, 100);
  setBubble(h, '🧪 補給完成!');
  const p = sceneToClient(h.sx, h.sy - 8); spawnFloat(`🧪 村莊 +${price}🪙`, p.x, p.y, '#7dffa8');
  if (h.hp < st.maxHp * 0.6) usePotion(h, true);
}
function buyGearAtShop(h) {
  const price = salePrice(120, 'gear');
  if (shopStock.gear <= 0) { setBubble(h, '沒有像樣的裝備…'); h.mood = clamp((h.mood ?? 70) - 8, 0, 100); return; }
  if (h.wallet < price) { setBubble(h, '太貴了吧…'); h.mood = clamp((h.mood ?? 70) - 5, 0, 100); return; }
  h.wallet -= price; shopStock.gear -= 1;
  gainGold(price); stats.shopRevenue = (stats.shopRevenue || 0) + price;
  h.gearAtk = (h.gearAtk || 0) + 2;
  h.mood = clamp((h.mood ?? 70) + 5, 0, 100);
  setBubble(h, '⚒️ 好劍!');
  const p = sceneToClient(h.sx, h.sy - 8); spawnFloat(`⚒️ 村莊 +${price}🪙`, p.x, p.y, '#ffc46b');
}
function buyDrinkAtShop(h) {
  const price = salePrice(10, 'potion');
  const lv = BuildingSystem_getLevel('drinkShop');
  if (lv <= 0) return;
  if (h.wallet < price) { setBubble(h, '太貴了吧…'); h.mood = clamp((h.mood ?? 70) - 5, 0, 100); return; }
  h.wallet -= price; gainGold(price); stats.shopRevenue = (stats.shopRevenue || 0) + price;
  h.mood = clamp((h.mood ?? 70) + 15 + lv * 3, 0, 100);
  setBubble(h, '🥤 好喝!');
  const p = sceneToClient(h.sx, h.sy - 8); spawnFloat(`🥤 村莊 +${price}🪙`, p.x, p.y, '#7dd6ff');
}
function hasEffect(h, kind) { return !!(h.effects && h.effects.some(e => e.kind === kind)); }

// ═══════════════════════════════════════════════════════════════════
// 城內戰鬥技能 / 殺怪 / 死亡
// ═══════════════════════════════════════════════════════════════════
function killMonster(h, m) {
  m.alive = false; m.respawnTicks = 6; m.hp = 0;
  const gold = Math.round(rand(m.gold[0], m.gold[1]) * getCombatGoldMultiplier());
  h.wallet += gold; grantXp(h, m.xp); h.fatigue = clamp(h.fatigue + 9, 0, 100);
  h.mood = clamp((h.mood ?? 70) + 2, 0, 100);
  if (Math.random() < (h.dropMagicStoneChance || 0.1)) h.diamonds += 1;
  const p = sceneToClient(m.x, m.y - 6);
  spawnFloat(`+${gold}🪙`, p.x, p.y, '#f4d03f');
  burst(p.x, p.y, '#f4d03f'); burst(p.x, p.y - 4, '#fff3b0');
}
function tryCastSkill(h, m, st) {
  h.skillCds = h.skillCds || {};
  for (const k of Object.keys(h.skillCds)) h.skillCds[k] -= 0.7;
  const ready = (id) => !(h.skillCds[id] > 0);
  const cast = (id) => {
    const d = SKILL_DEFS[id]; h.skillCds[id] = d.cd;
    const p = sceneToClient(h.sx, h.sy - 20);
    spawnFloat(`✦ ${d.name}`, p.x, p.y, d.color);
    burst(p.x, p.y + 6, d.color);
  };
  const zid = h.huntZoneId || bestHuntZone(h).id;
  const mates = wildMonsters.filter(mm => mm.alive && mm.zone === zid && mm.id !== m.id);
  const atk = st.atk + (h.gearAtk || 0);
  const hurt = (mm, mult) => { mm.hp -= Math.max(1, Math.round(atk * mult) - mm.def); mm.flash = 0.12; };
  switch (h.class) {
    case 'warrior':
      if (ready('shieldwall') && h.hp < st.maxHp * 0.6) { cast('shieldwall'); addEffect(h, 'shield'); return false; }
      if (ready('whirlwind') && mates.length >= 1) { cast('whirlwind'); for (const mm of [m, ...mates]) { hurt(mm, 0.6); if (mm.hp <= 0 && mm.id !== m.id) killMonster(h, mm); } return true; }
      break;
    case 'mage':
      if (ready('firerain') && mates.length >= 1) { cast('firerain'); for (const mm of [m, ...mates]) { hurt(mm, 0.8); if (mm.hp <= 0 && mm.id !== m.id) killMonster(h, mm); } return true; }
      if (ready('frostbolt')) { cast('frostbolt'); hurt(m, 1.2); m.slowT = 3; return true; }
      break;
    case 'rogue':
      if (ready('smokebomb') && h.hp < st.maxHp * 0.5) { cast('smokebomb'); addEffect(h, 'smoke'); return false; }
      if (ready('backstab')) { cast('backstab'); hurt(m, 2.5); const pm = sceneToClient(m.x, m.y - 10); spawnFloat('背刺暴擊!', pm.x, pm.y, '#ff9f43'); return true; }
      break;
    case 'archer':
      if (ready('eagleeye') && !hasEffect(h, 'eagle')) { cast('eagleeye'); addEffect(h, 'eagle'); return false; }
      if (ready('pierce')) { cast('pierce'); hurt(m, 1.0); if (mates.length) { hurt(mates[0], 1.0); if (mates[0].hp <= 0) killMonster(h, mates[0]); } return true; }
      break;
    case 'priest':
      if (ready('holyheal') && h.hp < st.maxHp * 0.55) { cast('holyheal'); const heal = Math.round(st.maxHp * 0.25); h.hp = Math.min(st.maxHp, h.hp + heal); const p = sceneToClient(h.sx, h.sy - 16); spawnFloat(`+${heal}`, p.x, p.y, '#7dffa8'); return false; }
      if (ready('smite')) { cast('smite'); hurt(m, 1.4); h.hp = Math.min(st.maxHp, h.hp + Math.round(st.maxHp * 0.05)); return true; }
      break;
  }
  return false;
}
function killWanderingHero(h) {
  h.aiState = 'dead'; h.deadTicks = Math.max(6, 18 - BuildingSystem_getLevel('inn') * 2);
  h.effects = []; h.inside = false; h.opponentId = null;
  tombstones.push({ id: uid(), x: h.sx, y: h.sy, name: h.name, t: h.deadTicks });
  const p = sceneToClient(h.sx, h.sy - 12); spawnFloat(`💀 ${h.name} 陣亡`, p.x, p.y, '#ff5252');
}
export function getTombstones() { return tombstones; }
function addEffect(h, kind) {
  const def = EFFECTS[kind]; if (!def) return;
  h.effects = h.effects || [];
  const cur = h.effects.find(e => e.kind === kind);
  if (cur) { cur.dur = def.dur; return; }
  h.effects.push({ kind, dur: def.dur, tick: 0 });
  const p = sceneToClient(h.sx, h.sy - 18); spawnFloat(def.label, p.x, p.y, def.color);
}
function processEffects(h, dt) {
  if (!h.effects || !h.effects.length) return;
  for (let i = h.effects.length - 1; i >= 0; i--) {
    const e = h.effects[i], def = EFFECTS[e.kind];
    e.dur -= dt; e.tick = (e.tick || 0) - dt;
    h.hp = Math.max(1, h.hp - def.dps * dt);
    if (e.tick <= 0 && def.dps > 0) {
      e.tick = 0.9;
      const p = sceneToClient(h.sx, h.sy - 15);
      spawnFloat(`-${Math.max(1, Math.round(def.dps * 0.9))}`, p.x, p.y, def.color);
    } else if (e.tick <= 0) { e.tick = 0.9; }
    if (e.dur <= 0) h.effects.splice(i, 1);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 主場景更新邏輯(進店 / 戰鬥 / 復活 / 死亡)
// ═══════════════════════════════════════════════════════════════════
export function updateWanderingScene(dt) {
  if (!dt || dt <= 0) return;
  ensureWildMonsters();
  updateVillagers(dt);
  for (const m of wildMonsters) {
    if (m.flash > 0) m.flash -= dt;
    if (m.slowT > 0) m.slowT -= dt;
    if (!m.alive) {
      m.respawnTicks -= dt;
      if (m.respawnTicks <= 0) {
        const z = huntZoneById(m.zone);
        // Re-scale stats on respawn so monsters grow as wandering heroes level up
        const baseT = (z.nightMonsters && sceneNight > 0.5) ? z.nightMonsters.concat(z.monsters) : z.monsters;
        const t = baseT.find(tt => tt.kind === m.kind) || baseT[0];
        if (t && t.scalePerLevel) {
          const scaled = scaleMonsterStats(t, z, 0);
          m.hp = scaled.hp; m.maxHp = scaled.maxHp; m.atk = scaled.atk; m.def = scaled.def;
        } else {
          m.hp = m.maxHp;
        }
        m.alive = true;
        m.x = z.x + 8 + rand(0, z.w - 18); m.y = z.y + 12 + rand(0, z.h - 24);
      }
    }
  }
  for (let i = tombstones.length - 1; i >= 0; i--) { tombstones[i].t -= dt; if (tombstones[i].t <= 0) tombstones.splice(i, 1); }
  for (let i = wanderingHeroes.length - 1; i >= 0; i--) {
    const h = wanderingHeroes[i];
    const st = getHeroStats(h);
    processEffects(h, dt);
    if (h.bubble) { h.bubble.t -= dt; if (h.bubble.t <= 0) h.bubble = null; }
    // §七 NPC 卡住恢復(在 switch 前統一處理;不論 aiState)
    // 三層:①側向偏移 ②重走路點 graph ③傳送至安全點(廣場 / 城門)。
    if (h.targetX != null) {
      if (h.stuckX == null) { h.stuckX = h.sx; h.stuckY = h.sy; }
      const _moved = (h.sx - h.stuckX) * (h.sx - h.stuckX) + (h.sy - h.stuckY) * (h.sy - h.stuckY);
      // < 0.36 px² / 1.5 s ≈ 視為原地踏步(displacement < 0.6 px/tick)
      if (_moved < 0.36) h.stuckTicks = (h.stuckTicks || 0) + dt;
      else { h.stuckTicks = 0; h.stuckX = h.sx; h.stuckY = h.sy; }
      if (h.stuckTicks > 1.5) {
        h.recoveryLevel = (h.recoveryLevel || 0) + 1;
        if (h.recoveryLevel === 1) {
          // L1 側向偏移:給 target 加垂直位移,鼓勵 NPC 繞過卡點
          const dx = h.targetX - h.sx, dy = h.targetY - h.sy;
          const mag = Math.hypot(dx, dy) || 1;
          const px = -dy / mag, py = dx / mag;
          h.targetX += px * 10; h.targetY += py * 10;
          h.stuckTicks = 0; h.stuckX = h.sx; h.stuckY = h.sy;
        } else if (h.recoveryLevel === 2) {
          // L2 重走路點 graph:用當前 sx/sy 重新 BFS
          const ftx = h.finalTargetX ?? h.targetX, fty = h.finalTargetY ?? h.targetY;
          const fromWp = nearestWaypoint(h.sx, h.sy);
          const toWp = nearestWaypoint(ftx, fty);
          let trail = null;
          if (fromWp && toWp) trail = (fromWp.id === toWp.id) ? [fromWp.id] : pathFind(fromWp.id, toWp.id);
          if (trail && trail.length >= 2) {
            h.wpTrail = trail; h.wpTrailIndex = 1;
            const next = getWaypoint(trail[1]);
            h.targetX = next.x + rand(-2, 2); h.targetY = next.y + rand(-2, 2);
          } else { h.wpTrail = null; h.targetX = ftx; h.targetY = fty; }
          h.stuckTicks = 0; h.stuckX = h.sx; h.stuckY = h.sy;
        } else {
          // L3 傳送至安全點(廣場或城門)
          const safe = BUILDING_ANCHORS.guild || BUILDING_ANCHORS.gate;
          h.sx = safe.x + rand(-3, 3); h.sy = safe.y + rand(-1, 1);
          h.wpTrail = null;
          const ftx = h.finalTargetX ?? h.targetX, fty = h.finalTargetY ?? h.targetY;
          h.targetX = ftx; h.targetY = fty;
          h.recoveryLevel = 0; h.stuckTicks = 0; h.stuckX = h.sx; h.stuckY = h.sy;
          setBubble(h, '🌀…(繞了一大圈)', 1.6);
        }
      }
    }
    switch (h.aiState) {
      case 'arrive':
      case 'idle':
        h.actionTicks -= dt;
        if (h.actionTicks <= 0) decideWanderingNeed(h);
        break;
      case 'toRest':
        if (moveActor(h, dt)) {
          h.aiState = 'resting'; h.inside = true; h.actionTicks = randf(2.5, 4);
          const rlv = BuildingSystem_getLevel('restaurant');
          const meal = 8 + rlv * 2;
          if (rlv > 0 && h.wallet >= meal) {
            h.wallet -= meal; gainGold(meal); stats.shopRevenue = (stats.shopRevenue || 0) + meal;
            setBubble(h, '🍖 吃飽了!');
            const p = sceneToClient(h.sx, h.sy - 8); spawnFloat(`🍖 村莊 +${meal}🪙`, p.x, p.y, '#ffb84d');
          } else setBubble(h, '先喝一杯…');
        }
        break;
      case 'resting': {
        h.actionTicks -= dt;
        const rlv = BuildingSystem_getLevel('restaurant');
        h.hp = Math.min(st.maxHp, h.hp + st.maxHp * 0.2 * dt);
        h.fatigue = clamp(h.fatigue - 22 * dt, 0, 100);
        h.mood = clamp((h.mood ?? 70) + 9 * (1 + rlv * 0.3) * dt, 0, 100);
        if (h.actionTicks <= 0) { h.inside = false; setBubble(h, '神清氣爽!'); decideWanderingNeed(h); }
        break;
      }
      case 'toDrink': if (moveActor(h, dt)) tryEnterShop(h, 'drink'); break;
      case 'toShopAlchemy': if (moveActor(h, dt)) tryEnterShop(h, 'alchemy'); break;
      case 'toShopForge': if (moveActor(h, dt)) tryEnterShop(h, 'forge'); break;
      case 'queue': {
        const busy = wanderingHeroes.some(o => o !== h && o.inside && o.shopId === h.queueFor);
        if (!busy) { tryEnterShop(h, h.queueFor); break; }
        h.actionTicks -= dt;
        if (h.actionTicks <= 0) { h.actionTicks = 1.5; setBubble(h, '還要等多久…', 1.4); h.mood = clamp((h.mood ?? 70) - 2, 0, 100); }
        break;
      }
      case 'inShop': {
        h.actionTicks -= dt;
        if (h.actionTicks <= 0) {
          if (h.shopId === 'alchemy') buyPotionAtShop(h);
          else if (h.shopId === 'drink') buyDrinkAtShop(h);
          else buyGearAtShop(h);
          h.inside = false; h.shopId = null;
          h.aiState = 'idle'; h.actionTicks = randf(0.4, 1);
        }
        break;
      }
      case 'dead': {
        h.deadTicks -= dt;
        if (h.deadTicks <= 0) {
          h.hp = Math.round(st.maxHp * 0.5);
          h.mood = clamp((h.mood ?? 70) - 25, 0, 100);
          h.sx = BUILDING_ANCHORS.gate.x + rand(-6, 6); h.sy = BUILDING_ANCHORS.gate.y;
          h.aiState = 'arrive'; h.actionTicks = 1;
          setBubble(h, '…我回來了');
        }
        break;
      }
      case 'toHunt': {
        if (!moveActor(h, dt)) break;
        const zid = h.huntZoneId || bestHuntZone(h).id;
        let m = wildMonsters.find(mm => mm.alive && mm.zone === zid);
        if (!m) m = wildMonsters.find(mm => mm.alive);
        if (!m) { h.aiState = 'idle'; h.actionTicks = 1.2; break; }
        h.opponentId = m.id; h.aiState = 'fighting'; h.actionTicks = 0.7; h.combo = 0;
        break;
      }
      case 'fighting': {
        let m = wildMonsters.find(mm => mm.id === h.opponentId && mm.alive);
        if (!m) {
          const zid = h.huntZoneId || bestHuntZone(h).id;
          m = wildMonsters.find(mm => mm.alive && mm.zone === zid) || wildMonsters.find(mm => mm.alive);
          if (m) h.opponentId = m.id;
        }
        if (!m) { h.aiState = 'idle'; h.actionTicks = 1; break; }
        const dx = m.x - h.sx, dy = m.y - h.sy, dist = Math.hypot(dx, dy);
        if (dist > 6) { h.sx += dx / dist * 26 * dt; h.sy += dy / dist * 26 * dt; break; }
        if (h.class === 'priest') {
          h.regenTick = (h.regenTick || 0) - dt;
          if (h.regenTick <= 0 && h.hp < st.maxHp) {
            h.regenTick = 1; const heal = Math.max(1, Math.round(st.maxHp * 0.02));
            h.hp = Math.min(st.maxHp, h.hp + heal);
            const p = sceneToClient(h.sx, h.sy - 16); spawnFloat(`+${heal} ✚再生`, p.x, p.y, '#7dffa8');
          }
        }
        h.actionTicks -= dt;
        if (h.actionTicks <= 0) {
          h.actionTicks = 0.7;
          h.combo = (h.combo || 0) + 1;
          const heroAtk = st.atk + (h.gearAtk || 0);
          const acted = tryCastSkill(h, m, st);
          if (!acted && m.hp > 0) {
            let dmgToMob = Math.max(1, Math.round(heroAtk * randf(0.85, 1.25)) - m.def);
            let dmgColor = '#ffd76a', tag = '';
            if (h.class === 'rogue' && Math.random() < 0.25) { dmgToMob *= 2; dmgColor = '#ff9f43'; tag = ' 暴擊!'; }
            else if (h.class === 'mage' && h.combo % 3 === 0) { dmgToMob = Math.round(dmgToMob * 1.5); dmgColor = '#d9a0ff'; tag = ' 咒能增幅'; }
            if (hasEffect(h, 'eagle')) { dmgToMob = Math.round(dmgToMob * 1.25); tag += ' 🦅'; }
            const hits = (h.class === 'archer' && Math.random() < 0.2) ? 2 : 1;
            if (hits === 2) tag = ' 連射';
            for (let k = 0; k < hits; k++) {
              m.hp -= dmgToMob; m.flash = 0.12;
              const pm = sceneToClient(m.x + rand(-3, 3), m.y - 8);
              spawnFloat(`-${dmgToMob}${k === 0 ? tag : ''}`, pm.x, pm.y, dmgColor);
              if (m.hp <= 0) break;
            }
          }
          if (m.hp <= 0) {
            killMonster(h, m);
            if (Math.random() < 0.3) setBubble(h, choice(['解決了。', '小菜一碟', '為了村莊!', '還有誰?']));
            if (Math.random() < BW_LEAVE_CHANCE) { setWanderingTarget(h, 'leaving', BUILDING_ANCHORS.gate.x, BUILDING_ANCHORS.gate.y); break; }
            if (h.hp < st.maxHp * 0.45 || h.fatigue > 75) { decideWanderingNeed(h); break; }
            const zid = h.huntZoneId || bestHuntZone(h).id;
            const nxt = wildMonsters.find(mm => mm.alive && mm.zone === zid) || wildMonsters.find(mm => mm.alive);
            if (nxt) { h.opponentId = nxt.id; h.actionTicks = 0.5; } else { h.aiState = 'idle'; h.actionTicks = 1.2; }
          } else {
            if (hasEffect(h, 'smoke') && Math.random() < 0.5) {
              const ph = sceneToClient(h.sx, h.sy - 14); spawnFloat('💨 閃避', ph.x, ph.y, '#c8c8c8');
              break;
            }
            if (m.slowT > 0 && Math.random() < 0.5) {
              const pm = sceneToClient(m.x, m.y - 8); spawnFloat('❄ 緩速', pm.x, pm.y, '#9be7ff');
              break;
            }
            let dmgToHero = Math.max(1, Math.round(m.atk * randf(0.8, 1.3)) - Math.floor(st.def / 2));
            let heroDmgColor = '#ff7b7b', htag = '';
            if (hasEffect(h, 'shield')) dmgToHero = Math.max(1, Math.round(dmgToHero * 0.6));
            if (h.class === 'warrior' && Math.random() < 0.3) { dmgToHero = Math.max(1, Math.floor(dmgToHero / 2)); heroDmgColor = '#8ecbff'; htag = ' 格擋'; }
            h.hp = Math.max(0, h.hp - dmgToHero);
            const ph = sceneToClient(h.sx, h.sy - 14);
            spawnFloat(`-${dmgToHero}${htag}`, ph.x, ph.y, heroDmgColor);
            if (m.debuff && Math.random() < 0.25) addEffect(h, m.debuff);
            if (h.hp <= 0) { killWanderingHero(h); break; }
            if (h.hp < st.maxHp * 0.25) {
              if ((h.inventory.healthPotion || 0) > 0) {
                usePotion(h, true);
                const pp = sceneToClient(h.sx, h.sy - 18);
                spawnFloat('🧪 喝藥', pp.x, pp.y, '#7dffa8');
              } else { decideWanderingNeed(h); break; }
            }
          }
        }
        break;
      }
      case 'leaving':
        if (moveActor(h, dt, 30)) { h.aiState = 'gone'; wanderingHeroes.splice(i, 1); }
        break;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// 繪製:怪區 / 怪物 / 墓碑 / 流浪獵人 / 村民
// ═══════════════════════════════════════════════════════════════════
export function drawWanderingActors(c, t) {
  for (const z of HUNT_ZONES) {
    c.fillStyle = z.ground; c.fillRect(z.x, z.y, z.w, z.h);
    c.strokeStyle = '#6b4a2f'; c.lineWidth = 2; c.strokeRect(z.x + 1, z.y + 1, z.w - 2, z.h - 2);
    c.fillStyle = '#3a2a1c';
    for (let x = z.x; x <= z.x + z.w; x += 9) { c.fillRect(x, z.y - 2, 2, 6); c.fillRect(x, z.y + z.h - 4, 2, 6); }
    c.fillStyle = '#dfe7ff'; c.fillRect(z.x + 4, z.y + 4, 2, 2); c.fillRect(z.x + 8, z.y + 6, 2, 2);
    c.font = '7px "Press Start 2P", monospace'; c.lineWidth = 3; c.strokeStyle = '#2c2c2c';
    const tag = `${z.name} Lv${z.minLv}~${z.maxLv}`;
    c.strokeText(tag, z.x + 3, z.y - 4); c.fillStyle = '#ff8a8a'; c.fillText(tag, z.x + 3, z.y - 4);
  }
  for (const m of wildMonsters) {
    if (!m.alive) continue;
    const mx = Math.round(m.x), my = Math.round(m.y);
    const bob = reduceMotion ? 0 : Math.round(Math.sin(t * 5 + m.x) * 1);
    c.fillStyle = m.color;
    if (m.kind === 'slime') { c.fillRect(mx - 3, my - 2 + bob, 7, 5); c.fillRect(mx - 2, my - 4 + bob, 5, 2); }
    else if (m.kind === 'rat') { c.fillRect(mx - 3, my - 2 + bob, 6, 4); c.fillRect(mx + 3, my - 1 + bob, 3, 1); c.fillRect(mx - 3, my - 4 + bob, 2, 2); }
    else if (m.kind === 'wolf') { c.fillRect(mx - 4, my - 3 + bob, 8, 4); c.fillRect(mx + 2, my - 5 + bob, 4, 3); }
    else if (m.kind === 'golem') { c.fillRect(mx - 4, my - 7 + bob, 8, 8); c.fillStyle = '#5d4f44'; c.fillRect(mx - 3, my - 5 + bob, 6, 2); }
    else if (m.kind === 'wisp') { c.fillStyle = `rgba(106,211,224,${0.5 + (reduceMotion ? 0 : Math.sin(t * 4 + m.x) * 0.2)})`; c.fillRect(mx - 4, my - 6 + bob, 8, 8); c.fillStyle = m.color; c.fillRect(mx - 2, my - 4 + bob, 4, 5); }
    else { c.fillRect(mx - 2, my - 2 + bob, 4, 4); c.fillRect(mx - 5, my - 3 + bob, 3, 2); c.fillRect(mx + 2, my - 3 + bob, 3, 2); }
    c.fillStyle = '#1b1026'; c.fillRect(mx - 1, my - 2 + bob, 1, 1); c.fillRect(mx + 1, my - 2 + bob, 1, 1);
    if (m.flash > 0) { c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(mx - 5, my - 8 + bob, 10, 9); }
    if (m.hp < m.maxHp) {
      c.fillStyle = '#2c2c2c'; c.fillRect(mx - 6, my - 9, 12, 2);
      c.fillStyle = '#e74c3c'; c.fillRect(mx - 6, my - 9, Math.max(1, Math.round(12 * m.hp / m.maxHp)), 2);
    }
  }
  for (const ts of tombstones) {
    const tx = Math.round(ts.x), ty = Math.round(ts.y);
    c.fillStyle = '#7a7a85'; c.fillRect(tx - 3, ty - 8, 7, 8); c.fillRect(tx - 1, ty - 10, 3, 2);
    c.fillStyle = '#4a4a55'; c.fillRect(tx - 1, ty - 6, 1, 4); c.fillRect(tx - 2, ty - 5, 3, 1);
  }
  const stateIcon = { toRest: '💤', toShopAlchemy: '🛒', toShopForge: '⚒️', queue: '⏳', fighting: '⚔', toHunt: '⚔', leaving: '🚪' };
  const classColor = { warrior: '#e74c3c', mage: '#9b59b6', rogue: '#2c3e50', archer: '#27ae60', priest: '#f1c40f' };
  const effectIcon = { poison: '☠', bleed: '🩸', shield: '🛡', smoke: '💨', eagle: '🦅' };
  for (const h of wanderingHeroes) {
    if (h.aiState === 'gone' || h.aiState === 'dead' || h.inside) continue;
    const x = Math.round(h.sx), y = Math.round(h.sy);
    const bob = reduceMotion ? 0 : Math.round(Math.sin(t * 6 + x) * 1);
    const rc = RARITIES[h.rarity || 'normal'];
    if (rc && h.rarity !== 'normal') { c.fillStyle = rc.color + '55'; c.fillRect(x - 4, y - 1 + bob, 9, 2); }
    c.fillStyle = classColor[h.class] || '#3498db';
    c.fillRect(x - 2, y - 6 + bob, 5, 6);
    c.fillStyle = '#f0c8a0'; c.fillRect(x - 2, y - 10 + bob, 5, 4);
    c.fillStyle = rc ? rc.color : '#241a16'; c.fillRect(x - 2, y - 11 + bob, 5, 2);
    if (h.class === 'warrior' || h.class === 'rogue') { c.fillStyle = '#dfe7ff'; c.fillRect(x + 3, y - 9 + bob, 1, 6); }
    else if (h.class === 'archer') { c.strokeStyle = '#8b5a2b'; c.lineWidth = 1; c.strokeRect(x + 3.5, y - 10 + bob, 2, 7); }
    else { c.fillStyle = '#f4d03f'; c.fillRect(x + 3, y - 8 + bob, 1, 5); }
    const icon = stateIcon[h.aiState];
    if (icon) { c.font = '7px sans-serif'; c.fillText(icon, x + 4, y - 11 + bob); }
    if (h.effects && h.effects.length) {
      c.font = '7px sans-serif';
      h.effects.forEach((e, k) => { c.fillText(effectIcon[e.kind] || '✦', x - 6 - k * 8, y - 11 + bob); });
    }
    const st = getHeroStats(h);
    if (h.hp < st.maxHp || h.aiState === 'fighting') {
      c.fillStyle = '#2c2c2c'; c.fillRect(x - 5, y - 16 + bob, 11, 2);
      c.fillStyle = '#2ecc71'; c.fillRect(x - 5, y - 16 + bob, Math.max(1, Math.round(11 * h.hp / st.maxHp)), 2);
    }
    if (h.bubble && h.bubble.text) {
      c.font = '7px "Press Start 2P", monospace';
      const bw = Math.min(56, h.bubble.text.length * 7 + 6);
      const bx = clamp(x - bw / 2, 2, sceneW - bw - 2), by = y - 30 + bob;
      c.fillStyle = 'rgba(255,248,220,0.95)'; c.fillRect(bx, by, bw, 10);
      c.fillStyle = '#fff8dc'; c.fillRect(x - 1, by + 10, 2, 2);
      c.strokeStyle = '#6b4a2f'; c.lineWidth = 1; c.strokeRect(bx + 0.5, by + 0.5, bw - 1, 9);
      c.fillStyle = '#3a2a1c'; c.fillText(h.bubble.text, bx + 3, by + 8);
    }
    if (h.aiState === 'fighting' && !reduceMotion && Math.sin(t * 14 + x) > 0.2) {
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x + 2, y - 9); c.lineTo(x + 8, y - 13); c.stroke();
    }
  }
  drawVillagers(c, t);
}

// ═══════════════════════════════════════════════════════════════════
// 浮字 / 粒子(全螢幕 canvas overlay)
// ═══════════════════════════════════════════════════════════════════
export function initFloatCanvas() {
  const canvas = $('float-canvas'); if (!canvas) return;
  floatState.canvas = canvas; floatState.ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  window.addEventListener('resize', resize); resize();
  const loop = () => {
    const c = floatState.ctx; if (!c) return;
    c.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = floatState.floats.length - 1; i >= 0; i--) {
      const f = floatState.floats[i]; f.life -= 1 / 60; f.y -= 0.7;
      if (f.life <= 0) { floatState.floats.splice(i, 1); continue; }
      c.globalAlpha = clamp(f.life, 0, 1); c.font = '12px "Press Start 2P", monospace'; c.fillStyle = f.color; c.strokeStyle = '#2c2c2c'; c.lineWidth = 3; c.strokeText(f.text, f.x, f.y); c.fillText(f.text, f.x, f.y);
    }
    c.globalAlpha = 1;
    for (let i = floatState.particles.length - 1; i >= 0; i--) {
      const p = floatState.particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= 1 / 45;
      if (p.life <= 0) { floatState.particles.splice(i, 1); continue; }
      c.globalAlpha = clamp(p.life, 0, 1); c.fillStyle = p.color; c.fillRect(p.x, p.y, p.size, p.size);
    }
    c.globalAlpha = 1; requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
export function spawnFloat(text, x, y, color = '#f4d03f') { floatState.floats.push({ text, x, y, color, life: 1.2 }); }
export function burst(x, y, color) { for (let i = 0; i < 12; i++) floatState.particles.push({ x, y, vx: randf(-2.4, 2.4), vy: randf(-3.4, -0.6), size: rand(2, 4), color, life: randf(0.5, 1) }); }

// ═══════════════════════════════════════════════════════════════════
// 主場景 draw(t 為從 sceneStart 以來的秒數)
// ═══════════════════════════════════════════════════════════════════
function mixColor(a, b, k) { return [Math.round(a[0] + (b[0] - a[0]) * k), Math.round(a[1] + (b[1] - a[1]) * k), Math.round(a[2] + (b[2] - a[2]) * k)]; }
function rgb(arr) { return `rgb(${arr[0]},${arr[1]},${arr[2]})`; }
function getClickGold() { return 2 + Math.floor(BuildingSystem_getLevel('goldMine') / 2) + (stats.clicks ? 0 : 0); }
import { getClickGold as _getClickGold } from './bonuses.js'

// ═══════════════════════════════════════════════════════════════════
// Layer batching — 靜態背景畫到 offscreen canvas,只在 dirty 時 redraw
// 動態層(actor / hotspot / particles)每幀從 offscreen 複製 + 疊加
// ═══════════════════════════════════════════════════════════════════
const _staticCache = { canvas: null, ctx: null, signature: '' };
// 相機 transform 的縮放因子(fitCanvas 計算並存,drawScene 每幀套用)
const _view = { sx: 1, sy: 1, panned: false };

function ensureStaticCache() {
  if (!_staticCache.canvas) {
    _staticCache.canvas = document.createElement('canvas');
    _staticCache.canvas.width = sceneW; _staticCache.canvas.height = sceneH;
    _staticCache.ctx = _staticCache.canvas.getContext('2d');
  }
  return _staticCache;
}
function staticCacheKey(t) {
  // 把「影響靜態層」的變數 hash 出來(天氣日夜相位 4 等級 / 建築等級 / 建築擺位)
  // 變動才 redraw,其他時間純粹 blit → 省 ~50% draw call
  const dayBucket = Math.floor((Math.sin(t / 18) + 1) / 2 * 4);
  const levels = ['monument','goldMine','weaponShop','armorShop','potionShop','altar','restaurant','drinkShop']
    .map(id => BuildingSystem_getLevel(id)).join(',');
  const plots = JSON.stringify(buildingPlots);
  return `${dayBucket}|${weather.type}|${levels}|${plots}`;
}
function drawStaticLayer(t) {
  const { canvas, ctx } = ensureStaticCache();
  const c = ctx, w = sceneW, h = sceneH;
  const day = (Math.sin(t / 18) + 1) / 2;
  const night = 1 - day;
  // 天空 + 道路 + 森林 + 雲
  const skyTop = mixColor([10, 14, 34], [92, 154, 214], day), skyBot = mixColor([38, 24, 54], [230, 176, 126], day);
  const grad = c.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, rgb(skyTop)); grad.addColorStop(0.60, rgb(skyBot)); grad.addColorStop(0.61, '#4c7042'); grad.addColorStop(1, '#263b2b');
  c.fillStyle = grad; c.fillRect(0, 0, w, h);
  c.fillStyle = day > 0.35 ? '#3f6b45' : '#13202a';
  for (let x = -8; x < w; x += 18) { const hh = 34 + ((x * 13) % 23); c.fillRect(x, 132 - hh, 12, hh); c.fillRect(x - 4, 132 - hh + 8, 20, 8); }
  c.fillStyle = day > 0.35 ? '#6f9f52' : '#20351f'; c.fillRect(0, 132, w, h - 132);
  c.fillStyle = '#7a5a3c'; c.fillRect(0, 206, w, 14); c.fillRect(112, 120, 16, 236); c.fillRect(0, 292, w, 12);
  c.fillStyle = 'rgba(244,208,63,0.12)'; for (let x = 6; x < w; x += 24) { c.fillRect(x, 211, 8, 3); c.fillRect(x, 297, 8, 3); }
  // 9 棟建築(每幀重畫若 plot 變動)
  const label = (txt, x, y, color = '#fff8dc') => { c.font = '8px "Press Start 2P", monospace'; c.strokeStyle = '#2c2c2c'; c.lineWidth = 3; c.strokeText(txt, x, y); c.fillStyle = color; c.fillText(txt, x, y); };
  const house = (x, y, ww, hh, roof, wall) => { c.fillStyle = wall; c.fillRect(x, y, ww, hh); c.fillStyle = roof; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + ww / 2, y - 18); c.lineTo(x + ww + 4, y); c.closePath(); c.fill(); c.fillStyle = '#2c2c2c'; c.fillRect(x + ww / 2 - 5, y + hh - 18, 10, 18); };
  const blv = (id) => BuildingSystem_getLevel(id);
  // 4 階段牆色(Lv 1-2 / 3-6 / 7-9 / 10+):每棟 4 色,identity 保留但 visual 升級
  const bwall4 = (id, foundation, developed, professional, landmark) => {
    const lv = blv(id);
    if (lv >= 10) return landmark;
    if (lv >= 7) return professional;
    if (lv >= 3) return developed;
    return foundation;
  };
  // 階段裝飾(developed/professional/landmark):依 sceneKey 加元素;lv<3 不繪
  // 座標對應各棟 fillRect 位置(在 house / 自身 fillRect 之上加)
  const BUILDING_DECOR = {
    tavern:     { chimney: { x: 50, y: 150, w: 4, h: 14 }, shelves: [{ x: 30, y: 188, w: 4, h: 3 }, { x: 44, y: 188, w: 4, h: 3 }],
                  window_glow: [{ x: 26, y: 170, w: 4, h: 4 }, { x: 48, y: 170, w: 4, h: 4 }],
                  lantern: [{ x: 22, y: 196, w: 1, h: 2 }, { x: 53, y: 196, w: 1, h: 2 }],
                  aura: { x: 14, y: 150, w: 46, h: 60 } },
    monument:   { chimney: { x: 138, y: 116, w: 5, h: 18 }, shelves: [{ x: 102, y: 178, w: 6, h: 4 }, { x: 132, y: 178, w: 6, h: 4 }],
                  banner: { x: 96, y: 108, w: 16, h: 6 },
                  tower: { x: 126, y: 102, w: 8, h: 16 },
                  lantern: [{ x: 98, y: 184, w: 1, h: 2 }, { x: 144, y: 184, w: 1, h: 2 }],
                  aura: { x: 86, y: 100, w: 64, h: 74 } },
    goldMine:   { chimney: { x: 218, y: 150, w: 4, h: 14 }, shelves: [{ x: 188, y: 184, w: 5, h: 3 }, { x: 200, y: 184, w: 5, h: 3 }, { x: 212, y: 184, w: 5, h: 3 }],
                  banner: { x: 186, y: 148, w: 16, h: 8 },
                  lantern: [{ x: 184, y: 198, w: 1, h: 2 }, { x: 218, y: 198, w: 1, h: 2 }],
                  aura: { x: 180, y: 144, w: 48, h: 58 } },
    restaurant: { shelves: [{ x: 64, y: 194, w: 4, h: 2 }, { x: 74, y: 194, w: 4, h: 2 }],
                  window_glow: [{ x: 64, y: 184, w: 18, h: 3 }],
                  lantern: [{ x: 62, y: 200, w: 1, h: 2 }, { x: 80, y: 200, w: 1, h: 2 }],
                  aura: { x: 60, y: 180, w: 26, h: 24 } },
    drinkShop:  { shelves: [{ x: 160, y: 200, w: 3, h: 2 }, { x: 167, y: 200, w: 3, h: 2 }],
                  window_glow: [{ x: 160, y: 189, w: 12, h: 3 }],
                  lantern: [{ x: 158, y: 204, w: 1, h: 2 }, { x: 172, y: 204, w: 1, h: 2 }],
                  aura: { x: 156, y: 186, w: 20, h: 22 } },
    forge:      { chimney: { x: 58, y: 238, w: 5, h: 16 }, shelves: [{ x: 26, y: 274, w: 5, h: 3 }, { x: 38, y: 274, w: 5, h: 3 }, { x: 50, y: 274, w: 5, h: 3 }],
                  lantern: [{ x: 22, y: 288, w: 1, h: 2 }, { x: 62, y: 288, w: 1, h: 2 }],
                  aura: { x: 20, y: 234, w: 50, h: 64 } },
    alchemy:    { chimney: { x: 132, y: 244, w: 4, h: 14 }, shelves: [{ x: 104, y: 280, w: 5, h: 3 }, { x: 118, y: 280, w: 5, h: 3 }, { x: 130, y: 280, w: 5, h: 3 }],
                  lantern: [{ x: 100, y: 294, w: 1, h: 2 }, { x: 136, y: 294, w: 1, h: 2 }],
                  aura: { x: 98, y: 240, w: 46, h: 62 } },
    research:   { shelves: [{ x: 184, y: 274, w: 5, h: 3 }, { x: 198, y: 274, w: 5, h: 3 }, { x: 208, y: 274, w: 5, h: 3 }],
                  banner: { x: 178, y: 236, w: 16, h: 6 },
                  lantern: [{ x: 178, y: 290, w: 1, h: 2 }, { x: 214, y: 290, w: 1, h: 2 }],
                  aura: { x: 176, y: 232, w: 44, h: 64 } },
  };
  const applyBuildingDecor = (sceneKey) => {
    const lvl = blv(sceneKey);
    if (lvl < 3) return;
    const d = BUILDING_DECOR[sceneKey]; if (!d) return;
    // developed (Lv3+) — 煙囪 + 貨架
    if (d.chimney) {
      const { x, y, w, h } = d.chimney;
      c.fillStyle = '#5a5a62'; c.fillRect(x, y, w, h);
      c.fillStyle = '#3a3a40'; c.fillRect(x - 1, y - 2, w + 2, 2); // 煙囪頂帽
    }
    if (d.shelves) {
      for (const s of d.shelves) { c.fillStyle = '#3a3a40'; c.fillRect(s.x, s.y, s.w, s.h); }
    }
    // professional (Lv7+) — 旗幟 + 暖黃窗
    if (lvl >= 7) {
      if (d.banner) {
        c.fillStyle = '#c0392b'; c.fillRect(d.banner.x, d.banner.y, d.banner.w, d.banner.h);
        c.fillStyle = '#7a1f12'; c.fillRect(d.banner.x, d.banner.y, 1, d.banner.h); // 旗桿
      }
      if (d.window_glow) {
        c.fillStyle = '#ffe066';
        for (const w of d.window_glow) c.fillRect(w.x, w.y, w.w, w.h);
      }
    }
    // landmark (Lv10+) — 高塔(僅公會) + 燈籠 + 外光暈
    if (lvl >= 10) {
      if (d.tower) {
        c.fillStyle = '#d4c896'; c.fillRect(d.tower.x, d.tower.y, d.tower.w, d.tower.h);
        c.fillStyle = '#ffe066'; c.fillRect(d.tower.x + 1, d.tower.y - 2, d.tower.w - 2, 2); // 金頂
      }
      if (d.lantern) {
        for (const l of d.lantern) {
          c.fillStyle = '#ff6b35'; c.fillRect(l.x, l.y, l.w, l.h);
        }
      }
      if (d.aura) {
        c.save();
        c.globalAlpha = 0.35;
        c.strokeStyle = '#ffe066';
        c.lineWidth = 2;
        c.strokeRect(d.aura.x, d.aura.y, d.aura.w, d.aura.h);
        c.restore();
      }
    }
    // region unlock (§十 第三):擊敗該區域 boss 後,在該棟加特殊裝飾
    const REGION_DECOR_POSITIONS = {
      alchemy:   { mistFlask: [{ x: 128, y: 246, w: 4, h: 6, color: '#7dffa8' }, { x: 124, y: 244, w: 2, h: 2, color: '#a8ffc8' }] },
      market:    { crystalScale: [{ x: 198, y: 142, w: 5, h: 5, color: '#9b59b6' }] },
      forge:     { goldPile: [{ x: 12, y: 286, w: 5, h: 4, color: '#ffd700' }, { x: 14, y: 290, w: 3, h: 2, color: '#d4a017' }] },
      guild:     { lavaBanner: [{ x: 100, y: 100, w: 28, h: 10, color: '#ff6b35' }, { x: 102, y: 98, w: 24, h: 2, color: '#ffd700' }] },
      research:  { voidBanner: [{ x: 184, y: 234, w: 16, h: 6, color: '#5a4a8a' }, { x: 186, y: 240, w: 12, h: 2, color: '#7d6ba8' }] },
    };
    const SCENE_TO_BUILDING = { tavern: 'tavern', guild: 'monument', market: 'goldMine', forge: 'weaponShop', alchemy: 'potionShop', research: 'altar', restaurant: 'restaurant', drinkShop: 'drinkShop' };
    const buildingId = SCENE_TO_BUILDING[sceneKey];
    if (buildingId) {
      const regionDecs = getUnlockedDecorationsForBuilding(buildingId);
      const positions = REGION_DECOR_POSITIONS[sceneKey] || {};
      for (const decKey of regionDecs) {
        const rects = positions[decKey]; if (!rects) continue;
        for (const r of rects) {
          c.fillStyle = r.color;
          c.fillRect(r.x, r.y, r.w, r.h);
        }
      }
    }
  };
  const bpips = (id, x, y) => { const n = Math.min(10, blv(id)); c.fillStyle = '#f4d03f'; for (let i = 0; i < n; i++) c.fillRect(x + i * 4, y, 3, 2); };
  c.save(); { const d = plotDelta('tavern'); c.translate(d.dx, d.dy); }
  house(16, 164, 42, 42, '#6d3f2a', bwall4('tavern', '#a9764b', '#9d9da8', '#b8b8c0', '#d4c896')); c.fillStyle = '#f4d03f'; c.fillRect(24, 172, 10, 8); c.fillRect(48, 172, 6, 8); applyBuildingDecor('tavern'); bpips('tavern', 16, 210);
  c.restore();
  c.save(); { const d = plotDelta('guild'); c.translate(d.dx, d.dy); }
  house(96, 132, 50, 62, '#46324a', bwall4('monument', '#c9b082', '#b8b8c4', '#d0d0e0', '#e8d8a8')); c.fillStyle = '#46324a'; c.fillRect(88, 154, 8, 40); c.fillRect(146, 154, 8, 40);
  c.fillStyle = '#2c2c2c'; c.fillRect(112, 104, 4, 30); c.fillStyle = '#e74c3c'; c.fillRect(116, 104, 24, 12);
  c.strokeStyle = '#dfe7ff'; c.lineWidth = 2; c.beginPath(); c.moveTo(105, 150); c.lineTo(127, 172); c.moveTo(127, 150); c.lineTo(105, 172); c.stroke(); applyBuildingDecor('monument'); bpips('monument', 96, 198);
  c.restore();
  c.save(); { const d = plotDelta('market'); c.translate(d.dx, d.dy); }
  c.fillStyle = bwall4('goldMine', '#8b5a2b', '#8a8a96', '#a8a8b8', '#c8b890'); c.fillRect(184, 166, 40, 34); c.fillStyle = '#e74c3c'; for (let i = 0; i < 4; i++) c.fillRect(182 + i * 11, 156, 8, 10); c.fillStyle = '#f4d03f'; c.fillRect(190, 176, 8, 6); c.fillRect(206, 176, 8, 6); applyBuildingDecor('goldMine'); bpips('goldMine', 184, 204);
  c.restore();
  if (blv('restaurant') > 0) { c.save(); { const d = plotDelta('restaurant'); c.translate(d.dx, d.dy); }
    c.fillStyle = bwall4('restaurant', '#a94f3c', '#9a8a86', '#b0a8a8', '#d8c0a8'); c.fillRect(62, 188, 22, 14);
    c.fillStyle = '#f4d03f'; c.fillRect(64, 182, 18, 6); c.fillStyle = '#2c2c2c'; c.fillRect(64, 202, 3, 4); c.fillRect(79, 202, 3, 4);
    applyBuildingDecor('restaurant'); bpips('restaurant', 62, 206); c.restore(); }
  if (blv('drinkShop') > 0) { c.save(); { const d = plotDelta('drinkShop'); c.translate(d.dx, d.dy); }
    c.fillStyle = bwall4('drinkShop', '#3c6ea9', '#8296a8', '#a8b8c8', '#c8d8c8'); c.fillRect(158, 194, 16, 12);
    c.fillStyle = '#7dd6ff'; c.fillRect(160, 189, 12, 5); c.fillStyle = '#2c2c2c'; c.fillRect(160, 206, 2, 4); c.fillRect(170, 206, 2, 4);
    applyBuildingDecor('drinkShop'); bpips('drinkShop', 158, 210); c.restore(); }
  c.save(); { const d = plotDelta('forge'); c.translate(d.dx, d.dy); }
  house(22, 252, 44, 40, '#3c3c46', bwall4('weaponShop', '#8f8f9d', '#787882', '#9898a0', '#c0b896')); c.fillStyle = '#2c2c2c'; c.fillRect(48, 238, 10, 18);
  c.fillStyle = '#ff9f43'; c.fillRect(34, 274, 12, 6); applyBuildingDecor('weaponShop'); bpips('weaponShop', 22, 296);
  c.restore();
  c.save(); { const d = plotDelta('alchemy'); c.translate(d.dx, d.dy); }
  house(100, 258, 40, 36, '#4b3a63', bwall4('potionShop', '#9b7bb8', '#9890a8', '#b8b0c8', '#d8c8b0')); c.fillStyle = '#2c2c2c'; c.fillRect(112, 278, 18, 10); c.fillStyle = '#27ae60'; c.fillRect(114, 276, 14, 4);
  applyBuildingDecor('potionShop'); bpips('potionShop', 100, 298);
  c.restore();
  c.save(); { const d = plotDelta('research'); c.translate(d.dx, d.dy); }
  house(178, 252, 40, 42, '#2d3d63', bwall4('altar', '#7890c9', '#8890b0', '#a8b0c8', '#d0c8a8')); c.fillStyle = night > 0.4 ? '#9be7ff' : '#4aa3ff'; c.fillRect(192, 236, 10, 10); c.fillStyle = `rgba(155,231,255,${0.25 + night * 0.35})`; c.fillRect(188, 232, 18, 18); applyBuildingDecor('altar'); bpips('altar', 178, 298);
  c.restore();
  c.save(); { const d = plotDelta('gate'); c.translate(d.dx, d.dy); }
  c.fillStyle = '#4a4a55'; c.fillRect(96, 314, 48, 34); c.fillStyle = '#1b1026'; c.fillRect(104, 322, 32, 26);
  c.fillStyle = '#ff5252'; c.fillRect(112, 332, 4, 3); c.fillRect(124, 332, 4, 3); // 眼睛不閃(畫在 static 層)
  c.restore();
  // §六 1 4 服務圈 zone band(在每棟建築底部畫一道該 zone 的彩色 hint,讓玩家一眼看出分類)
  const ZONE_BANDS = [
    { sceneKey: 'tavern',     y: 206, w: 42, color: '#ff6b4a' },  // urgent
    { sceneKey: 'alchemy',    y: 300, w: 40, color: '#ff6b4a' },  // urgent
    { sceneKey: 'forge',      y: 292, w: 44, color: '#9b6bd6' },  // combat
    { sceneKey: 'restaurant', y: 206, w: 22, color: '#5db3ff' },  // commerce
    { sceneKey: 'drinkShop',  y: 212, w: 16, color: '#5db3ff' },  // commerce
    { sceneKey: 'guild',      y: 194, w: 50, color: '#a8a18a' },  // management
    { sceneKey: 'market',     y: 200, w: 40, color: '#a8a18a' },  // management
    { sceneKey: 'research',   y: 296, w: 40, color: '#a8a18a' },  // management
  ];
  for (const b of ZONE_BANDS) {
    const d = plotDelta(b.sceneKey);
    c.fillStyle = b.color;
    c.globalAlpha = 0.18;
    c.fillRect(d.dx + 2, d.dy + b.y - 1, b.w, 2);
    c.globalAlpha = 1;
  }
  // ── 主動線路點視覺(8 路點 + 連線虛線;對應 ROAD_GRAPH) ──
  // 低調渲染:暖金 #f4d03f 半透明虛線 + 暗芯;不干擾建築輪廓,但讓「路」可視。
  c.lineWidth = 1;
  c.strokeStyle = 'rgba(244,208,63,0.32)';
  c.setLineDash([2, 2]);
  const _seenEdges = new Set();
  for (const wp of ROAD_GRAPH) {
    for (const aId of wp.adjacent) {
      const key = wp.id < aId ? `${wp.id}|${aId}` : `${aId}|${wp.id}`;
      if (_seenEdges.has(key)) continue;
      _seenEdges.add(key);
      const a = getWaypoint(aId); if (!a) continue;
      c.beginPath(); c.moveTo(wp.x, wp.y); c.lineTo(a.x, a.y); c.stroke();
    }
  }
  c.setLineDash([]);
  for (const wp of ROAD_GRAPH) {
    c.fillStyle = 'rgba(244,208,63,0.55)';
    c.fillRect(wp.x - 1, wp.y - 1, 3, 3);
    c.fillStyle = 'rgba(28,20,12,0.9)';
    c.fillRect(wp.x, wp.y, 1, 1);
  }
}

// 建築名 label — 改在 drawScene 主 canvas 直接畫(DPR-aware 解析度)
// 原本在 drawStaticLayer 內 8px logical cache,DPR scale 後糊。
// 移到主 canvas 後,8px logical × DPR scale = 跟 DOM 文字一樣清晰。
function drawBuildingLabels(c) {
  const blv = (id) => BuildingSystem_getLevel(id);
  const cfg = [
    { key: 'tavern', txt: '酒館', x: 20, y: 150, color: '#fff8dc', show: true },
    { key: 'guild', txt: '公會', x: 104, y: 98, color: '#f4d03f', show: true },
    { key: 'market', txt: '市集', x: 188, y: 150, color: '#fff8dc', show: true },
    { key: 'restaurant', txt: '餐廳', x: 60, y: 176, color: '#ffb84d', show: () => blv('restaurant') > 0 },
    { key: 'drinkShop', txt: '飲料', x: 154, y: 184, color: '#7dd6ff', show: () => blv('drinkShop') > 0 },
    { key: 'forge', txt: '鐵匠', x: 24, y: 238, color: '#fff8dc', show: true },
    { key: 'alchemy', txt: '煉金', x: 104, y: 244, color: '#fff8dc', show: true },
    { key: 'research', txt: '研究', x: 182, y: 238, color: '#fff8dc', show: true },
    { key: 'gate', txt: '獵場', x: 106, y: 310, color: '#e1b3ff', show: true },
  ];
  c.font = '8px "Press Start 2P", monospace';
  c.lineWidth = 3;
  c.strokeStyle = '#2c2c2c';
  for (const lb of cfg) {
    if (lb.show !== true && (typeof lb.show !== 'function' || !lb.show())) continue;
    const d = plotDelta(lb.key);
    c.fillStyle = lb.color;
    c.strokeText(lb.txt, lb.x + d.dx, lb.y + d.dy);
    c.fillText(lb.txt, lb.x + d.dx, lb.y + d.dy);
  }
}

export function drawScene(t, dt) {
  updateWanderingScene(dt || 0);
  const c = sceneCtx, w = sceneW, h = sceneH;
  if (!c) return;
  const day = (Math.sin(t / 18) + 1) / 2;
  const night = 1 - day;
  setSceneNight(night);

  // 0. 相機:每幀套用「縮放 + 平移」transform,之後全部以世界座標繪製。
  //    home 相機 (0,0) → 視窗恰好等於村莊 0..w×0..h,畫面與加相機前逐像素相同。
  c.setTransform(_view.sx, 0, 0, _view.sy, -cam.x * _view.sx, -cam.y * _view.sy);
  c.imageSmoothingEnabled = false;
  c.clearRect(cam.x - 4, cam.y - 4, w + 8, h + 8);
  // 外環荒野(拖曳離開村莊才進畫面;村莊 static cache 會蓋掉中央)
  const panned = !isAtHome();
  if (panned) drawWorldRing(c, night);
  // 相機離開村莊時顯示「回村」鈕(只在狀態切換時動 DOM)
  if (panned !== _view.panned) { _view.panned = panned; const rb = $('btn-recenter'); if (rb) rb.style.display = panned ? 'flex' : 'none'; }

  // 1. 靜態層:若 cache 過期就重畫,否則 blit
  const cache = ensureStaticCache();
  const sig = staticCacheKey(t);
  if (_staticCache.signature !== sig) {
    drawStaticLayer(t);
    _staticCache.signature = sig;
  }
  c.drawImage(cache.canvas, 0, 0);

  // 1.5. 建築名 labels(畫在主 canvas,DPR-aware 解析度 → 跟 DOM 文字一樣清晰)
  drawBuildingLabels(c);

  // 2. 動態層:每天都要畫的東西(太陽/月亮 + 雲 + 煙囪煙 + 鍋爐泡)
  // 太陽/月亮位置
  const orbX = w * (0.18 + 0.64 * ((t / 36) % 1)), orbY = 48 + Math.sin(t / 18) * 16;
  c.fillStyle = day > 0.35 ? '#ffd76a' : '#dfe7ff'; c.fillRect(Math.round(orbX), Math.round(orbY), 13, 13);
  // 飄雲
  c.fillStyle = day > 0.35 ? 'rgba(255,255,255,0.82)' : 'rgba(188,202,255,0.28)';
  for (let i = 0; i < 4; i++) { const x = ((t * (5 + i * 2) + i * 70) % (w + 60)) - 30, y = 30 + i * 22; c.fillRect(Math.round(x), y, 22, 7); c.fillRect(Math.round(x) + 5, y - 5, 12, 6); c.fillRect(Math.round(x) + 16, y + 3, 16, 6); }
  // 鐵匠煙囪煙(Lv7+ 才畫 — 專業階段 chimney_smoke decoration)
  if (!reduceMotion && BuildingSystem_getLevel('weaponShop') >= 7) { const d = plotDelta('forge'); c.save(); c.translate(d.dx, d.dy);
    for (let i = 0; i < 4; i++) { const sy = 238 - ((t * 10 + i * 9) % 34); c.fillStyle = `rgba(220,220,220,${0.35 - i * 0.06})`; c.fillRect(50 + Math.sin(t + i) * 4, sy, 6 + i, 5); } c.restore(); }
  // 煉金鍋爐泡(Lv7+ 才畫)
  if (!reduceMotion && BuildingSystem_getLevel('potionShop') >= 7) { const d = plotDelta('alchemy'); c.save(); c.translate(d.dx, d.dy);
    for (let i = 0; i < 3; i++) { c.fillStyle = 'rgba(190,255,210,0.8)'; c.fillRect(116 + i * 5, 272 - ((t * 8 + i * 4) % 10), 2, 2); } c.restore(); }
  // 獵場門 portal glow(會動,放動態)
  if (!reduceMotion) { const d = plotDelta('gate'); c.save(); c.translate(d.dx, d.dy);
    c.fillStyle = `rgba(155,89,182,${0.35 + Math.sin(t * 4) * 0.12})`; c.fillRect(107, 325, 26, 20);
    c.fillStyle = '#ff5252'; if (Math.sin(t * 3) > -0.2) { c.fillRect(112, 332, 4, 3); c.fillRect(124, 332, 4, 3); } c.restore(); }

  // 3. Actor 層(每幀重畫 — 流浪 NPC / 怪 / 墓碑 / 對話泡泡)
  drawWanderingActors(c, t);

  // 4. Hotspot 高亮(hover feedback)
  for (const hs of SCENE_HOTSPOTS) {
    const active = hoverHotspot && hoverHotspot.id === hs.id;
    const d = plotDelta(hs.id);
    c.fillStyle = active ? 'rgba(244,208,63,0.20)' : 'rgba(255,248,220,0.035)'; c.fillRect(hs.x + d.dx, hs.y + d.dy, hs.w, hs.h);
    c.strokeStyle = active ? '#f4d03f' : 'rgba(255,248,220,0.10)'; c.lineWidth = active ? 2 : 1; c.strokeRect(hs.x + 0.5, hs.y + 0.5, hs.w - 1, hs.h - 1);
  }

  // 4.5 外圍獵場之門(僅拖曳離開村莊時繪製)
  if (panned) drawGates(c, t);

  // 5. Weather particles / 夜晚靈火
  if (night > 0.55 && !reduceMotion) { c.fillStyle = 'rgba(225,179,255,0.75)'; for (let i = 0; i < 10; i++) { const x = 90 + ((i * 17 + Math.sin(t + i) * 8 + 40) % 60), y = 300 + ((i * 23) % 46) + Math.cos(t * 1.7 + i) * 4; c.fillRect(Math.round(x), Math.round(y), 2, 2); } }
  if (!reduceMotion && weather.type === 'rain') {
    c.fillStyle = 'rgba(140,180,255,0.5)';
    for (let i = 0; i < 26; i++) { const x = (i * 37 + t * 140) % w, y = (i * 53 + t * 260) % h; c.fillRect(Math.round(x), Math.round(y), 1, 5); }
  } else if (!reduceMotion && weather.type === 'snow') {
    c.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 22; i++) { const x = (i * 41 + Math.sin(t + i) * 12 + t * 18) % w, y = (i * 47 + t * 36) % h; c.fillRect(Math.round(x), Math.round(y), 2, 2); }
  } else if (weather.type === 'fog') {
    c.fillStyle = 'rgba(200,200,210,0.18)'; c.fillRect(0, 0, w, h);
  }
}

// ═══════════════════════════════════════════════════════════════════
// initScene:綁定 canvas 事件 + rAF loop
// ═══════════════════════════════════════════════════════════════════
export function initScene() {
  const canvas = $('scene-canvas'); if (!canvas) return;
  setSceneCtx(canvas.getContext('2d'), canvas, 240, 360);
  sceneCtx.imageSmoothingEnabled = false;
  // 動態 canvas:internal 解析度 = display × DPR(高 DPI 螢幕銳利),ctx 縮放讓 240×360 邏輯座標正確
  function fitCanvas() {
    const wrap = canvas.parentElement; if (!wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const dw = wrap.clientWidth, dh = wrap.clientHeight;
    canvas.width = Math.max(1, Math.round(dw * dpr));
    canvas.height = Math.max(1, Math.round(dh * dpr));
    _view.sx = (dw / sceneW) * dpr; _view.sy = (dh / sceneH) * dpr;
    sceneCtx.setTransform(_view.sx, 0, 0, _view.sy, -cam.x * _view.sx, -cam.y * _view.sy);
    sceneCtx.imageSmoothingEnabled = false;
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  // ── 拖曳平移(pan)+ 點擊(tap)狀態機 ──
  // 手勢區分:pointerdown 記錄起點;移動超過門檻 → 判定為拖曳(平移相機,吞掉點擊);
  //          否則 pointerup 視為點擊 → 依序命中 流浪獵人 / 建築熱區 / 外圍門。
  const DRAG_PX = 6;                       // 判定拖曳的 client 位移門檻
  let ptrDown = false, dragged = false, downCX = 0, downCY = 0, startCamX = 0, startCamY = 0;
  const recenterBtn = $('btn-recenter');
  if (recenterBtn) recenterBtn.addEventListener('click', () => { recenterCam(); sfx?.('click'); setSceneHint('回到村莊中心。拖曳畫面可再次探索外圍。'); });

  canvas.addEventListener('pointerdown', (e) => {
    ptrDown = true; dragged = false;
    downCX = e.clientX; downCY = e.clientY;
    startCamX = cam.x; startCamY = cam.y;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });
  canvas.addEventListener('pointermove', (e) => {
    if (ptrDown) {
      const rect = sceneCanvas.getBoundingClientRect();
      const dx = e.clientX - downCX, dy = e.clientY - downCY;
      if (!dragged && Math.hypot(dx, dy) > DRAG_PX) { dragged = true; canvas.style.cursor = 'grabbing'; setHoverHotspot(null); }
      if (dragged) {
        // client 位移 → 世界位移;相機反向移動讓內容跟著手指
        setCam(startCamX - dx / rect.width * sceneW, startCamY - dy / rect.height * sceneH);
      }
      return;
    }
    // hover(滑鼠):流浪獵人 / 建築熱區 / 外圍門
    const p = scenePoint(e);
    const wh = wanderingHeroAt(p.x, p.y);
    const hs = wh ? null : hotspotAt(p.x, p.y);
    const gate = (wh || hs) ? null : gateAt(p.x, p.y);
    setHoverHotspot(hs);
    canvas.style.cursor = (wh || hs || gate) ? 'pointer' : 'grab';
    if (wh) setSceneHint(`流浪${CLASS_NAMES_ZH[wh.class] || '獵人'}「${wh.name}」Lv.${wh.level}:點擊查看 / 招募`);
    else if (hs) { const _sz = serviceZoneOf(hs.id); setSceneHint(`${_sz ? '[' + _sz.short + ']' : ''}${hs.name}:${hs.hint}`); }
    else if (gate) { const z = zoneOf(gate.zoneId), s = gateStatus(gate.zoneId); setSceneHint(`${z.icon} ${z.name}:${s.unlocked ? (s.cleared ? '已征服・可再刷' : s.bossReady ? '頭目已現身!' : '點擊派遣出征') : '🔒 尚未解鎖'}`); }
    else setSceneHint('🖐 拖曳探索世界地圖・外圍有 7 座獵場之門;點建築互動、點流浪獵人招募。');
  });
  canvas.addEventListener('pointerleave', () => { if (!ptrDown) { setHoverHotspot(null); canvas.style.cursor = 'grab'; setSceneHint('🖐 拖曳探索世界地圖・外圍有 7 座獵場之門。'); } });
  const endPointer = (e) => {
    if (!ptrDown) return;
    ptrDown = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    if (dragged) { dragged = false; canvas.style.cursor = 'grab'; return; } // 拖曳結束 — 不觸發點擊
    // ── tap ──
    const p = scenePoint(e);
    const wh = wanderingHeroAt(p.x, p.y);
    if (wh) {
      sfx?.('click');
      setHeroSubTab('wander'); openPanel('hero');
      showToast(`流浪獵人「${wh.name}」:可在酒館頁招募進村`, 'info');
      const cp = sceneToClient(wh.sx, wh.sy - 10); burst(cp.x, cp.y, '#f4d03f');
      return;
    }
    const hs = hotspotAt(p.x, p.y);
    if (hs) { sfx?.('click'); handleHotspot(hs, e); return; }
    const gate = gateAt(p.x, p.y);
    if (gate) { handleGate(gate); return; }
    setSceneHint('請點擊發亮建築、外圍獵場之門或流浪獵人;空白處拖曳可平移地圖。');
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', () => { ptrDown = false; dragged = false; canvas.style.cursor = 'grab'; });
  let lastNow = performance.now();
  // rAF loop 必須永遠跑 — drawScene 內部動畫(雲/煙/泡/portal glow)各自有 if(!reduceMotion) guard;
  // 若 loop 本身被 reduceMotion 中斷,整個場景會 freeze 住。
  const loop = (now) => { const dt = Math.min(0.05, (now - lastNow) / 1000); lastNow = now; drawScene((now - sceneStart) / 1000, dt); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
function setSceneHint(text) { const el = $('scene-hint'); if (el && el.textContent !== text) el.textContent = text; }
function scenePoint(e) {
  const rect = sceneCanvas.getBoundingClientRect();
  // 螢幕座標 → 世界座標(加回相機平移,與 sceneToClient 互為逆)
  return { x: (e.clientX - rect.left) / rect.width * sceneW + cam.x, y: (e.clientY - rect.top) / rect.height * sceneH + cam.y, cx: e.clientX, cy: e.clientY };
}
function hotspotAt(x, y) {
  return SCENE_HOTSPOTS.find(h => { const d = plotDelta(h.id); return x >= h.x + d.dx && x <= h.x + d.dx + h.w && y >= h.y + d.dy && y <= h.y + d.dy + h.h; }) || null;
}
function handleHotspot(hs, e) {
  burst(e.clientX, e.clientY, '#f4d03f');
  if (hs.id === 'guild') { collectGuildClick(e); openPanel('res'); return; }
  if (hs.id === 'market') { collectMarketClick(e); openPanel('build'); return; }
  sfx('click');
  if (hs.id === 'tavern') { setHeroSubTab('wander'); openPanel('hero'); showToast(wanderingHeroes.length ? '酒館有新的流浪獵人' : '酒館外目前沒有流浪獵人', 'info'); }
  else if (hs.id === 'forge') { setShopFilter('weapon'); openPanel('shop'); showToast('鐵匠鋪:製作武器,防具在皮甲工坊。', 'info'); }
  else if (hs.id === 'alchemy') { setShopFilter('potion'); openPanel('shop'); showToast('煉金工房:製作藥水與查看倉庫。', 'info'); }
  else if (hs.id === 'research') { openPanel('ach'); showToast('魔核研究所:查看成就與村莊重建。', 'info'); }
  else if (hs.id === 'restaurant') { openPanel('build'); showToast('餐廳:獵人休息時付餐費,升級加快心情恢復。', 'info'); }
  else if (hs.id === 'drinkShop') { openPanel('build'); showToast('飲料店:心情普通的獵人會來買飲料。', 'info'); }
  else if (hs.id === 'gate') { openPanel('map'); showToast('選擇獵場與難度,派遣獵人出征。', 'info'); }
}
import { checkAchievements } from './meta.js'
// 外圍獵場之門點擊:未解鎖→提示;已解鎖→開該區難度詳情(隊伍/自由組隊/單人派遣都在該 modal)。
// 走 window.openDifficultyModal(combat.js 已 bridge 到 window)以避免 scene→combat 直接 import 造成循環。
function handleGate(gate) {
  const z = zoneOf(gate.zoneId); if (!z) return;
  const s = gateStatus(gate.zoneId);
  const cp = sceneToClient(gate.x, gate.y - 12);
  if (!s.unlocked) {
    sfx?.('click'); burst(cp.x, cp.y, '#8a8a96');
    showToast(`🔒 ${z.icon}${z.name} 尚未解鎖 — 先擊敗前一區頭目解鎖。`, 'error');
    return;
  }
  sfx?.('dispatch'); burst(cp.x, cp.y, '#f4d03f');
  const diff = smartDiff(gate.zoneId);
  if (typeof window !== 'undefined' && typeof window.openDifficultyModal === 'function') {
    window.openDifficultyModal(gate.zoneId, diff);
  } else {
    openPanel('map');
  }
  showToast(`${z.icon} ${z.name} — 選擇隊伍或獵人派遣出征。`, 'info');
}
function collectGuildClick(e) {
  const amount = _getClickGold() + BuildingSystem_getLevel('monument');
  gainGold(amount); stats.clicks = (stats.clicks || 0) + 1;
  const mat = choice(MATERIAL_TYPES); ResourceSystem_add(mat, 1);
  spawnFloat(`🪙+${fmt(amount)} ${RESOURCES[mat].icon}+1`, e.clientX, e.clientY, '#f4d03f');
  sfx('gold'); checkAchievements(); renderHUD();
}
function collectMarketClick(e) {
  const amount = _getClickGold() + Math.floor(stageProductionRate('goldMine', BuildingSystem_getGoldRate()) * 5);
  if (amount <= 0) { showToast('市集尚未建造,先到建築面板興建。', 'error'); return; }
  gainGold(amount); stats.clicks = (stats.clicks || 0) + 1;
  spawnFloat(`⚖️+${fmt(amount)}`, e.clientX, e.clientY, '#f4d03f');
  sfx('gold'); checkAchievements(); renderHUD();
}

// ═══════════════════════════════════════════════════════════════════
// impls 反向注入(給其他模組用)
// ═══════════════════════════════════════════════════════════════════
impls.spawnFloat = spawnFloat;
// 流浪獵人自動生成:processWanderingTick 從 gameTick(setInterval 1000ms) 呼叫一次 consume,
// 所以倒數單位是「秒」,遞減 1。
// state.js 初始值是 0,settings-and-init 載入存檔會 setNextWanderingSpawnIn(秒數)
// — 若都沒設,首次呼叫 consume 會把 0 視為「未初始化」並初始化為間隔。
impls.bumpNextWanderingSpawn = (n) => setNextWanderingSpawnIn(n);
impls.consumeNextWanderingSpawn = () => {
  if (nextWanderingSpawnIn <= 0) {
    // 未初始化或剛 spawn 過 — 設為酒館等級對應間隔(秒),等下一輪才 spawn
    setNextWanderingSpawnIn(BuildingSystem_getWanderingSpawnInterval());
    return false;
  }
  const next = Math.max(0, nextWanderingSpawnIn - 1);
  setNextWanderingSpawnIn(next);
  if (next <= 0) {
    setNextWanderingSpawnIn(BuildingSystem_getWanderingSpawnInterval());
    return true;
  }
  return false;
};
