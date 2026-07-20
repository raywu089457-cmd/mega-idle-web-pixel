// scripts/screenshot.mjs — 多 viewport 視覺迴歸測試
// 啟動本地 HTTP server,跑遊戲 2 秒後截圖到 screenshots/
// 用法:
//   node scripts/screenshot.mjs              # 截圖到 screenshots/
//   node scripts/screenshot.mjs --update     # 覆蓋 baselines/*.png
//   node scripts/screenshot.mjs --compare    # 對比 baseline,差異 > 1% 報錯
//
// viewports: 手機 360x640, 平板 768x1024, 桌面 1280x720
// baselines: screenshots/baselines/<viewport>.png

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ARG = process.argv[2];
const UPDATE = ARG === '--update';
const COMPARE = ARG === '--compare';
const SHOTS = resolve(ROOT, 'screenshots');
const BASELINES = resolve(SHOTS, 'baselines');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const PORT = 8766;

const VIEWPORTS = [
  { name: 'mobile-360x640', width: 360, height: 640 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'desktop-1280x720', width: 1280, height: 720 },
];

const server = createServer(async (req, res) => {
  try {
    let path = req.url.split('?')[0];
    if (path === '/') path = '/index.html';
    const file = '.' + path;
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch (e) {
    res.writeHead(404); res.end('not found: ' + req.url);
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const URL = `http://127.0.0.1:${PORT}/index.html`;

await mkdir(SHOTS, { recursive: true });
await mkdir(BASELINES, { recursive: true });

const browser = await chromium.launch({ headless: true });
let pass = 0, fail = 0;
const report = [];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  await page.goto(URL, { waitUntil: 'load' });
  await sleep(2500); // 等 init() + 1~2 tick
  // 關掉 onboarding modal(以取得乾淨畫面)
  try { await page.evaluate(() => { window.closeOnboard?.(); document.getElementById('modal-onboard')?.classList.remove('open'); }); } catch {}
  await sleep(300);
  const shotPath = resolve(SHOTS, `${vp.name}.png`);
  await page.screenshot({ path: shotPath, fullPage: false });
  await ctx.close();

  // 對比 baseline(若存在)
  const baselinePath = resolve(BASELINES, `${vp.name}.png`);
  let baselineExists = false;
  try { await access(baselinePath); baselineExists = true; } catch {}

  if (COMPARE && baselineExists) {
    const a = PNG.sync.read(await readFile(baselinePath));
    const b = PNG.sync.read(await readFile(shotPath));
    if (a.width !== b.width || a.height !== b.height) {
      report.push(`✗ ${vp.name}: size mismatch ${a.width}x${a.height} vs ${b.width}x${b.height}`);
      fail++;
    } else {
      const diff = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.1 });
      const pct = (diff / (a.width * a.height)) * 100;
      if (pct > 1) {
        report.push(`✗ ${vp.name}: ${pct.toFixed(2)}% pixel diff (threshold 1%)`);
        fail++;
      } else {
        report.push(`✓ ${vp.name}: ${pct.toFixed(3)}% pixel diff`);
        pass++;
      }
    }
  } else if (UPDATE) {
    await writeFile(baselinePath, await readFile(shotPath));
    report.push(`✓ ${vp.name}: baseline updated`);
    pass++;
  } else {
    report.push(`✓ ${vp.name}: shot saved (no baseline comparison)`);
    pass++;
  }
  if (consoleErrors.length) {
    fail++;
    report.push(`  ${vp.name}: ${consoleErrors.length} console errors: ${consoleErrors[0].slice(0, 100)}`);
  }
}

await browser.close();
server.close();

console.log('=== SCREENSHOT REPORT ===');
for (const r of report) console.log('  ' + r);
console.log(`\n=== ${pass} pass / ${fail} fail ===`);
console.log(`\nshots: ${SHOTS}`);
console.log(`baselines: ${BASELINES}`);
if (COMPARE) console.log('(compare mode — fail if > 1% pixel diff)');
if (UPDATE) console.log('(update mode — overwrote baselines)');
process.exit(fail === 0 ? 0 : 1);
