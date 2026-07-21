// src/data.js — L0 純資料表
// 從 index.html L661-909 + L2543-2548 搬出
// 依賴: ./util.js (choice)
// 所有 const 對外 export

import { choice } from './util.js';

// ─── RESOURCES ───────────────────────────────────────────────────────
export const RESOURCES = {
  gold:        { name: '金幣', icon: '🪙', initial: 500, capacity: 99999 },
  magicStones: { name: '魔核', icon: '💠', initial: 0, capacity: 999 },
  fruitPoor:   { name: '獸肉', icon: '🍖', initial: 0, capacity: 500 },
  waterDirty:  { name: '清泉', icon: '💧', initial: 0, capacity: 500 },
  woodRotten:  { name: '木材', icon: '🪵', initial: 0, capacity: 500 },
  ironRusty:   { name: '鐵礦', icon: '⛏️', initial: 0, capacity: 500 },
  herbLow:     { name: '藥草', icon: '🌿', initial: 0, capacity: 500 },
};
export const MATERIAL_TYPES = ['fruitPoor', 'waterDirty', 'woodRotten', 'ironRusty', 'herbLow'];

// ─── BUILDINGS ───────────────────────────────────────────────────────
export const BUILDINGS = {
  monument:   { id: 'monument', name: '獵魔公會', description: '村莊核心。獵人回報的素材在此分類，每秒自動整理出獸肉、清泉、木材、鐵礦與藥草。', startLevel: 1, maxLevel: 10, baseCost: { gold: 500, woodRotten: 50, ironRusty: 20 }, costMultiplier: 2.0, icon: '🏰' },
  goldMine:   { id: 'goldMine', name: '市集', description: '村民與商旅交易的地方，持續產生金幣，並提升點擊公會號召村民幹活的收益。', startLevel: 0, maxLevel: 15, baseCost: { gold: 250, woodRotten: 60, ironRusty: 30 }, costMultiplier: 1.8, icon: '⚖️' },
  tavern:     { id: 'tavern', name: '獵人酒館', description: '流浪獵人會在此停留。升級可增加村莊獵人空位，並讓更強的流浪獵人更快造訪。', startLevel: 1, maxLevel: 5, baseCost: { gold: 300, woodRotten: 80 }, costMultiplier: 1.5, icon: '🍺' },
  weaponShop: { id: 'weaponShop', name: '鐵匠鋪', description: '打造獵魔武器。等級越高可製作越強武器，且全體獵人攻擊力提升。', startLevel: 1, maxLevel: 15, baseCost: { gold: 200, woodRotten: 50, ironRusty: 30 }, costMultiplier: 2.0, icon: '⚔️' },
  armorShop:  { id: 'armorShop', name: '皮甲工坊', description: '縫製獵魔防具。等級越高可製作越強防具，且全體獵人防禦力提升。', startLevel: 1, maxLevel: 12, baseCost: { gold: 200, ironRusty: 40, woodRotten: 20 }, costMultiplier: 2.0, icon: '🛡️' },
  potionShop: { id: 'potionShop', name: '煉金工房', description: '調配治療藥水，定期自動生產上架給獵人購買（營收歸村莊）。等級越高生產越快越多。', startLevel: 1, maxLevel: 10, baseCost: { gold: 200, herbLow: 50, waterDirty: 30 }, costMultiplier: 2.0, icon: '⚗️' },
  altar:      { id: 'altar', name: '魔核研究所', description: '解析魔核與怪物素材，永久提升全隊狩獵金幣與經驗獲取。', startLevel: 0, maxLevel: 10, baseCost: { gold: 400, magicStones: 3, herbLow: 40 }, costMultiplier: 2.0, icon: '🔯' },
  trinketShop:{ id: 'trinketShop', name: '飾品店', description: '打造護符、項鍊與戒指。等級越高可製作越強飾品，飾品帶有特殊詞綴。', startLevel: 0, maxLevel: 5, baseCost: { gold: 350, woodRotten: 60, magicStones: 2 }, costMultiplier: 1.9, icon: '📿' },
  restaurant: { id: 'restaurant', name: '餐廳', description: '供應獸肉料理。在酒館休息的獵人會付餐費（村莊收入），且心情恢復更快。', startLevel: 0, maxLevel: 5, baseCost: { gold: 280, fruitPoor: 60, woodRotten: 40 }, costMultiplier: 1.8, icon: '🍖' },
  drinkShop:  { id: 'drinkShop', name: '飲料店', description: '販售清泉飲品。心情普通的流浪獵人會來買飲料提振精神（村莊收入）。', startLevel: 0, maxLevel: 5, baseCost: { gold: 260, waterDirty: 60, woodRotten: 30 }, costMultiplier: 1.8, icon: '🥤' },
  inn:        { id: 'inn', name: '旅館', description: '提供乾淨床位。縮短獵人陣亡復活時間，村莊獵人休整回血更快。', startLevel: 0, maxLevel: 5, baseCost: { gold: 320, woodRotten: 80, ironRusty: 20 }, costMultiplier: 1.8, icon: '🛏️' },
  trainingGround: { id: 'trainingGround', name: '訓練場', description: '木樁與教官。村莊閒置獵人持續獲得經驗。', startLevel: 0, maxLevel: 5, baseCost: { gold: 300, woodRotten: 70, fruitPoor: 30 }, costMultiplier: 1.8, icon: '🎯' },
  enhanceForge: { id: 'enhanceForge', name: '強化爐', description: '改良鍛造火候，降低裝備強化的金幣費用。', startLevel: 0, maxLevel: 5, baseCost: { gold: 400, ironRusty: 80, magicStones: 2 }, costMultiplier: 1.9, icon: '⚒️' },
};
export const BUILDING_ORDER = ['monument', 'goldMine', 'tavern', 'restaurant', 'drinkShop', 'inn', 'weaponShop', 'armorShop', 'potionShop', 'trinketShop', 'enhanceForge', 'trainingGround', 'altar'];

