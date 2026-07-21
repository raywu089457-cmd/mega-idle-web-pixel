// src/meta.js — L2 進度/離線/每日/成就
// 從 index.html L2563-2690 搬出(doPrestige 移到 settings-and-init.js 避免循環)
// 注意:renderAll 不在這裡呼叫;由 caller (init / onclick) 負責
// 注意:bonus aggregation (getXpMultiplier 等) 在 bonuses.js

import { ACHIEVEMENTS, DIFF_LABELS, HERO_CLASSES, ITEMS, MATERIAL_TYPES, ZONES, RESOURCES } from './data.js'
import { achievementsUnlocked, daily, mapProgress, pendingDailyReward, pendingOfflineSummary, potionShopAutoProduce, potionShopTickCounter, gearTickCounter, shopStock, territoryHeroes, stats, setPotionShopAutoProduce, incPotionShopTickCounter, incGearTickCounter, setPendingDailyReward, setDaily, setPendingOfflineSummary } from './state.js'
import { BuildingSystem_getLevel, BuildingSystem_getPotionProduction, BuildingSystem_getTotalLevels, BuildingSystem_getGoldRate, ResourceSystem_add, gainGold } from './resources-buildings.js'
import { $, esc, fmt, todayKey, yesterdayKey, showToast, hideModal, showModal } from './util.js'
import { sfx } from './audio.js'
// combat.js 與 inventory.js 為 forward ref(只 call 進函式內,無模組層級使用)
// 實際型別由 main.js 在 init 前先 import,確保 ES module graph 完整
function spawnFloatText(text, x, y, color) { impls.spawnFloat?.(text, x, y, color); }

// ═══════════════════════════════════════════════════════════════════
// PRODUCTION TICK
// ═══════════════════════════════════════════════════════════════════
export function produceTick() {
  const mon = BuildingSystem_getLevel('monument');
  const mult = getMaterialMultiplier();
  for (const mat of MATERIAL_TYPES) {
    const wMult = (mat === 'herbLow' && weather.type === 'rain') ? 1.2 : 1;
    ResourceSystem_add(mat, Math.max(1, Math.round(rand(1, 3) * mon * mult * wMult)));
  }
  const goldRate = BuildingSystem_getGoldRate();
  if (goldRate > 0) gainGold(Math.max(1, Math.round(goldRate * (weather.type === 'snow' ? 0.9 : 1))));
  if (potionShopAutoProduce && BuildingSystem_getLevel('potionShop') > 0) {
    incPotionShopTickCounter();
    const p = BuildingSystem_getPotionProduction();
    if (potionShopTickCounter >= p.ticks) {
      incPotionShopTickCounter(-potionShopTickCounter);
      // 一半入村莊倉庫（玩家用）、一半上架賣給獵人（村莊金庫收入來源）
      addItem('healthPotion', p.amount);
      shopStock.healthPotion = Math.min(potionStockCap(), shopStock.healthPotion + p.amount);
    }
  }
  if (BuildingSystem_getLevel('weaponShop') > 0) {
    incGearTickCounter();
    if (gearTickCounter >= 18) { incGearTickCounter(-gearTickCounter); shopStock.gear = Math.min(gearStockCap(), shopStock.gear + 1); }
  }
}

// ─── 注入 addItem / potionStockCap / gearStockCap (來自 inventory.js, 晚綁) ───
import { addItem, potionStockCap, gearStockCap } from './inventory.js'

// ═══════════════════════════════════════════════════════════════════
// OFFLINE
// ═══════════════════════════════════════════════════════════════════
export function computeOffline(seconds) {
  const eff = 0.5, mon = BuildingSystem_getLevel('monument'), mult = getMaterialMultiplier();
  const gains = { gold: Math.round(BuildingSystem_getGoldRate() * seconds * eff), magicStones: 0 };
  for (const mat of MATERIAL_TYPES) gains[mat] = Math.round(2 * mon * seconds * eff * mult);
  if (BuildingSystem_getLevel('potionShop') > 0) {
    const p = BuildingSystem_getPotionProduction();
    gains.healthPotion = Math.floor(seconds / p.ticks) * p.amount;
  }
  return gains;
}

