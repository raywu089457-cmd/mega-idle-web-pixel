// src/inventory.js — L2 庫存 / 商店 / 裝備 / 強化
// 從 index.html L1578-1745 搬出
// 設計:不 import audio.js / ui.js;UI 副作用(sfx/showToast/renderAll)由 caller 負責

import {
  ITEMS, BUILDINGS, GEAR_TIERS, AFFIXES, CLASS_NAMES_ZH, RESOURCES, ENHANCE_MAX,
  isGear, makeGearInstance, gearTierMult, gearDisplayName, gearSellPrice,
  baseClassOf,
} from './data.js';
import { gearInventory, shopInventory, MAX_INV, setEquipPick } from './state.js';
import { $, showToast, hideModal, showModal, esc, uid } from './util.js';
import { ResourceSystem_spend, ResourceSystem_canAfford, ResourceSystem_add, gainGold, BuildingSystem_getLevel } from './resources-buildings.js';
import { getHeroStats, getEquipBonuses } from './heroes-stats.js';

// ═══════════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════════
export function invCount(itemId) {
  if (isGear(itemId)) return gearInventory.filter(g => g.id === itemId).length;
  return shopInventory[itemId] || 0;
}
export function invTotal() { return Object.values(shopInventory).reduce((s, n) => s + (n || 0), 0) + gearInventory.length; }
export function addItem(itemId, qty = 1, opts = {}) {
  if (!ITEMS[itemId] || qty <= 0) return false;
  if (invTotal() + qty > MAX_INV) return false;
  if (isGear(itemId)) {
    for (let i = 0; i < qty; i++) gearInventory.push(makeGearInstance(itemId, opts));
    return true;
  }
  shopInventory[itemId] = (shopInventory[itemId] || 0) + qty;
  return true;
}
export function addGearInstance(inst) {
  if (invTotal() + 1 > MAX_INV) return false;
  gearInventory.push({ ...inst });
  return true;
}
export function takeGearInstance(itemId) {
  const idx = gearInventory.findIndex(g => g.id === itemId);
  if (idx < 0) return null;
  return gearInventory.splice(idx, 1)[0];
}
export function addDropItem(itemId) {
  const def = ITEMS[itemId]; if (!def) return null;
  if (!isGear(itemId)) return addItem(itemId, 1) ? def.icon + def.name : null;
  const inst = makeGearInstance(itemId, { roll: true });
  if (!addGearInstance(inst)) return null;
  return def.icon + gearDisplayName(inst);
}
export function removeItem(itemId, qty = 1) {
  if (isGear(itemId)) {
    let removed = 0;
    for (let i = gearInventory.length - 1; i >= 0 && removed < qty; i--) {
      if (gearInventory[i].id === itemId) { gearInventory.splice(i, 1); removed++; }
    }
    return removed === qty;
  }
  if (invCount(itemId) < qty) return false;
  shopInventory[itemId] -= qty;
  if (shopInventory[itemId] <= 0) delete shopInventory[itemId];
  return true;
}

export function itemStatsText(def) {
  const parts = [];
  if (def.atk) parts.push(`攻+${def.atk}`);
  if (def.def) parts.push(`防+${def.def}`);
  if (def.hp) parts.push(`HP+${def.hp}`);
  if (def.crit) parts.push(`暴擊+${Math.round(def.crit * 100)}%`);
  if (def.msFind) parts.push(`魔核+${Math.round(def.msFind * 100)}%`);
  if (def.healPct) parts.push(`恢復${Math.round(def.healPct * 100)}%HP`);
  return parts.join('・');
}

export function potionStockCap() { return 8 + BuildingSystem_getLevel('potionShop') * 2; }
export function gearStockCap() { return 3 + BuildingSystem_getLevel('weaponShop') + BuildingSystem_getLevel('armorShop'); }
export function salePrice(base, kind) { return Math.max(1, Math.round(base * priceMult[kind] * 1.2)); }
import { priceMult } from './state.js';
export function setPriceTier(kind, mult) { priceMult[kind] = mult; }
export function getShopStock() { return shopStock; }
import { shopStock } from './state.js';
export function getPriceMult() { return priceMult; }