// ─── HERO CLASSES ────────────────────────────────────────────────────
export const HERO_CLASSES = {
  warrior: { name: '劍士', baseHp: 100, baseAtk: 15, baseDef: 10, icon: '⚔️' },
  mage:    { name: '咒術師', baseHp: 70,  baseAtk: 25, baseDef: 5,  icon: '🧙' },
  rogue:   { name: '刺客', baseHp: 85,  baseAtk: 18, baseDef: 8,  icon: '🗡️' },
  archer:  { name: '遊俠', baseHp: 80, baseAtk: 20, baseDef: 7, icon: '🏹' },
  priest:  { name: '神官', baseHp: 90, baseAtk: 10, baseDef: 15, icon: '✝️' },
  paladin:     { name: '聖騎士', baseHp: 120, baseAtk: 17, baseDef: 13, icon: '🛡️' },
  archmage:    { name: '大魔導', baseHp: 80,  baseAtk: 30, baseDef: 6,  icon: '🔯' },
  shadowblade: { name: '影刃',   baseHp: 95,  baseAtk: 21, baseDef: 9,  icon: '🌑' },
  sniper:      { name: '神射手', baseHp: 90, baseAtk: 23, baseDef: 8,  icon: '🎯' },
  bishop:      { name: '主教',   baseHp: 105, baseAtk: 12, baseDef: 18, icon: '👑' },
};
export const CLASS_NAMES_ZH = { warrior: '劍士', mage: '咒術師', rogue: '刺客', archer: '遊俠', priest: '神官', paladin: '聖騎士', archmage: '大魔導', shadowblade: '影刃', sniper: '神射手', bishop: '主教' };
export const ADV_CLASSES = {
  paladin:     { name: '聖騎士', base: 'warrior', bonus: { hp: 0.20, def: 0.15 },        desc: 'HP +20%、防禦 +15%' },
  archmage:    { name: '大魔導', base: 'mage',    bonus: { atk: 0.20, msFind: 0.10 },    desc: '攻擊 +20%、魔核發現 +10%' },
  shadowblade: { name: '影刃',   base: 'rogue',   bonus: { atk: 0.10, crit: 0.08 },      desc: '攻擊 +10%、暴擊 +8%' },
  sniper:      { name: '神射手', base: 'archer',  bonus: { atk: 0.15, crit: 0.05 },      desc: '攻擊 +15%、暴擊 +5%' },
  bishop:      { name: '主教',   base: 'priest',  bonus: { hp: 0.15, def: 0.10 },        desc: 'HP +15%、防禦 +10%' },
};
export const CLASS_LINEAGE = Object.fromEntries(Object.entries(ADV_CLASSES).map(([k, v]) => [k, v.base]));
export function baseClassOf(cls) { return CLASS_LINEAGE[cls] || cls; }
export function advClassFor(cls) { return Object.keys(ADV_CLASSES).find(k => ADV_CLASSES[k].base === cls) || null; }

export function isGear(id) { const t = ITEMS[id]?.type; return t === 'weapon' || t === 'armor' || t === 'accessory'; }
export function rollGearTier() { const r = Math.random(); return r < 0.6 ? 'normal' : r < 0.9 ? 'fine' : 'legend'; }
export function makeGearInstance(id, opts = {}) {
  const def = ITEMS[id] || {};
  const tier = opts.tier || (opts.roll ? rollGearTier() : 'normal');
  let affix = opts.affix || null;
  if (!affix && tier === 'legend') affix = choice(AFFIXES).id;
  else if (!affix && tier === 'fine' && opts.roll && Math.random() < 0.4) affix = choice(AFFIXES).id;
  return { iid: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), id, tier, affix, plus: 0, name: def.name, icon: def.icon };
}
export function gearTierMult(tier) { return GEAR_TIERS[tier]?.mult || 1; }
export function gearDisplayName(inst) {
  const def = ITEMS[inst.id]; if (!def) return inst.id;
  const t = inst.tier === 'legend' ? '傳說・' : inst.tier === 'fine' ? '精良・' : '';
  const a = inst.affix ? '・' + (AFFIXES.find(x => x.id === inst.affix)?.name || '') : '';
  return t + def.name + a;
}
export function gearSellPrice(inst) { const base = ITEMS[inst.id]?.price || 0; return Math.round(base * (inst.tier === 'legend' ? 2.5 : inst.tier === 'fine' ? 1.5 : 1)); }

// 建築擺位(scene 用)
export const PLOT_BUILDINGS = ['tavern', 'guild', 'market', 'restaurant', 'drinkShop', 'forge', 'alchemy', 'research', 'gate'];
export const PLOT_COORDS = [
  { x: 16, y: 164 }, { x: 96, y: 132 }, { x: 184, y: 166 }, { x: 62, y: 188 }, { x: 158, y: 194 },
  { x: 22, y: 252 }, { x: 100, y: 258 }, { x: 178, y: 252 }, { x: 96, y: 314 },
];
export const PLOT_NAMES = { tavern: '獵人酒館', guild: '獵魔公會', market: '市集', restaurant: '餐廳', drinkShop: '飲料店', forge: '鐵匠鋪', alchemy: '煉金工房', research: '魔核研究所', gate: '獵場門' };
export const BUILDING_TO_SCENE = { tavern: 'tavern', monument: 'guild', goldMine: 'market', restaurant: 'restaurant', drinkShop: 'drinkShop', weaponShop: 'forge', potionShop: 'alchemy', altar: 'research' };
export const DEFAULT_PLOT_OF = Object.fromEntries(PLOT_BUILDINGS.map((b, i) => [b, i]));

export function weaponElement(hero) { const eq = hero.equipment?.weapon; return eq ? (ITEMS[eq.id]?.element || null) : null; }
export function elementCounterMult(hero, zone) { const w = weaponElement(hero); return (w && ELEMENT_BEATS[w] === zone?.element) ? 1.25 : 1; }
export function zoneWeaknessText(zone) { const w = Object.keys(ELEMENT_BEATS).find(k => ELEMENT_BEATS[k] === zone?.element); return w ? `${ELEMENT_NAMES[zone.element]}・弱${ELEMENT_NAMES[w]}` : (ELEMENT_NAMES[zone?.element] || ''); }

// ─── HUNTER NAMES / TYPES ────────────────────────────────────────────
export const HUNTER_NAMES = [
  '阿嵐','艾琳','白洛','班恩','碧翠','布蘭','凱恩','卡菈','塞德里','達尼','德菈','艾登','艾拉','芬恩','菲歐','蓋爾','格溫','哈洛','海莉','伊格','伊蓮','傑斯','喬安','凱爾','凱菈','里昂','莉亞','洛根','露西','瑪格','馬洛','米菈','奈德','妮娜','奧登','奧菈','派克','佩姬','昆恩','蕾娜','雷恩','羅莎','盧恩','山姆','瑟菈','索恩','塔莉','烏爾','薇拉','維克','溫蒂','桑德','雅菈','約恩','札克','佐伊','阿諾','貝拉','柯林','朵拉','埃蒙','芙拉','戈登','荷莉','伊凡','潔西','凱文','蘿拉','墨林','諾拉','奧利','寶拉','雷伊','芮塔','西蒙','蒂娜','尤金','薇薇','沃特','仙菈','阿祁','布蕾','卡洛','迪恩','艾茉','法羅','葛蕾','漢娜','伊索','賈桂','凱特','路德','梅茵','納特','歐琳','帕特','琪拉','羅倫','素娜','坦恩','尤娜','凡斯','温妮','希恩','雪莉','亞德','茵娜','傑洛','葵拉','雷德','米雅','諾恩','佩恩','珂菈','達洛','瑟恩','艾諾','斑','琴','嵐','霧','霜','焰','隼','狼','燕','熊','狐','貓','鴉','鹿','獅','藤','石','泉','星','月','嵐'
];

