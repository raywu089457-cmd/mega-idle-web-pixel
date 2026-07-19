// src/scene.js — L2 Canvas 場景 + 城內 AI + 建築擺位
// 從 index.html L2744-3566 搬出
// 本檔是 stub:只實作 ui.js / window-bridge 需要的最小 API。
// 完整場景渲染(Canvas + 場景 600 行)在 follow-up session 補上。

import { ZONES, BUILDING_TO_SCENE, PLOT_COORDS, PLOT_BUILDINGS, PLOT_NAMES, DEFAULT_PLOT_OF, BUILDING_ANCHORS, HUNT_ZONES, ANCHOR_BASE, ANCHOR_PLOT_KEY, SCENE_HOTSPOTS, SCENE_SCALE, mixColor, rgb, $ } from './data.js';
import { sceneCtx, sceneCanvas, sceneW, sceneH, sceneStart, buildingPlots, placementPick, hoverHotspot, setPlacementPick, setBuildingPlots, setSceneCtx, setSceneStart, setHoverHotspot, impls, setSceneNight, sceneNight } from './state.js';
import { showToast, $, esc, showModal, hideModal, rand, randf, clamp } from './util.js';
import { sfx } from './audio.js';
import { gainGold } from './resources-buildings.js';

// ─── 場景初始化(實作版本,初始化 canvas)───
export function initScene() {
  const canvas = $('scene-canvas');
  if (!canvas) return;
  sceneCanvas && (sceneCanvas.width = 240 * SCENE_SCALE);
  setSceneCtx(canvas.getContext('2d'), canvas, 240 * SCENE_SCALE, 360 * SCENE_SCALE);
  setSceneStart(performance.now());
  // stub:不繪製背景,留白由 CSS 處理
  setBuildingPlots({ ...DEFAULT_PLOT_OF });
}

// ─── 場景渲染(loop 由 rAF 驅動) ───
export function drawScene(_t, _dt) { /* stub:不繪製 */ }
export function updateWanderingScene(_dt) { /* stub */ }
export function drawWanderingActors(_c, _t) { /* stub */ }

// ─── 建築擺位(從 ui.js 引用) ───
export function pickPlacement(sceneKey) {
  if (placementPick === sceneKey) { setPlacementPick(null); return; }
  if (placementPick) {
    // 兩兩交換
    const a = placementPick, b = sceneKey;
    const aPlot = Object.keys(buildingPlots).find(k => buildingPlots[k] === PLOT_BUILDINGS.indexOf(a));
    const bPlot = Object.keys(buildingPlots).find(k => buildingPlots[k] === PLOT_BUILDINGS.indexOf(b));
    if (aPlot && bPlot && aPlot !== bPlot) {
      const tmp = buildingPlots[aPlot]; buildingPlots[aPlot] = buildingPlots[bPlot]; buildingPlots[bPlot] = tmp;
      showToast(`已交換 ${PLOT_NAMES[aPlot] || aPlot} ↔ ${PLOT_NAMES[bPlot] || bPlot}`, 'success');
      sfx('click');
    }
    setPlacementPick(null);
  } else {
    setPlacementPick(sceneKey);
  }
}
export function resetBuildingPlots() { setBuildingPlots({ ...DEFAULT_PLOT_OF }); showToast('已恢復預設擺位。', 'info'); sfx('click'); }

// ─── 浮字 + 粒子(用於離線收益等) ───
import { floatState } from './state.js';
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

// ─── 註冊 impls ───
impls.spawnFloat = spawnFloat;
impls.bumpNextWanderingSpawn = (n) => { /* TODO */ };
impls.consumeNextWanderingSpawn = () => false;