// ═══════════════════════════════════════════════════════════════════
// CRAFT / SELL
// ═══════════════════════════════════════════════════════════════════
export function canCraft(itemId) {
  const def = ITEMS[itemId]; if (!def) return { ok: false, reason: '未知物品' };
  const lv = BuildingSystem_getLevel(def.req.b);
  if (lv < def.req.lv) return { ok: false, reason: `${BUILDINGS[def.req.b].name} Lv.${def.req.lv}` };
  if (invTotal() >= MAX_INV) return { ok: false, reason: '倉庫已滿' };
  if (!ResourceSystem_canAfford(def.cost)) return { ok: false, reason: '材料不足' };
  return { ok: true };
}
export function craftItem(itemId) {
  const def = ITEMS[itemId]; const chk = canCraft(itemId);
  if (!chk.ok) { showToast(chk.reason, 'error'); return; }
  ResourceSystem_spend(def.cost);
  addItem(itemId, 1); stats.crafted += 1;
  sfx('craft'); showToast(`製作完成：${def.icon} ${def.name}`, 'success');
}
import { stats } from './state.js';
import { sfx } from './audio.js';

export function sellItem(itemId) {
  const def = ITEMS[itemId]; if (!def || !removeItem(itemId, 1)) return;
  gainGold(def.price); sfx('gold'); showToast(`賣出 ${def.name} +${def.price}🪙`, 'info');
}
export function sellGear(id, tier, affix) {
  const idx = gearInventory.findIndex(g => g.id === id && (g.tier || 'normal') === tier && (g.affix || '') === (affix || ''));
  if (idx < 0) return;
  const inst = gearInventory.splice(idx, 1)[0];
  const price = gearSellPrice(inst);
  gainGold(price); sfx('gold'); showToast(`賣出 ${gearDisplayName(inst)} +${price}🪙`, 'info');
}
export function salvageGear(id, tier, affix) {
  const idx = gearInventory.findIndex(g => g.id === id && (g.tier || 'normal') === tier && (g.affix || '') === (affix || ''));
  if (idx < 0) return;
  const inst = gearInventory.splice(idx, 1)[0];
  const def = ITEMS[inst.id];
  const parts = [];
  for (const [rid, amt] of Object.entries(def.cost || {})) {
    if (rid === 'gold' || rid === 'magicStones') continue;
    const back = Math.max(1, Math.floor(amt / 2));
    ResourceSystem_add(rid, back); parts.push(`${RESOURCES[rid].icon}${back}`);
  }
  let ms = 0;
  const msChance = inst.tier === 'legend' ? 0.6 : inst.tier === 'fine' ? 0.3 : 0;
  if (Math.random() < msChance) { ms = 1; ResourceSystem_add('magicStones', 1); }
  sfx('craft'); showToast(`分解 ${gearDisplayName(inst)}：回收 ${parts.join(' ') || '—'}${ms ? ' +1💠' : ''}`, 'success');
}
export function sellAllCommons() {
  let total = 0, count = 0;
  const next = gearInventory.filter(g => {
    const d = ITEMS[g.id];
    if (d && d.rarity === 'common' && (g.tier || 'normal') === 'normal') { total += gearSellPrice(g); count++; return false; }
    return true;
  });
  gearInventory.length = 0; gearInventory.push(...next);
  if (!count) { showToast('沒有可賣的普通裝備。', 'info'); return; }
  gainGold(total); sfx('gold'); showToast(`賣出 ${count} 件普通裝備，+${total}🪙`, 'success');
}