export const WANDERING_HERO_TYPES = [
  { typeId: 'wandering_warrior_1', class: 'warrior', name: '見習劍士', level: 1, dropGold: 20, dropMagicStoneChance: 0.1 },
  { typeId: 'wandering_warrior_2', class: 'warrior', name: '老練劍士', level: 5, dropGold: 50, dropMagicStoneChance: 0.15 },
  { typeId: 'wandering_mage_1', class: 'mage', name: '流浪咒術師', level: 2, dropGold: 25, dropMagicStoneChance: 0.12 },
  { typeId: 'wandering_mage_2', class: 'mage', name: '禁書術士', level: 7, dropGold: 60, dropMagicStoneChance: 0.18 },
  { typeId: 'wandering_rogue_1', class: 'rogue', name: '巷弄刺客', level: 1, dropGold: 15, dropMagicStoneChance: 0.08 },
  { typeId: 'wandering_rogue_2', class: 'rogue', name: '無聲獵手', level: 8, dropGold: 70, dropMagicStoneChance: 0.2 },
  { typeId: 'wandering_archer_1', class: 'archer', name: '遊蕩遊俠', level: 3, dropGold: 35, dropMagicStoneChance: 0.12 },
  { typeId: 'wandering_archer_2', class: 'archer', name: '鷹眼神射', level: 6, dropGold: 55, dropMagicStoneChance: 0.17 },
  { typeId: 'wandering_priest_1', class: 'priest', name: '旅行神官', level: 2, dropGold: 22, dropMagicStoneChance: 0.14 },
  { typeId: 'wandering_priest_2', class: 'priest', name: '聖印祭司', level: 7, dropGold: 58, dropMagicStoneChance: 0.2 },
];

// ─── RARITIES ────────────────────────────────────────────────────────
export const RARITIES = {
  normal: { id: 'normal', name: '普通', color: '#c8bfa8', weight: 60, starBonus: 0, walletMult: 1 },
  rare:   { id: 'rare', name: '稀有', color: '#5db3ff', weight: 28, starBonus: 1, walletMult: 1.3 },
  hero:   { id: 'hero', name: '英雄', color: '#b678ff', weight: 10, starBonus: 1, walletMult: 1.8 },
  legend: { id: 'legend', name: '傳說', color: '#ffb84d', weight: 2, starBonus: 2, walletMult: 2.6 },
};
export function rollRarity() {
  const total = Object.values(RARITIES).reduce((s, r) => s + r.weight, 0);
  let r = Math.random() * total;
  for (const k of Object.keys(RARITIES)) { r -= RARITIES[k].weight; if (r <= 0) return k; }
  return 'normal';
}

// ─── ZONES ───────────────────────────────────────────────────────────
export const ZONES = [
  {
    id: 1, name: '迷霧森林', icon: '🌲', element: 'nature',
    difficulties: {
      easy: { recommendedLevel: 1, enemies: [{ name: '腐牙野狼', hp: 20, atk: 5, def: 2 }, { name: '迷霧哥布林', hp: 15, atk: 4, def: 1 }], goldRange: [20, 40], magicStoneChance: 1.0, xp: 10, drops: ['healthPotion'] },
      normal: { recommendedLevel: 2, enemies: [{ name: '荊棘魔', hp: 35, atk: 8, def: 4 }, { name: '霧狼頭目', hp: 30, atk: 10, def: 3 }], goldRange: [40, 70], magicStoneChance: 1.0, xp: 20, drops: ['healthPotion', 'woodenSword'] },
      hard: { recommendedLevel: 3, enemies: [{ name: '枯木妖', hp: 50, atk: 12, def: 6 }, { name: '掠食藤', hp: 55, atk: 14, def: 5 }], goldRange: [70, 100], magicStoneChance: 1.0, xp: 35, drops: ['woodenSword', 'healthPotion'] },
    },
    boss: { name: '迷霧樹心', hp: 120, atk: 16, def: 8, goldRange: [150, 200], magicStoneChance: 1.0, drops: ['woodenSword', 'leatherArmor'], xp: 50, mechanic: 'regen' },
  },
  {
    id: 2, name: '腐化沼澤', icon: '🪷', element: 'poison',
    difficulties: {
      easy:   { recommendedLevel: 3, enemies: [{ name: '泥沼殭屍', hp: 40, atk: 10, def: 5 }, { name: '毒霧蛙', hp: 35, atk: 12, def: 4 }], goldRange: [50, 80], magicStoneChance: 1.0, xp: 15, drops: ['healthPotion', 'leatherArmor'] },
      normal: { recommendedLevel: 5, enemies: [{ name: '沼澤巫婆', hp: 60, atk: 14, def: 8 }, { name: '腐鱗鱷', hp: 70, atk: 16, def: 6 }], goldRange: [80, 130], magicStoneChance: 1.0, xp: 30, drops: ['huntersBow', 'ironDagger'] },
      hard:   { recommendedLevel: 6, enemies: [{ name: '疫病使徒', hp: 85, atk: 18, def: 10 }, { name: '深泥巨怪', hp: 95, atk: 20, def: 9 }], goldRange: [130, 180], magicStoneChance: 1.0, xp: 50, drops: ['ironDagger', 'huntersBow'] },
    },
    boss: { name: '腐化母巢', hp: 200, atk: 22, def: 12, goldRange: [250, 350], magicStoneChance: 1.0, drops: ['huntersBow', 'mysticStaff', 'ironArmor'], xp: 80, mechanic: 'poison' },
  },
  {
    id: 3, name: '荒廢礦坑', icon: '⛏️', element: 'earth',
    difficulties: {
      easy:   { recommendedLevel: 5, enemies: [{ name: '礦坑骷髏', hp: 55, atk: 14, def: 8 }, { name: '穴居魔', hp: 50, atk: 16, def: 7 }], goldRange: [70, 110], magicStoneChance: 1.0, xp: 20, drops: ['ironDagger', 'healthPotion'] },
      normal: { recommendedLevel: 7, enemies: [{ name: '鏽甲監工', hp: 80, atk: 18, def: 12 }, { name: '暗影爆破者', hp: 75, atk: 22, def: 10 }], goldRange: [110, 160], magicStoneChance: 1.0, xp: 40, drops: ['mysticStaff', 'ironArmor'] },
      hard:   { recommendedLevel: 9, enemies: [{ name: '礦心魔像', hp: 110, atk: 24, def: 14 }, { name: '深坑爬行者', hp: 120, atk: 26, def: 15 }], goldRange: [160, 220], magicStoneChance: 1.0, xp: 65, drops: ['mysticStaff', 'ironArmor'] },
    },
    boss: { name: '礦坑魔像王', hp: 300, atk: 28, def: 18, goldRange: [400, 500], magicStoneChance: 1.0, drops: ['ironArmor', 'mysticStaff', 'holyMace'], xp: 120, mechanic: 'shield' },
  },
  {
    id: 4, name: '熔岩裂谷', icon: '🌋', element: 'fire',
    difficulties: {
      easy:   { recommendedLevel: 7, enemies: [{ name: '熔岩蜥', hp: 70, atk: 18, def: 10 }, { name: '灰燼蝠', hp: 65, atk: 20, def: 9 }], goldRange: [100, 150], magicStoneChance: 1.0, xp: 25, drops: ['ironArmor', 'healthPotion'] },
      normal: { recommendedLevel: 9, enemies: [{ name: '焰角魔', hp: 100, atk: 22, def: 14 }, { name: '熔核祭司', hp: 95, atk: 26, def: 12 }], goldRange: [150, 200], magicStoneChance: 1.0, xp: 50, drops: ['holyMace', 'ironArmor'] },
      hard:   { recommendedLevel: 11, enemies: [{ name: '裂谷督軍', hp: 140, atk: 30, def: 18 }, { name: '黑曜巨兵', hp: 150, atk: 32, def: 20 }], goldRange: [200, 280], magicStoneChance: 1.0, xp: 80, drops: ['holyMace', 'mysticStaff'] },
    },
    boss: { name: '熔岩暴君', hp: 400, atk: 35, def: 22, goldRange: [500, 650], magicStoneChance: 1.0, drops: ['holyMace', 'knightArmor', 'mysticStaff'], xp: 160, mechanic: 'lifesteal' },
  },
  {
    id: 5, name: '魔域王座', icon: '👹', element: 'dark',
    difficulties: {
      easy:   { recommendedLevel: 10, enemies: [{ name: '魔域犬魔', hp: 100, atk: 24, def: 15 }, { name: '血咒騎士', hp: 110, atk: 26, def: 16 }], goldRange: [150, 220], magicStoneChance: 1.0, xp: 40, drops: ['mysticStaff', 'ironArmor'] },
      normal: { recommendedLevel: 12, enemies: [{ name: '虛空掠奪者', hp: 150, atk: 30, def: 20 }, { name: '王座守衛', hp: 160, atk: 32, def: 22 }], goldRange: [220, 300], magicStoneChance: 1.0, xp: 70, drops: ['holyMace', 'huntersBow'] },
      hard:   { recommendedLevel: 14, enemies: [{ name: '深淵執政官', hp: 200, atk: 38, def: 26 }, { name: '破滅領主', hp: 210, atk: 40, def: 28 }], goldRange: [300, 400], magicStoneChance: 1.0, xp: 100, drops: ['holyMace', 'knightArmor', 'mysticStaff'] },
    },
    boss: { name: '魔域大君', hp: 600, atk: 45, def: 30, goldRange: [800, 1000], magicStoneChance: 1.0, drops: ['holyMace', 'mysticStaff', 'knightArmor', 'huntersBow'], xp: 200, mechanic: 'aoe' },
  },
];

