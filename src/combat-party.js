// src/combat-party.js — L2 組隊戰鬥(共享血條團隊戰 + 常駐隊伍管理)
// 從 index.html L2089-2443 搬出
// 設計:不 import ui.js;sfx + showToast inline;renderAll 由 caller 負責

import { ZONES, DIFF_LABELS, BOSS_MECH_TEXT, elementCounterMult } from './data.js';
import { partyCombats, mapProgress, sceneNight, settings, partyDispatchState, teams, setTeams, setPartyDispatchState } from './state.js';
import { getHeroStats, usePotion, grantXp, syncActiveExplorations } from './heroes-stats.js';
import { getHeroSkillLevel, tickSkillCds, applySkillBuffs, tryTriggerActiveSkill } from './skills.js';
import { getZone, calcDamage, addBattleReport, isBossReady, teamAvailableMembers } from './combat.js';
import { rand, clamp, choice, uid, $, showModal, hideModal, showToast, esc, closeModal } from './util.js';
import { sfx } from './audio.js';
import { gainGold, ResourceSystem_add } from './resources-buildings.js';
import { addDropItem } from './inventory.js';
import { territoryHeroes, stats } from './state.js';
import { checkAchievements } from './meta.js';
import { renderAll, saveGame } from './ui.js'; // late-bind(避免循環;init 順序保證)

function setRenderAllRef(fn) { /* no-op; window-bridge will rebind */ }

