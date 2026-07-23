import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext();
await ctx.addInitScript(() => { try { localStorage.removeItem('kingdomBuilderSave'); } catch (e) {} });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('PAGEERR:', e.message));
p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE_ERR:', m.text()); });
await p.goto('http://127.0.0.1:8766/index.html');
await new Promise(r => setTimeout(r, 3000));
const r = await p.evaluate(() => {
  const before = window.wanderingHeroes?.length;
  let threw = null;
  try { window.impls.spawnWanderingHero(); } catch (e) { threw = e.message; }
  const after = window.wanderingHeroes?.length;
  const fn = window.impls.spawnWanderingHero.toString();
  return { before, after, threw, fnSlice: fn.slice(0, 300) };
});
console.log('push test:', JSON.stringify(r, null, 2));
await b.close();