// ─── ITEMS ───────────────────────────────────────────────────────────
export const ITEMS = {
  woodenSword: { id: 'woodenSword', name: '獵人短刃', type: 'weapon', rarity: 'common', price: 30, cost: { woodRotten: 30, ironRusty: 10 }, icon: '🗡️', forClass: 'warrior', atk: 5, element: 'thunder', req: { b: 'weaponShop', lv: 1 } },
  ironDagger: { id: 'ironDagger', name: '毒牙匕首', type: 'weapon', rarity: 'rare', price: 80, cost: { ironRusty: 40, gold: 200 }, icon: '🔪', forClass: 'rogue', atk: 9, crit: 0.08, element: 'poison', req: { b: 'weaponShop', lv: 2 } },
  huntersBow: { id: 'huntersBow', name: '穿甲長弓', type: 'weapon', rarity: 'rare', price: 90, cost: { woodRotten: 50, ironRusty: 30 }, icon: '🏹', forClass: 'archer', atk: 13, element: 'nature', req: { b: 'weaponShop', lv: 3 } },
  holyMace: { id: 'holyMace', name: '聖印戰錘', type: 'weapon', rarity: 'rare', price: 95, cost: { ironRusty: 35, herbLow: 40 }, icon: '✝️', forClass: 'priest', atk: 12, def: 4, element: 'holy', req: { b: 'weaponShop', lv: 4 } },
  mysticStaff: { id: 'mysticStaff', name: '咒核法杖', type: 'weapon', rarity: 'epic', price: 150, cost: { magicStones: 5, herbLow: 50 }, icon: '🔮', forClass: 'mage', atk: 17, msFind: 0.15, element: 'ice', req: { b: 'weaponShop', lv: 5 } },
  leatherArmor: { id: 'leatherArmor', name: '獸皮輕甲', type: 'armor', rarity: 'common', price: 40, cost: { woodRotten: 20, fruitPoor: 20 }, icon: '🥋', def: 5, hp: 20, req: { b: 'armorShop', lv: 1 } },
  ironArmor: { id: 'ironArmor', name: '獵魔鎧甲', type: 'armor', rarity: 'rare', price: 120, cost: { ironRusty: 80, gold: 600 }, icon: '🛡️', def: 10, hp: 40, req: { b: 'armorShop', lv: 2 } },
  knightArmor: { id: 'knightArmor', name: '屠魔重甲', type: 'armor', rarity: 'epic', price: 300, cost: { ironRusty: 120, magicStones: 3, gold: 1000 }, icon: '⚜️', def: 16, hp: 80, req: { b: 'armorShop', lv: 4 } },
  healthPotion: { id: 'healthPotion', name: '治療藥水', type: 'potion', rarity: 'common', price: 25, cost: { herbLow: 20, waterDirty: 15 }, icon: '🧪', healPct: 0.3, req: { b: 'potionShop', lv: 1 } },
  hunterCharm: { id: 'hunterCharm', name: '獵魔護符', type: 'accessory', rarity: 'rare', price: 180, cost: { magicStones: 4, herbLow: 60 }, icon: '🧿', crit: 0.06, msFind: 0.1, req: { b: 'trinketShop', lv: 1 } },
  wolfFang: { id: 'wolfFang', name: '狼牙項鍊', type: 'accessory', rarity: 'rare', price: 150, cost: { fruitPoor: 80, ironRusty: 40 }, icon: '📿', atk: 7, req: { b: 'trinketShop', lv: 2 } },
  springRing: { id: 'springRing', name: '清泉戒指', type: 'accessory', rarity: 'epic', price: 220, cost: { waterDirty: 90, magicStones: 3 }, icon: '💍', hp: 60, def: 4, req: { b: 'trinketShop', lv: 3 } },
  // ─── NEW: Tier 0 starter weapons (Lv 1 alternative to woodenSword) ───
  woodenClub: { id: 'woodenClub', name: '粗木棍', type: 'weapon', rarity: 'common', price: 20, cost: { woodRotten: 20 }, icon: '🪵', forClass: 'warrior', atk: 3, element: 'earth', req: { b: 'weaponShop', lv: 1 } },
  clothRobe: { id: 'clothRobe', name: '學徒布袍', type: 'armor', rarity: 'common', price: 25, cost: { fruitPoor: 15, waterDirty: 10 }, icon: '🥼', def: 3, hp: 15, req: { b: 'armorShop', lv: 1 } },
  // ─── NEW: Epic class-locked weapons (parallel to mysticStaff) ───
  arcaneBlade: { id: 'arcaneBlade', name: '秘紋闊刃', type: 'weapon', rarity: 'epic', price: 170, cost: { magicStones: 5, ironRusty: 60 }, icon: '⚔️', forClass: 'warrior', atk: 22, def: 3, element: 'thunder', req: { b: 'weaponShop', lv: 6 } },
  shadowBlade: { id: 'shadowBlade', name: '影契短刃', type: 'weapon', rarity: 'epic', price: 160, cost: { magicStones: 5, fruitPoor: 80 }, icon: '🗡️', forClass: 'rogue', atk: 18, crit: 0.12, element: 'dark', req: { b: 'weaponShop', lv: 6 } },
  silverBow: { id: 'silverBow', name: '銀月長弓', type: 'weapon', rarity: 'epic', price: 180, cost: { magicStones: 5, woodRotten: 90 }, icon: '🏹', forClass: 'archer', atk: 24, element: 'ice', req: { b: 'weaponShop', lv: 6 } },
  crusadeMace: { id: 'crusadeMace', name: '十字戰錘', type: 'weapon', rarity: 'epic', price: 175, cost: { magicStones: 5, ironRusty: 50, herbLow: 30 }, icon: '🔨', forClass: 'priest', atk: 19, def: 6, hp: 30, element: 'holy', req: { b: 'weaponShop', lv: 6 } },
  // ─── NEW: Legendary weapons (peak power) ───
  dragonSlayer: { id: 'dragonSlayer', name: '屠龍巨刃', type: 'weapon', rarity: 'legendary', price: 500, cost: { magicStones: 30, ironRusty: 200, gold: 5000 }, icon: '🐉', forClass: 'warrior', atk: 65, element: 'fire', req: { b: 'weaponShop', lv: 10 } },
  voidStaff: { id: 'voidStaff', name: '虛空法杖', type: 'weapon', rarity: 'legendary', price: 500, cost: { magicStones: 30, herbLow: 200, gold: 5000 }, icon: '🌀', forClass: 'mage', atk: 55, msFind: 0.35, element: 'dark', req: { b: 'weaponShop', lv: 10 } },
  venomFang: { id: 'venomFang', name: '毒腺之牙', type: 'weapon', rarity: 'legendary', price: 500, cost: { magicStones: 30, fruitPoor: 200, gold: 5000 }, icon: '🐍', forClass: 'rogue', atk: 48, crit: 0.22, element: 'poison', req: { b: 'weaponShop', lv: 10 } },
  galeBow: { id: 'galeBow', name: '暴風長弓', type: 'weapon', rarity: 'legendary', price: 500, cost: { magicStones: 30, woodRotten: 200, gold: 5000 }, icon: '🌪️', forClass: 'archer', atk: 72, element: 'thunder', req: { b: 'weaponShop', lv: 10 } },
  divineHammer: { id: 'divineHammer', name: '神聖之錘', type: 'weapon', rarity: 'legendary', price: 500, cost: { magicStones: 30, ironRusty: 100, herbLow: 100, gold: 5000 }, icon: '⚡', forClass: 'priest', atk: 52, def: 18, hp: 90, element: 'holy', req: { b: 'weaponShop', lv: 10 } },
  // ─── NEW: Legendary armor (buffed for endgame relevance) ───
  phoenixArmor: { id: 'phoenixArmor', name: '鳳凰戰甲', type: 'armor', rarity: 'legendary', price: 450, cost: { magicStones: 22, ironRusty: 150, gold: 4000 }, icon: '🦅', def: 40, hp: 180, req: { b: 'armorShop', lv: 8 } },
  // ─── NEW: T5 MYTHIC tier (Lv 200+ endgame content) ───
  // Massively higher stats so they stay meaningful at high levels (10-18% contribution at Lv 300-500).
  infernoGreatsword: { id: 'infernoGreatsword', name: '烈焰巨劍', type: 'weapon', rarity: 'legendary', price: 1200, cost: { magicStones: 80, ironRusty: 300, gold: 15000 }, icon: '🔥', forClass: 'warrior', atk: 180, def: 15, hp: 100, element: 'fire', req: { b: 'weaponShop', lv: 14, altar: 10 } },
  eternityStaff: { id: 'eternityStaff', name: '永恆之杖', type: 'weapon', rarity: 'legendary', price: 1200, cost: { magicStones: 80, herbLow: 300, gold: 15000 }, icon: '✨', forClass: 'mage', atk: 160, msFind: 0.5, element: 'holy', req: { b: 'weaponShop', lv: 14, altar: 10 } },
  voidPiercer: { id: 'voidPiercer', name: '虛空穿刺者', type: 'weapon', rarity: 'legendary', price: 1200, cost: { magicStones: 80, fruitPoor: 300, gold: 15000 }, icon: '🌌', forClass: 'rogue', atk: 140, crit: 0.3, element: 'dark', req: { b: 'weaponShop', lv: 14, altar: 10 } },
  skySplitter: { id: 'skySplitter', name: '裂天之弓', type: 'weapon', rarity: 'legendary', price: 1200, cost: { magicStones: 80, woodRotten: 300, gold: 15000 }, icon: '🌠', forClass: 'archer', atk: 200, element: 'thunder', req: { b: 'weaponShop', lv: 14, altar: 10 } },
  genesisMace: { id: 'genesisMace', name: '創世紀之錘', type: 'weapon', rarity: 'legendary', price: 1200, cost: { magicStones: 80, ironRusty: 150, herbLow: 150, gold: 15000 }, icon: '🌍', forClass: 'priest', atk: 150, def: 30, hp: 150, element: 'holy', req: { b: 'weaponShop', lv: 14, altar: 10 } },
  aegisPlate: { id: 'aegisPlate', name: '神盾鎧甲', type: 'armor', rarity: 'legendary', price: 1000, cost: { magicStones: 60, ironRusty: 200, gold: 12000 }, icon: '🛡️', def: 80, hp: 350, req: { b: 'armorShop', lv: 12, altar: 10 } },
  omnipotenceCrown: { id: 'omnipotenceCrown', name: '全能之冠', type: 'accessory', rarity: 'legendary', price: 1500, cost: { magicStones: 100, ironRusty: 100, herbLow: 100, woodRotten: 100, fruitPoor: 100, waterDirty: 100, gold: 20000 }, icon: '👑', atk: 35, def: 35, hp: 150, crit: 0.1, msFind: 0.25, req: { b: 'trinketShop', lv: 5, altar: 10 } },
  abyssReaver: { id: 'abyssReaver', name: '深淵撕裂者', type: 'weapon', rarity: 'legendary', price: 1500, cost: { magicStones: 120, ironRusty: 200, gold: 20000 }, icon: '🕳', atk: 220, element: 'dark', req: { b: 'weaponShop', lv: 15, altar: 10 } },
  // ─── NEW: New accessories (more variety for build diversity) ───
  amuletOfVigor: { id: 'amuletOfVigor', name: '活力護身符', type: 'accessory', rarity: 'rare', price: 160, cost: { fruitPoor: 100, herbLow: 50 }, icon: '📿', hp: 80, def: 5, req: { b: 'trinketShop', lv: 2 } },
  bootsOfSpeed: { id: 'bootsOfSpeed', name: '疾風之靴', type: 'accessory', rarity: 'rare', price: 170, cost: { waterDirty: 60, fruitPoor: 50, ironRusty: 30 }, icon: '👢', eva: 0.12, req: { b: 'trinketShop', lv: 3 } },
  ringOfMight: { id: 'ringOfMight', name: '力量戒指', type: 'accessory', rarity: 'rare', price: 180, cost: { ironRusty: 80, magicStones: 2 }, icon: '💍', atk: 12, req: { b: 'trinketShop', lv: 2 } },
  pendantOfWisdom: { id: 'pendantOfWisdom', name: '智者墜飾', type: 'accessory', rarity: 'epic', price: 250, cost: { herbLow: 100, magicStones: 5 }, icon: '🔯', xpMult: 0.15, msFind: 0.05, req: { b: 'trinketShop', lv: 4 } },
  cloakOfShadows: { id: 'cloakOfShadows', name: '暗影斗篷', type: 'accessory', rarity: 'epic', price: 280, cost: { fruitPoor: 100, magicStones: 4 }, icon: '🧥', crit: 0.1, eva: 0.08, req: { b: 'trinketShop', lv: 4 } },
  crownOfChampions: { id: 'crownOfChampions', name: '王者之冠', type: 'accessory', rarity: 'legendary', price: 500, cost: { magicStones: 15, ironRusty: 80, herbLow: 80, woodRotten: 80, fruitPoor: 80, waterDirty: 80, gold: 5000 }, icon: '👑', atk: 10, def: 10, hp: 50, crit: 0.05, msFind: 0.1, req: { b: 'trinketShop', lv: 5 } },
  // ─── NEW: Consumables (potions + scrolls) ───
  attackPotion: { id: 'attackPotion', name: '力量藥水', type: 'potion', rarity: 'rare', price: 60, cost: { herbLow: 30, ironRusty: 10 }, icon: '💪', atkBuff: 8, duration: 30, req: { b: 'potionShop', lv: 2 } },
  defensePotion: { id: 'defensePotion', name: '防禦藥水', type: 'potion', rarity: 'rare', price: 60, cost: { herbLow: 30, waterDirty: 20 }, icon: '🛡️', defBuff: 8, duration: 30, req: { b: 'potionShop', lv: 2 } },
  xpScroll: { id: 'xpScroll', name: '經驗卷軸', type: 'potion', rarity: 'epic', price: 200, cost: { herbLow: 100, magicStones: 2 }, icon: '📜', xpBuff: 100, req: { b: 'potionShop', lv: 3 } },
  goldMagnetScroll: { id: 'goldMagnetScroll', name: '聚金卷軸', type: 'potion', rarity: 'rare', price: 80, cost: { ironRusty: 30, magicStones: 1 }, icon: '🧲', goldBuff: 0.25, duration: 60, req: { b: 'potionShop', lv: 2 } },
};
export const RARITY_NAMES = { common: '普通', rare: '稀有', epic: '史詩', legendary: '傳說' };

