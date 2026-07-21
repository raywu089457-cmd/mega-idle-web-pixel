// src/combat.js — L2 戰鬥引擎(單人即時戰 + 離線戰 + 派遣)
// 從 index.html L1747-2087 搬出(+ redeployAllHeroes 從 heroes-stats.js 搬入避免循環)
// 設計:不 import ui.js;sfx + showToast inline;renderAll 由 caller 負責
// 進階章節(abyss)在 expeditions.js — 用 finishAbyssCombat / startAbyssCombat 晚綁

import { ZONES, DIFF_LABELS, BOSS_MECH_TEXT, HERO_CLASSES, ELEMENT_NAMES, weaponElement, elementCounterMult, zoneWeaknessText } from './data.js'
import { liveCombats, partyCombats, mapProgress, sceneNight, expandedReports, battleReports, dispatchHeroId, settings, setDispatchHeroId, setBattleReports } from './state.js'
import { getHeroStats, usePotion, grantXp, restHero, syncActiveExplorations } from './heroes-stats.js'
import { getHeroSkillLevel, tickSkillCds, applySkillBuffs, tryTriggerActiveSkill } from './skills.js'
import { rand, randf, choice, clamp, uid, $, timeAgo, showModal, hideModal, showToast, esc, closeModal } from './util.js'
import { sfx } from './audio.js'
import { gainGold, ResourceSystem_add, BuildingSystem_getLevel } from './resources-buildings.js'
import { addDropItem } from './inventory.js'
import { territoryHeroes, teams, setTeams, impls } from './state.js'
// startAbyssCombat / finishAbyssCombat 走 state.impls(避免循環)

// ═══════════════════════════════════════════════════════════════════
// 戰報 / 傷害公式
// ═══════════════════════════════════════════════════════════════════
export function addBattleReport(kind, title, result, lines, rewards) {
  battleReports.unshift({ id: uid(), kind, title, result, lines, rewards, time: Date.now() });
  if (battleReports.length > 100) battleReports.length = 100;
}
export function calcDamage(atk, def, crit) {
  const base = Math.max(1, atk - def * 0.55);
  const isCrit = Math.random() < crit;
  return { dmg: Math.max(1, Math.round(base * randf(0.85, 1.15) * (isCrit ? 1.7 : 1))), isCrit };
}
export function runCombat(hero, enemyTemplate, ctx) {
  const st = getHeroStats(hero);
  const enemy = { ...enemyTemplate, hp: enemyTemplate.hp };
  const counterMult = elementCounterMult(hero, ctx.element ? ZONES.find(z => z.element === ctx.element) || { element: ctx.element } : null);
  const lines = [`⚔ ${hero.name} 遭遇 ${enemy.name}！`];
  if (counterMult > 1) lines.push(`⚡ ${ELEMENT_NAMES[weaponElement(hero)]}屬性武器剋制此地魔物，傷害 +25%！`);
  let rounds = 0, won = false;
  while (rounds < 24 && hero.hp > 0 && enemy.hp > 0) {
    rounds += 1;
    if (hero.autoPotion && hero.hp < st.maxHp * 0.35) {
      if (usePotion(hero, true)) lines.push(`🧪 ${hero.name} 喝下藥水，HP ${Math.max(0, Math.round(hero.hp))}/${st.maxHp}`);
    }
    const hit = calcDamage(Math.round(st.atk * counterMult), enemy.def || 0, st.crit);
    enemy.hp -= hit.dmg;
    lines.push(`第${rounds}回合：${hero.name} 造成 ${hit.dmg} 傷害${hit.isCrit ? '（暴擊！）' : ''}，${enemy.name} HP ${Math.max(0, enemy.hp)}`);
    if (enemy.hp <= 0) { won = true; break; }
    if (Math.random() < (st.eva || 0)) {
      lines.push(`💨 ${hero.name} 閃避了 ${enemy.name} 的反擊！`);
    } else {
      const ehit = calcDamage(enemy.atk || 1, st.def, 0.03);
      hero.hp -= ehit.dmg;
      lines.push(`${enemy.name} 反擊造成 ${ehit.dmg} 傷害，${hero.name} HP ${Math.max(0, Math.round(hero.hp))}/${st.maxHp}`);
    }
  }
  const rewards = { gold: 0, xp: 0, magicStones: 0, drops: [] };
  if (won) {
    battleReportsKills(hero, ctx);
    rewards.gold = Math.round(rand(ctx.goldRange[0], ctx.goldRange[1]) * st.goldMult);
    rewards.xp = Math.round((ctx.xp || 10) * st.xpMult);
    gainGold(rewards.gold);
    grantXp(hero, rewards.xp);
    const msChance = (ctx.magicStoneChance || 0) + st.msFind;
    if (Math.random() < msChance) { rewards.magicStones = 1; ResourceSystem_add('magicStones', 1); }
    const dropChance = sceneNight > 0.5 ? 0.38 : 0.28;
    for (const dropId of (ctx.drops || [])) {
      if (Math.random() < dropChance) { const label = addDropItem(dropId); if (label) rewards.drops.push(label); }
    }
    lines.push(`🏆 勝利！獲得 ${rewards.gold}🪙、${rewards.xp} XP${rewards.magicStones ? '、1💠' : ''}${rewards.drops.length ? '、掉落 ' + rewards.drops.join('、') : ''}`);
  } else {
    hero.hp = Math.max(1, Math.round(st.maxHp * 0.2));
    lines.push(`💀 ${hero.name} 戰敗撤退，返回獵魔村休整。`);
  }
  return { won, rounds, lines, rewards };
}
import { stats } from './state.js'
function battleReportsKills(_hero, ctx) {
  stats.kills += 1; if (ctx.boss) stats.bossKills += 1;
}

