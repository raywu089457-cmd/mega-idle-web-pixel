// src/window-bridge.js — 把所有 inline onclick 引用的函式 re-export 到 window
// index.html 的 78 個 onclick 字串完全不動;此處把每個被引用的函式掛到 window

import {
  checkDaily, claimDaily,
} from './meta.js';
import {
  dispatchHero, closeDispatch, openDispatch, openDifficultyModal, dispatchParty,
  redeployAllHeroes, redeployAllHeroes as redeployAll,
  toggleReport, clearReports,
} from './combat.js';
import {
  togglePartyHero, toggleFormation, closePartyDispatch, launchPartyDispatch, partyDispatch,
  addToTeam, removeFromTeam, toggleTeamFormation, dispatchTeam, endTeamRun,
} from './combat-party.js';
import {
  openEquipModal, equipItem, unequipItem, enhanceEquip, closeInventory,
  craftItem, sellItem, sellGear, salvageGear, sellAllCommons, fulfillOrder,
  setPriceTier,
} from './inventory.js';
import {
  closePanel, togglePanel, upgradeBuilding, renderHeroesPanel, renderMapPanel,
  setCombatSpeed, openSettings, closeSettings, exportSaveCode, importSaveCode,
  doPrestige, doReset, closeOnboard,
} from './ui.js';
import {
  advanceClass, trainHero, usePotion, recallHero, recallAllHeroes, recruitWanderingHero,
  rerollTrait, canAdvance, resetSkills,
} from './heroes-stats.js';
import { learnSkill, getHeroSkillLevel, canLearnSkill } from './skills.js';
import { dispatchAbyss } from './expeditions.js';
import { pickPlacement, resetBuildingPlots } from './scene.js';
import {
  setHeroSubTab, setSkillTabHeroId, setHeroReportSubTab, setShopFilter,
} from './state.js';
import { collectOffline, saveGame, closeModal } from './settings-and-init.js';

// 簡單 setter 別名(因為 setState 函式在 state.js 內,但 onclick 用的是直接賦值)
function _setHeroSubTab(v) { setHeroSubTab(v); }
function _setSkillTabHeroId(v) { setSkillTabHeroId(v); }
function _setHeroReportSubTab(v) { setHeroReportSubTab(v); }
function _setShopFilter(v) { setShopFilter(v); }

// ─── window re-export 集中清單 ───
// eslint-disable-next-line no-unused-vars
const BRIDGE = {
  // 戰鬥
  dispatchHero, closeDispatch, openDispatch, openDifficultyModal, dispatchParty, redeployAllHeroes,
  // 組隊
  togglePartyHero, toggleFormation, closePartyDispatch, launchPartyDispatch, partyDispatch,
  addToTeam, removeFromTeam, toggleTeamFormation, dispatchTeam, endTeamRun,
  // 庫存 / 裝備
  openEquipModal, equipItem, unequipItem, enhanceEquip, closeInventory,
  craftItem, sellItem, sellGear, salvageGear, sellAllCommons, fulfillOrder, setPriceTier,
  // UI
  closePanel, togglePanel, upgradeBuilding, renderHeroesPanel, renderMapPanel,
  setCombatSpeed, openSettings, closeSettings, exportSaveCode, importSaveCode,
  doPrestige, doReset, closeOnboard,
  // 獵人
  advanceClass, trainHero, usePotion, recallHero, recallAllHeroes, recruitWanderingHero,
  rerollTrait, resetSkills,
  // 技能
  learnSkill,
  // 深淵
  dispatchAbyss,
  // 場景
  pickPlacement, resetBuildingPlots,
  // 進度
  checkDaily, claimDaily, collectOffline, clearReports, toggleReport,
  // 狀態 setter(給 inline onclick 用)
  heroSubTab: undefined,             // 由 setHeroSubTab 設定,以下同理
  skillTabHeroId: undefined,
  heroReportSubTab: undefined,
  shopFilter: undefined,
  // 其它
  saveGame, closeModal,
};
// 將可變的狀態變數綁到 window getter/setter(讓 onclick 可直接賦值)
Object.defineProperty(window, 'heroSubTab', { get: () => _getHeroSubTab(), set: (v) => _setHeroSubTab(v), configurable: true });
Object.defineProperty(window, 'skillTabHeroId', { get: () => _getSkillTabHeroId(), set: (v) => _setSkillTabHeroId(v), configurable: true });
Object.defineProperty(window, 'heroReportSubTab', { get: () => _getHeroReportSubTab(), set: (v) => _setHeroReportSubTab(v), configurable: true });
Object.defineProperty(window, 'shopFilter', { get: () => _getShopFilter(), set: (v) => _setShopFilter(v), configurable: true });

// 同步 setter → window 同步
import { heroSubTab as _heroSubTab, skillTabHeroId as _skillTabHeroId, heroReportSubTab as _heroReportSubTab, shopFilter as _shopFilter } from './state.js';
function _getHeroSubTab() { return _heroSubTab; }
function _getSkillTabHeroId() { return _skillTabHeroId; }
function _getHeroReportSubTab() { return _heroReportSubTab; }
function _getShopFilter() { return _shopFilter; }

// 批次掛載函式
for (const [k, v] of Object.entries(BRIDGE)) {
  if (typeof v === 'function') window[k] = v;
}