// ─── GEAR TIERS / AFFIXES / SETS ─────────────────────────────────────
export const GEAR_TIERS = {
  normal: { name: '', mult: 1 },
  fine:   { name: '精良', mult: 1.15, color: '#5db3ff' },
  legend: { name: '傳說', mult: 1.30, color: '#ffb84d' },
};
export const AFFIXES = [
  { id: 'vamp',    name: '吸血', text: '擊殺回血 4%',    effect: st => { st.killHeal = (st.killHeal || 0) + 0.04; } },
  { id: 'hunter',  name: '獵手', text: '對頭目傷害 +12%', effect: st => { st.bossDmg = (st.bossDmg || 0) + 0.12; } },
  { id: 'scholar', name: '學者', text: '經驗 +10%',      effect: st => { st.xpMult *= 1.10; } },
  { id: 'miner',   name: '尋寶', text: '魔核發現 +8%',   effect: st => { st.msFind = (st.msFind || 0) + 0.08; } },
  { id: 'thorn',   name: '荊棘', text: '反彈 8% 承傷',   effect: st => { st.thorns = (st.thorns || 0) + 0.08; } },
];
export const GEAR_SETS = [
  { id: 'hunter', name: '獵魔套', pieces: ['woodenSword', 'ironArmor'], text: '對頭目傷害 +15%', effect: st => { st.bossDmg = (st.bossDmg || 0) + 0.15; } },
  { id: 'slayer', name: '屠魔套', pieces: ['holyMace', 'knightArmor'], text: '攻/防/HP +8%', effect: st => { st.atk = Math.round(st.atk * 1.08); st.def = Math.round(st.def * 1.08); st.maxHp = Math.round(st.maxHp * 1.08); } },
  // ─── NEW: 3-piece sets for late-game builds ───
  { id: 'dragon', name: '龍鱗套', pieces: ['dragonSlayer', 'phoenixArmor', 'crownOfChampions'], text: '攻擊 +25% + 對頭目 +20%', effect: st => { st.atk = Math.round(st.atk * 1.25); st.bossDmg = (st.bossDmg || 0) + 0.20; } },
  { id: 'void', name: '虛空套', pieces: ['voidStaff', 'phoenixArmor', 'pendantOfWisdom'], text: 'MP +50% + 經驗 +25%', effect: st => { st.msFind = (st.msFind || 0) + 0.5; st.xpMult *= 1.25; } },
  { id: 'shadow', name: '影行者套', pieces: ['shadowBlade', 'cloakOfShadows', 'bootsOfSpeed'], text: '爆擊 +15% + 閃避 +15%', effect: st => { st.crit = (st.crit || 0) + 0.15; st.eva = (st.eva || 0) + 0.15; } },
  { id: 'crusade', name: '十字軍套', pieces: ['crusadeMace', 'knightArmor', 'ringOfMight'], text: '攻 +20% + 防 +20% + HP +15%', effect: st => { st.atk = Math.round(st.atk * 1.20); st.def = Math.round(st.def * 1.20); st.maxHp = Math.round(st.maxHp * 1.15); } },
  { id: 'archer', name: '神射手套', pieces: ['silverBow', 'galeBow', 'amuletOfVigor'], text: '攻 +30% + HP +30%', effect: st => { st.atk = Math.round(st.atk * 1.30); st.maxHp = Math.round(st.maxHp * 1.30); } },
  // ─── NEW: Early-game 2-piece sets (accessibility for new players) ───
  { id: 'trainee', name: '見習套', pieces: ['woodenClub', 'clothRobe'], text: '全屬性 +5%', effect: st => { st.atk = Math.round(st.atk * 1.05); st.def = Math.round(st.def * 1.05); st.maxHp = Math.round(st.maxHp * 1.05); } },
  { id: 'beast', name: '野獸套', pieces: ['wolfFang', 'huntersBow'], text: '攻 +10%', effect: st => { st.atk = Math.round(st.atk * 1.10); } },
];