export function offlineModalHtml(gains, seconds) {
  const mins = Math.floor(seconds / 60);
  const rows = Object.entries(gains).filter(([, v]) => v > 0).map(([k, v]) => {
    const conf = k === 'healthPotion' ? ITEMS.healthPotion : RESOURCES[k];
    return `<div class="offline-item"><span class="offline-label">${conf.icon} ${conf.name}</span><span class="offline-val">+${fmt(v)}</span></div>`;
  }).join('');
  const exploringHeroes = territoryHeroes.filter(h => h.status === 'exploring');
  const expHtml = exploringHeroes.length ? `<div style="margin-top:8px;"><div class="section-label">⚔ 離線遠征（${exploringHeroes.length} 位獵人探索中）</div>${exploringHeroes.map(h => { const z = getZone(h.exploreZoneId); return `<div class="offline-item"><span class="offline-label">${HERO_CLASSES[h.class].icon} ${esc(h.name)}</span><span class="offline-val">${z ? z.icon + ' ' + z.name : ''}・${DIFF_LABELS[h.exploreDifficulty] || ''}</span></div>`; }).join('')}<div style="font-size:11px;color:var(--text-faint);padding:4px 0;">離線時自動結算，最多 8 小時</div></div>` : '';
  return `<div style="text-align:center;font-size:13px;color:var(--text-dim);">離線約 ${mins} 分鐘，獵魔村以 50% 效率持續運作</div>${rows || '<div class="empty-state">沒有可收取資源</div>'}${expHtml}`;
}

export function collectOffline() {
  if (pendingOfflineSummary) {
    for (const [k, v] of Object.entries(pendingOfflineSummary.gains)) {
      if (k === 'healthPotion') addItem('healthPotion', v);
      else if (k === 'gold') gainGold(v); else ResourceSystem_add(k, v);
    }
    // 離線遠征結算：探索中的獵人自動結算（最多 8 小時）
    const expeditionLines = [];
    for (const hero of territoryHeroes.filter(h => h.status === 'exploring')) {
      const zone = getZone(hero.exploreZoneId); if (!zone) continue;
      const isBoss = hero.exploreDifficulty === 'boss';
      const cfg = isBoss ? zone.boss : zone.difficulties[hero.exploreDifficulty];
      // 每 30 秒 = 1 場戰鬥，上限取決於離線秒數，最多 8 小時 = 960 秒 = 32 場
      const maxBattles = Math.floor(pendingOfflineSummary.seconds / 30);
      const battles = Math.min(maxBattles, 24);
      let g = 0, x = 0, ms = 0, wins = 0, drops = [];
      for (let i = 0; i < battles; i++) {
        const enemyTemplate = isBoss ? zone.boss : choice(cfg.enemies);
        const res = runCombat(hero, enemyTemplate, { boss: isBoss, goldRange: cfg.goldRange, magicStoneChance: cfg.magicStoneChance, xp: cfg.xp, drops: cfg.drops, element: zone.element });
        if (res.won) {
          wins += 1; g += res.rewards.gold; x += res.rewards.xp; ms += res.rewards.magicStones;
          if (res.rewards.drops) drops.push(...res.rewards.drops);
        } else {
          // 失敗後不中斷，繼續下一場（疲勞累計但離線不計算）
          break;
        }
      }
      if (battles > 0) {
        const dropStr = drops.length ? `・掉落 ${drops.slice(0, 3).join('')}` : '';
        expeditionLines.push(`${hero.name} ${wins}/${battles} 勝（+${g}🪙 +${x}XP${ms ? ' +' + ms + '💠' : ''}）${dropStr}`);
        hero.explorationProgress = Math.min(99, (hero.explorationProgress || 0) + wins * 20);
      }
    }
    spawnFloatText('✦ 離線收益已收取', window.innerWidth / 2, window.innerHeight / 2, '#f4d03f');
    if (expeditionLines.length) {
      showToast(`⚔ 離線遠征結算：${expeditionLines.join('、')}`, 'info');
    }
    sfx('gold');
  }
  setPendingOfflineSummary(null); hideModal('modal-welcome');
}