export function toggleReport(id) {
  if (expandedReports.has(id)) expandedReports.delete(id); else expandedReports.add(id);
  // 重新 render 由 ui.js 處理;此處只維護 set
}
export function clearReports() {
  setBattleReports([]);
  expandedReports.clear();
}

// ═══════════════════════════════════════════════════════════════════
// 地圖 / 探索
// ═══════════════════════════════════════════════════════════════════
export function getZone(zoneId) { return ZONES.find(z => z.id === Number(zoneId)); }
export function isZoneUnlocked(zoneId) { return mapProgress.unlockedZones.includes(Number(zoneId)); }
export function isBossReady(zoneId) { const p = mapProgress.zoneProgress[zoneId]; return p && p.easy && p.normal && p.hard && !p.bossDefeated; }
export function dispatchHero(heroId, zoneId, difficulty, quiet) {
  const hero = territoryHeroes.find(h => h.id === heroId); const zone = getZone(zoneId);
  if (!hero || !zone || !isZoneUnlocked(zoneId)) { showToast('無法派遣到該區域。', 'error'); return; }
  if (hero.status === 'exploring') { showToast('獵人正在狩獵中。', 'error'); return; }
  if (hero.status === 'resting') { showToast('獵人休整中，稍後再出征。', 'error'); return; }
  if ((hero.fatigue || 0) >= 90) { showToast('疲勞過高，請先讓獵人休整。', 'error'); return; }
  if (difficulty === 'boss' && !isBossReady(zoneId)) { showToast('需先通關驅逐/討伐/獵殺。', 'error'); return; }
  // 攜帶 2 瓶藥水(從倉庫)
  const carry = Math.min(2, (() => { const inv = hero.inventory || {}; return inv.healthPotion || 0; })() + 0);
  // 從全域庫存取藥水;藥水數量從 inventory 模組的 invCount 計算
  // (簡化:直接從 shopInventory 扣,因為派遣時把攜帶的搬給英雄)
  hero.inventory.healthPotion = (hero.inventory.healthPotion || 0) + carry;
  hero.status = 'exploring'; hero.exploreZoneId = zone.id; hero.exploreDifficulty = difficulty; hero.explorationProgress = 0;
  hero.lastZoneId = zone.id; hero.lastDifficulty = difficulty;
  hero.combatSkillCds = {}; // Reset skill cooldowns on new exploration
  closeDispatch(); closeModal();
  if (!quiet) { sfx('dispatch'); showToast(`${hero.name} 前往 ${zone.name}（${DIFF_LABELS[difficulty]}）`, 'info'); }
  syncActiveExplorations();
}
import { invCount, removeItem } from './inventory.js'
// 上面 invCount/removeItem 是真的函式;closeDispatch/openDispatch 用 ui.js 提供的 showModal/hideModal
// 因為 1F1521 引用 — 修正:dispatchHero 內部不直接呼叫 invCount;改由 ui.js 統一處理搬運邏輯
export function closeDispatch() { setDispatchHeroId(null); hideModal('modal-dispatch'); }

