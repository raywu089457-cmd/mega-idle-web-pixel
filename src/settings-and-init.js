// src/settings-and-init.js — L2 設定 + 存檔 import/export + applyStateToRuntime + init/gameTick
// 從 index.html L3871-4007 搬出
// 注意:applyStateToRuntime 原本在 state.js,但需 import 太多 L2,在這裡組合

import { $, esc, showModal, hideModal, showToast, setActivePanel as _setActivePanel, fmt, todayKey } from './util.js';
import { sfx } from './audio.js';
import { saveGame, loadGame, migrateSave, getDefaultGameState, defaultMapProgress, SETTINGS, gameState, setGameState as _setGameState, setResources, setBuildingStates, setMapProgress, setShopStock, setPriceMult, setActiveExplorations, setBattleReports, setStats, setAchievementsUnlocked, setPrestige, setDaily, setSettings, setWeather, setCraftOrders, setTeams, setBuildingPlots, setShopInventory, setGearInventory, setNextWanderingSpawnIn, setPotionShopAutoProduce, setTerritoryHeroes, setWanderingHeroes, setResetting, setPendingOfflineSummary, getStateResetting, territoryCombatTickCounter, incTerritoryCombatTickCounter, buildingPlots as _buildingPlots, defaultBuildings } from './state.js';
import { syncActiveExplorations, normalizeHero, generateHero, finalBossDefeated, getPrestigeGain } from './heroes-stats.js';
import { defaultTeams } from './combat-party.js';
import { renderAll, renderHUD, renderBadges, renderPanel, openPanel, closePanel, renderBuildingsPanel, renderSpeedBtns, setCombatSpeed, exportSaveCode, importSaveCode, doPrestige, checkDaily, upgradeBuilding, renderResourcesPanel, renderHeroesPanel, renderMapPanel, renderShopPanel, renderAchPanel, bindSettings } from './ui.js';
import { SAVE_KEY, getDefaultGameState as _getDefaultGameState, setGameState } from './state.js';
import { checkAchievements, collectOffline, computeOffline, offlineModalHtml, claimDaily, produceTick, checkDaily as _checkDaily, finalBossDefeated as _finalBossDefeated, getPrestigeGain as _getPrestigeGain } from './meta.js';
import { processHeroTick, openDispatch, openDifficultyModal, dispatchHero, processPartyCombats } from './combat.js';
import { startAbyssCombat, finishAbyssCombat, spawnWanderingHero, processWanderingTick, weatherTick } from './expeditions.js';
import { initScene, drawScene, initFloatCanvas } from './scene.js';
import { gameState as _gs } from './state.js';
import { DEFAULT_PLOT_OF } from './data.js';
import { ensureAudio } from './audio.js';

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
import { settings } from './state.js';
export function closeSettings() { saveGame(); hideModal('modal-settings'); }
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
export function registerSW() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch(() => { });
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
  const { ResourceSystem_init } = require_resources_buildings();
  ResourceSystem_init(gameState);
  const { BuildingSystem_init } = require_resources_buildings();
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
      if (teamSeen.has(id) || !territoryHeroesRef().some(h => h.id === id)) return false;
      teamSeen.add(id); return true;
    }).slice(0, 4);
    t.formation = t.formation || {};
  }
  setTeams(teams);
  setBuildingPlots({ ...DEFAULT_PLOT_OF, ...(gameState.buildingPlots || {}) });
  syncActiveExplorations();
  if (territoryHeroesRef().length === 0) territoryHeroesRef().push(generateHero('warrior', 1, 'Ray'));
}
import { ResourceSystem_init, BuildingSystem_init } from './resources-buildings.js';
import { territoryHeroes as territoryHeroesRef, teams as teamsRef, setTeams as setTeamsRef, setTerritoryHeroes as setTerritoryHeroesRef } from './state.js';
function require_resources_buildings() { return { ResourceSystem_init, BuildingSystem_init }; }

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
  renderHUD(); renderBadges();
  if (activePanel && (territoryCombatTickCounter % 5 === 0 || (activePanel === 'map' && territoryCombatTickCounter % 2 === 0))) {
    renderPanel(activePanel);
  }
}
import { activePanel } from './state.js';
import { processOrdersTick } from './ui.js';

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
  if (elapsed > 60) {
    const capped = Math.min(elapsed, 8 * 3600);
    setPendingOfflineSummary({ seconds: capped, gains: computeOffline(capped) });
    $('modal-welcome-body').innerHTML = offlineModalHtml(getPendingOfflineSummary().gains, capped);
    showModal('modal-welcome');
  }
  checkDaily();
  if (!settings.onboarded) showModal('modal-onboard');
  checkAchievements();
  renderAll();
  setInterval(gameTick, 1000);
  setInterval(saveGame, 10000);
  window.addEventListener('pagehide', saveGame);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
  window.addEventListener('pointerdown', ensureAudio, { once: true });
  registerSW();
}
import { setPendingOfflineSummary, getPendingOfflineSummary } from './state.js';
