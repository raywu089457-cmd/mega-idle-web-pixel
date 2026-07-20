#!/usr/bin/env node
/**
 * scripts/check-onclick.mjs — 確認 index.html 的 onclick 處理器在 window-bridge.js 都有掛到 window
 * 用法:node scripts/check-onclick.mjs
 * 退出碼:0 全覆蓋;1 有缺漏
 *
 * 兩種 bridge 形式都支援:
 *   A. window.X = X;(直接賦值)
 *   B. const BRIDGE = { X, Y, ... }; Object.assign(window, BRIDGE);
 */

import { readFile } from 'node:fs/promises';

const html = await readFile('index.html', 'utf8');
const bridge = await readFile('src/window-bridge.js', 'utf8');

// 從 index.html 抓所有 onclick="<name>( 中的 <name>
const usedSet = new Set();
for (const m of html.matchAll(/onclick="([a-zA-Z_][a-zA-Z_0-9]*)\s*\(/g)) usedSet.add(m[1]);

// 從 window-bridge.js 抓所有掛到 window 的識別符
// 形式 A:window.X = X; 或 window['X'] = X;
// 形式 B:BRIDGE = { X, Y, ... };
const providedSet = new Set();
for (const m of bridge.matchAll(/window\.([a-zA-Z_][a-zA-Z0-9_$]*)\s*=/g)) providedSet.add(m[1]);
for (const m of bridge.matchAll(/Object\.assign\s*\(\s*window\s*,\s*\{([\s\S]*?)\}\s*\)/g)) {
  for (const k of m[1].matchAll(/^\s*([a-zA-Z_][a-zA-Z0-9_$]*)\s*[,}]/gm)) providedSet.add(k[1]);
}
// 形式 C:Object.defineProperty(window, 'X', ...)
for (const m of bridge.matchAll(/Object\.defineProperty\s*\(\s*window\s*,\s*['"]([a-zA-Z_][a-zA-Z0-9_$]*)['"]/g)) providedSet.add(m[1]);

// 差集
const missing = [...usedSet].filter(k => !providedSet.has(k));

console.log(`[check-onclick] index.html 用 onclick 處理器: ${usedSet.size}`);
console.log(`[check-onclick] window-bridge.js 提供: ${providedSet.size}`);
if (missing.length === 0) {
  console.log(`[check-onclick] OK — 全覆蓋`);
  process.exit(0);
}
console.error(`[check-onclick] FAIL — 缺漏 ${missing.length} 個:`);
for (const k of missing) console.error(`  - ${k}`);
process.exit(1);