// ═══════════════════════════════════════════════════════════════════
// PARTY DISPATCH MODAL (自由組隊選擇)
// ═══════════════════════════════════════════════════════════════════
export function calcPartyPower(heroes) {
  if (!heroes || !heroes.length) return { atk: 0, def: 0, count: 0 };
  let totalAtk = 0, maxDef = 0;
  for (const h of heroes) { const st = getHeroStats(h); totalAtk += st.atk; maxDef = Math.max(maxDef, st.def); }
  const count = heroes.length;
  const atkMult = 1 + 0.1 * (count - 1);
  return { atk: Math.round(totalAtk * atkMult), def: maxDef, count };
}
export function openPartyDispatch(zoneId, diff) {
  setPartyDispatchState({ zoneId, difficulty: diff, selected: [], formation: {} });
  renderPartyDispatchModal();
  showModal('modal-party-dispatch');
}
export function renderPartyDispatchModal() {
  const { zoneId, difficulty, selected } = partyDispatchState;
  const zone = getZone(zoneId);
  const cfg = difficulty === 'boss' ? zone.boss : zone.difficulties[difficulty];
  const idle = territoryHeroes.filter(h => (h.status === 'idle' || h.status === 'exploring') && (h.fatigue || 0) < 90);
  const selectedHeroes = selected.map(id => territoryHeroes.find(h => h.id === id)).filter(Boolean);
  const power = calcPartyPower(selectedHeroes);
  const slotCount = 4;
  const slotsHtml = Array.from({ length: slotCount }, (_, i) => {
    const h = selectedHeroes[i];
    if (h) {
      const pos = (partyDispatchState.formation[h.id] || 'front') === 'back' ? '後' : '前';
      const posColor = pos === '前' ? 'var(--red)' : 'var(--blue)';
      return `<div class="party-slot filled" onclick="togglePartyHero('${h.id}')" title="${h.name}（點「前/後」切換站位）"><span>${HERO_CLASSES_ICON[h.class] || '⚔'}</span><span class="slot-name">${esc(h.name).slice(0, 3)}</span><span style="font-size:9px;color:${posColor};border:1px solid ${posColor};padding:0 3px;cursor:pointer;" onclick="event.stopPropagation();toggleFormation('${h.id}')">${pos}</span></div>`;
    }
    return `<div class="party-slot"><span style="color:var(--text-faint);font-size:20px;">+</span><span class="slot-num">空位</span></div>`;
  }).join('');
  const heroesHtml = idle.map(h => {
    const isSelected = selected.includes(h.id);
    const st = getHeroStats(h);
    return `<div class="party-hero-row ${isSelected ? 'selected' : ''}" onclick="togglePartyHero('${h.id}')">
      <span style="font-size:22px">${HERO_CLASSES_ICON[h.class] || '⚔'}</span>
      <div class="ph-info">
        <div class="ph-name">${esc(h.name)} Lv.${h.level}</div>
        <div class="ph-stats">⚔${st.atk} 🛡${st.def} HP${Math.round(h.hp)}/${st.maxHp}</div>
      </div>
      <span class="ph-ap">🗡 AP ${h.skillPoints || 0}</span>
      ${isSelected ? '<span style="color:var(--golden-wheat);font-size:16px;">✓</span>' : ''}
    </div>`;
  }).join('');
  const enemyAtk = difficulty === 'boss' ? zone.boss.atk : Math.max(...(cfg.enemies || []).map(e => e.atk || 0));
  $('party-dispatch-body').innerHTML = `
    <div class="party-header">選擇 1~4 位獵人組隊挑戰 ${zone.icon} ${zone.name}（${DIFF_LABELS[difficulty]}）</div>
    <div class="party-slots">${slotsHtml}</div>
    <div class="party-power">⚔ 編隊總攻擊力 ${power.atk}　🛡 總防禦 ${power.def}　👥 ${power.count} 人</div>
    <div style="text-align:center;font-size:11px;color:var(--text-faint);">前排：70% 機率被敵人鎖定｜後排：受傷 -30%、攻擊 -10%（共享同一隻敵人血條）</div>
    <div class="section-label">選擇獵人（點擊切換）</div>
    <div class="party-heroes">${heroesHtml || '<div class="empty-state">沒有可派遣的獵人</div>'}</div>
    <div class="section-label" style="margin-top:6px;">敵人情報</div>
    <div class="offline-item"><span class="offline-label">👾 ${difficulty === 'boss' ? zone.boss.name : cfg.enemies?.map(e => e.name).join('、') || '怪物'}</span></div>
    <div class="offline-item"><span class="offline-label">⚔ 敵人攻擊</span><span class="offline-val">${enemyAtk}</span></div>
  `;
  const btn = $('btn-launch-party'); if (btn) btn.disabled = selectedHeroes.length === 0;
}
const HERO_CLASSES_ICON = { warrior: '⚔️', mage: '🧙', rogue: '🗡️', archer: '🏹', priest: '✝️', paladin: '🛡️', archmage: '🔯', shadowblade: '🌑', sniper: '🎯', bishop: '👑' };
export function togglePartyHero(heroId) {
  const idx = partyDispatchState.selected.indexOf(heroId);
  if (idx >= 0) {
    partyDispatchState.selected.splice(idx, 1);
    delete partyDispatchState.formation[heroId];
  } else {
    if (partyDispatchState.selected.length >= 4) { showToast('最多 4 位獵人', 'info'); return; }
    partyDispatchState.selected.push(heroId);
    const h = territoryHeroes.find(x => x.id === heroId);
    partyDispatchState.formation[heroId] = (h && (h.class === 'warrior' || h.class === 'priest')) ? 'front' : 'back';
  }
  renderPartyDispatchModal();
}
export function toggleFormation(heroId) {
  partyDispatchState.formation[heroId] = partyDispatchState.formation[heroId] === 'back' ? 'front' : 'back';
  sfx('click');
  renderPartyDispatchModal();
}
export function closePartyDispatch() { hideModal('modal-party-dispatch'); setPartyDispatchState({ zoneId: null, difficulty: null, selected: [], formation: {} }); }
export function launchPartyDispatch() {
  const { zoneId, difficulty, selected, formation } = partyDispatchState;
  if (!selected.length) { showToast('請選擇至少一位獵人', 'error'); return; }
  closePartyDispatch(); closeModal();
  startPartyCombat(selected, zoneId, difficulty, formation);
  showToast(`👥 ${selected.length} 人編隊出發！`, 'success');
}
export function partyDispatch(zoneId, diff) {
  closeModal();
  openPartyDispatch(zoneId, diff);
}

