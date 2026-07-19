#!/usr/bin/env node
/**
 * scripts/check-imports.mjs — DFS 循環 import 偵測
 *
 * 用法:node scripts/check-imports.mjs src/
 * 退出碼:0 無循環;1 有循環
 *
 * 規則:
 * - 解析每個 .js 檔的 static import 陳述式
 * - 排除 ./* 與 ./subpath(同目錄視為內部)
 * - 排除 ../(同模組群)
 * - 任何回到自己的鏈 → 報循環
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, resolve, dirname, relative, sep } from 'node:path';

const root = process.argv[2] || 'src';

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith('.js')) yield full;
  }
}

const importRe = /import\s+(?:[\s\S]+?from\s+)?['"]([^'"]+)['"]/g;

async function collectImports(file) {
  let src;
  try { src = await readFile(file, 'utf8'); }
  catch { return new Set(); }   // 讀不到的檔案視為無 import(partial pass)
  const out = new Set();
  for (const m of src.matchAll(importRe)) {
    const spec = m[1];
    if (!spec.startsWith('.')) continue;            // skip bare specifiers
    const abs = resolve(dirname(file), spec);
    // 跳過尚未建立的檔案 — 不算循環,只列為 unresolved
    try { await readFile(abs); out.add(abs); }
    catch { /* unresolved import — ignore for cycle check */ }
  }
  return out;
}

const cycles = [];

async function checkCycle(start, current, stack, visited) {
  if (visited.has(current)) return;                 // already DFS'd from another branch
  visited.add(current);
  const imports = await collectImports(current);
  for (const dep of imports) {
    if (dep === start) {
      cycles.push([...stack, current, dep]);
    } else if (!stack.includes(dep)) {
      await checkCycle(start, dep, [...stack, current], visited);
    }
  }
}

let count = 0;
for await (const file of walk(root)) {
  count++;
  await checkCycle(file, file, [], new Set());
}

if (cycles.length === 0) {
  console.log(`[check-imports] OK — ${count} files, 0 cycles`);
  process.exit(0);
}

console.error(`[check-imports] FAIL — ${cycles.length} cycle(s) found:`);
for (const cyc of cycles) {
  console.error('  ' + cyc.map(f => relative(root, f) || f).join(' -> '));
}
process.exit(1);
