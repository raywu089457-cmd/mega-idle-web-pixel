#!/usr/bin/env node
// scripts/fps-bench.mjs — 量測 drawScene 渲染 FPS 與平均 frame time
// 用法:node scripts/fps-bench.mjs [duration_sec]
// 退出碼:0 表示平均 FPS ≥ 30;1 表示過慢

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const PORT = 8769;
const DURATION = Number(process.argv[2] || 10);

const server = createServer(async (req, res) => {
  try {
    let path = req.url.split('?')[0]; if (path === '/') path = '/index.html';
    const body = await readFile('.' + path);
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));
const URL = `http://127.0.0.1:${PORT}/index.html`;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'load' });
await new Promise(r => setTimeout(r, 2000)); // 等 init + scene ready

// 安裝 FPS counter via hook into requestAnimationFrame
const result = await page.evaluate(async (duration) => {
  return new Promise((resolve) => {
    let frames = 0;
    const startTime = performance.now();
    let lastTime = startTime;
    const samples = [];
    function tick(now) {
      frames++;
      samples.push(now - lastTime);
      lastTime = now;
      if (now - startTime < duration * 1000) {
        requestAnimationFrame(tick);
      } else {
        const total = now - startTime;
        const avgFrame = samples.reduce((s, x) => s + x, 0) / samples.length;
        const maxFrame = Math.max(...samples);
        const fps = (frames * 1000) / total;
        resolve({ frames, totalMs: Math.round(total), avgFrameMs: avgFrame.toFixed(2), maxFrameMs: maxFrame.toFixed(2), fps: fps.toFixed(2) });
      }
    }
    requestAnimationFrame(tick);
  });
}, DURATION);

await browser.close();
server.close();

console.log('=== FPS BENCHMARK ===');
console.log(`duration: ${DURATION}s`);
console.log(`frames:   ${result.frames}`);
console.log(`fps:      ${result.fps}`);
console.log(`avg:      ${result.avgFrameMs}ms / frame`);
console.log(`max:      ${result.maxFrameMs}ms (worst frame)`);
const fps = Number(result.fps);
if (fps >= 30) { console.log('\n✓ FPS ≥ 30 (target met)'); process.exit(0); }
else { console.log(`\n✗ FPS ${fps} < 30 (target missed)`); process.exit(1); }
