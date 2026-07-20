#!/usr/bin/env node
/**
 * scripts/verify-all.mjs — 跑所有 4 項驗證,exit 0 = 全綠
 * 用法:node scripts/verify-all.mjs
 *   1. node --check (語法)
 *   2. scripts/check-imports.mjs (DFS 循環)
 *   3. scripts/check-onclick.mjs (onclick ↔ bridge 覆蓋)
 *   4. scripts/smoke-test.mjs (Playwright headless 0 errors)
 */

import { spawnSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const steps = [];
let pass = 0, fail = 0;

async function run(name, cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8' });
  const ok = r.status === 0;
  const lastLine = (r.stdout || r.stderr || '').trim().split('\n').filter(l => l.trim()).pop() || '';
  steps.push({ name, ok, lastLine });
  ok ? pass++ : fail++;
  console.log(`${ok ? '✓' : '✗'} ${name}  ${lastLine}`);
  return ok;
}

const files = (await readdir('src')).filter(f => f.endsWith('.js'));

console.log('=== 1/4 syntax check ===');
let syntaxOk = 0;
for (const f of files) {
  const r = spawnSync('node', ['--check', join('src', f)], { stdio: 'pipe' });
  if (r.status === 0) syntaxOk++;
}
const syntaxAll = syntaxOk === files.length;
steps.push({ name: 'node --check', ok: syntaxAll, lastLine: `${syntaxOk}/${files.length} files` });
syntaxAll ? pass++ : fail++;
console.log(`${syntaxAll ? '✓' : '✗'} node --check  ${syntaxOk}/${files.length} files`);

console.log('\n=== 2/4 import cycle check ===');
await run('check-imports', 'node', ['scripts/check-imports.mjs', 'src/']);

console.log('\n=== 3/4 onclick coverage ===');
await run('check-onclick', 'node', ['scripts/check-onclick.mjs']);

console.log('\n=== 4/4 browser smoke test ===');
await run('smoke-test', 'node', ['scripts/smoke-test.mjs']);

console.log(`\n=== SUMMARY: ${pass} pass / ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