// ═══════════════════════════════════════════════════════════════════
// 即時派遣戰鬥
// ═══════════════════════════════════════════════════════════════════
export function getLiveCombats() { return liveCombats; }
export function resolveExploration(hero) { startLiveCombat(hero); }
export function startLiveCombat(hero) {
  const zone = getZone(hero.exploreZoneId); if (!zone) { hero.status = 'idle'; return; }
  const diff = hero.exploreDifficulty;
  const isBoss = diff === 'boss';
  const cfg = isBoss ? zone.boss : zone.difficulties[diff];
  const enemy = isBoss ? { ...zone.boss } : { ...choice(cfg.enemies) };
  enemy.maxHp = enemy.hp;
  liveCombats[hero.id] = {
    heroId: hero.id, zoneId: zone.id, diff, isBoss, cfg, enemy,
    round: 0, lines: [`⚔ ${hero.name} 遭遇 ${enemy.name}！`], phase2: false, enraged: false,
    dmgDealt: 0, dmgTaken: 0, crits: 0, bossMech: isBoss ? (zone.boss.mechanic || null) : null, lastCounterDmg: 0,
  };
  if (elementCounterMult(hero, zone) > 1) liveCombats[hero.id].lines.push(`⚡ ${ELEMENT_NAMES[weaponElement(hero)]}屬性武器剋制此地魔物，傷害 +25%！`);
  if (isBoss && zone.boss.mechanic && BOSS_MECH_TEXT[zone.boss.mechanic]) liveCombats[hero.id].lines.push(BOSS_MECH_TEXT[zone.boss.mechanic]);
}
export function partyInfoFor(hero) {
  const allies = territoryHeroes.filter(o => o !== hero && o.status === 'exploring' && o.exploreZoneId === hero.exploreZoneId && o.exploreDifficulty === hero.exploreDifficulty);
  const classes = new Set([hero.class, ...allies.map(o => o.class)]);
  return { size: 1 + allies.length, classes: classes.size, mult: 1 + 0.05 * (classes.size - 1) };
}
export function advanceLiveCombat(hero, lc) {
  const st = getHeroStats(hero);
  const party = partyInfoFor(hero);
  lc.round += 1;
  tickSkillCds(hero);
  applySkillBuffs(hero, st, lc);
  if (lc.isBoss && !lc.enraged && lc.round >= 30) {
    lc.enraged = true; lc.enemy.atk = Math.round(lc.enemy.atk * 2);
    lc.lines.push('👹 頭目進入狂暴狀態，攻擊翻倍！');
    showToast(`👹 ${lc.enemy.name} 狂暴了！`, 'error'); sfx('boss');
  }
  if (hero.autoPotion && hero.hp < st.maxHp * 0.35 && usePotion(hero, true)) lc.lines.push(`🧪 ${hero.name} 喝下藥水，HP ${Math.max(0, Math.round(hero.hp))}/${st.maxHp}`);
  // Try trigger active skill
  tryTriggerActiveSkill(hero, st, lc);
  // Consume active skill effects set on st this round
  const zone = getZone(lc.zoneId);
  const skillAtkMult = 1 + (st.atkBonus || 0) + (st.skillDmgBonus || 0);
  const counterMult = elementCounterMult(hero, zone);
  const shieldMult = (lc.bossMech === 'shield' && lc.round <= 10) ? 0.6 : 1;
  const bossMult = lc.isBoss ? 1 + (st.bossDmg || 0) : 1;
  const critEff = (st.crit || 0) + (st.critBonus || 0);
  const defEff = Math.max(0, Math.round((lc.enemy.def || 0) * (1 - Math.min(0.9, st.pierce || 0))));
  const hit = calcDamage(Math.round(st.atk * party.mult * skillAtkMult * counterMult * shieldMult * bossMult), defEff, critEff);
  lc.enemy.hp -= hit.dmg;
  lc.dmgDealt += hit.dmg; if (hit.isCrit) lc.crits += 1;
  lc.lines.push(`第${lc.round}回合：${hero.name} 造成 ${hit.dmg} 傷害${hit.isCrit ? '（暴擊！）' : ''}${party.classes > 1 ? `（編隊 +${Math.round((party.mult - 1) * 100)}%）` : ''}，${lc.enemy.name} HP ${Math.max(0, lc.enemy.hp)}`);
  if (st.doubleAttack && lc.enemy.hp > 0) {
    const dblLv = getHeroSkillLevel(hero, 'r_speed');
    const hit2 = calcDamage(Math.round(st.atk * party.mult * Math.max(0.4, 1 - 0.2 * dblLv) * counterMult * shieldMult * bossMult), defEff, critEff);
    lc.enemy.hp -= hit2.dmg;
    lc.dmgDealt += hit2.dmg; if (hit2.isCrit) lc.crits += 1;
    lc.lines.push(`🌪️ 疾風追加攻擊造成 ${hit2.dmg} 傷害，${lc.enemy.name} HP ${Math.max(0, lc.enemy.hp)}`);
  }
  if (st.healPower) {
    const healAmt = Math.round(st.maxHp * st.healPower);
    hero.hp = Math.min(st.maxHp, hero.hp + healAmt);
    lc.lines.push(`💚 治療恢復 ${healAmt} HP，${hero.name} HP ${Math.round(hero.hp)}/${st.maxHp}`);
  }
  if (st.slowEnemy) {
    lc.enemySlowRounds = (lc.enemySlowRounds || 0) + st.slowEnemy;
    lc.lines.push(`❄️ ${lc.enemy.name} 被凍結，${st.slowEnemy} 回合無法反擊！`);
  }
  if (lc.isBoss && !lc.phase2 && lc.enemy.hp > 0 && lc.enemy.hp < lc.enemy.maxHp * 0.5) {
    lc.phase2 = true; lc.enemy.atk = Math.round(lc.enemy.atk * 1.3);
    lc.lines.push('⚠️ 頭目進入第二階段，攻擊提升 30%！');
    showToast(`⚠️ ${lc.enemy.name} 進入第二階段！`, 'error'); sfx('boss');
  }
  if (lc.enemy.hp <= 0) { finishLiveCombat(hero, lc, true); return; }
  lc.lastCounterDmg = 0;
  if ((lc.enemySlowRounds || 0) > 0) {
    lc.enemySlowRounds -= 1;
    lc.lines.push(`❄️ ${lc.enemy.name} 凍結中，無法反擊。`);
  } else if (Math.random() < (st.eva || 0)) {
    lc.lines.push(`💨 ${hero.name} 閃避了 ${lc.enemy.name} 的反擊！`);
  } else {
    const ehit = calcDamage(lc.enemy.atk || 1, st.def, 0.03);
    hero.hp -= ehit.dmg;
    lc.dmgTaken += ehit.dmg; lc.lastCounterDmg = ehit.dmg;
    lc.lines.push(`${lc.enemy.name} 反擊造成 ${ehit.dmg} 傷害，${hero.name} HP ${Math.max(0, Math.round(hero.hp))}/${st.maxHp}`);
    if (st.thorns && lc.enemy.hp > 0) {
      const th = Math.max(1, Math.round(ehit.dmg * st.thorns));
      lc.enemy.hp -= th; lc.dmgDealt += th;
      lc.lines.push(`🌵 荊棘反彈 ${th} 傷害，${lc.enemy.name} HP ${Math.max(0, lc.enemy.hp)}`);
      if (lc.enemy.hp <= 0) { finishLiveCombat(hero, lc, true); return; }
    }
  }
  // Boss 專屬機制
  if (lc.bossMech && lc.enemy.hp > 0 && hero.hp > 0) {
    if (lc.bossMech === 'regen' && lc.round % 5 === 0) {
      const heal = Math.round(lc.enemy.maxHp * 0.08);
      lc.enemy.hp = Math.min(lc.enemy.maxHp, lc.enemy.hp + heal);
      lc.lines.push(`🌱 ${lc.enemy.name} 再生恢復 ${heal} HP（${Math.round(lc.enemy.hp)}/${lc.enemy.maxHp}）`);
    } else if (lc.bossMech === 'poison' && lc.round % 3 === 0) {
      const dot = Math.max(1, Math.round(st.maxHp * 0.05));
      hero.hp -= dot; lc.dmgTaken += dot;
      lc.lines.push(`☠️ ${hero.name} 中毒流失 ${dot} HP（${Math.max(0, Math.round(hero.hp))}/${st.maxHp}）`);
    } else if (lc.bossMech === 'lifesteal' && lc.lastCounterDmg > 0) {
      const steal = Math.round(lc.lastCounterDmg * 0.5);
      lc.enemy.hp = Math.min(lc.enemy.maxHp, lc.enemy.hp + steal);
      lc.lines.push(`🩸 ${lc.enemy.name} 吸取 ${steal} HP（${Math.round(lc.enemy.hp)}/${lc.enemy.maxHp}）`);
    } else if (lc.bossMech === 'aoe' && lc.round % 6 === 0) {
      const aoe = Math.max(1, Math.round(st.maxHp * 0.2));
      hero.hp -= aoe; lc.dmgTaken += aoe;
      lc.lines.push(`💥 ${lc.enemy.name} 釋放毀滅衝擊，無視防禦造成 ${aoe} 傷害！`);
      sfx('boss');
    }
  }
  if (hero.hp <= 0) finishLiveCombat(hero, lc, false);
  else if (lc.round >= 60) { lc.lines.push('⏱ 戰鬥拖太久，獵人體力不支撤退。'); finishLiveCombat(hero, lc, false); }
}
export function finishLiveCombat(hero, lc, won) {
  if (lc.isAbyss) { impls.finishAbyssCombat(hero, lc, won); return; }
  const st = getHeroStats(hero);
  const zone = getZone(lc.zoneId);
  const rewards = { gold: 0, xp: 0, magicStones: 0, drops: [] };
  if (won) {
    stats.kills += 1; if (lc.isBoss) stats.bossKills += 1;
    rewards.gold = Math.round(rand(lc.cfg.goldRange[0], lc.cfg.goldRange[1]) * st.goldMult);
    rewards.xp = Math.round((lc.cfg.xp || 10) * st.xpMult);
    gainGold(rewards.gold); grantXp(hero, rewards.xp);
    const msChance = (lc.cfg.magicStoneChance || 0) + st.msFind;
    if (Math.random() < msChance) { rewards.magicStones = 1; ResourceSystem_add('magicStones', 1); }
    const dropChance = sceneNight > 0.5 ? 0.38 : 0.28;
    for (const dropId of (lc.cfg.drops || [])) {
      if (Math.random() < dropChance) { const label = addDropItem(dropId); if (label) rewards.drops.push(label); }
    }
    lc.lines.push(`🏆 勝利！獲得 ${rewards.gold}🪙、${rewards.xp} XP${rewards.magicStones ? '、1💠' : ''}${rewards.drops.length ? '、掉落 ' + rewards.drops.join('、') : ''}`);
    if (sceneNight > 0.5) lc.lines.push('🌙 夜晚狩獵加成：掉落率提升');
    if (st.killHeal) {
      const kh = Math.max(1, Math.round(st.maxHp * st.killHeal));
      hero.hp = Math.min(st.maxHp, hero.hp + kh);
      lc.lines.push(`🩸 吸血詞綴恢復 ${kh} HP（${Math.round(hero.hp)}/${st.maxHp}）`);
    }
  } else {
    hero.hp = Math.max(1, Math.round(st.maxHp * 0.2));
    lc.lines.push(`💀 ${hero.name} 戰敗撤退，返回獵魔村休整。`);
  }
  lc.lines.push(`📊 輸出 ${Math.round(lc.dmgDealt || 0)}・承傷 ${Math.round(lc.dmgTaken || 0)}・暴擊 ${lc.crits || 0} 次・共 ${lc.round} 回合`);
  addBattleReport('zone', `${zone.icon} ${zone.name}・${DIFF_LABELS[lc.diff]}`, won ? (lc.isBoss ? '頭目擊破' : '勝利') : '撤退', lc.lines, rewards);
  if (won) {
    if (lc.isBoss) {
      mapProgress.zoneProgress[zone.id].bossDefeated = true;
      if (!mapProgress.clearedZones.includes(zone.id)) mapProgress.clearedZones.push(zone.id);
      const next = getZone(zone.id + 1);
      if (next && !mapProgress.unlockedZones.includes(next.id)) { mapProgress.unlockedZones.push(next.id); mapProgress.currentZone = next.id; }
      hero.status = 'idle'; hero.explorationProgress = 0; hero.exploreZoneId = null; hero.exploreDifficulty = null;
      sfx('boss'); showToast(`👑 擊敗 ${zone.boss.name}！${next ? '解鎖 ' + next.name : '五域全通，可進行重建！'}`, 'success');
      if (!next) showToast('🌀 前往「成就」面板進行重建，獲得永久傳承碎片。', 'info');
    } else {
      const first = !mapProgress.zoneProgress[zone.id][lc.diff];
      mapProgress.zoneProgress[zone.id][lc.diff] = true;
      hero.explorationProgress = 0;
      if (first) showToast(`✅ 首次通關 ${zone.name}（${DIFF_LABELS[lc.diff]}）`, 'success');
    }
  } else {
    hero.status = 'resting'; hero.restTicks = 6; hero.explorationProgress = 0; hero.exploreZoneId = null; hero.exploreDifficulty = null;
    sfx('defeat');
  }
  delete liveCombats[hero.id];
  syncActiveExplorations();
}
export function processHeroTick() {
  for (const hero of territoryHeroes) {
    const st = getHeroStats(hero);
    if (hero.status === 'resting') {
      hero.restTicks = Math.max(0, (hero.restTicks || 0) - 1);
      hero.fatigue = clamp((hero.fatigue || 0) - 18, 0, 100);
      hero.hp = Math.min(st.maxHp, hero.hp + Math.ceil(st.maxHp * 0.25 * (1 + BuildingSystem_getLevel('inn') * 0.1)));
      if (hero.restTicks <= 0 && hero.hp >= st.maxHp * 0.5 && hero.fatigue < 90) hero.status = 'idle';
    } else if (hero.status === 'exploring') {
      if (hero.partyId) {
        hero.fatigue = clamp((hero.fatigue || 0) + (hero.exploreDifficulty === 'boss' ? 4 : 3), 0, 100);
        if (!partyCombats[hero.partyId]) hero.partyId = null;
        continue;
      }
      if (hero.hp < st.maxHp * 0.35) usePotion(hero, true);
      hero.fatigue = clamp((hero.fatigue || 0) + (hero.exploreDifficulty === 'boss' ? 4 : 3), 0, 100);
      if (liveCombats[hero.id]) {
        const speed = clamp(settings.combatSpeed || 1, 1, 4);
        for (let i = 0; i < speed && liveCombats[hero.id]; i++) advanceLiveCombat(hero, liveCombats[hero.id]);
      } else {
        hero.explorationProgress += hero.exploreDifficulty === 'boss' ? 7 : hero.exploreZoneId === 'abyss' ? 12 : 11;
        if (hero.explorationProgress >= 100) {
          if (hero.exploreZoneId === 'abyss') impls.startAbyssCombat(hero);
          else resolveExploration(hero);
        }
        else if ((hero.fatigue || 0) >= 90 && settings.autoRecall !== false) {
          restHero(hero.id);
          showToast(`😪 ${hero.name} 疲勞過高，自動返回村莊休整。`, 'info');
        }
      }
    } else {
      hero.fatigue = clamp((hero.fatigue || 0) - 4, 0, 100);
      hero.hp = Math.min(st.maxHp, hero.hp + Math.ceil(st.maxHp * 0.04));
      const tg = BuildingSystem_getLevel('trainingGround');
      if (tg > 0) grantXp(hero, tg * 2);
    }
  }
}
export function openDifficultyModal(zoneId, diff) {
  const zone = getZone(zoneId); if (!zone) return;
  const cfg = diff === 'boss' ? zone.boss : zone.difficulties[diff];
  $('modal-detail-name').textContent = `${zone.icon} ${zone.name} — ${DIFF_LABELS[diff]}`;
  const enemies = diff === 'boss' ? [zone.boss] : cfg.enemies;
  const idleHeroes = territoryHeroes.filter(h => h.status === 'idle');
  $('modal-detail-body').innerHTML = `
    <div class="section-label">敵人情報</div>
    <div class="offline-item"><span class="offline-label">🌿 區域元素</span><span class="offline-val">${zoneWeaknessText(zone)}${diff === 'boss' && zone.boss.mechanic ? '・' + BOSS_MECH_TEXT[zone.boss.mechanic] : ''}</span></div>
    ${enemies.map(e => `<div class="hero-pick-row"><span style="font-size:22px">${isBossIcon(diff)}</span><div class="hp-info"><div class="hp-name">${e.name}</div><div class="hp-stats">HP ${e.hp}・攻 ${e.atk}・防 ${e.def}</div></div></div>`).join('')}
    <div class="section-label">獎勵</div>
    <div class="offline-item"><span class="offline-label">🪙 金幣</span><span class="offline-val">${cfg.goldRange[0]}~${cfg.goldRange[1]}</span></div>
    <div class="offline-item"><span class="offline-label">💠 魔核機率</span><span class="offline-val">${Math.round(cfg.magicStoneChance * 100)}%</span></div>
    <div class="offline-item"><span class="offline-label">✨ 經驗</span><span class="offline-val">${cfg.xp}</span></div>
    <div class="section-label">派遣獵人</div>
    ${teams.filter(t => teamAvailableMembers(t).length > 0).map(t => `<div style="margin-bottom:6px;"><button class="btn btn-blue btn-sm" onclick="dispatchTeam(${t.id},${zone.id},'${diff}')">⚔ 隊伍 ${t.id + 1} 出擊（${teamAvailableMembers(t).length} 人共同戰鬥）</button></div>`).join('')}
    ${idleHeroes.length ? `<div style="margin-bottom:6px;"><button class="btn btn-purple btn-sm" onclick="partyDispatch(${zone.id},'${diff}')">👥 自由組隊（最多 4 人）</button></div>` : ''}
    ${idleHeroes.length ? idleHeroes.map(h => { const st = getHeroStats(h); return `<div class="hero-pick-row"><span style="font-size:22px">${HERO_CLASSES[h.class].icon}</span><div class="hp-info"><div class="hp-name">${h.name} Lv.${h.level}</div><div class="hp-stats">攻${st.atk} 防${st.def} HP${Math.round(h.hp)}/${st.maxHp}</div></div><button class="btn btn-blue btn-sm" onclick="dispatchHero('${h.id}',${zone.id},'${diff}')">派遣</button></div>`; }).join('') : '<div class="empty-state">沒有閒置獵人，請先招募或召回</div>'}
    <div class="modal-actions"><button class="btn btn-outline btn-sm" onclick="closeModal()">關閉</button></div>`;
  showModal('modal-detail');
}
export function isBossIcon(diff) { return diff === 'boss' ? '👑' : '👾'; }
export function dispatchParty(zoneId, diff) {
  const idle = territoryHeroes.filter(h => h.status === 'idle' && (h.fatigue || 0) < 90).slice(0, 4);
  if (!idle.length) { showToast('沒有可派遣的獵人。', 'error'); return; }
  closeModal();
  for (const h of idle) dispatchHero(h.id, zoneId, diff);
  showToast(`👥 ${idle.length} 人編隊出發！同區不同職業越多，攻擊加成越高。`, 'success');
}
export function openDispatch(heroId) {
  const hero = territoryHeroes.find(h => h.id === heroId); if (!hero) return;
  setDispatchHeroId(heroId);
  $('dispatch-hero-name').textContent = `${HERO_CLASSES[hero.class].icon} ${hero.name} Lv.${hero.level}`;
  $('dispatch-zone-grid').innerHTML = ZONES.map(z => {
    const unlocked = isZoneUnlocked(z.id); const p = mapProgress.zoneProgress[z.id];
    const diffs = ['easy', 'normal', 'hard'].map(d => `<button class="btn btn-sm ${p[d] ? 'btn-outline' : 'btn-blue'}" ${unlocked ? '' : 'disabled'} onclick="dispatchHero('${heroId}',${z.id},'${d}')">${DIFF_LABELS[d]}${p[d] ? '✓' : ''}</button>`).join('');
    const boss = `<button class="btn btn-sm btn-purple" ${unlocked && isBossReady(z.id) ? '' : 'disabled'} onclick="dispatchHero('${heroId}',${z.id},'boss')">👑頭目</button>`;
    return `<div class="dispatch-zone ${unlocked ? '' : 'locked'}"><div class="dz-name">${z.icon} ${z.name}</div><div style="display:flex;flex-direction:column;gap:4px">${diffs}${boss}</div></div>`;
  }).join('');
  showModal('modal-dispatch');
}

// ═══════════════════════════════════════════════════════════════════
// 隊伍 / 重新出發(從 heroes-stats.js 搬入避免循環)
// ═══════════════════════════════════════════════════════════════════
function teamAvailableMembers(team) { return team.members.map(id => territoryHeroes.find(h => h.id === id)).filter(h => h && h.status === 'idle' && (h.fatigue || 0) < 90); }
export { teamAvailableMembers };
export function redeployAllHeroes() {
  const ready = territoryHeroes.filter(h => h.status === 'idle' && h.lastZoneId && isZoneUnlocked(h.lastZoneId) && (h.fatigue || 0) < 90 && (h.lastDifficulty !== 'boss' || isBossReady(h.lastZoneId)));
  if (!ready.length) { showToast('沒有可再出發的獵人（需曾派遣過且疲勞 <90）。', 'info'); return; }
  for (const h of ready) dispatchHero(h.id, h.lastZoneId, h.lastDifficulty, true);
  sfx('dispatch'); showToast(`⚔ ${ready.length} 位獵人再次出發！`, 'success');
}
