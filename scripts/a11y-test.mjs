// scripts/a11y-test.mjs — axe-core a11y 掃描
// 啟動本地 HTTP server,跑 Playwright + axe-core,列出所有 violations
// 用法:node scripts/a11y-test.mjs
// 退出碼:0 無違規;1 有違規(critical/serious 計)

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { AxeBuilder } from '@axe-core/playwright';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const PORT = 8768;
const URL = `http://127.0.0.1:${PORT}/index.html`;
const STRICT = ['critical', 'serious'];   // 這些等級的違規算 fail

const server = createServer(async (req, res) => {
  try {
    let path = req.url.split('?')[0];
    if (path === '/') path = '/index.html';
    const file = '.' + path;
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch (e) { res.writeHead(404); res.end('not found'); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 480, height: 800 } });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'load' });
await sleep(2000);
// 關 onboarding modal
try { await page.evaluate(() => document.getElementById('modal-onboard')?.classList.remove('open')); } catch {}

const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  .analyze();

await browser.close();
server.close();

const violations = results.violations;
const total = violations.length;
const byImpact = violations.reduce((acc, v) => { acc[v.impact] = (acc[v.impact] || 0) + 1; return acc; }, {});

console.log('=== A11Y SCAN ===');
console.log('total violations:', total);
for (const [impact, count] of Object.entries(byImpact)) console.log(`  ${impact}: ${count}`);

const strictFails = violations.filter(v => STRICT.includes(v.impact));
console.log('\ncritical/serious fails:', strictFails.length);

for (const v of violations) {
  const marker = STRICT.includes(v.impact) ? '✗' : '·';
  console.log(`\n${marker} [${v.impact}] ${v.id} — ${v.help}`);
  console.log(`  ${v.helpUrl}`);
  console.log(`  ${v.nodes.length} node(s):`);
  for (const n of v.nodes.slice(0, 2)) {
    console.log(`    target: ${n.target.join(' ')}`);
    console.log(`    html: ${(n.html || '').slice(0, 100)}`);
  }
}

process.exit(strictFails.length ? 1 : 0);
