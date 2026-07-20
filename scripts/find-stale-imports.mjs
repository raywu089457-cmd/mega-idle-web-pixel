// scripts/find-stale-imports.mjs — 掃所有 src/*.js 的 import 找 stale(目標 module 沒 export 該名)
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '..', 'src');

const files = await readdir(SRC);
const modules = {};
for (const f of files) if (f.endsWith('.js')) modules[f] = await readFile(join(SRC, f), 'utf8');

const importRe = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;
const exportRe = /^export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;

const exportsMap = {};
for (const [f, src] of Object.entries(modules)) {
  exportsMap[f] = new Set();
  for (const m of src.matchAll(exportRe)) exportsMap[f].add(m[1]);
}

const issues = [];
for (const [f, src] of Object.entries(modules)) {
  for (const m of src.matchAll(importRe)) {
    const namesRaw = m[1];
    const spec = m[2];
    const target = spec.replace(/^\.\//, '');
    if (!exportsMap[target]) { issues.push(`${f}: cannot resolve './${target}'`); continue; }
    const names = namesRaw.split(',').map(n => {
      const trimmed = n.trim();
      const asMatch = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
      return asMatch ? { orig: asMatch[1], local: asMatch[2] } : { orig: trimmed, local: trimmed };
    });
    for (const { orig, local } of names) {
      if (!orig) continue;
      // check if locally defined too (same-file declaration)
      const localDeclRe = new RegExp(`^\\s*(?:export\\s+)?(?:async\\s+)?(?:function|const|let|var|class)\\s+${local}\\b`, 'm');
      const hasLocalDecl = localDeclRe.test(src);
      if (!exportsMap[target].has(orig) && !hasLocalDecl) {
        issues.push(`${f}: '${orig}' not exported from './${target}' and not locally declared`);
      } else if (hasLocalDecl && exportsMap[target].has(orig)) {
        // 重複:既 import 又本檔宣告(可能 OK if 是同名 export re-import,但語法上是 conflict)
        // 檢查是不是真的 duplicate(import 出現不只一次也算)
        const importCount = (src.match(new RegExp(`\\b${orig}\\b`, 'g')) || []).length;
        if (importCount > 1) issues.push(`${f}: '${orig}' both imported from './${target}' and declared locally (${importCount} references)`);
      }
    }
  }
}

if (issues.length === 0) { console.log('[stale-imports] OK — no issues'); process.exit(0); }
console.error(`[stale-imports] FAIL — ${issues.length} issues:`);
for (const i of issues) console.error('  ' + i);
process.exit(1);
