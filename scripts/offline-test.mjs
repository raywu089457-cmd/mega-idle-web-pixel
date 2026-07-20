// scripts/offline-test.mjs — PWA 離線測試
// 1. 啟動 HTTP server
// 2. Playwright 開頁,確認 SW 註冊成功
// 3. 等 service worker activate,把 cache 填好
// 4. 切到離線(context.setOffline(true))
// 5. 重新 reload,確認 init() 仍跑、遊戲仍載入
// 6. 截圖離線畫面
// 退出碼:0 離線仍可用;1 離線失效

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const PORT = 8767;
const URL = `http://127.0.0.1:${PORT}/index.html`;
const OUT_PNG = 'offline-test.png';

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
const ctx = await browser.newContext({ viewport: { width: 480, height: 800 } });  // 模擬手機
const page = await ctx.newPage();

const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(e.message));

console.log('=== PWA OFFLINE TEST ===');
console.log('URL:', URL);

// 階段 1:在線載入,確認 SW 註冊
console.log('\n[1/4] online: load + register SW');
await page.goto(URL, { waitUntil: 'load' });
await sleep(2000);
const onlineState = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  const cacheNames = reg ? await caches.keys() : [];
  // 列出每個 cache 的 keys
  const allKeys = {};
  for (const name of cacheNames) {
    const c = await caches.open(name);
    const reqs = await c.keys();
    allKeys[name] = reqs.map(r => new URL(r.url).pathname);
  }
  return {
    swRegistered: !!reg,
    swActive: !!(reg && reg.active),
    cacheNames,
    allKeys,
    hudGold: document.getElementById('hud-gold')?.textContent || '?',
    sceneCanvas: !!document.getElementById('scene-canvas'),
    floatCanvas: !!document.getElementById('float-canvas'),
    onInit: typeof window.dispatchHero === 'function',
  };
});
console.log('  SW registered:', onlineState.swRegistered, '/ active:', onlineState.swActive);
console.log('  caches:', onlineState.cacheNames);
console.log('  cached files per cache:');
for (const [name, files] of Object.entries(onlineState.allKeys)) {
  console.log(`    ${name}: ${files.length} files`);
  for (const f of files) console.log(`      - ${f}`);
}
console.log('  HUD gold:', onlineState.hudGold);
console.log('  Canvases:', `scene=${onlineState.sceneCanvas} float=${onlineState.floatCanvas}`);
console.log('  window-bridge:', onlineState.onInit ? '✓ active' : '✗ missing');

// 等 SW activate + fetch 觸發快取填充
await sleep(3000);

// 階段 2:切離線
console.log('\n[2/4] set offline: context.setOffline(true)');
await ctx.setOffline(true);
console.log('  ✓ offline mode engaged');

// 階段 3:reload(從 cache 載入)
console.log('\n[3/4] offline: reload page');
const reloadErrors = [];
const failedRequests = [];
page.on('pageerror', (e) => reloadErrors.push(e.message));
page.on('requestfailed', (req) => {
  if (!req.url().endsWith('/favicon.ico')) failedRequests.push(req.url().replace(URL.replace('/index.html', ''), ''));
});
await page.reload({ waitUntil: 'load' });
await sleep(3000);
const offlineState = await page.evaluate(() => ({
  hudGold: document.getElementById('hud-gold')?.textContent || '?',
  sceneCanvas: !!document.getElementById('scene-canvas'),
  floatCanvas: !!document.getElementById('float-canvas'),
  onInit: typeof window.dispatchHero === 'function',
  onClose: typeof window.closePanel === 'function',
  panels: document.querySelectorAll('.panel').length,
  onToggle: typeof window.togglePanel === 'function',
}));
console.log('  failed requests:', failedRequests.length);
for (const r of failedRequests.slice(0, 10)) console.log('    -', r);
console.log('  HUD gold:', offlineState.hudGold);
console.log('  Canvases:', `scene=${offlineState.sceneCanvas} float=${offlineState.floatCanvas}`);
console.log('  window-bridge:', `dispatchHero=${offlineState.onInit} closePanel=${offlineState.onClose}`);
console.log('  panels:', offlineState.panels);

// 階段 4:截圖
console.log('\n[4/4] screenshot offline state');
await page.screenshot({ path: OUT_PNG, fullPage: false });
console.log('  ✓ saved to ' + OUT_PNG);

await browser.close();
server.close();

// 結論
const allOnline = onlineState.swRegistered && onlineState.hudGold !== '?' && onlineState.sceneCanvas;
const allOffline = offlineState.hudGold !== '?' && offlineState.sceneCanvas && offlineState.onInit && offlineState.panels >= 6;
console.log('\n=== RESULT ===');
console.log('online :', allOnline ? '✓ 遊戲可載入' : '✗ 失敗');
console.log('offline:', allOffline ? '✓ PWA cache 生效' : '✗ 離線失效');
console.log('errors :', consoleErrors.length + reloadErrors.length, '(online', consoleErrors.length, '/ offline', reloadErrors.length, ')');
if (consoleErrors.length) console.log('  online errors:', consoleErrors.slice(0, 3));
if (reloadErrors.length) console.log('  offline errors:', reloadErrors.slice(0, 3));

const exit = allOnline && allOffline ? 0 : 1;
process.exit(exit);