// ─── DIFFICULTY / ELEMENT / BOSS MECH ────────────────────────────────
export const DIFF_LABELS = { easy: '驅逐', normal: '討伐', hard: '獵殺', boss: '頭目' };
export const DIFF_COLORS = { easy: '#27ae60', normal: '#f39c12', hard: '#c0392b', boss: '#8e44ad' };
export const ELEMENT_NAMES = { thunder: '雷', poison: '毒', nature: '自然', ice: '冰', holy: '聖', earth: '土', fire: '火', dark: '暗' };
export const ELEMENT_BEATS = { thunder: 'earth', poison: 'nature', nature: 'poison', ice: 'fire', holy: 'dark' };
export const BOSS_MECH_TEXT = {
  regen: '🌱 頭目每 5 回合再生 HP！',
  poison: '☠️ 頭目的毒素每 3 回合侵蝕 HP！',
  shield: '🛡️ 頭目前 10 回合有堅固護盾，受到傷害 -40%！',
  lifesteal: '🩸 頭目會吸取反擊傷害回血！',
  aoe: '💥 頭目每 6 回合釋放無視防禦的毀滅衝擊！',
};
export const ENHANCE_MAX = 10;

// ─── TRAITS / ACHIEVEMENTS ───────────────────────────────────────────
export const TRAITS = [
  { id: 'eagle', name: '鷹眼', desc: '暴擊 +4%', apply: st => { st.crit += 0.04; } },
  { id: 'iron', name: '鐵壁', desc: '防禦 +8%', apply: st => { st.def = Math.round(st.def * 1.08); } },
  { id: 'swift', name: '迅捷', desc: '攻擊 +6%', apply: st => { st.atk = Math.round(st.atk * 1.06); } },
  { id: 'greed', name: '財迷', desc: '狩獵金幣 +8%', apply: st => { st.goldMult *= 1.08; } },
  { id: 'sage', name: '學者', desc: '經驗 +8%', apply: st => { st.xpMult *= 1.08; } },
  { id: 'tough', name: '強韌', desc: 'HP +10%', apply: st => { st.maxHp = Math.round(st.maxHp * 1.10); } },
];

