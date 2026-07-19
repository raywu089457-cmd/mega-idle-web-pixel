// src/ui.js — L2 UI 渲染(panel / modal / HUD / 訂單 / 建築擺位 / 重建 / 技能 / 隊伍)
// 從 index.html L3567-3925 搬出 + buildingEffectText(原 L1304 從 resources-buildings 搬入以避免循環)
// 設計:不 import meta.js / settings-and-init.js(它們會呼叫 ui.js)
// 收 renderAll / openPanel / togglePanel / closePanel / renderPanel / saveGame 等供其他模組呼叫

import {
  RESOURCES, MATERIAL_TYPES, BUILDINGS, BUILDING_ORDER, HERO_CLASSES, CLASS_NAMES_ZH,
  RARITIES, ZONES, DIFF_LABELS, ITEMS, GEAR_TIERS, AFFIXES, ACHIEVEMENTS, WEATHERS, SKILL_TREE,
  baseClassOf, advClassFor, isGear, gearDisplayName, ADV_CLASSES, DIFF_COLORS, ENHANCE_MAX,
} from './data.js';
import {
  activePanel, heroSubTab, heroReportSubTab, skillTabHeroId, expandedReports, dispatchHeroId,
  equipPick, craftOrders, stats, achievementsUnlocked, prestige, daily, settings, shopFilter,
  priceMult, shopStock, weather, territoryHeroes, wanderingHeroes, battleReports, activeExplorations,
  mapProgress, liveCombats, partyCombats, teams, partyDispatchState, setShopFilter, setHeroSubTab,
  setSkillTabHeroId, setHeroReportSubTab, setActivePanel, setDispatchHeroId, setEquipPick,
  setCraftOrders, territoryCombatTickCounter, incTerritoryCombatTickCounter,
  setDispatchHeroId as _setDispatchHeroId,
} from './state.js';
import { $, esc, pct, fmt, timeAgo, showModal, hideModal, showToast, closeModal } from './util.js';
import { sfx } from './audio.js';
import {
  ResourceSystem_get, ResourceSystem_getFillPercent, ResourceSystem_canAfford, ResourceSystem_spend,
  BuildingSystem_getLevel, BuildingSystem_getTotalLevels, BuildingSystem_getPotionProduction,
  BuildingSystem_upgrade, getBuildingCost, buildingMaxLevel,
} from './resources-buildings.js';
import { getHeroStats, getHeroTrait, getHeroTraits, usePotion, canAdvance, advanceClass, syncActiveExplorations, rerollTrait, trainCost, trainHero, recallHero, recruitWanderingHero, heroTeam, recruitCost } from './heroes-stats.js';
import { getHeroSkillLevel, canLearnSkill, learnSkill, resetSkills } from './skills.js';
import { getAchievementBonuses, getMaterialMultiplier, getClickGold } from './bonuses.js';
import { finalBossDefeated, getPrestigeGain, checkAchievements } from './meta.js';
import { getZone, isZoneUnlocked, isBossReady } from './combat.js';
import { partyMembers } from './combat-party.js';
import { invCount, salePrice, potionStockCap, gearStockCap, canCraft, craftItem, setPriceTier, sellItem, sellGear, salvageGear, sellAllCommons, fulfillOrder, spawnCraftOrder, setCombatSpeed, getClickGold as getClickGoldFn } from './inventory.js';
import { territoryHeroes as _territoryHeroes } from './state.js';
import { addToTeam, removeFromTeam, toggleTeamFormation } from './combat-party.js';
import { xpNeed } from './heroes-stats.js';
import { saveGame, applyStateToRuntime } from './settings-and-init.js'; // late-bind

// ═══════════════════════════════════════════════════════════════════
// 建築效果文字(從 resources-buildings 搬入以避免循環:依賴 inventory 的 salePrice)
// ═══════════════════════════════════════════════════════════════════
export function buildingEffectText(id) {
  const lvl = BuildingSystem_getLevel(id);
  switch (id) {
    case 'monument': return '⚡ 各材料 +' + lvl + '~' + (3 * lvl) + '/秒';
    case 'goldMine': return lvl > 0 ? '🪙 +' + (lvl * 2) + ' 金幣/秒・點擊 +' + Math.floor(lvl / 2) : '🪙 建造後每秒產出金幣';
    case 'tavern': return '🛏 獵人空位 ' + BuildingSystem_getTerritoryHeroSlots() + '・訪客上限 ' + BuildingSystem_getMaxWanderingHeroes();
    case 'weaponShop': return '🗡 全獵人攻擊 +' + lvl + '・可製作 Lv.' + lvl + ' 級武器';
    case 'armorShop': return '🛡 全獵人防禦 +' + lvl + '・可製作 Lv.' + lvl + ' 級防具';
    case 'potionShop': { const p = BuildingSystem_getPotionProduction(); return '💊 每' + p.ticks + '秒生產 ' + p.amount + ' 瓶藥水'; }
    case 'altar': return lvl > 0 ? '🔯 戰鬥金幣/經驗 +' + (lvl * 4) + '%' : '🔯 建造後提升戰鬥收益';
    case 'restaurant': return lvl > 0 ? `🍖 休息餐費 ${8 + lvl * 2}🪙/次・心情恢復 +${lvl * 30}%` : '🍖 建造後獵人休息會付餐費';
    case 'drinkShop': return lvl > 0 ? `🥤 飲料 ${salePrice(10, 'potion')}🪙/杯・心情 +${15 + lvl * 3}` : '🥤 建造後獵人會來買飲料';
    case 'inn': return lvl > 0 ? `🛏️ 復活 ${Math.max(6, 18 - lvl * 2)} 秒・休整回血 +${lvl * 10}%` : '🛏️ 建造後加速復活與休整';
    case 'trainingGround': return lvl > 0 ? `🎯 閒置獵人 +${lvl * 2} XP/秒` : '🎯 建造後閒置獵人自動練功';
    case 'enhanceForge': return lvl > 0 ? `⚒️ 強化費用 -${lvl * 6}%` : '⚒️ 建造後降低強化費用';
    default: return '';
  }
}
import { BuildingSystem_getMaxWanderingHeroes, BuildingSystem_getTerritoryHeroSlots } from './resources-buildings.js';