// ═══════════════════════════════════════════════════════════════════
// DAILY
// ═══════════════════════════════════════════════════════════════════
export function checkDaily() {
  const today = todayKey();
  if (daily.lastClaim === today) return;
  const nextStreak = daily.lastClaim === yesterdayKey() ? daily.streak + 1 : 1;
  // MILESTONE BONUSES (retention hooks): 7d/14d/30d/60d/100d reward big chunks
  const milestones = {
    7:  { gold: 500, magicStones: 5, potion: 5, extra: '🧪 5瓶藥水 + 5魔核' },
    14: { gold: 1000, magicStones: 10, potion: 10, extra: '🌟 雙倍獎勵週' },
    30: { gold: 2000, magicStones: 30, potion: 20, extra: '👑 月度大獎' },
    60: { gold: 4000, magicStones: 60, potion: 40, extra: '💎 雙月獎勵' },
    100:{ gold: 8000, magicStones: 150, potion: 100, extra: '🏆 百日傳奇' },
  };
  const milestone = milestones[nextStreak];
  const baseGold = 150 + nextStreak * 60;
  const baseMs = nextStreak % 3 === 0 ? 1 : 0;
  const basePotion = 1 + Math.floor(nextStreak / 2);
  const reward = {
    streak: nextStreak,
    gold: baseGold + (milestone?.gold || 0),
    magicStones: baseMs + (milestone?.magicStones || 0),
    potion: basePotion + (milestone?.potion || 0),
    milestone: milestone?.extra || null,
  };
  setPendingDailyReward(reward);
  let html = `<div style="text-align:center;font-size:13px;color:var(--text-dim);">連續登入第 ${nextStreak} 天</div>`;
  if (milestone) html += `<div style="text-align:center;color:var(--golden-wheat);font-weight:bold;margin-top:8px;">🎉 ${milestone.extra}！</div>`;
  html += `<div class="offline-item"><span class="offline-label">🪙 金幣</span><span class="offline-val">+${reward.gold}</span></div>
<div class="offline-item"><span class="offline-label">💠 魔核</span><span class="offline-val">+${reward.magicStones}</span></div>
<div class="offline-item"><span class="offline-label">🧪 藥水</span><span class="offline-val">+${reward.potion}</span></div>`;
  $('modal-daily-body').innerHTML = html;
  showModal('modal-daily');
}

export function claimDaily() {
  if (!pendingDailyReward) { hideModal('modal-daily'); return; }
  gainGold(pendingDailyReward.gold);
  if (pendingDailyReward.magicStones > 0) ResourceSystem_add('magicStones', pendingDailyReward.magicStones);
  if (pendingDailyReward.potion > 0) addItem('healthPotion', pendingDailyReward.potion);
  setDaily({ ...daily, lastClaim: todayKey(), streak: pendingDailyReward.streak, bestStreak: Math.max(daily.bestStreak, pendingDailyReward.streak) });
  setPendingDailyReward(null); hideModal('modal-daily'); sfx('daily'); showToast('每日獎勵已領取！', 'success');
}

// ═══════════════════════════════════════════════════════════════════
// ACHIEVEMENTS / PRESTIGE
// ═══════════════════════════════════════════════════════════════════
export function achievementContext() { return { totalBuildingLevels: BuildingSystem_getTotalLevels(), dailyBestStreak: daily.bestStreak }; }
export function checkAchievements() {
  const ctx = achievementContext();
  for (const a of ACHIEVEMENTS) {
    if (achievementsUnlocked[a.id]) continue;
    if (a.check(stats, ctx)) { achievementsUnlocked[a.id] = Date.now(); sfx('ach'); showToast(`🏆 成就解鎖：${a.name}`, 'success'); }
  }
}
export function unlockedAchCount() { return Object.keys(achievementsUnlocked).length; }
export function finalBossDefeated() { return !!mapProgress.zoneProgress[ZONES[ZONES.length - 1].id]?.bossDefeated; }
export function getPrestigeGain() {
  const heroLevels = territoryHeroes.reduce((s, h) => s + h.level, 0);
  return Math.max(1, 1 + Math.floor(heroLevels / 30) + Math.floor(unlockedAchCount() / 6));
}

// ─── forward refs (晚綁,避免 import 循環) ───
import { rand, choice } from './util.js'
import { weather, impls } from './state.js'
import { getMaterialMultiplier, getCombatGoldMultiplier, getXpMultiplier, getAchievementBonuses } from './bonuses.js'
import { runCombat, getZone } from './combat.js'