export const ACHIEVEMENTS = [
  { id: 'kill1',    icon: '🩸', name: '首次狩獵', desc: '贏得 1 場狩獵', bonusText: '素材產出 +1%', bonus: { mat: 0.01 }, check: s => s.kills >= 1 },
  { id: 'kill100',  icon: '⚔️', name: '百獵好手', desc: '贏得 100 場狩獵', bonusText: '素材產出 +3%', bonus: { mat: 0.03 }, check: s => s.kills >= 100 },
  { id: 'kill500',  icon: '🎖️', name: '魔物剋星', desc: '贏得 500 場狩獵', bonusText: '狩獵金幣 +5%', bonus: { gold: 0.05 }, check: s => s.kills >= 500 },
  { id: 'boss1',    icon: '👑', name: '頭目獵人', desc: '擊敗 1 個頭目', bonusText: '全獵人攻擊 +2', bonus: { atk: 2 }, check: s => s.bossKills >= 1 },
  { id: 'bossAll',  icon: '👹', name: '五域淨化', desc: '擊敗全部 5 個頭目', bonusText: '全獵人攻擊 +5、防禦 +5', bonus: { atk: 5, def: 5 }, check: s => s.bossKills >= 5 },
  { id: 'gold10k',  icon: '💰', name: '村莊盈余', desc: '累積賺取 10,000 金幣', bonusText: '素材產出 +2%', bonus: { mat: 0.02 }, check: s => s.goldEarned >= 10000 },
  { id: 'gold100k', icon: '🏦', name: '商路大亨', desc: '累積賺取 100,000 金幣', bonusText: '點擊金幣 +2', bonus: { click: 2 }, check: s => s.goldEarned >= 100000 },
  { id: 'build15',  icon: '🏗️', name: '村莊成形', desc: '建築總等級達 15', bonusText: '素材產出 +2%', bonus: { mat: 0.02 }, check: (s, g) => g.totalBuildingLevels >= 15 },
  { id: 'build30',  icon: '🏰', name: '獵魔重鎮', desc: '建築總等級達 30', bonusText: '素材產出 +3%', bonus: { mat: 0.03 }, check: (s, g) => g.totalBuildingLevels >= 30 },
  { id: 'click100', icon: '👆', name: '勤勉村長', desc: '點擊公會 100 次', bonusText: '點擊金幣 +1', bonus: { click: 1 }, check: s => s.clicks >= 100 },
  { id: 'click1k',  icon: '🌟', name: '號召群眾', desc: '點擊公會 1,000 次', bonusText: '點擊金幣 +3', bonus: { click: 3 }, check: s => s.clicks >= 1000 },
  { id: 'daily7',   icon: '📅', name: '七日駐守', desc: '連續登入 7 天', bonusText: '經驗獲取 +5%', bonus: { xp: 0.05 }, check: (s, g) => g.dailyBestStreak >= 7 },
  { id: 'prestige1', icon: '🌀', name: '村莊再興', desc: '完成 1 次重建', bonusText: '素材產出 +5%', bonus: { mat: 0.05 }, check: s => s.prestiges >= 1 },
];

// ─── WEATHERS ────────────────────────────────────────────────────────
export const WEATHERS = {
  sunny: { name: '晴朗', icon: '☀️', weight: 40, desc: '風和日麗' },
  rain:  { name: '下雨', icon: '🌧️', weight: 25, desc: '藥草產出 +20%' },
  fog:   { name: '起霧', icon: '🌫️', weight: 20, desc: '魔核發現 +10%' },
  snow:  { name: '下雪', icon: '❄️', weight: 15, desc: '經驗 +10%、金幣產出 -10%' },
};

