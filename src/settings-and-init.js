// src/settings-and-init.js — L2 設定 + 存檔 import/export + applyStateToRuntime + init/gameTick
// 從 index.html L3871-4007 搬出
// 注意:applyStateToRuntime 原本在 state.js,但需 import 太多 L2,在這裡組合

import { $, esc, showModal, hideModal, showToast, fmt, todayKey } from './util.js'
import { sfx } from './audio.js'
import { saveGame, loadGame, migrateSave, getDefaultGameState, defaultMapProgress, gameState, setResources, setBuildingStates, setMapProgress, setShopStock, setPriceMult, setActiveExplorations, setBattleReports, setStats, setAchievementsUnlocked, setPrestige, setDaily, setSettings, setWeather, setCraftOrders, setTeams, setBuildingPlots, setShopInventory, setGearInventory, setNextWanderingSpawnIn, setPotionShopAutoProduce, setTerritoryHeroes, setWanderingHeroes, setResetting, setPendingOfflineSummary, territoryCombatTickCounter, incTerritoryCombatTickCounter, buildingPlots as _buildingPlots, defaultBuildings, townEvent, setTownEvent } from './state.js'
import { syncActiveExplorations, normalizeHero, generateHero } from './heroes-stats.js'
import { defaultTeams } from './combat-party.js'
import { renderAll, renderHUD, renderBadges, renderPanel, openPanel, closePanel, renderBuildingsPanel, upgradeBuilding, renderResourcesPanel, renderHeroesPanel, renderMapPanel, renderShopPanel, renderAchPanel } from './ui.js'
import { BuildingSystem_setSpec } from './resources-buildings.js'
import { BUILDINGS } from './data.js'
import { computePresetSwaps, getPresetName } from './layout-presets.js'
import { PLOT_BUILDINGS } from './scene-map.js'
import { SAVE_KEY, getDefaultGameState as _getDefaultGameState } from './state.js'
import { checkAchievements, collectOffline, computeOffline, offlineModalHtml, claimDaily, produceTick, checkDaily as _checkDaily, finalBossDefeated as _finalBossDefeated, getPrestigeGain as _getPrestigeGain } from './meta.js'
import { processHeroTick, openDispatch, openDifficultyModal, dispatchHero } from './combat.js';
import { processPartyCombats } from './combat-party.js';
import { processOrdersTick } from './ui.js';
import { startAbyssCombat, finishAbyssCombat, spawnWanderingHero, processWanderingTick, weatherTick } from './expeditions.js'
import { maybeTriggerNewEvent, tickEventDuration, TOWN_EVENTS } from './town-events.js'
import { initScene, drawScene, initFloatCanvas } from './scene.js'
import { gameState as _gs } from './state.js'
import { ensureAudio } from './audio.js'

