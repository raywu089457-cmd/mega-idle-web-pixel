// src/scene-map.js — 世界地圖層:相機 pan + 外圍 7 個獵場之門(zone gates)
// LEAF 模組:只 import data / util / state,不 import scene.js / ui.js / combat.js(零循環)。
// 座標系:村莊(main city)固定在世界座標 0..SCENE_W × 0..SCENE_H(=240×360),與既有繪製/命中程式完全相容。
// 世界比村莊大一圈(RING),外圍環狀區放 7 個獵場之門;相機(cam)決定視窗(viewport)看到世界哪一塊。
// 相機 home = (0,0) 時視窗剛好等於村莊 → 畫面與加相機前逐像素相同(門/外環只在拖曳後才進畫面)。

import { ZONES } from './data.js'
import { mapProgress } from './state.js'
import { clamp } from './util.js'

// ── 世界尺寸(設計常數,對應 setSceneCtx(...,240,360)) ──
export const SCENE_W = 240, SCENE_H = 360;   // 村莊視窗邏輯尺寸
export const RING = 132;                     // 村莊四周可探索的環寬
export const WORLD = { minX: -RING, minY: -RING, maxX: SCENE_W + RING, maxY: SCENE_H + RING }; // 504 × 624

// ── 相機(可變物件,scene.js 直接讀 cam.x / cam.y 走 hot path) ──
export const cam = { x: 0, y: 0 };
export function clampCam() {
  cam.x = clamp(cam.x, WORLD.minX, WORLD.maxX - SCENE_W);
  cam.y = clamp(cam.y, WORLD.minY, WORLD.maxY - SCENE_H);
}
export function setCam(x, y) { cam.x = x; cam.y = y; clampCam(); }
export function panCam(dxWorld, dyWorld) { cam.x += dxWorld; cam.y += dyWorld; clampCam(); }
export function recenterCam() { cam.x = 0; cam.y = 0; }
export function isAtHome() { return Math.abs(cam.x) < 1 && Math.abs(cam.y) < 1; }

// ── 7 個門的世界座標中心(村莊佔 0..240 × 0..360,門散在外環) ──
export const ZONE_GATES = [
  { zoneId: 1, x: 30,  y: -80 },   // 迷霧森林 — 上·左
  { zoneId: 2, x: 120, y: -98 },   // 腐化沼澤 — 上·中
  { zoneId: 3, x: 210, y: -80 },   // 荒廢礦坑 — 上·右
  { zoneId: 4, x: 314, y: 150 },   // 熔岩裂谷 — 右
  { zoneId: 5, x: 204, y: 446 },   // 魔域王座 — 下·右
  { zoneId: 6, x: 56,  y: 452 },   // 噩夢迴廊 — 下·左
  { zoneId: 7, x: -76, y: 200 },   // 深淵核心 — 左
];
const GATE_HALF_W = 24, GATE_HALF_H = 28;    // 命中框半寬/半高(不含下方名牌)
const GATE_COLORS = { 1: '#6fbf5f', 2: '#9b6bd6', 3: '#c9a15a', 4: '#ff6b4a', 5: '#e0556b', 6: '#7c5cff', 7: '#5db3ff' };

export function zoneOf(zoneId) { return ZONES.find(z => z.id === zoneId); }
export function gateAt(x, y) {
  for (const g of ZONE_GATES) {
    if (Math.abs(x - g.x) <= GATE_HALF_W && Math.abs(y - g.y) <= GATE_HALF_H + 12) return g;
  }
  return null;
}
export function gateStatus(zoneId) {
  const unlocked = !!(mapProgress.unlockedZones && mapProgress.unlockedZones.includes(zoneId));
  const p = (mapProgress.zoneProgress && mapProgress.zoneProgress[zoneId]) || {};
  return { unlocked, cleared: !!p.bossDefeated, bossReady: !!(p.easy && p.normal && p.hard && !p.bossDefeated) };
}
// 門點擊時派遣的預設難度:未過關由易→難,全過關但頭目未除→頭目,已征服→hard(再刷)
export function smartDiff(zoneId) {
  const p = (mapProgress.zoneProgress && mapProgress.zoneProgress[zoneId]) || {};
  if (p.bossDefeated) return 'hard';
  if (p.easy && p.normal && p.hard) return 'boss';
  if (!p.easy) return 'easy';
  if (!p.normal) return 'normal';
  return 'hard';
}

// ── 外環荒野背景(固定裝飾座標,無 per-frame 隨機,避免閃爍) ──
const RING_TREES = [
  { x: -96, y: 40 }, { x: -108, y: 120 }, { x: -70, y: 300 }, { x: -100, y: 380 },
  { x: 300, y: 30 }, { x: 344, y: 90 }, { x: 328, y: 250 }, { x: 356, y: 360 }, { x: 300, y: 440 },
  { x: 40, y: -110 }, { x: 170, y: -118 }, { x: 260, y: -110 },
  { x: 20, y: 430 }, { x: 130, y: 470 }, { x: 250, y: 470 },
];
const RING_ROCKS = [
  { x: -60, y: 70 }, { x: 290, y: 180 }, { x: -40, y: 350 }, { x: 300, y: 400 }, { x: 90, y: -80 }, { x: 180, y: 445 },
];

