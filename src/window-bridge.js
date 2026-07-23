// src/window-bridge.js — 把所有 inline onclick 引用的函式 re-export 到 window
// index.html 的 78 個 onclick 字串完全不動;此處把每個被引用的函式掛到 window

import { checkDaily, claimDaily, collectOffline } from './meta.js';
import {
  dispatchHero, closeDispatch, openDispatch, openDifficultyModal, dispatchParty,
  redeployAllHeroes, toggleReport, clearReports,
} from './combat.js';
import {
  togglePartyHero, toggleFormation, closePartyDispatch, launchPartyDispatch, partyDispatch,
  addToTeam, removeFromTeam, toggleTeamFormation, dispatchTeam, endTeamRun,
} from './combat-party.js';
import {
  openEquipModal, equipItem, unequipItem, enhanceEquip, closeInventory,
  craftItem, sellItem, sellGear, salvageGear, sellAllCommons, transmuteGear, setPriceTier,
} from './inventory.js';
import {
  closePanel, togglePanel, upgradeBuilding, renderHeroesPanel, renderMapPanel, renderShopGrid, fulfillOrder, openTraditionPicker,
} from './ui.js';
import {
  setCombatSpeed, openSettings, closeSettings, exportSaveCode, importSaveCode,
  doPrestige, doReset, closeOnboard, confirmTraditionPick,
} from './settings-and-init.js';
import {
  advanceClass, trainHero, usePotion, recallHero, recallAllHeroes, recruitWanderingHero,
  rerollTrait,
} from './heroes-stats.js';
import { learnSkill, resetSkills } from './skills.js';
import { dispatchAbyss } from './expeditions.js';
import { pickPlacement, resetBuildingPlots } from './scene.js';
import {
  setHeroSubTab, setSkillTabHeroId, setHeroReportSubTab, setShopFilter,
  heroSubTab, skillTabHeroId, heroReportSubTab, shopFilter, saveGame,
  territoryHeroes, setTerritoryHeroes,
} from './state.js';
import { closeModal } from './util.js';

// 批次掛載到 window
window.checkDaily = checkDaily;
window.claimDaily = claimDaily;
window.collectOffline = collectOffline;
window.dispatchHero = dispatchHero;
window.closeDispatch = closeDispatch;
window.openDispatch = openDispatch;
window.openDifficultyModal = openDifficultyModal;
window.dispatchParty = dispatchParty;
window.redeployAllHeroes = redeployAllHeroes;
window.toggleReport = toggleReport;
window.clearReports = clearReports;
window.togglePartyHero = togglePartyHero;
window.toggleFormation = toggleFormation;
window.closePartyDispatch = closePartyDispatch;
window.launchPartyDispatch = launchPartyDispatch;
window.partyDispatch = partyDispatch;
window.addToTeam = addToTeam;
window.removeFromTeam = removeFromTeam;
window.toggleTeamFormation = toggleTeamFormation;
window.dispatchTeam = dispatchTeam;
window.endTeamRun = endTeamRun;
window.openEquipModal = openEquipModal;
window.equipItem = equipItem;
window.unequipItem = unequipItem;
window.enhanceEquip = enhanceEquip;
window.closeInventory = closeInventory;
window.craftItem = craftItem;
window.sellItem = sellItem;
window.sellGear = sellGear;
window.salvageGear = salvageGear;
window.sellAllCommons = sellAllCommons;
window.transmuteGear = transmuteGear;
window.fulfillOrder = fulfillOrder;
window.setPriceTier = setPriceTier;
window.closePanel = closePanel;
window.togglePanel = togglePanel;
window.upgradeBuilding = upgradeBuilding;
window.renderHeroesPanel = renderHeroesPanel;
window.renderMapPanel = renderMapPanel;
window.renderShopGrid = renderShopGrid;
window.setCombatSpeed = setCombatSpeed;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.exportSaveCode = exportSaveCode;
window.importSaveCode = importSaveCode;
window.doPrestige = doPrestige;
window.doReset = doReset;
window.closeOnboard = closeOnboard;
window.openTraditionPicker = openTraditionPicker;
window.confirmTraditionPick = confirmTraditionPick;
window.advanceClass = advanceClass;
window.trainHero = trainHero;
window.usePotion = usePotion;
window.recallHero = recallHero;
window.recallAllHeroes = recallAllHeroes;
window.recruitWanderingHero = recruitWanderingHero;
window.rerollTrait = rerollTrait;
window.resetSkills = resetSkills;
window.learnSkill = learnSkill;
window.dispatchAbyss = dispatchAbyss;
window.pickPlacement = pickPlacement;
window.resetBuildingPlots = resetBuildingPlots;
window.saveGame = saveGame;
window.closeModal = closeModal;

// 可變狀態變數:getter/setter(讓 onclick 可直接賦值)
Object.defineProperty(window, 'heroSubTab', { get: () => heroSubTab, set: (v) => setHeroSubTab(v), configurable: true });
Object.defineProperty(window, 'skillTabHeroId', { get: () => skillTabHeroId, set: (v) => setSkillTabHeroId(v), configurable: true });
Object.defineProperty(window, 'heroReportSubTab', { get: () => heroReportSubTab, set: (v) => setHeroReportSubTab(v), configurable: true });
Object.defineProperty(window, 'shopFilter', { get: () => shopFilter, set: (v) => setShopFilter(v), configurable: true });
Object.defineProperty(window, 'territoryHeroes', { get: () => territoryHeroes, set: (v) => setTerritoryHeroes(v), configurable: true });