// ═══════════════════════════════════════════════════════════════════
// Panel / modal 控制
// ═══════════════════════════════════════════════════════════════════
export function openPanel(name) {
  setActivePanel(name);
  for (const p of document.querySelectorAll('.panel')) p.classList.remove('open');
  for (const b of document.querySelectorAll('.nav-btn')) b.classList.remove('active');
  const panel = $('panel-' + name), nav = $('nav-' + name);
  if (panel) panel.classList.add('open'); if (nav) nav.classList.add('active');
  sfx('click'); renderPanel(name);
}
export function togglePanel(name) {
  if (activePanel === name) { closePanel(); return; }
  openPanel(name);
}
export function closePanel() {
  setActivePanel(null);
  for (const p of document.querySelectorAll('.panel')) p.classList.remove('open');
  for (const b of document.querySelectorAll('.nav-btn')) b.classList.remove('active');
}
export function renderPanel(name) {
  if (name === 'res') renderResourcesPanel();
  else if (name === 'hero') renderHeroesPanel();
  else if (name === 'build') renderBuildingsPanel();
  else if (name === 'map') renderMapPanel();
  else if (name === 'shop') renderShopPanel();
  else if (name === 'ach') renderAchPanel();
}
export function renderAll() { renderHUD(); renderBadges(); if (activePanel) renderPanel(activePanel); }
export function renderHUD() {
  $('hud-gold').textContent = fmt(ResourceSystem_get('gold'));
  $('hud-magic').textContent = fmt(ResourceSystem_get('magicStones'));
  $('hc-fruit').textContent = fmt(ResourceSystem_get('fruitPoor'));
  $('hc-water').textContent = fmt(ResourceSystem_get('waterDirty'));
  $('hc-wood').textContent = fmt(ResourceSystem_get('woodRotten'));
  $('hc-iron').textContent = fmt(ResourceSystem_get('ironRusty'));
  $('hc-herb').textContent = fmt(ResourceSystem_get('herbLow'));
  $('castle-level').textContent = `獵魔村傳承 ${prestige.count}・碎片 ${prestige.shards}`;
  const streak = daily.streak || 0;
  const streakEl = $('hud-streak');
  if (streakEl) streakEl.textContent = streak > 0 ? streak + '天' : '';
  const wEl = $('hud-weather');
  if (wEl) { wEl.textContent = WEATHERS[weather.type].icon; wEl.title = `天氣：${WEATHERS[weather.type].name}（${WEATHERS[weather.type].desc}）`; }
}
export function renderBadges() {
  const idle = territoryHeroes.filter(h => h.status === 'idle').length;
  const wb = $('nav-badge-hero');
  if (wb) { if (idle > 0) { wb.style.display = 'block'; wb.textContent = idle; } else wb.style.display = 'none'; }
  const ab = $('nav-badge-ach'); if (ab) ab.style.display = finalBossDefeated() ? 'block' : 'none';
}
export function renderResourcesPanel() {
  const mon = BuildingSystem_getLevel('monument');
  $('res-grid').innerHTML = Object.entries(RESOURCES).map(([id, conf]) => {
    const val = ResourceSystem_get(id), fill = ResourceSystem_getFillPercent(id);
    let rate = '<span class="rate neg">—</span>';
    if (MATERIAL_TYPES.includes(id)) rate = `<span class="rate">+${mon}~${3 * mon}/s</span>`;
    if (id === 'gold') rate = `<span class="rate">+${BuildingSystem_getGoldRate()}/s・點擊+${getClickGold()}</span>`;
    return `<div class="res-card"><div class="res-top"><div class="res-info"><div class="res-ico">${conf.icon}</div><div><div class="res-name">${conf.name}</div><div class="res-val">${fmt(val)}<span class="res-max"> / ${fmt(conf.capacity)}</span></div></div></div>${rate}</div><div class="progress-bar"><div class="progress-fill ${fill > 85 ? 'crit' : fill > 65 ? 'warn' : ''}" style="width:${fill}%"></div></div>${id === 'magicStones' ? '<div class="bonus-line">用途：神秘法杖、騎士鎧甲、祭壇與裝備強化</div>' : ''}</div>`;
  }).join('');
}
import { BuildingSystem_getGoldRate } from './resources-buildings.js';