// ═══════════════════════════════════════════════════════════════════
// 常駐隊伍 ×4
// ═══════════════════════════════════════════════════════════════════
export function defaultTeams() { return [0, 1, 2, 3].map(i => ({ id: i, members: [], formation: {} })); }
export function teamById(id) { return teams.find(t => t.id === Number(id)); }
export function heroTeam(heroId) { return teams.find(t => t.members.includes(heroId)) || null; }
export function addToTeam(teamId, heroId) {
  const team = teamById(teamId); const hero = territoryHeroes.find(h => h.id === heroId);
  if (!team || !hero) return;
  if (team.members.length >= 4) { showToast('隊伍最多 4 人。', 'info'); return; }
  if (heroTeam(heroId)) { showToast('該獵人已在其他隊伍。', 'error'); return; }
  if (hero.status !== 'idle') { showToast('獵人必須在村莊待命才能加入隊伍。', 'error'); return; }
  team.members.push(heroId);
  if (!team.formation[heroId]) team.formation[heroId] = (hero.class === 'warrior' || hero.class === 'priest') ? 'front' : 'back';
  sfx('click');
}
export function removeFromTeam(teamId, heroId) {
  const team = teamById(teamId); if (!team) return;
  const hero = territoryHeroes.find(h => h.id === heroId);
  if (hero && hero.partyId) { showToast('出擊中無法調整成員。', 'info'); return; }
  team.members = team.members.filter(id => id !== heroId);
  delete team.formation[heroId];
  sfx('click');
}
export function toggleTeamFormation(teamId, heroId) {
  const team = teamById(teamId); if (!team) return;
  team.formation[heroId] = team.formation[heroId] === 'back' ? 'front' : 'back';
  sfx('click');
}
export function dispatchTeam(teamId, zoneId, diff) {
  const team = teamById(teamId); if (!team) return;
  const members = teamAvailableMembers(team);
  if (!members.length) { showToast('隊伍沒有可出擊的成員（需在村待命且疲勞 <90）。', 'error'); return; }
  if (diff === 'boss' && !isBossReady(zoneId)) { showToast('需先通關驅逐/討伐/獵殺。', 'error'); return; }
  closeModal();
  startPartyCombat(members.map(h => h.id), zoneId, diff, team.formation, team.id);
  showToast(`⚔ 隊伍 ${team.id + 1} 出擊（${members.length} 人）！`, 'success');
}
export function endTeamRun(pc, reason, skipReport) {
  if (!pc) return;
  const members = partyMembers(pc, false);
  for (const h of members) {
    h.partyId = null;
    if (h.hp <= 0) { const st = getHeroStats(h); h.hp = Math.max(1, Math.round(st.maxHp * 0.2)); }
    h.status = 'idle'; h.explorationProgress = 0; h.exploreZoneId = null; h.exploreDifficulty = null;
  }
  pc.lines.push(`🏳 隊伍結束狩獵返回村莊（${reason}）。`);
  if (!skipReport) {
    const zone = getZone(pc.zoneId);
    addBattleReport('zone', `👥 ${zone.icon} ${zone.name}・${DIFF_LABELS[pc.difficulty]}（隊伍 ${pc.teamId + 1}）`, '返回', pc.lines, { gold: 0, xp: 0, magicStones: 0, drops: [] });
  }
  delete partyCombats[pc.id];
  sfx('click'); syncActiveExplorations();
}
export function startPartyNextRound(pc) {
  const enemy = { ...choice(pc.cfg.enemies) };
  enemy.maxHp = enemy.hp;
  pc.enemy = enemy; pc.round = 0; pc.waiting = false; pc.progress = 0; pc.enemySlowRounds = 0;
  pc.streak = (pc.streak || 1) + 1;
  if (pc.lines.length > 60) pc.lines = pc.lines.slice(-30);
  pc.lines.push(`—— 第 ${pc.streak} 場 —— ⚔ 遭遇 ${enemy.name}！`);
  syncActiveExplorations();
}

