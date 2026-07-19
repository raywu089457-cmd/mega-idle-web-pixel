#!/usr/bin/env node
/**
 * scripts/check-onclick.mjs — 確認 index.html 的 onclick 處理器在 window-bridge.js 都有匯出
 * 用法:node scripts/check-onclick.mjs
 * 退出碼:0 全覆蓋;1 有缺漏
 */

import { readFile } from 'node:fs/promises';

const html = await readFile('index.html', 'utf8');
const bridge = await readFile('src/window-bridge.js', 'utf8');

// 從 index.html 抓所有 onclick="<name>( 中的 <name>
const usedSet = new Set();
for (const m of html.matchAll(/onclick="([a-zA-Z_][a-zA-Z_0-9]*)\s*\(/g)) usedSet.add(m[1]);

// 從 window-bridge.js 的 BRIDGE = { ... } 區塊抓所有 key
// 做法:抓 { 到 } 之間的整個 block,然後用 \b 找所有 identifier(排除註解)
const bridgeMatch = bridge.match(/const BRIDGE = \{([\s\S]*?)\n\};/);
if (!bridgeMatch) { console.error('BRIDGE object not found in window-bridge.js'); process.exit(1); }
let block = bridgeMatch[1];
// 移除 // 註解
block = block.replace(/\/\/[^\n]*/g, '');
const providedSet = new Set();
for (const m of block.matchAll(/\b([a-zA-Z_][a-zA-Z_0-9]*)\b/g)) {
  const k = m[1];
  // 過濾關鍵字
  if (['const','undefined','true','false'].includes(k)) continue;
  providedSet.add(k);
}

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
