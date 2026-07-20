#!/usr/bin/env node
// scripts/perf-bench.mjs — 量測 FPS (desktop+mobile) / heap / startup time
// 用法:node scripts/perf-bench.mjs [--save] [--no-mobile]
// --save:把結果寫到 perf-baseline.json(給 CI 對比 regression)
// 退出碼:0 通過;1 任一指標低於 threshold
//
// 量測流程:
//   1. desktop 1280×720: 量 FPS (5s) + 量 heap (idle 後)
//   2. mobile  360×640 : 量 FPS (5s) — 手機 viewport 是真實使用場景
//   3. 每次 page.goto 量 navigationStart → load 事件 = startup ms

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname } from 'node:path';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const PORT = 8772;
const URL = `http://127.0.0.1:${PORT}/index.html`;
const FPS_DURATION = 5;
const THRESHOLDS = { fpsDesktop: 30, fpsMobile: 30, heapMB: 80, startupMs: 4000 };

const args = new Set(process.argv.slice(2));
const SAVE = args.has('--save');
const SKIP_MOBILE = args.has('--no-mobile');

const server = createServer(async (req, res) => {
  try {
    let path = req.url.split('?')[0]; if (path === '/') path = '/index.html';
    const body = await readFile('.' + path);
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true });

async function measureViewport(viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(URL, { waitUntil: 'load' });
  const startupMs = Date.now() - t0;
  await new Promise(r => setTimeout(r, 1500));   // 等 scene ready

  const fpsResult = await page.evaluate(async (duration) => {
    return new Promise((resolve) => {
      let frames = 0, last = performance.now();
      const samples = [];
      const start = performance.now();
      function tick(now) {
        frames++; samples.push(now - last); last = now;
        if (now - start < duration * 1000) {
          requestAnimationFrame(tick);
        } else {
          const total = now - start;
          const avg = samples.reduce((s, x) => s + x, 0) / samples.length;
          resolve({ frames, totalMs: Math.round(total), avgFrameMs: +avg.toFixed(2), maxFrameMs: +Math.max(...samples).toFixed(2), fps: +((frames * 1000) / total).toFixed(2) });
        }
      }
      requestAnimationFrame(tick);
    });
  }, FPS_DURATION);

  // 量 heap — 等 1s 確保 GC 跑過;取多次中位數
  const heapSamples = [];
  for (let i = 0; i < 5; i++) {
    const m = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0);
    heapSamples.push(m);
    await new Promise(r => setTimeout(r, 200));
  }
  heapSamples.sort((a, b) => a - b);
  const heapMedian = heapSamples[Math.floor(heapSamples.length / 2)];
  const heapMB = +(heapMedian / 1024 / 1024).toFixed(2);

  await ctx.close();
  return { startupMs, fps: fpsResult.fps, avgFrameMs: fpsResult.avgFrameMs, maxFrameMs: fpsResult.maxFrameMs, heapMB };
}

console.log('=== PERF BENCH ===');
const desktop = await measureViewport({ width: 1280, height: 720 });
console.log(`desktop 1280x720: fps=${desktop.fps} heap=${desktop.heapMB}MB startup=${desktop.startupMs}ms`);

let mobile = null;
if (!SKIP_MOBILE) {
  mobile = await measureViewport({ width: 360, height: 640 });
  console.log(`mobile  360x640: fps=${mobile.fps} heap=${mobile.heapMB}MB startup=${mobile.startupMs}ms`);
}

await browser.close();
server.close();

// Pass/fail check
const checks = [
  ['fpsDesktop', desktop.fps, THRESHOLDS.fpsDesktop, '>='],
  ['heapMB', desktop.heapMB, THRESHOLDS.heapMB, '<='],
  ['startupMs', desktop.startupMs, THRESHOLDS.startupMs, '<='],
];
if (mobile) {
  checks.push(['fpsMobile', mobile.fps, THRESHOLDS.fpsMobile, '>=']);
  checks.push(['heapMB-mobile', mobile.heapMB, THRESHOLDS.heapMB, '<=']);
}

let failed = 0;
for (const [name, val, threshold, op] of checks) {
  const ok = op === '>=' ? val >= threshold : val <= threshold;
  console.log(`  ${ok ? '✓' : '✗'} ${name}=${val} ${op} ${threshold}${ok ? '' : ' (FAIL)'}`);
  if (!ok) failed++;
}

const baseline = { timestamp: new Date().toISOString(), thresholds: THRESHOLDS, desktop, mobile };
if (SAVE) {
  await writeFile('perf-baseline.json', JSON.stringify(baseline, null, 2));
  console.log(`\n✓ baseline saved to perf-baseline.json`);
}

console.log(`\n${failed === 0 ? '✓' : '✗'} ${checks.length - failed}/${checks.length} thresholds met`);
process.exit(failed === 0 ? 0 : 1);