// ═══════════════════════════════════════════════════════════════════
// 團隊戰鬥(共享血條、輪流出手)
// ═══════════════════════════════════════════════════════════════════
export function startPartyCombat(heroIds, zoneId, difficulty, formation, teamId) {
  const zone = getZone(zoneId); if (!zone) return;
  const isBoss = difficulty === 'boss';
  const cfg = isBoss ? zone.boss : zone.difficulties[difficulty];
  const enemy = isBoss ? { ...zone.boss } : { ...choice(cfg.enemies) };
  enemy.maxHp = enemy.hp;
  const id = 'pc' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  for (const hid of heroIds) {
    const h = territoryHeroes.find(x => x.id === hid); if (!h) continue;
    h.status = 'exploring'; h.exploreZoneId = zone.id; h.exploreDifficulty = difficulty; h.explorationProgress = 0;
    h.lastZoneId = zone.id; h.lastDifficulty = difficulty;
    h.partyId = id; h.combatSkillCds = {};
  }
  partyCombats[id] = {
    id, heroIds: heroIds.slice(), zoneId: zone.id, difficulty, isBoss, cfg, enemy,
    round: 0, lines: [`⚔ 編隊遭遇 ${enemy.name}！`], phase2: false, enraged: false,
    dmgDealt: 0, dmgTaken: 0, crits: 0, bossMech: isBoss ? (zone.boss.mechanic || null) : null,
    formation: { ...(formation || {}) }, lastDmgToHero: 0, finished: false,
    teamId: teamId ?? null, waiting: false, progress: 0, streak: 1,
  };
  if (isBoss && zone.boss.mechanic && BOSS_MECH_TEXT[zone.boss.mechanic]) partyCombats[id].lines.push(BOSS_MECH_TEXT[zone.boss.mechanic]);
  syncActiveExplorations();
}
export function partyMembers(pc, aliveOnly) {
  return pc.heroIds.map(id => territoryHeroes.find(h => h.id === id)).filter(h => h && (!aliveOnly || h.hp > 0));
}
export function advancePartyCombat(pc) {
  if (!pc || pc.finished) return;
  const zone = getZone(pc.zoneId);
  pc.round += 1;
  if (pc.isBoss && !pc.enraged && pc.round >= 30) {
    pc.enraged = true; pc.enemy.atk = Math.round(pc.enemy.atk * 2);
    pc.lines.push('👹 頭目進入狂暴狀態，攻擊翻倍！'); sfx('boss');
  }
  const order = partyMembers(pc, true).sort((a, b) => ((pc.formation[a.id] === 'back' ? 1 : 0) - (pc.formation[b.id] === 'back' ? 1 : 0)));
  for (const h of order) {
    if (pc.enemy.hp <= 0) break;
    const st = getHeroStats(h);
    tickSkillCds(h);
    applySkillBuffs(h, st, pc);
    if (h.autoPotion && h.hp < st.maxHp * 0.35 && usePotion(h, true)) pc.lines.push(`🧪 ${h.name} 喝下藥水，HP ${Math.max(0, Math.round(h.hp))}/${st.maxHp}`);
    tryTriggerActiveSkill(h, st, pc);
    const skillAtkMult = 1 + (st.atkBonus || 0) + (st.skillDmgBonus || 0);
    const counterMult = elementCounterMult(h, zone);
    const shieldMult = (pc.bossMech === 'shield' && pc.round <= 10) ? 0.6 : 1;
    const bossMult = pc.isBoss ? 1 + (st.bossDmg || 0) : 1;
    const rowMult = pc.formation[h.id] === 'back' ? 0.9 : 1;
    const critEff = (st.crit || 0) + (st.critBonus || 0);
    const defEff = Math.max(0, Math.round((pc.enemy.def || 0) * (1 - Math.min(0.9, st.pierce || 0))));
    const hit = calcDamage(Math.round(st.atk * skillAtkMult * counterMult * shieldMult * bossMult * rowMult), defEff, critEff);
    pc.enemy.hp -= hit.dmg; pc.dmgDealt += hit.dmg; if (hit.isCrit) pc.crits += 1;
    pc.lines.push(`第${pc.round}回合：${h.name} 造成 ${hit.dmg} 傷害${hit.isCrit ? '（暴擊！）' : ''}，${pc.enemy.name} HP ${Math.max(0, pc.enemy.hp)}`);
    if (st.doubleAttack && pc.enemy.hp > 0) {
      const dblLv = getHeroSkillLevel(h, 'r_speed');
      const hit2 = calcDamage(Math.round(st.atk * Math.max(0.4, 1 - 0.2 * dblLv) * counterMult * shieldMult * bossMult * rowMult), defEff, critEff);
      pc.enemy.hp -= hit2.dmg; pc.dmgDealt += hit2.dmg; if (hit2.isCrit) pc.crits += 1;
      pc.lines.push(`🌪️ ${h.name} 疾風追加 ${hit2.dmg} 傷害`);
    }
    if (st.healPower) {
      const healAmt = Math.round(st.maxHp * st.healPower);
      h.hp = Math.min(st.maxHp, h.hp + healAmt);
      pc.lines.push(`💚 ${h.name} 治療恢復 ${healAmt} HP`);
    }
    if (st.slowEnemy) { pc.enemySlowRounds = (pc.enemySlowRounds || 0) + st.slowEnemy; pc.lines.push(`❄️ ${pc.enemy.name} 被凍結！`); }
  }
  if (pc.enemy.hp <= 0) { finishPartyCombat(pc, true); return; }
  if (pc.isBoss && !pc.phase2 && pc.enemy.hp < pc.enemy.maxHp * 0.5) {
    pc.phase2 = true; pc.enemy.atk = Math.round(pc.enemy.atk * 1.3);
    pc.lines.push('⚠️ 頭目進入第二階段，攻擊提升 30%！'); sfx('boss');
  }
  const targets = partyMembers(pc, true);
  if (!targets.length) { finishPartyCombat(pc, false); return; }
  pc.lastDmgToHero = 0;
  if ((pc.enemySlowRounds || 0) > 0) {
    pc.enemySlowRounds -= 1;
    pc.lines.push(`❄️ ${pc.enemy.name} 凍結中，無法反擊。`);
  } else {
    const front = targets.filter(h => pc.formation[h.id] !== 'back');
    const pick = (front.length && Math.random() < 0.7) ? choice(front) : choice(targets);
    const pst = getHeroStats(pick);
    if (Math.random() < (pst.eva || 0)) {
      pc.lines.push(`💨 ${pick.name} 閃避了 ${pc.enemy.name} 的攻擊！`);
    } else {
      const ehit = calcDamage(pc.enemy.atk || 1, pst.def, 0.03);
      const dmg = pc.formation[pick.id] === 'back' ? Math.max(1, Math.round(ehit.dmg * 0.7)) : ehit.dmg;
      pick.hp -= dmg; pc.dmgTaken += dmg; pc.lastDmgToHero = dmg;
      pc.lines.push(`${pc.enemy.name} 攻擊 ${pick.name} 造成 ${dmg} 傷害（HP ${Math.max(0, Math.round(pick.hp))}/${pst.maxHp}）`);
      if (pst.thorns && pc.enemy.hp > 0) {
        const th = Math.max(1, Math.round(dmg * pst.thorns));
        pc.enemy.hp -= th; pc.dmgDealt += th;
        pc.lines.push(`🌵 ${pick.name} 荊棘反彈 ${th} 傷害`);
        if (pc.enemy.hp <= 0) { finishPartyCombat(pc, true); return; }
      }
      if (pick.hp <= 0) pc.lines.push(`💀 ${pick.name} 倒下了！`);
    }
  }
  if (pc.bossMech && pc.enemy.hp > 0 && partyMembers(pc, true).length) {
    if (pc.bossMech === 'regen' && pc.round % 5 === 0) {
      const heal = Math.round(pc.enemy.maxHp * 0.08);
      pc.enemy.hp = Math.min(pc.enemy.maxHp, pc.enemy.hp + heal);
      pc.lines.push(`🌱 ${pc.enemy.name} 再生恢復 ${heal} HP`);
    } else if (pc.bossMech === 'poison' && pc.round % 3 === 0) {
      for (const h of partyMembers(pc, true)) {
        const hst = getHeroStats(h);
        const dot = Math.max(1, Math.round(hst.maxHp * 0.05));
        h.hp -= dot; pc.dmgTaken += dot;
        pc.lines.push(`☠️ ${h.name} 中毒流失 ${dot} HP`);
      }
    } else if (pc.bossMech === 'lifesteal' && pc.lastDmgToHero > 0) {
      const steal = Math.round(pc.lastDmgToHero * 0.5);
      pc.enemy.hp = Math.min(pc.enemy.maxHp, pc.enemy.hp + steal);
      pc.lines.push(`🩸 ${pc.enemy.name} 吸取 ${steal} HP`);
    } else if (pc.bossMech === 'aoe' && pc.round % 6 === 0) {
      for (const h of partyMembers(pc, true)) {
        const hst = getHeroStats(h);
        const aoe = Math.max(1, Math.round(hst.maxHp * 0.2));
        h.hp -= aoe; pc.dmgTaken += aoe;
      }
      pc.lines.push(`💥 ${pc.enemy.name} 釋放毀滅衝擊，全隊受到無視防禦傷害！`);
      sfx('boss');
    }
  }
  if (!partyMembers(pc, true).length) { finishPartyCombat(pc, false); return; }
  if (pc.round >= 80) { pc.lines.push('⏱ 戰鬥拖太久，編隊體力不支撤退。'); finishPartyCombat(pc, false); }
}
export function finishPartyCombat(pc, won) {
  pc.finished = true;
  const zone = getZone(pc.zoneId);
  const members = partyMembers(pc, false);
  const rewards = { gold: 0, xp: 0, magicStones: 0, drops: [] };
  if (won) {
    stats.kills += 1; if (pc.isBoss) stats.bossKills += 1;
    rewards.gold = Math.round(rand(pc.cfg.goldRange[0], pc.cfg.goldRange[1]) * (1 + 0.25 * (members.length - 1)));
    gainGold(rewards.gold);
    rewards.xp = pc.cfg.xp || 10;
    for (const h of members) grantXp(h, Math.round(rewards.xp * getHeroStats(h).xpMult));
    if (Math.random() < (pc.cfg.magicStoneChance || 0)) { rewards.magicStones = 1; ResourceSystem_add('magicStones', 1); }
    const dropChance = sceneNight > 0.5 ? 0.19 : 0.14;
    for (let i = 0; i < members.length; i++) {
      for (const dropId of (pc.cfg.drops || [])) {
        if (Math.random() < dropChance) { const label = addDropItem(dropId); if (label) rewards.drops.push(label); }
      }
    }
    pc.lines.push(`🏆 編隊勝利！獲得 ${rewards.gold}🪙、每位 ${rewards.xp} XP${rewards.magicStones ? '、1💠' : ''}${rewards.drops.length ? '、掉落 ' + rewards.drops.join('、') : ''}`);
    if (sceneNight > 0.5) pc.lines.push('🌙 夜晚狩獵加成：掉落率提升');
    if (pc.isBoss) {
      mapProgress.zoneProgress[zone.id].bossDefeated = true;
      if (!mapProgress.clearedZones.includes(zone.id)) mapProgress.clearedZones.push(zone.id);
      const next = getZone(zone.id + 1);
      if (next && !mapProgress.unlockedZones.includes(next.id)) { mapProgress.unlockedZones.push(next.id); mapProgress.currentZone = next.id; }
      sfx('boss'); showToast(`👑 編隊擊敗 ${zone.boss.name}！${next ? '解鎖 ' + next.name : '五域全通！'}`, 'success');
    } else {
      mapProgress.zoneProgress[zone.id][pc.difficulty] = true;
    }
  } else {
    for (const h of members) { const st = getHeroStats(h); h.hp = Math.max(1, Math.round(st.maxHp * 0.2)); }
    pc.lines.push('💀 編隊戰敗撤退，返回獵魔村休整。');
  }
  pc.lines.push(`📊 輸出 ${Math.round(pc.dmgDealt)}・承傷 ${Math.round(pc.dmgTaken)}・暴擊 ${pc.crits} 次・共 ${pc.round} 回合`);
  addBattleReport('zone', `👥 ${zone.icon} ${zone.name}・${DIFF_LABELS[pc.difficulty]}（${members.length}人編隊）`, won ? (pc.isBoss ? '頭目擊破' : '勝利') : '撤退', pc.lines, rewards);
  if (won && !pc.isBoss && pc.teamId != null) {
    const survivors = partyMembers(pc, true);
    for (const h of members) {
      if (h.hp <= 0) {
        const st = getHeroStats(h); h.hp = Math.max(1, Math.round(st.maxHp * 0.2));
        h.partyId = null; h.status = 'idle'; h.explorationProgress = 0; h.exploreZoneId = null; h.exploreDifficulty = null;
        pc.lines.push(`🚑 ${h.name} 負傷脫隊回村休養。`);
      }
    }
    if (!survivors.length) { endTeamRun(pc, '全員負傷', true); return; }
    pc.heroIds = survivors.map(h => h.id);
    if (settings.autoRecall !== false && survivors.some(h => (h.fatigue || 0) >= 90)) { endTeamRun(pc, '成員疲勞', true); return; }
    pc.waiting = true; pc.progress = 0;
    syncActiveExplorations(); checkAchievements();
    return;
  }
  for (const h of members) {
    h.partyId = null;
    if (won && !pc.isBoss) { h.explorationProgress = 0; }
    else { h.status = 'idle'; h.explorationProgress = 0; h.exploreZoneId = null; h.exploreDifficulty = null; }
  }
  delete partyCombats[pc.id];
  syncActiveExplorations(); checkAchievements();
}
export function processPartyCombats() {
  const speed = clamp(settings.combatSpeed || 1, 1, 4);
  for (const pc of Object.values(partyCombats)) {
    if (pc.waiting) {
      pc.progress = (pc.progress || 0) + 12;
      if (pc.progress >= 100) startPartyNextRound(pc);
      continue;
    }
    for (let i = 0; i < speed && partyCombats[pc.id]; i++) advancePartyCombat(pc);
  }
}