// ─── SKILL_TREE (L911 標題下的純資料表) ──────────────────────────────
// 注意:SKILL_TREE 的 effect 是 (st, lv) => void;屬於純資料。
// 進階職業(聖騎士/大魔導/影刃/神射手/主教)透過 baseClassOf() 繼承 base class 技能樹。
export const SKILL_TREE = {
  warrior: [
    { id: 'w_pow', name: '力量', icon: '💪', desc: '被動：攻擊力 +5%', type: 'passive', maxLevel: 5, effect: (st, lv) => { st.atk = Math.round(st.atk * (1 + 0.05 * lv)); } },
    { id: 'w_def', name: '鐵壁', icon: '🛡️', desc: '被動：防禦力 +5%', type: 'passive', maxLevel: 5, effect: (st, lv) => { st.def = Math.round(st.def * (1 + 0.05 * lv)); } },
    { id: 'w_crit', name: '怒斬', icon: '⚡', desc: '主動：暴擊率 +30%/級，持續 5 回合', type: 'active', maxLevel: 3, triggerRounds: 8, duration: 5, power: 0.3, effect: (st, lv) => { st.critBonus = (st.critBonus || 0) + 0.30 * lv; } },
    { id: 'w_hp', name: '堅韌', icon: '❤️', desc: '被動：HP 上限 +8%', type: 'passive', maxLevel: 5, effect: (st, lv) => { st.maxHp = Math.round(st.maxHp * (1 + 0.08 * lv)); } },
    { id: 'w_rage', name: '狂暴', icon: '🔥', desc: '主動：攻擊力 +25%/級，持續 3 回合', type: 'active', maxLevel: 3, triggerRounds: 10, duration: 3, power: 0.25, effect: (st, lv) => { st.atkBonus = (st.atkBonus || 0) + 0.25 * lv; } },
  ],
  mage: [
    { id: 'm_pow', name: '咒能', icon: '🔮', desc: '被動：攻擊力 +6%', type: 'passive', maxLevel: 5, effect: (st, lv) => { st.atk = Math.round(st.atk * (1 + 0.06 * lv)); } },
    { id: 'm_mp', name: '魔力', icon: '💠', desc: '被動：魔核發現率 +5%', type: 'passive', maxLevel: 5, effect: (st, lv) => { st.msFind = (st.msFind || 0) + 0.05 * lv; } },
    { id: 'm_fire', name: '烈焰', icon: '🔥', desc: '主動：範圍火焰攻擊，傷害 +40%/級', type: 'active', maxLevel: 3, triggerRounds: 9, power: 0.4, effect: (st, lv) => { st.skillDmgBonus = (st.skillDmgBonus || 0) + 0.40 * lv; } },
    { id: 'm_frost', name: '寒冰', icon: '❄️', desc: '主動：敵人凍結 2 回合無法反擊，傷害 +20%/級', type: 'active', maxLevel: 3, triggerRounds: 7, power: 0.2, effect: (st, lv) => { st.skillDmgBonus = (st.skillDmgBonus || 0) + 0.20 * lv; st.slowEnemy = 2; } },
    { id: 'm_xp', name: '博學', icon: '📖', desc: '被動：經驗獲取 +8%', type: 'passive', maxLevel: 5, effect: (st, lv) => { st.xpMult = (st.xpMult || 1) + 0.08 * lv; } },
  ],
  rogue: [
    { id: 'r_atk', name: '速攻', icon: '🗡️', desc: '被動：攻擊力 +5%', type: 'passive', maxLevel: 5, effect: (st, lv) => { st.atk = Math.round(st.atk * (1 + 0.05 * lv)); } },
    { id: 'r_crit', name: '背刺', icon: '🎯', desc: '主動：下次攻擊必定暴擊，傷害 +25%/級', type: 'active', maxLevel: 3, triggerRounds: 6, power: 0.25, effect: (st, lv) => { st.critBonus = (st.critBonus || 0) + 0.25 * lv; } },
    { id: 'r_eva', name: '霧影', icon: '💨', desc: '被動：閃避率 +4%', type: 'passive', maxLevel: 5, effect: (st, lv) => { st.eva = (st.eva || 0) + 0.04 * lv; } },
    { id: 'r_gold', name: '盜賊', icon: '💰', desc: '被動：金幣獲取 +6%', type: 'passive', maxLevel: 5, effect: (st, lv) => { st.goldMult = (st.goldMult || 1) + 0.06 * lv; } },
    { id: 'r_speed', name: '疾風', icon: '🌪️', desc: '主動：攻速提升，連續攻擊 2 次，傷害 -20%/級', type: 'active', maxLevel: 3, triggerRounds: 8, power: -0.2, effect: (st, lv) => { st.doubleAttack = (st.doubleAttack || 0) + 1; } },
  ],
  archer: [
    { id: 'a_atk', name: '狙擊', icon: '🏹', desc: '被動：攻擊力 +5%', type: 'passive', maxLevel: 5, effect: (st, lv) => { st.atk = Math.round(st.atk * (1 + 0.05 * lv)); } },
    { id: 'a_crit', name: '鷹眼', icon: '🦅', desc: '主動：暴擊率 +35%/級，持續 4 回合', type: 'active', maxLevel: 3, triggerRounds: 9, duration: 4, power: 0.35, effect: (st, lv) => { st.critBonus = (st.critBonus || 0) + 0.35 * lv; } },
    { id: 'a_hp', name: '野性', icon: '🐺', desc: '被動：HP 上限 +6%', type: 'passive', maxLevel: 5, effect: (st, lv) => { st.maxHp = Math.round(st.maxHp * (1 + 0.06 * lv)); } },
    { id: 'a_pierce', name: '貫穿', icon: '➡️', desc: '主動：穿透攻擊，無視敵人 30% 防禦/級', type: 'active', maxLevel: 3, triggerRounds: 7, power: 0.30, effect: (st, lv) => { st.pierce = (st.pierce || 0) + 0.30 * lv; } },
    { id: 'a_gold', name: '獵人', icon: '🦌', desc: '被動：金幣獲取 +5%', type: 'passive', maxLevel: 5, effect: (st, lv) => { st.goldMult = (st.goldMult || 1) + 0.05 * lv; } },
  ],
  priest: [
    { id: 'p_hp', name: '神聖', icon: '✝️', desc: '被動：HP 上限 +6%', type: 'passive', maxLevel: 5, effect: (st, lv) => { st.maxHp = Math.round(st.maxHp * (1 + 0.06 * lv)); } },
    { id: 'p_heal', name: '治愈', icon: '💚', desc: '主動：治療自己 HP 的 25%/級', type: 'active', maxLevel: 3, triggerRounds: 8, power: 0.25, effect: (st, lv) => { st.healPower = (st.healPower || 0) + 0.25 * lv; } },
    { id: 'p_def', name: '庇護', icon: '🛡️', desc: '被動：防禦力 +5%', type: 'passive', maxLevel: 5, effect: (st, lv) => { st.def = Math.round(st.def * (1 + 0.05 * lv)); } },
    { id: 'p_smite', name: '懲擊', icon: '⚡', desc: '主動：神聖打擊，傷害 +30%/級', type: 'active', maxLevel: 3, triggerRounds: 7, power: 0.30, effect: (st, lv) => { st.skillDmgBonus = (st.skillDmgBonus || 0) + 0.30 * lv; } },
    { id: 'p_xp', name: '祈福', icon: '🙏', desc: '被動：經驗獲取 +6%', type: 'passive', maxLevel: 5, effect: (st, lv) => { st.xpMult = (st.xpMult || 1) + 0.06 * lv; } },
  ],
};
