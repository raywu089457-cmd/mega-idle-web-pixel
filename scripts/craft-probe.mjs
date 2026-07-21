import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { extname } from 'node:path';

const PORT = 8800;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    let p = req.url.split('?')[0]; if (p === '/') p = '/index.html';
    const body = await readFile('.' + p);
    res.writeHead(200, { 'Content-Type': MIME[extname('.' + p)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('404'); }
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('CON-ERR:', m.text()); });
page.on('pageerror', e => console.log('PAGEERR:', e.message));
await ctx.addInitScript(() => { try { localStorage.removeItem('kingdomBuilderSave'); } catch {} });
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load' });
await sleep(1500);
await page.evaluate(() => { try { window.closeOnboard?.(); } catch {} });
await sleep(300);
await page.evaluate(async () => {
  const [S, T, RB, D, H, SK, INV, META, COMBAT] = await Promise.all([
    import('/src/state.js'), import('/src/settings-and-init.js'), import('/src/resources-buildings.js'),
    import('/src/data.js'), import('/src/heroes-stats.js'), import('/src/skills.js'),
    import('/src/inventory.js'), import('/src/meta.js'), import('/src/combat.js'),
  ]);
  window.__sim = { S, T, RB, D, H, SK, INV, META, COMBAT };
});
await sleep(500);
await page.evaluate(() => { try { window.claimDaily?.(); } catch {}; try { window.collectOffline?.(); } catch {}; try { window.closeModal?.(); } catch {} });

// Tick a bit to accumulate materials
await page.evaluate(() => { for (let i = 0; i < 30; i++) window.__sim.T.gameTick(); });
await sleep(200);

const out = await page.evaluate(() => {
  const { S, INV, D, RB } = window.__sim;
  const before = {
    gold: S.resources.gold.value, woodRotten: S.resources.woodRotten.value, ironRusty: S.resources.ironRusty.value,
    gearLen: S.gearInventory.length,
    wsLevel: RB.BuildingSystem_getLevel('weaponShop')
  };
  const chk1 = INV.canCraft('woodenSword');
  let ok1 = null, after1 = null, msAfter = null;
  if (chk1.ok) {
    ok1 = window.craftItem('woodenSword');
    after1 = { gearLen: S.gearInventory.length, gold: S.resources.gold.value };
    const g = S.gearInventory[0];
    if (g) {
      const ms0 = S.resources.magicStones.value;
      window.salvageGear(g.id, g.tier || 'normal', g.affix || '');
      msAfter = { msBefore: ms0, msNow: S.resources.magicStones.value, newGold: S.resources.gold.value, newWood: S.resources.woodRotten.value, gearId: g.id, gearTier: g.tier };
    }
  }
  return { before, chk1, ok1, after1, msAfter };
});
console.log('CRAFT PROBE:', JSON.stringify(out, null, 2));

// Test full natural combat ms drop probability: dispatch a hero to zone1 easy and tick
const out2 = await page.evaluate(async () => {
  const { S, H } = window.__sim;
  const hero = S.territoryHeroes[0]; if (!hero) return { err: 'no-hero' };
  window.dispatchHero(hero.id, 1, 'easy', true);
  let msDrops = 0, goldWon = 0, battles = 0;
  for (let i = 0; i < 200; i++) {
    window.__sim.T.gameTick();
    if (!S.liveCombats[hero.id] && S.resources.magicStones.value > msDrops) {
      msDrops = S.resources.magicStones.value;
    }
  }
  return { msDrops, finalMs: S.resources.magicStones.value, goldFinal: S.resources.gold.value };
});
console.log('COMBAT MS PROBE (zone1 easy, 200 ticks):', JSON.stringify(out2, null, 2));

await browser.close();
server.close();