// ═══════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════
export function openSettings() {
  $('slider-music').value = settings.music; $('slider-sfx').value = settings.sfx;
  $('toggle-notif').classList.toggle('on', !!settings.notif);
  $('toggle-autorecall').classList.toggle('on', settings.autoRecall !== false);
  renderSpeedBtns();
  showModal('modal-settings');
}
import { settings } from './state.js'
export function closeSettings() { saveGame(); hideModal('modal-settings'); }
export function renderSpeedBtns() {
  if (!$('speed-btns')) return;
  const opts = [[0.5, '0.5x'], [1, '1x'], [2, '2x'], [4, '4x']];
  $('speed-btns').innerHTML = opts.map(([v, label]) => `<button class="report-sub-btn ${settings.combatSpeed === v ? 'active' : ''}" onclick="setCombatSpeed(${v})">${label}</button>`).join('');
}
export function setCombatSpeed(n) { settings.combatSpeed = n; sfx('click'); renderSpeedBtns(); saveGame(); }
export function closeOnboard() { settings.onboarded = true; saveGame(); hideModal('modal-onboard'); sfx('click'); }
export function bindSettings() {
  $('btn-settings').addEventListener('click', () => { sfx('click'); openSettings(); });
  $('slider-music').addEventListener('input', (e) => { settings.music = Number(e.target.value); });
  $('slider-sfx').addEventListener('input', (e) => { settings.sfx = Number(e.target.value); sfx('click'); });
  $('slider-music').addEventListener('change', saveGame); $('slider-sfx').addEventListener('change', saveGame);
  $('toggle-notif').addEventListener('click', () => { settings.notif = !settings.notif; $('toggle-notif').classList.toggle('on', settings.notif); saveGame(); });
  $('toggle-autorecall').addEventListener('click', () => { settings.autoRecall = settings.autoRecall === false; $('toggle-autorecall').classList.toggle('on', settings.autoRecall); saveGame(); });
}
export function doReset() {
  if (!confirm('確定要清除所有進度重新開始嗎？此操作無法復原。')) return;
  setResetting(true);
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
  location.reload();
}
export function doPrestige(traditionId) {
  if (!finalBossDefeated()) { showToast('需先擊敗魔域王座的魔域大君。', 'error'); return; }
  const TRADITIONS_VALID = ['commerce', 'forge', 'hunt', 'scholar', 'pioneer'];
  if (!traditionId || !TRADITIONS_VALID.includes(traditionId)) {
    showToast('請先選擇一項村莊傳統。', 'error');
    if (typeof openTraditionPicker === 'function') openTraditionPicker();
    return;
  }
  const gain = getPrestigeGain();
  if (!confirm(`重建將重置資源、建築、獵人與地圖,但保留成就/統計/每日,並獲得 ${gain} 傳承碎片 + 「${traditionId}」傳統。確定?`)) return;
  const nextTraditions = { ...(prestige.traditions || { commerce: 0, forge: 0, hunt: 0, scholar: 0, pioneer: 0 }) };
  nextTraditions[traditionId] = (nextTraditions[traditionId] || 0) + 1;
  const keep = { stats, achievements: achievementsUnlocked, prestige: { shards: prestige.shards + gain, count: prestige.count + 1, traditions: nextTraditions }, daily, settings };
  keep.stats.prestiges = (keep.stats.prestiges || 0) + 1;
  const newState = getDefaultGameState();
  newState.stats = keep.stats; newState.achievements = keep.achievements; newState.prestige = keep.prestige; newState.daily = keep.daily; newState.settings = keep.settings;
  localStorage.setItem(SAVE_KEY, JSON.stringify(newState));
  location.reload();
}
export function confirmTraditionPick(traditionId) {
  closeModal();
  doPrestige(traditionId);
}
// §六 2 — 確認選擇建築專精
export function confirmSpecializationPick(buildingId, specId) {
  closeModal();
  BuildingSystem_setSpec(buildingId, specId);
  saveGame();
  renderBuildingsPanel();
  showToast(`⚒️ ${BUILDINGS[buildingId]?.name || buildingId} 已選「${specId}」專精`, 'success', 3000);
}
// §十 4 — 套用布局 preset
export function applyLayoutPreset(presetId) {
  const swaps = computePresetSwaps(buildingPlots, presetId);
  if (swaps.length === 0) { showToast('已是目標布局。', 'info'); return; }
  // 套用所有 swap — 透過 plotDelta 機制:pickPlacement 兩兩互換
  const next = { ...buildingPlots };
  for (const [a, b] of swaps) {
    const aPlot = next[a] ?? PLOT_BUILDINGS.indexOf(a);
    const bPlot = next[b] ?? PLOT_BUILDINGS.indexOf(b);
    next[a] = bPlot; next[b] = aPlot;
  }
  setBuildingPlots(next);
  saveGame();
  renderBuildingsPanel();
  showToast(`🏘 已套用「${getPresetName(presetId)}」(${swaps.length} 次互換)`, 'success', 3000);
}
// §六 3 — 城鎮事件 tick 推進 + 隨機觸發
export function tickTownEvent() {
  const ticked = tickEventDuration(townEvent, territoryCombatTickCounter);
  if (ticked !== townEvent) setTownEvent(ticked);
  if (!ticked) {
    const newEvt = maybeTriggerNewEvent(townEvent, territoryCombatTickCounter);
    if (newEvt) {
      setTownEvent(newEvt);
      const def = TOWN_EVENTS[newEvt.id];
      showToast(`${def.icon} 城鎮事件:${def.name}`, 'info', 4000);
    }
  }
}
import { finalBossDefeated, getPrestigeGain } from './meta.js';
import { achievementsUnlocked, prestige } from './state.js';
import { DEFAULT_PLOT_OF } from './data.js';
export function registerSW() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      // 有新 SW 在等 → 跳 toast 提示重整
      if (reg.waiting) promptUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) promptUpdate(nw);
        });
      });
      // 每次分頁 focus 都檢查一次(覆蓋瀏覽器 24h 預設檢查太慢的問題)
      window.addEventListener('focus', () => reg.update().catch(() => {}));
    }).catch(() => { });
    // 新 SW 接管時(其他分頁 activate)→ 提示
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      showToast('🔄 新版本已就緒,建議重整頁面', 'info', 8000);
    });
  }
}
let _updatePromptShown = false;
function promptUpdate(worker) {
  if (_updatePromptShown) return;
  _updatePromptShown = true;
  showToast('✨ 新版本下載完成,點此重整啟用', 'success', 30000);
  const toast = [...document.querySelectorAll('.toast')].pop();
  if (toast) {
    toast.style.cursor = 'pointer';
    toast.addEventListener('click', () => {
      worker.postMessage({ type: 'SKIP_WAITING' });
      setTimeout(() => location.reload(), 300);
    }, { once: true });
  }
}
export function exportSaveCode() {
  saveGame();
  try {
    const raw = localStorage.getItem(SAVE_KEY) || '';
    $('save-code').value = btoa(unescape(encodeURIComponent(raw)));
    showToast('存檔碼已產生，請複製保存。', 'success');
  } catch (e) { showToast('匯出失敗。', 'error'); }
}
export function importSaveCode() {
  const code = ($('save-code').value || '').trim();
  if (!code) { showToast('請先貼上存檔碼。', 'error'); return; }
  try {
    const raw = decodeURIComponent(escape(atob(code)));
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.resources) throw new Error('bad save');
    if (!confirm('匯入將覆蓋目前進度，確定繼續？')) return;
    localStorage.setItem(SAVE_KEY, raw);
    location.reload();
  } catch (e) { showToast('存檔碼無效，請確認後再試。', 'error'); }
}