function heroCardHtml(h) {
  const st = getHeroStats(h), cls = HERO_CLASSES[h.class];
  const rc = RARITIES[h.rarity || 'normal'];
  const statusBadge = h.status === 'exploring' ? '<span class="hero-badge badge-exploring">狩獵中</span>' : h.status === 'resting' ? '<span class="hero-badge badge-resting">休整中</span>' : '<span class="hero-badge badge-idle">閒置</span>';
  const eq = (slot, label) => {
    const e = h.equipment?.[slot];
    if (!e) return `<span class="equip-slot" onclick="openEquipModal('${h.id}','${slot}')">＋${label}</span>`;
    const tc = GEAR_TIERS[e.tier]?.color;
    const name = tc ? `<span style="color:${tc}">${e.icon}${e.name}</span>` : `${e.icon}${e.name}`;
    return `<span class="equip-slot rar-${ITEMS[e.id]?.rarity || 'common'}" title="點擊卸下，右鍵/長按強化" onclick="unequipItem('${h.id}','${slot}')" oncontextmenu="event.preventDefault();enhanceEquip('${h.id}','${slot}')">${name}+${e.plus || 0}</span>`;
  };
  const setBadge = (h.activeSets || []).length ? `<span style="color:var(--golden-wheat);font-size:11px;">⚜ ${h.activeSets.map(s => s.name).join('・')}</span>` : '';
  const canAct = h.status === 'idle';
  const ap = h.skillPoints || 0;
  const traitsHtml = getHeroTraits(h).length
    ? getHeroTraits(h).map((t, i) => `${t.name}<span style="cursor:pointer;color:var(--text-faint);" title="重骰（2💠）" onclick="rerollTrait('${h.id}',${i + 1})">🎲</span>`).join('・')
    : '無特質';
  const advBtn = advClassFor(h.class) ? `<button class="btn btn-purple btn-sm" ${canAdvance(h) ? '' : 'disabled'} title="Lv.20 + 20💠 轉職為${ADV_CLASSES[advClassFor(h.class)].name}" onclick="advanceClass('${h.id}')">⬆ 轉職</button>` : '';
  const teamTag = heroTeam(h.id) ? `・🛡隊${heroTeam(h.id).id + 1}` : '';
  return `<div class="hero-card rar-frame-${h.rarity || 'normal'}"><div class="hero-top"><div class="hero-portrait portrait-rar-${h.rarity || 'normal'}">${cls.icon}</div><div class="hero-info"><div style="display:flex;align-items:center;gap:6px;"><div class="hero-name">${esc(h.name)}</div><span class="rarity-tag" style="color:${rc.color}">${rc.name}</span>${statusBadge}</div><div class="hero-class">${cls.name} Lv.${h.level}・<span style="color:var(--gold);letter-spacing:1px;">${'★'.repeat(h.stars || 3)}${'☆'.repeat(5 - (h.stars || 3))}</span>・${traitsHtml}・🧪${h.inventory.healthPotion || 0}・😪${h.fatigue || 0}%・🗡<span style="color:${ap > 0 ? 'var(--purple)' : 'var(--text-faint)'}">${ap}AP</span>${teamTag}</div><div class="hero-stats"><div class="stat-hp-bar"><div class="hp-bar"><div class="hp-fill ${pct(h.hp, st.maxHp) > 60 ? 'high' : pct(h.hp, st.maxHp) > 30 ? 'med' : ''}" style="width:${pct(h.hp, st.maxHp)}%"></div></div><span class="hp-text">${Math.round(h.hp)}/${st.maxHp}</span></div><div class="stat-xp-bar"><div class="xp-bar"><div class="xp-fill" style="width:${pct(h.xp, xpNeed(h.level))}%"></div></div><span class="xp-text">${h.xp}/${xpNeed(h.level)}</span></div><div class="stat">⚔ ${st.atk} <span class="eq-bonus">(+${st.atk - (h.atk || 0) - BuildingSystem_getLevel('weaponShop') - getAchievementBonuses().atk})</span>　🛡 ${st.def}　💥 ${Math.round(st.crit * 100)}%</div><div class="hero-equip">${eq('weapon', '武器')}${eq('armor', '防具')}${eq('accessory', '飾品')}<span class="inv-btn-slot" onclick="enhanceEquip('${h.id}','weapon')">強化武器</span><span class="inv-btn-slot" onclick="enhanceEquip('${h.id}','armor')">強化防具</span><span class="inv-btn-slot" onclick="enhanceEquip('${h.id}','accessory')">強化飾品</span>${setBadge}</div></div></div></div><div class="hero-actions"><button class="btn btn-blue btn-sm" ${canAct ? '' : 'disabled'} onclick="openDispatch('${h.id}')">派遣</button><button class="btn btn-gold btn-sm" onclick="trainHero('${h.id}')">訓練 ${fmt(trainCost(h).gold)}🪙</button><button class="btn btn-outline btn-sm" ${h.status === 'exploring' ? '' : 'disabled'} onclick="recallHero('${h.id}')">召回</button><button class="btn btn-purple btn-sm" onclick="skillTabHeroId='${h.id}';heroSubTab='skills';renderHeroesPanel()">🗡技能</button>${advBtn}</div></div>`;
}
import { unequipItem, enhanceEquip } from './inventory.js';
export function renderHeroesPanel() {
  $('hero-tab-bar').innerHTML = [['territory', '村莊獵人'], ['wander', `流浪(${wanderingHeroes.length})`], ['reports', `戰報(${battleReports.length})`], ['skills', '🗡 技能'], ['teams', '👥 隊伍']].map(([k, label]) => `<button class="report-sub-btn ${heroSubTab === k ? 'active' : ''}" onclick="heroSubTab='${k}';renderHeroesPanel()">${label}</button>`).join('');
  for (const k of ['territory', 'wander', 'reports', 'skills', 'teams']) $('hero-' + k).classList.toggle('active', heroSubTab === k);
  if (heroSubTab === 'territory') {
    $('hero-territory').innerHTML = `<div class="section-label">村莊獵人 ${territoryHeroes.length}/${BuildingSystem_getTerritoryHeroSlots()}（點「技能」學習技能）</div>` + (territoryHeroes.length ? territoryHeroes.map(heroCardHtml).join('') : '<div class="empty-state">還沒有獵人。到酒館招募流浪獵人吧！</div>');
  } else if (heroSubTab === 'wander') {
    $('hero-wander').innerHTML = wanderingHeroes.length ? wanderingHeroes.map(h => { const st = getHeroStats(h); const rc = RARITIES[h.rarity || 'normal']; const stateBadge = h.aiState === 'dead' ? '<span class="hero-badge badge-resting">陣亡復活中</span>' : '<span class="hero-badge badge-wandering">流浪</span>'; return `<div class="hero-card rar-frame-${h.rarity || 'normal'}"><div class="hero-top"><div class="hero-portrait portrait-rar-${h.rarity || 'normal'}">${HERO_CLASSES[h.class].icon}</div><div class="hero-info"><div style="display:flex;align-items:center;gap:6px;"><div class="hero-name">${esc(h.name)}</div><span style="color:${rc.color}">${rc.name}</span>${stateBadge}</div><div class="hero-class">${CLASS_NAMES_ZH[h.class]} Lv.${h.level}・<span style="color:var(--gold);letter-spacing:1px;">${'★'.repeat(h.stars || 3)}${'☆'.repeat(5 - (h.stars || 3))}</span>・${getHeroTrait(h)?.name || '無特質'}・😪${h.fatigue || 0}%・😊${Math.round(h.mood ?? 70)}</div><div class="stat">⚔${st.atk} 🛡${st.def} HP${Math.round(h.hp)}/${st.maxHp}</div><div class="wallet-display">錢包 <span>${fmt(h.wallet)}🪙</span>・💠${h.diamonds || 0}</div><div class="hero-actions"><button class="btn btn-gold btn-sm" onclick="recruitWanderingHero('${h.id}')">招募 ${fmt(recruitCost(h).gold)}🪙</button></div></div></div></div>`; }).join('') : '<div class="empty-state">酒館外目前沒有流浪獵人</div>';
  } else if (heroSubTab === 'skills') {
    renderSkillsTab();
  } else if (heroSubTab === 'teams') {
    renderTeamsTab();
  } else {
    const filtered = battleReports.filter(r => heroReportSubTab === 'all' || r.kind === heroReportSubTab);
    $('hero-reports').innerHTML = `<div class="report-sub-tabs">${[['all', '全部'], ['zone', '狩獵'], ['wander', '流浪']].map(([k, label]) => `<button class="report-sub-btn ${heroReportSubTab === k ? 'active' : ''}" onclick="heroReportSubTab='${k}';renderHeroesPanel()">${label}</button>`).join('')}<button class="report-sub-btn" onclick="clearReports()">清空</button></div>` + (filtered.length ? filtered.map(r => `<div class="report-entry"><div class="report-head" onclick="toggleReport('${r.id}')"><span class="report-result" style="color:${r.result.includes('敗') || r.result.includes('撤退') ? 'var(--red)' : 'var(--green)'}">${r.result}</span><div class="report-info"><div class="report-title">${r.title}</div><div class="report-time">${timeAgo(r.time)}</div></div><span class="report-expand ${expandedReports.has(r.id) ? 'open' : ''}">▼</span></div><div class="report-body ${expandedReports.has(r.id) ? 'open' : ''}"><div class="combat-log">${r.lines.map(line => `<div class="log-line ${line.includes('勝利') ? 'log-victory' : line.includes('戰敗') ? 'log-defeat' : line.includes('藥水') ? 'log-heal' : line.includes('掉落') ? 'log-drop' : 'log-round'}">${line}</div>`).join('')}</div></div></div>`).join('') : '<div class="empty-state">尚無戰報</div>');
  }
}
import { clearReports, toggleReport } from './combat.js';
export function renderTeamsTab() {
  const unassigned = territoryHeroes.filter(h => !heroTeam(h.id) && h.status === 'idle');
  $('hero-teams').innerHTML = `<div class="section-label">常駐隊伍（最多 4 組 × 4 人）— 到「地圖」選獵場出擊，隊伍會共同戰鬥並連戰</div>` + teams.map(t => {
    const active = Object.values(partyCombats).find(pc => pc.teamId === t.id);
    const membersHtml = t.members.length ? t.members.map(id => {
      const h = territoryHeroes.find(x => x.id === id); if (!h) return '';
      const st = getHeroStats(h);
      const pos = (t.formation[id] || 'front') === 'back' ? '後' : '前';
      return `<div class="party-hero-row"><span style="font-size:22px">${HERO_CLASSES[h.class].icon}</span><div class="ph-info"><div class="ph-name">${esc(h.name)} Lv.${h.level}${h.status === 'exploring' ? ' <span style="color:var(--red);font-size:11px;">出擊中</span>' : ''}</div><div class="ph-stats">⚔${st.atk} 🛡${st.def} HP${Math.round(h.hp)}/${st.maxHp} 😪${h.fatigue || 0}%</div></div><button class="btn btn-outline btn-sm" title="切換前/後排" onclick="toggleTeamFormation(${t.id},'${id}')">${pos}排</button><button class="btn btn-outline btn-sm" ${h.partyId ? 'disabled' : ''} onclick="removeFromTeam(${t.id},'${id}')">移出</button></div>`;
    }).join('') : '<div class="empty-state">尚未指派成員</div>';
    const addHtml = (!active && t.members.length < 4 && unassigned.length) ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">${unassigned.map(h => `<button class="btn btn-outline btn-sm" onclick="addToTeam(${t.id},'${h.id}')">＋${HERO_CLASSES[h.class].icon}${esc(h.name)}</button>`).join('')}</div>` : '';
    return `<div class="skill-card"><div class="skill-top"><div class="skill-info"><div class="skill-name">隊伍 ${t.id + 1}（${t.members.length}/4）${active ? '<span style="color:var(--red);">・出擊中</span>' : ''}</div></div></div>${membersHtml}${addHtml}</div>`;
  }).join('') + `<div style="font-size:12px;color:var(--text-faint);margin-top:8px;line-height:1.5;">📌 使用方式：點「＋」把待命獵人加入隊伍 → 到「地圖」選獵場難度 → 按「隊伍 N 出擊」。隊伍全員共享同一敵人血條共同戰鬥，勝利後自動整裝連戰；成員負傷會脫隊、疲勞滿會自動返村，也可在地圖面板手動撤退。</div>`;
}
export function renderSkillsTab() {
  const heroes = territoryHeroes;
  if (!heroes.length) { $('hero-skills').innerHTML = '<div class="empty-state">沒有獵人可學習技能</div>'; return; }
  if (!skillTabHeroId || !heroes.find(h => h.id === skillTabHeroId)) {
    setSkillTabHeroId(heroes[0].id);
  }
  const hero = heroes.find(h => h.id === skillTabHeroId);
  const tree = SKILL_TREE[baseClassOf(hero.class)] || [];
  const ap = hero.skillPoints || 0;
  const heroSelHtml = heroes.map(h => `<button class="report-sub-btn ${h.id === skillTabHeroId ? 'active' : ''}" onclick="skillTabHeroId='${h.id}';renderSkillsTab()">${HERO_CLASSES[h.class].icon} ${esc(h.name)}</button>`).join('');
  const skillsHtml = tree.map(def => {
    const curLevel = getHeroSkillLevel(hero, def.id);
    const isMaxed = curLevel >= def.maxLevel;
    const canLearn = canLearnSkill(hero, def.id);
    const fillPct = (curLevel / def.maxLevel) * 100;
    return `<div class="skill-card ${isMaxed ? '' : def.type === 'active' ? 'active-skill' : 'passive-skill'}">
      <div class="skill-top">
        <div class="skill-icon">${def.icon}</div>
        <div class="skill-info">
          <div class="skill-name">${def.name} ${curLevel > 0 ? `Lv.${curLevel}` : ''}</div>
          <div class="skill-desc">${def.desc}</div>
        </div>
      </div>
      <div class="skill-level-row">
        <span class="skill-level">${curLevel}/${def.maxLevel}</span>
        <div class="skill-bar"><div class="skill-fill" style="width:${fillPct}%"></div></div>
        ${!isMaxed ? `<button class="btn btn-sm ${canLearn ? 'btn-gold' : 'btn-outline'}" ${canLearn ? '' : 'disabled'} onclick="learnSkill(territoryHeroes.find(h=>h.id==='${hero.id}'),'${def.id}')">學習</button>` : '<span style="font-size:11px;color:var(--text-faint);">已滿級</span>'}
      </div>
    </div>`;
  }).join('');
  $('hero-skills').innerHTML = `
    <div class="section-label">選擇獵人</div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;">${heroSelHtml}</div>
    <div class="skill-ap-row">🗡 可用技能點：<b style="color:var(--golden-wheat);">${ap}</b> AP（升級獲得） <button class="btn btn-outline btn-sm" style="margin-left:8px;" onclick="resetSkills('${hero.id}')">🔄 重置技能（5💠）</button></div>
    <div class="section-label">${HERO_CLASSES[hero.class].icon} ${CLASS_NAMES_ZH[hero.class] || hero.class} 技能樹</div>
    <div class="skill-grid">${skillsHtml}</div>
  `;
}
import { BUILDING_TO_SCENE, plotNameOf, PLOT_COORDS } from './data.js';
import { setBuildingPlots, buildingPlots, DEFAULT_PLOT_OF } from './state.js';
import { resetBuildingPlots, pickPlacement, placementPick, setPlacementPick } from './scene.js';
export function renderBuildingsPanel() {
  const castleLv = BuildingSystem_getLevel('monument');
  const placeHint = placementPick ? `⇄ 擺設模式：選擇要與「${plotNameOf(placementPick)}」交換的建築` : '⇄ 點「換位」可兩兩交換建築位置（場景即時生效）';
  $('building-grid').innerHTML = `<div style="grid-column:1/-1;font-size:12px;color:var(--text-dim);padding:2px 0;">🏰 建築等級上限＝獵魔公會等級 ×2（公會目前 Lv.${castleLv}，上限 Lv.${castleLv * 2}）</div><div style="grid-column:1/-1;font-size:12px;color:var(--text-dim);padding:2px 0;display:flex;gap:6px;align-items:center;flex-wrap:wrap;"><span style="flex:1;">${placeHint}</span><button class="btn btn-outline btn-sm" onclick="resetBuildingPlots()">恢復預設</button></div>` + BUILDING_ORDER.map(id => {
    const b = BUILDINGS[id], lvl = BuildingSystem_getLevel(id);
    const effMax = buildingMaxLevel(id), hardMax = lvl >= b.maxLevel, castleCapped = !hardMax && lvl >= effMax;
    const maxed = hardMax || castleCapped;
    const cost = maxed ? null : getBuildingCost(id, lvl + 1);
    const afford = cost && ResourceSystem_canAfford(cost);
    const sceneKey = BUILDING_TO_SCENE[id];
    const placeBtn = sceneKey ? `<button class="btn ${placementPick === sceneKey ? 'btn-gold' : 'btn-outline'} btn-sm" style="margin-top:4px;" onclick="pickPlacement('${sceneKey}')">${placementPick === sceneKey ? '✕ 取消換位' : '⇄ 換位'}</button>` : '';
    return `<div class="building-card ${lvl === 0 ? 'unbuilt' : ''}"><div class="building-header"><div class="building-name">${b.name}</div><div class="building-level">Lv.${lvl}/${effMax}${hardMax ? ' MAX' : ''}</div></div><div class="building-ico">${b.icon}</div><div class="building-desc">${b.description}</div><div class="building-effect">${buildingEffectText(id)}</div>${hardMax ? '<div class="max-badge">已達最高等級</div>' : castleCapped ? `<div class="max-badge">🔒 需先升級獵魔公會</div>` : `<div class="building-cost">${Object.entries(cost).map(([rid, amt]) => `<span class="cost-item">${RESOURCES[rid].icon}${fmt(amt)}</span>`).join('')}</div><button class="btn ${afford ? 'btn-gold' : 'btn-outline'} btn-sm" ${afford ? '' : 'disabled'} onclick="upgradeBuilding('${id}')">${lvl === 0 ? '建造' : '升級'}</button>`}${placeBtn}</div>`;
  }).join('');
}
export function upgradeBuilding(id) {
  if (BuildingSystem_upgrade(id)) { sfx('craft'); showToast(`${BUILDINGS[id].name} 升到 Lv.${BuildingSystem_getLevel(id)}`, 'success'); checkAchievements(); }
  else if (BuildingSystem_getLevel(id) >= buildingMaxLevel(id) && BuildingSystem_getLevel(id) < BUILDINGS[id].maxLevel) showToast('🔒 已達公會上限，請先升級獵魔公會。', 'error');
  else showToast('資源不足或已達上限。', 'error');
}
export function renderMapPanel() {
  syncActiveExplorations();
  const partyHtml = Object.values(partyCombats).map(pc => {
    const z = getZone(pc.zoneId);
    const memberBars = partyMembers(pc, false).map(h => { const hst = getHeroStats(h); const dead = h.hp <= 0; return `<div class="stat-hp-bar" style="margin:2px 0;${dead ? 'opacity:0.4;' : ''}"><span style="font-size:11px;">${pc.formation[h.id] === 'back' ? '後' : '前'} ${HERO_CLASSES[h.class].icon} ${esc(h.name)}</span><div class="hp-bar"><div class="hp-fill ${pct(h.hp, hst.maxHp) > 60 ? 'high' : pct(h.hp, hst.maxHp) > 30 ? 'med' : ''}" style="width:${pct(h.hp, hst.maxHp)}%"></div></div><span class="hp-text">${Math.max(0, Math.round(h.hp))}/${hst.maxHp}</span></div>`; }).join('');
    const bossTag = pc.waiting
      ? `<span style="color:var(--green);font-size:11px;">✓ 第 ${pc.streak || 1} 場勝利・整裝中 ${Math.floor(pc.progress || 0)}%</span>`
      : pc.isBoss ? `<span style="color:var(--red);font-size:11px;">👑 ${pc.enraged ? '狂暴中' : pc.phase2 ? '第二階段' : '第一階段'}・第 ${pc.round} 回合</span>` : `<span style="color:var(--text-faint);font-size:11px;">第 ${pc.round} 回合${pc.teamId != null ? `・第 ${pc.streak || 1} 場` : ''}</span>`;
    const retreatBtn = pc.teamId != null ? `<div class="modal-actions" style="margin-top:4px;"><button class="btn btn-outline btn-sm" onclick="endTeamRun(partyCombats['${pc.id}'],'手動撤退')">🏳 隊伍撤退</button></div>` : '';
    const lastLines = pc.lines.slice(-2).map(l => `<div style="font-size:11px;color:var(--text-dim);">${esc(l)}</div>`).join('');
    return `<div class="explore-item"><div class="explore-top"><span class="explore-name">👥 ${z.icon} ${z.name}・${DIFF_LABELS[pc.difficulty]}（${pc.heroIds.length}人編隊）</span></div>
      <div class="stat-hp-bar" style="margin:3px 0;"><span style="font-size:11px;">👾 ${esc(pc.enemy.name)}</span><div class="hp-bar"><div class="hp-fill ${pct(pc.enemy.hp, pc.enemy.maxHp) > 60 ? 'high' : pct(pc.enemy.hp, pc.enemy.maxHp) > 30 ? 'med' : ''}" style="width:${pct(pc.enemy.hp, pc.enemy.maxHp)}%"></div></div><span class="hp-text">${Math.max(0, Math.round(pc.enemy.hp))}/${pc.enemy.maxHp}</span></div>
      ${memberBars}${bossTag}${lastLines}${retreatBtn}</div>`;
  }).join('');
  const soloHtml = activeExplorations.length ? `<div class="section-label">進行中狩獵</div>` + activeExplorations.map(e => {
    const z = getZone(e.zoneId);
    const lc = liveCombats[e.heroId];
    if (lc) {
      const hero = territoryHeroes.find(h => h.id === e.heroId);
      const hst = hero ? getHeroStats(hero) : { maxHp: 1 };
      const bossTag = lc.isBoss ? `<span style="color:var(--red);font-size:11px;">👑 ${lc.enraged ? '狂暴中' : lc.phase2 ? '第二階段' : '第一階段'}・第 ${lc.round} 回合${!lc.enraged ? `・${Math.max(0, 30 - lc.round)} 回合後狂暴` : ''}</span>` : `<span style="color:var(--text-faint);font-size:11px;">第 ${lc.round} 回合</span>`;
      const lastLines = lc.lines.slice(-2).map(l => `<div style="font-size:11px;color:var(--text-dim);">${esc(l)}</div>`).join('');
      return `<div class="explore-item"><div class="explore-top"><span class="explore-name">${z.icon} ${z.name}・${DIFF_LABELS[e.difficulty]}</span><span class="explore-hero">${esc(e.heroName)}</span></div>
        <div class="stat-hp-bar" style="margin:3px 0;"><span style="font-size:11px;">👾 ${esc(lc.enemy.name)}</span><div class="hp-bar"><div class="hp-fill ${pct(lc.enemy.hp, lc.enemy.maxHp) > 60 ? 'high' : pct(lc.enemy.hp, lc.enemy.maxHp) > 30 ? 'med' : ''}" style="width:${pct(lc.enemy.hp, lc.enemy.maxHp)}%"></div></div><span class="hp-text">${Math.max(0, Math.round(lc.enemy.hp))}/${lc.enemy.maxHp}</span></div>
        ${hero ? `<div class="stat-hp-bar" style="margin:3px 0;"><span style="font-size:11px;">⚔️ ${esc(hero.name)}</span><div class="hp-bar"><div class="hp-fill ${pct(hero.hp, hst.maxHp) > 60 ? 'high' : pct(hero.hp, hst.maxHp) > 30 ? 'med' : ''}" style="width:${pct(hero.hp, hst.maxHp)}%"></div></div><span class="hp-text">${Math.max(0, Math.round(hero.hp))}/${hst.maxHp}</span></div>` : ''}
        ${bossTag}${lastLines}</div>`;
    }
    return `<div class="explore-item"><div class="explore-top"><span class="explore-name">${z.icon} ${z.name}・${DIFF_LABELS[e.difficulty]}</span><span class="explore-hero">${esc(e.heroName)}</span><span class="explore-pct">${Math.floor(e.progress)}%</span></div><div class="progress-bar"><div class="progress-fill" style="width:${e.progress}%"></div></div></div>`;
  }).join('') : '';
  $('active-explore').innerHTML = (partyHtml + soloHtml) || '<div class="empty-state">目前沒有狩獵隊伍</div>';
  $('zone-list').innerHTML = ZONES.map(z => {
    const unlocked = isZoneUnlocked(z.id), p = mapProgress.zoneProgress[z.id];
    const rec = z.difficulties.easy.recommendedLevel;
    const status = p.bossDefeated ? '✅ 已征服' : unlocked ? (isBossReady(z.id) ? '👑 Boss 已現身' : '⚔ 可狩獵') : '🔒 未解鎖';
    return `<div class="zone-card ${unlocked ? '' : 'locked'} ${p.bossDefeated ? 'cleared' : ''}"><div class="zone-head"><div class="zone-ico">${z.icon}</div><div class="zone-name">${z.name}</div><div class="zone-rec">建議 Lv.${rec}+</div></div><div class="zone-status" style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">${status}</div><div class="diff-row">${['easy', 'normal', 'hard'].map(d => `<button class="btn btn-sm ${p[d] ? 'btn-outline' : 'btn-blue'} diff-btn" ${unlocked ? '' : 'disabled'} onclick="openDifficultyModal(${z.id},'${d}')">${DIFF_LABELS[d]}${p[d] ? '<span class="diff-clear">✓</span>' : ''}</button>`).join('')}<button class="btn btn-sm btn-purple" ${unlocked && (isBossReady(z.id) || p.bossDefeated) ? '' : 'disabled'} onclick="openDifficultyModal(${z.id},'boss')">👑頭目</button></div></div>`;
  }).join('');
  let abyssHtml = '';
  if (abyssUnlocked()) {
    const abyssHeroes = territoryHeroes.filter(h => h.exploreZoneId === 'abyss' && h.status === 'exploring');
    const runRows = abyssHeroes.map(h => {
      const lc = liveCombats[h.id];
      const status = lc ? `👾 ${esc(lc.enemy.name)} HP ${Math.max(0, Math.round(lc.enemy.hp))}/${lc.enemy.maxHp}・第 ${lc.round} 回合` : `前進中 ${Math.floor(h.explorationProgress)}%`;
      return `<div class="explore-item"><div class="explore-top"><span class="explore-name">🕳 第 ${h.abyssDepth || 1} 層</span><span class="explore-hero">${esc(h.name)}</span></div><div style="font-size:11px;color:var(--text-dim);">${status}</div><div class="modal-actions" style="margin-top:4px;"><button class="btn btn-outline btn-sm" onclick="recallHero('${h.id}')">撤離</button></div></div>`;
    }).join('');
    const idleHeroes = territoryHeroes.filter(h => h.status === 'idle' && (h.fatigue || 0) < 90);
    const pickRows = idleHeroes.map(h => `<div class="hero-pick-row"><span style="font-size:22px">${HERO_CLASSES[h.class].icon}</span><div class="hp-info"><div class="hp-name">${esc(h.name)} Lv.${h.level}</div></div><button class="btn btn-purple btn-sm" onclick="dispatchAbyss('${h.id}')">進入深淵</button></div>`).join('');
    abyssHtml = `<div class="section-label" style="margin-top:12px;">🕳 無盡深淵（歷史最佳 ${mapProgress.abyssBest || 0} 層）</div>${runRows}${abyssHeroes.length === 0 ? (pickRows || '<div class="empty-state">沒有可進入深淵的獵人</div>') : ''}`;
  }
  $('abyss-section').innerHTML = abyssHtml;
}
import { abyssUnlocked, dispatchAbyss } from './expeditions.js';
export function spawnCraftOrder() {
  const craftable = Object.values(ITEMS).filter(d => isGear(d.id) && BuildingSystem_getLevel(d.req.b) >= d.req.lv);
  if (!craftable.length) return;
  const def = import_choice(craftable);
  const price = Math.round(def.price * 1.5);
  craftOrders.push({ id: 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), itemId: def.id, price, expiresIn: 180 });
  showToast(`📜 新委託：${price}🪙 收購 ${def.icon}${def.name}（3 分鐘內交付）`, 'info');
  if (activePanel === 'shop') renderShopPanel();
}
import { choice as import_choice } from './util.js';
import { gearInventory } from './state.js';
export function renderShopPanel() {
  $('shop-filter').innerHTML = [['all', '全部'], ['weapon', '⚔️ 武器'], ['armor', '🛡 防具'], ['potion', '🧪 藥水'], ['accessory', '📿 飾品']]
    .map(([k, label]) => `<button class="report-sub-btn ${shopFilter === k ? 'active' : ''}" onclick="shopFilter='${k}';renderShopPanel()">${label}</button>`).join('');
  const tierBtn = (kind, mult, label) => `<button class="report-sub-btn ${priceMult[kind] === mult ? 'active' : ''}" onclick="setPriceTier('${kind}',${mult})">${label}</button>`;
  $('shop-stock').innerHTML = `<div class="section-label">🏪 村莊貨架（賣給獵人・營收累計 ${fmt(stats.shopRevenue || 0)}🪙）</div>
    <div class="shop-stock-row">🧪 藥水貨架 <b>${shopStock.healthPotion}/${potionStockCap()}</b>・售價 ${salePrice(25, 'potion')}🪙　${tierBtn('potion', 0.8, '薄利')}${tierBtn('potion', 1, '標準')}${tierBtn('potion', 1.6, '高價')}</div>
    <div class="shop-stock-row">⚒️ 裝備貨架 <b>${shopStock.gear}/${gearStockCap()}</b>・售價 ${salePrice(120, 'gear')}🪙　${tierBtn('gear', 0.8, '薄利')}${tierBtn('gear', 1, '標準')}${tierBtn('gear', 1.6, '高價')}</div>
    <div style="font-size:11px;color:var(--text-faint);margin-top:4px;">定價越高獵人越可能嫌貴不買；缺貨會讓獵人心情變差。貨架由煉金工房/鐵匠鋪自動補貨。</div>`;
  $('shop-grid').innerHTML = Object.values(ITEMS).filter(item => shopFilter === 'all' || item.type === shopFilter).map(item => {
    const chk = canCraft(item.id);
    return `<div class="shop-card rar-${item.rarity} ${chk.ok ? '' : 'locked-item'}"><div class="shop-ico">${item.icon}</div><div class="shop-name">${item.name}</div><div class="shop-stats">${itemStatsText(item)}${item.forClass ? '・' + CLASS_NAMES_ZH[item.forClass] : ''}</div><div class="shop-stock">倉庫 ×${invCount(item.id)}・售價 ${item.price}🪙</div><div class="shop-req">${chk.ok ? '' : chk.reason}</div><div class="building-cost">${Object.entries(item.cost).map(([rid, amt]) => `<span class="cost-item">${RESOURCES[rid].icon}${fmt(amt)}</span>`).join('')}</div><button class="btn btn-gold btn-sm" ${chk.ok ? '' : 'disabled'} onclick="craftItem('${item.id}')">製作</button></div>`;
  }).join('');
  $('shop-orders').innerHTML = craftOrders.length ? `<div class="section-label">📜 委託訂單（高價收購・限時）</div>` + craftOrders.map(o => {
    const d = ITEMS[o.itemId];
    const have = gearInventory.some(g => g.id === o.itemId);
    return `<div class="shop-stock-row">${d.icon} ${d.name} → <b style="color:var(--golden-wheat);">${o.price}🪙</b><span style="font-size:11px;color:${o.expiresIn < 30 ? 'var(--red)' : 'var(--text-faint)'};">（剩 ${o.expiresIn} 秒）</span> <button class="btn btn-gold btn-sm" ${have ? '' : 'disabled'} onclick="fulfillOrder('${o.id}')">交付</button></div>`;
  }).join('') : '';
  const potionInv = Object.entries(shopInventory).filter(([, qty]) => qty > 0);
  const gearGroups = {};
  for (const g of gearInventory) { const k = `${g.id}|${g.tier || 'normal'}|${g.affix || ''}`; gearGroups[k] = (gearGroups[k] || 0) + 1; }
  const commonCount = gearInventory.filter(g => ITEMS[g.id]?.rarity === 'common' && (g.tier || 'normal') === 'normal').length;
  const potionRows = potionInv.map(([id, qty]) => { const d = ITEMS[id]; return `<div class="inv-item rar-${d.rarity}"><span class="inv-ico">${d.icon}</span><span class="inv-name">${d.name}<span style="color:var(--text-faint);font-size:11px;">　${itemStatsText(d)}</span></span><span class="inv-qty">×${qty}</span><button class="btn btn-outline btn-sm" onclick="sellItem('${id}')">賣</button></div>`; });
  const gearRows = Object.entries(gearGroups).map(([k, qty]) => {
    const [id, tier, affix] = k.split('|');
    const d = ITEMS[id];
    const tc = GEAR_TIERS[tier]?.color;
    const affixText = affix ? '・' + (AFFIXES.find(a => a.id === affix)?.text || '') : '';
    const nameHtml = tc ? `<span style="color:${tc}">${gearDisplayName({ id, tier, affix })}</span>` : gearDisplayName({ id, tier, affix });
    return `<div class="inv-item rar-${d.rarity}"><span class="inv-ico">${d.icon}</span><span class="inv-name">${nameHtml}<span style="color:var(--text-faint);font-size:11px;">　${itemStatsText(d)}${affixText}</span></span><span class="inv-qty">×${qty}</span><button class="btn btn-outline btn-sm" title="分解為素材" onclick="salvageGear('${id}','${tier}','${affix}')">解</button><button class="btn btn-outline btn-sm" onclick="sellGear('${id}','${tier}','${affix}')">賣</button></div>`;
  });
  const allRows = potionRows.concat(gearRows).join('');
  $('inv-list').innerHTML = (commonCount ? `<button class="btn btn-outline btn-sm" onclick="sellAllCommons()">🪙 一鍵賣出普通裝（${commonCount} 件）</button>` : '') + (allRows || '<div class="empty-state">倉庫是空的</div>');
}
import { itemStatsText, shopInventory } from './state.js';
export function renderAchPanel() {
  const canPrestige = finalBossDefeated();
  $('ach-special').innerHTML = `<div class="ach-card special"><div class="ach-head"><span class="ach-ico">🌀</span><div><div class="ach-name">傳承重建</div><div class="ach-desc">擊敗魔域大君後重置獵魔村，換取永久傳承碎片。目前碎片 ${prestige.shards}（全產出 +${prestige.shards * 10}%），已重建 ${prestige.count} 次。</div><div class="ach-bonus">本次可獲得：${canPrestige ? getPrestigeGain() : '—'} 碎片</div></div><span class="ach-state ${canPrestige ? 'done' : ''}">${canPrestige ? '可重建' : '未解鎖'}</span></div><div class="modal-actions"><button class="btn btn-purple btn-sm" ${canPrestige ? '' : 'disabled'} onclick="doPrestige()">🌀 重建</button><button class="btn btn-gold btn-sm" onclick="checkDaily()">📅 每日獎勵</button></div></div>`;
  $('ach-list').innerHTML = ACHIEVEMENTS.map(a => { const done = !!achievementsUnlocked[a.id]; return `<div class="ach-card"><div class="ach-head"><span class="ach-ico">${a.icon}</span><div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div><div class="ach-bonus">${a.bonusText}</div></div><span class="ach-state ${done ? 'done' : ''}">${done ? '已完成' : '未完成'}</span></div></div>`; }).join('');
}
import { doPrestige, checkDaily } from './meta.js';
