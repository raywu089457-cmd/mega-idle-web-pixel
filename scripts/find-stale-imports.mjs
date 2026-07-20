#!/usr/bin/env node
/**
 * scripts/find-stale-imports.mjs — 掃所有 src/*.js 的 import 找 stale(目標 module 沒 export 該名)
 * 用法:node scripts/find-stale-imports.mjs
 * 退出碼:0 沒問題;1 有 stale
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '..', 'src');

const files = (await readdir(SRC)).filter(f => f.endsWith('.js'));
const sources = {};
for (const f of files) sources[f] = await readFile(join(SRC, f), 'utf8');

// 收集每個 module 的 exports(支援 multi-name:export let A = 0, B = 0)
const exportsMap = {};
for (const [f, src] of Object.entries(sources)) {
  exportsMap[f] = new Set();
  for (const line of src.split('\n')) {
    // 匹配 export 開頭的各種形式
    const m = line.match(/^\s*export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([a-zA-Z_$][a-zA-Z0-9_$,\s=]*)[\s({=]/);
    if (!m) continue;
    // 抓出所有逗號分隔的 name
    const decl = m[1].split(',').map(s => s.trim().split(/\s*[={]/)[0].trim()).filter(Boolean);
    for (const name of decl) exportsMap[f].add(name);
  }
}

const importRe = /^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/gm;
const issues = [];

for (const [f, src] of Object.entries(sources)) {
  for (const m of src.matchAll(importRe)) {
    const namesRaw = m[1];
    const spec = m[2];
    const target = spec.replace(/^\.\//, '');
    if (!exportsMap[target]) continue;
    const targetExports = exportsMap[target];
    const names = namesRaw.split(',').map(n => {
      const trimmed = n.trim();
      const asMatch = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
      return asMatch ? { orig: asMatch[1], local: asMatch[2] } : { orig: trimmed, local: trimmed };
    });
    for (const { orig, local } of names) {
      if (!orig) continue;
      if (!targetExports.has(orig)) {
        issues.push(`${f}: '${orig}' not exported from './${target}'`);
      }
    }
  }
}

if (issues.length === 0) { console.log('[stale-imports] OK — no issues'); process.exit(0); }
console.error(`[stale-imports] FAIL — ${issues.length} issues:`);
for (const i of issues) console.error('  ' + i);
process.exit(1);