// ctx 已套用「相機 + 縮放」transform;此處全部用世界座標繪製。
export function drawWorldRing(c, night) {
  // 1. 整個世界底色(荒野)。村莊中心會被不透明的 static cache 蓋掉,只有外環會露出。
  const g0 = Math.round(34 + (1 - night) * 20), g1 = Math.round(52 + (1 - night) * 34);
  c.fillStyle = `rgb(${g0 - 8},${g1},${g0})`;
  c.fillRect(WORLD.minX, WORLD.minY, WORLD.maxX - WORLD.minX, WORLD.maxY - WORLD.minY);
  // 斑駁暗塊(固定格點,棋盤式微差)
  c.fillStyle = `rgba(20,32,18,0.35)`;
  for (let x = WORLD.minX; x < WORLD.maxX; x += 24) {
    for (let y = WORLD.minY; y < WORLD.maxY; y += 24) {
      if (((x / 24 + y / 24) & 1) === 0) c.fillRect(x + 2, y + 2, 10, 10);
    }
  }
  // 2. 世界邊界(懸崖/柵欄框)
  c.strokeStyle = '#1c140c'; c.lineWidth = 4;
  c.strokeRect(WORLD.minX + 2, WORLD.minY + 2, WORLD.maxX - WORLD.minX - 4, WORLD.maxY - WORLD.minY - 4);
  // 3. 從村莊邊緣到各門的碎石小徑(虛線)
  c.fillStyle = 'rgba(210,180,120,0.28)';
  for (const gt of ZONE_GATES) {
    const ex = clamp(gt.x, 16, SCENE_W - 16), ey = clamp(gt.y, 16, SCENE_H - 16); // 村莊邊緣起點
    const dx = gt.x - ex, dy = gt.y - ey, dist = Math.hypot(dx, dy) || 1;
    const steps = Math.max(1, Math.round(dist / 9));
    for (let i = 0; i <= steps; i++) { const px = ex + dx * (i / steps), py = ey + dy * (i / steps); c.fillRect(Math.round(px) - 2, Math.round(py) - 2, 4, 3); }
  }
  // 4. 荒野樹木 / 石頭(固定座標)
  for (const tr of RING_TREES) {
    c.fillStyle = night > 0.4 ? '#16321a' : '#2f5a30'; c.fillRect(tr.x - 6, tr.y - 4, 12, 12);
    c.fillStyle = '#3a2a1c'; c.fillRect(tr.x - 1, tr.y + 8, 3, 6);
  }
  for (const rk of RING_ROCKS) { c.fillStyle = '#6b6459'; c.fillRect(rk.x - 5, rk.y - 3, 11, 7); c.fillStyle = '#4a4640'; c.fillRect(rk.x - 5, rk.y + 2, 11, 2); }
}

export function drawGates(c, t) {
  for (const gt of ZONE_GATES) {
    const z = zoneOf(gt.zoneId); if (!z) continue;
    const s = gateStatus(gt.zoneId);
    const col = GATE_COLORS[gt.zoneId] || '#8ecbff';
    const x = gt.x, y = gt.y;
    const dim = !s.unlocked;
    // 拱門石座
    c.fillStyle = dim ? '#3a3a42' : '#6a6270';
    c.fillRect(x - 20, y - 22, 40, 40);
    c.fillStyle = dim ? '#2a2a30' : '#4c4552';
    c.fillRect(x - 16, y - 18, 32, 34);
    // 傳送門光(未鎖才發光;頭目就緒會脈動)
    if (!dim) {
      const pulse = s.bossReady ? 0.35 + Math.sin(t * 4) * 0.22 : 0.32;
      c.fillStyle = hexA(col, pulse);
      c.fillRect(x - 12, y - 14, 24, 28);
      c.fillStyle = hexA(col, 0.9);
      c.fillRect(x - 12, y - 14, 24, 3);
    } else {
      c.fillStyle = '#20202a'; c.fillRect(x - 12, y - 14, 24, 28);
    }
    // 區域圖示
    c.font = '14px sans-serif'; c.textAlign = 'center';
    c.globalAlpha = dim ? 0.5 : 1;
    c.fillText(z.icon, x, y + 4);
    c.globalAlpha = 1;
    // 狀態角標
    if (s.cleared) { c.font = '11px sans-serif'; c.fillText('✅', x + 15, y - 12); }
    else if (dim) { c.font = '11px sans-serif'; c.fillText('🔒', x + 14, y - 12); }
    else if (s.bossReady) { c.font = '11px sans-serif'; c.fillText('👑', x + 14, y - 12); }
    // 名牌
    c.font = '8px "Press Start 2P", monospace'; c.lineWidth = 3; c.strokeStyle = '#1c140c';
    c.strokeText(z.name, x, y + 30); c.fillStyle = dim ? '#9a9088' : '#fff8dc'; c.fillText(z.name, x, y + 30);
    c.textAlign = 'left';
  }
}

// #rrggbb + alpha → rgba()
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a, 0, 1)})`;
}