// ═══════════════════════════════════════════════════════════════════
// EQUIP / UNEQUIP / ENHANCE
// ═══════════════════════════════════════════════════════════════════
import { territoryHeroes } from './state.js';
export function equipItem(heroId, iid) {
  const hero = territoryHeroes.find(h => h.id === heroId);
  const idx = gearInventory.findIndex(g => g.iid === iid);
  const inst = idx >= 0 ? gearInventory[idx] : null;
  const def = inst ? ITEMS[inst.id] : null;
  if (!hero || !def) return;
  if (def.forClass && def.forClass !== baseClassOf(hero.class)) { showToast(`${def.name} 限定 ${CLASS_NAMES_ZH[def.forClass]} 使用`, 'error'); return; }
  const slot = def.type;
  gearInventory.splice(idx, 1);
  if (hero.equipment[slot]) addGearInstance(hero.equipment[slot]);
  hero.equipment[slot] = inst;
  hero.hp = Math.min(hero.hp, getHeroStats(hero).maxHp);
  closeInventory(); sfx('equip'); showToast(`${hero.name} 裝備了 ${gearDisplayName(inst)}`, 'success');
}
export function unequipItem(heroId, slot) {
  const hero = territoryHeroes.find(h => h.id === heroId); if (!hero || !hero.equipment?.[slot]) return;
  if (!addGearInstance(hero.equipment[slot])) { showToast('倉庫已滿，無法卸下。', 'error'); return; }
  hero.equipment[slot] = null; sfx('click');
}
export function enhanceCost(eq) {
  const disc = 1 - BuildingSystem_getLevel('enhanceForge') * 0.06;
  return { gold: Math.max(10, Math.round(120 * ((eq.plus || 0) + 1) * disc)), magicStones: Math.floor(((eq.plus || 0) + 1) / 2) };
}
export function enhanceEquip(heroId, slot) {
  const hero = territoryHeroes.find(h => h.id === heroId); const eq = hero?.equipment?.[slot];
  if (!eq) return;
  if ((eq.plus || 0) >= ENHANCE_MAX) { showToast('已達強化上限。', 'info'); return; }
  if (!ResourceSystem_spend(enhanceCost(eq))) { showToast('強化材料不足。', 'error'); return; }
  eq.plus = (eq.plus || 0) + 1; sfx('enhance'); showToast(`強化成功 +${eq.plus}`, 'success');
}
export function compareItemText(candEq, curEq) {
  if (!curEq) return ' <span style="color:var(--green);font-size:11px;">（空位）</span>';
  const cand = getEquipBonuses(candEq);
  const cur = getEquipBonuses(curEq);
  const keys = [['atk', '攻'], ['def', '防'], ['hp', 'HP'], ['crit', '暴'], ['msFind', '核']];
  const parts = [];
  for (const [k, label] of keys) {
    const isPct = k === 'crit' || k === 'msFind';
    const d = isPct ? Math.round(((cand[k] || 0) - (cur[k] || 0)) * 100) : (cand[k] || 0) - (cur[k] || 0);
    if (d !== 0) parts.push(`<span style="color:${d > 0 ? 'var(--green)' : 'var(--red)'}">${label}${d > 0 ? '▲+' : '▼-'}${Math.abs(d)}${isPct ? '%' : ''}</span>`);
  }
  return parts.length ? ' ' + parts.join(' ') : ' <span style="color:var(--text-faint);font-size:11px;">（數值相同）</span>';
}
export function openEquipModal(heroId, slot) {
  setEquipPick({ heroId, slot });
  const hero = territoryHeroes.find(h => h.id === heroId); if (!hero) return;
  $('inv-modal-title').textContent = slot === 'weapon' ? '🗡 選擇武器' : slot === 'armor' ? '🛡 選擇防具' : '📿 選擇飾品';
  $('inv-modal-hero').textContent = `${hero.name}（${CLASS_NAMES_ZH[hero.class]}）— ${slot === 'accessory' ? '飾品不限職業' : '限定職業才可裝備'}`;
  const list = $('inv-modal-list');
  const options = gearInventory.filter(g => ITEMS[g.id]?.type === slot && (!ITEMS[g.id].forClass || ITEMS[g.id].forClass === hero.class));
  list.innerHTML = options.length ? options.map(g => {
    const d = ITEMS[g.id];
    const tc = GEAR_TIERS[g.tier]?.color;
    const affixText = g.affix ? '・' + (AFFIXES.find(a => a.id === g.affix)?.text || '') : '';
    return `<div class="hero-pick-row rar-${d.rarity}"><span style="font-size:22px">${d.icon}</span><div class="hp-info"><div class="hp-name">${tc ? `<span style="color:${tc}">${gearDisplayName(g)}</span>` : gearDisplayName(g)}</div><div class="hp-stats">${itemStatsText(d)}${affixText}${compareItemText(g, hero.equipment[slot])}</div></div><button class="btn btn-gold btn-sm" onclick="equipItem('${heroId}','${g.iid}')">裝備</button></div>`;
  }).join('') : '<div class="empty-state">倉庫沒有可用的對應裝備</div>';
  showModal('modal-inventory');
}
export function closeInventory() { setEquipPick(null); hideModal('modal-inventory'); }
