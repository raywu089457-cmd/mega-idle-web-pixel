// scripts/poc-shot.mjs — 一次性:載入 poc/*.html 截圖驗證能否渲染
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const target = process.argv[2] || 'poc/canvas-isometric.html';
const out = process.argv[3] || 'poc/_shot.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 640 } });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
await page.goto('file://' + resolve(ROOT, target).replace(/\\/g, '/'));
await sleep(2500);
await page.screenshot({ path: resolve(ROOT, out) });
await browser.close();
console.log(errors.length ? errors.join('\n') : 'OK: no page errors');
