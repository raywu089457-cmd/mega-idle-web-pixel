// scripts/smoke-test.mjs — Playwright headless 冒煙測試
// 啟動本地 HTTP server(ES module 需要 HTTP,file:// 會被 CORS 擋),跑 5 秒,收集 console 錯誤
// 用法:node scripts/smoke-test.mjs
// 退出碼:0 全綠;1 有錯誤

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { extname } from 'node:path';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const PORT = 8765;
const errors = [];
const warnings = [];

// 啟動本地靜態伺服器
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
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
const URL = `http://127.0.0.1:${PORT}/index.html`;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

page.on('console', (msg) => {
  const text = msg.text();
  if (msg.type() === 'error') errors.push(text);
  else if (msg.type() === 'warning') warnings.push(text);
});
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
page.on('requestfailed', (req) => {
  if (req.url().endsWith('/favicon.ico')) return;
  errors.push(`requestfailed: ${req.url()} - ${req.failure()?.errorText || 'unknown'}`);
});

try {
  await page.goto(URL, { waitUntil: 'load' });
  await sleep(5000);
  const hud = await page.evaluate(() => {
    return {
      hudGold: document.getElementById('hud-gold')?.textContent || '?',
      hudMagic: document.getElementById('hud-magic')?.textContent || '?',
      hcFruit: document.getElementById('hc-fruit')?.textContent || '?',
      hudStreak: document.getElementById('hud-streak')?.textContent || '?',
      sceneCanvas: !!document.getElementById('scene-canvas'),
      floatCanvas: !!document.getElementById('float-canvas'),
      panelCount: document.querySelectorAll('.panel').length,
      navCount: document.querySelectorAll('.nav-btn').length,
      onDispatchHero: !!window.dispatchHero,
      onClosePanel: !!window.closePanel,
      onToggleReport: !!window.toggleReport,
      localStorage: !!localStorage.getItem('kingdomBuilderSave'),
    };
  });
  await page.screenshot({ path: 'smoke-test.png', fullPage: false });
  // 嘗試點 panel 切換(模擬使用者)
  await page.click('#nav-hero', { timeout: 2000 }).catch(() => {});
  await sleep(500);
  const heroOpen = await page.evaluate(() => {
    return document.getElementById('panel-hero')?.classList.contains('open') || false;
  });
  console.log('=== SMOKE TEST RESULT ===');
  console.log('URL:', URL);
  console.log('HUD:', `gold=${hud.hudGold} magic=${hud.hudMagic} fruit=${hud.hcFruit} streak=${hud.hudStreak}`);
  console.log('Canvas: scene=' + hud.sceneCanvas + ' float=' + hud.floatCanvas);
  console.log('panels:', hud.panelCount, '/ navs:', hud.navCount);
  console.log('window bridge: dispatchHero=' + hud.onDispatchHero + ' closePanel=' + hud.onClosePanel + ' toggleReport=' + hud.onToggleReport);
  console.log('localStorage[kingdomBuilderSave]:', hud.localStorage);
  console.log('hero panel opens on click:', heroOpen);
  console.log('errors:', errors.length, '/ warnings:', warnings.length);
  if (errors.length) {
    console.log('--- ERRORS ---');
    errors.slice(0, 15).forEach((e, i) => console.log(`[${i + 1}] ${e.slice(0, 200)}`));
  }
} catch (e) {
  errors.push('top-level: ' + e.message);
  console.log('top-level error:', e.message);
} finally {
  await browser.close();
  server.close();
}

process.exit(errors.length ? 1 : 0);