// ═══════════════════════════════════════════════════════════════════
// applyStateToRuntime — 從存檔載入 runtime
// ═══════════════════════════════════════════════════════════════════
export function applyStateToRuntime() {
  ResourceSystem_init(gameState);
  BuildingSystem_init(gameState);
  setTerritoryHeroes((gameState.heroes || []).map(normalizeHero));
  setWanderingHeroes((gameState.wanderingHeroes || []).map(normalizeHero));
  setShopInventory(gameState.shopInventory || {});
  setGearInventory(gameState.gearInventory || []);
  setShopStock(Object.assign({ healthPotion: 2, gear: 1 }, gameState.shopStock || {}));
  setPriceMult(Object.assign({ potion: 1, gear: 1 }, gameState.priceMult || {}));
  setPotionShopAutoProduce(gameState.potionShopAutoProduce !== false);
  setNextWanderingSpawnIn(gameState.nextWanderingSpawnIn || 3);
  setMapProgress(gameState.mapProgress || defaultMapProgress());
  setActiveExplorations(gameState.activeExplorations || []);
  setBattleReports(gameState.battleReports || []);
  setStats(gameState.stats || { kills: 0, bossKills: 0, goldEarned: 0, clicks: 0, crafted: 0, prestiges: 0, shopRevenue: 0 });
  setAchievementsUnlocked(gameState.achievements || {});
  setPrestige(gameState.prestige || { shards: 0, count: 0 });
  setDaily(gameState.daily || { lastClaim: null, streak: 0, bestStreak: 0 });
  setSettings(gameState.settings || { music: 40, sfx: 80, notif: true });
  setWeather(gameState.weather || { type: 'sunny', ticks: 0 });
  setCraftOrders(gameState.craftOrders || []);
  let teams = Array.isArray(gameState.teams) ? gameState.teams.slice(0, 4) : defaultTeams();
  while (teams.length < 4) teams.push({ id: teams.length, members: [], formation: {} });
  const teamSeen = new Set();
  for (const t of teams) {
    t.id = teams.indexOf(t);
    t.members = (t.members || []).filter(id => {
      if (teamSeen.has(id) || !territoryHeroes.some(h => h.id === id)) return false;
      teamSeen.add(id); return true;
    }).slice(0, 4);
    t.formation = t.formation || {};
  }
  setTeams(teams);
  setBuildingPlots({ ...DEFAULT_PLOT_OF, ...(gameState.buildingPlots || {}) });
  syncActiveExplorations();
  if (territoryHeroes.length === 0) territoryHeroes.push(generateHero('warrior', 1, 'Ray'));
}
import { ResourceSystem_init, BuildingSystem_init } from './resources-buildings.js'
import { territoryHeroes } from './state.js'

// ═══════════════════════════════════════════════════════════════════
// gameTick — 主循環
// ═══════════════════════════════════════════════════════════════════
export function gameTick() {
  produceTick();
  weatherTick();
  processOrdersTick();
  processHeroTick();
  processPartyCombats();
  processWanderingTick();
  incTerritoryCombatTickCounter();
  checkAchievements();
  // §六 3 城鎮事件:tick 推進 + 隨機觸發
  tickTownEvent();
  renderHUD(); renderBadges();
  if (activePanel && (territoryCombatTickCounter % 5 === 0 || (activePanel === 'map' && territoryCombatTickCounter % 2 === 0))) {
    renderPanel(activePanel);
  }
}
import { activePanel } from './state.js'

// ═══════════════════════════════════════════════════════════════════
// init — 啟動入口
// ═══════════════════════════════════════════════════════════════════
export function init() {
  loadGame();
  applyStateToRuntime();
  bindSettings();
  initScene();
  initFloatCanvas();
  // Offline progress
  const elapsed = Math.floor((Date.now() - (gameState.lastOnline || Date.now())) / 1000);
  // ?skipwelcome=1 — 分享連結 / 開發測試跳過離線收益彈窗
  const skipWelcome = new URLSearchParams(location.search).get('skipwelcome') === '1';
  if (!skipWelcome && elapsed > 60) {
    const capped = Math.min(elapsed, 8 * 3600);
    setPendingOfflineSummary({ seconds: capped, gains: computeOffline(capped) });
    $('modal-welcome-body').innerHTML = offlineModalHtml(getPendingOfflineSummary().gains, capped);
    showModal('modal-welcome');
  }
  checkDaily();
  // ?skiponboard=1 — 分享連結 / 深連結跳過新手導覽(開發測試也方便)
  const skipOnboard = new URLSearchParams(location.search).get('skiponboard') === '1';
  if (!skipOnboard && !settings.onboarded) showModal('modal-onboard');
  checkAchievements();
  renderAll();
  setInterval(gameTick, 1000);
  setInterval(saveGame, 10000);
  window.addEventListener('pagehide', saveGame);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
  window.addEventListener('pointerdown', ensureAudio, { once: true });
  registerSW();
}

