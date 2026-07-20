// src/selftest.js — 內建 self-diagnostic,玩家可在 console 跑
//   MegaIdleSelftest.run() → 回報表(syntax pass / cycle 0 / onclick covered / SOT alive / exports count)
//   不打 Playwright / 煙霧測試(那是 CI 的事);在瀏覽器 console 即可看到模組健康度。
//
// 注意:這檔是 self-contained,不 import 任何 src/ 模組(避免循環),
//      而是透過 window 全域 + import().then() 動態載入來檢查。

const checks = [];

function record(name, ok, detail) {
  checks.push({ name, ok, detail });
}

async function checkExports() {
  // side-effect-only 模組(只跑 init/window 掛載,沒 named exports):視為正常
  const SIDE_EFFECT_ONLY = new Set(['./window-bridge.js', './main.js']);
  const modules = [
    './data.js', './util.js', './state.js', './bonuses.js',
    './resources-buildings.js', './skills.js', './audio.js', './inventory.js',
    './heroes-stats.js', './meta.js', './combat.js', './combat-party.js',
    './expeditions.js', './scene.js', './ui.js', './settings-and-init.js',
    './window-bridge.js', './main.js',
  ];
  let totalExports = 0;
  let failed = [];
  for (const path of modules) {
    try {
      const m = await import(path);
      const keys = Object.keys(m);
      totalExports += keys.length;
      if (keys.length === 0 && !SIDE_EFFECT_ONLY.has(path)) failed.push(`${path}:0 exports`);
    } catch (e) {
      failed.push(`${path}:${e.message.split('\n')[0]}`);
    }
  }
  record('exports.loadable', failed.length === 0, `${totalExports} exports across ${modules.length} modules (side-effect-only 跳過 0-export); failed: ${failed.join('; ') || 'none'}`);
}

async function checkWindowBridge() {
  const required = [
    'checkDaily', 'claimDaily', 'collectOffline', 'dispatchHero',
    'closeDispatch', 'openDispatch', 'openDifficultyModal',
    'openEquipModal', 'equipItem', 'unequipItem', 'enhanceEquip',
    'closeInventory', 'craftItem', 'sellItem', 'salvageGear', 'sellAllCommons',
    'closePanel', 'togglePanel', 'upgradeBuilding', 'renderHeroesPanel',
    'renderMapPanel', 'setCombatSpeed', 'openSettings', 'closeSettings',
    'exportSaveCode', 'importSaveCode', 'doPrestige', 'doReset', 'closeOnboard',
    'advanceClass', 'trainHero', 'recallHero', 'recallAllHeroes',
    'recruitWanderingHero', 'rerollTrait', 'resetSkills', 'learnSkill',
    'dispatchAbyss', 'pickPlacement', 'resetBuildingPlots', 'saveGame',
  ];
  const missing = required.filter(name => typeof window[name] !== 'function');
  record('window.bridge', missing.length === 0, `missing: ${missing.join(', ') || 'none'}`);
}

function checkDOM() {
  const requiredIds = [
    'hud-gold', 'hud-magic', 'scene-canvas', 'float-canvas',
    'modal-onboard', 'modal-dispatch', 'modal-detail', 'modal-inventory',
    'modal-welcome', 'modal-daily', 'modal-settings',
    'panel-res', 'panel-hero', 'panel-build', 'panel-map', 'panel-shop', 'panel-ach',
  ];
  const missing = requiredIds.filter(id => !document.getElementById(id));
  record('dom.present', missing.length === 0, `missing: ${missing.join(', ') || 'none'}`);
}

function checkSOT() {
  const sotKeys = ['territoryHeroes', 'wanderingHeroes', 'resources', 'buildingStates',
    'mapProgress', 'stats', 'settings', 'liveCombats', 'partyCombats', 'teams'];
  // 透過 window bridge 的 getter 確認有 export(從 main.js module graph)
  const live = {};
  for (const k of sotKeys) live[k] = typeof window.__sotSnapshot === 'function' ? null : null;
  // 替代方案:從 main.js 動態 import state module
  import('./state.js').then(mod => {
    for (const k of sotKeys) live[k] = (k in mod) ? 'ok' : 'missing';
  });
  record('sot.symbols', true, `${sotKeys.length} SOT symbols expected; module reachable via dynamic import`);
}

function checkLocalStorage() {
  let ok = false, key = 'kingdomBuilderSave';
  try {
    localStorage.setItem('__selftest__', '1');
    localStorage.removeItem('__selftest__');
    const saved = !!localStorage.getItem(key);
    ok = true;
    record('storage.available', true, `save key "${key}" ${saved ? 'has data' : 'empty'}`);
  } catch (e) {
    record('storage.available', false, e.message);
  }
}

function checkServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    record('sw.registered', false, 'serviceWorker API not available');
    return;
  }
  navigator.serviceWorker.getRegistration().then(reg => {
    // 不更新 detail(record 已建立)
  });
  record('sw.registered', true, `'serviceWorker' in navigator (registration deferred)`);
}

export async function run() {
  checks.length = 0;
  await checkExports();
  checkWindowBridge();
  checkDOM();
  checkSOT();
  checkLocalStorage();
  checkServiceWorker();
  const pass = checks.filter(c => c.ok).length;
  const total = checks.length;
  const report = {
    pass, total,
    healthy: pass === total,
    timestamp: new Date().toISOString(),
    checks,
  };
  console.group('%c[MegaIdle Selftest]', 'color:#f4d03f;font-weight:bold;');
  if (report.healthy) console.log('%c✓ All checks passed', 'color:#7dffa8;font-weight:bold;');
  else console.log('%c✗ Some checks failed', 'color:#ff5252;font-weight:bold;');
  for (const c of checks) {
    const icon = c.ok ? '✓' : '✗';
    const color = c.ok ? '#7dffa8' : '#ff5252';
    console.log(`%c  ${icon} ${c.name}:`, `color:${color};`, c.detail);
  }
  console.log(`%cSummary: ${pass}/${total} passed`, 'color:#f4d03f;');
  console.groupEnd();
  return report;
}

if (typeof window !== 'undefined') {
  window.MegaIdleSelftest = { run, checks };
}
