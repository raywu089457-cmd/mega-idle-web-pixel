// scripts/fix-stale-imports.mjs — 自動移除 stale imports
// 對每個 .js 檔,parse import 區段,確認每個 import 名字在目標 module 有 export;若無就移除該名。

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '..', 'src');
const files = (await readdir(SRC)).filter(f => f.endsWith('.js'));
const sources = {};
for (const f of files) sources[f] = await readFile(join(SRC, f), 'utf8');

const exportRe = /^export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
const exportsMap = {};
for (const [f, src] of Object.entries(sources)) {
  exportsMap[f] = new Set();
  for (const m of src.matchAll(exportRe)) exportsMap[f].add(m[1]);
}

const importRe = /^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?/gm;
let totalFixes = 0;

for (const [f, src] of Object.entries(sources)) {
  // 收集檔案中所有函式/變數宣告(排除 import)
  const lines = src.split('\n');
  const localDecls = new Set();
  for (const line of lines) {
    if (line.startsWith('import ')) continue;
    const m = line.match(/^\s*(?:export\s+)?(?:async\s+)?(?:function|const|let|var|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (m) localDecls.add(m[1]);
  }
  let newSrc = src;
  for (const m of [...src.matchAll(importRe)]) {
    const [full, namesRaw, spec] = m;
    const target = spec.replace(/^\.\//, '');
    if (!exportsMap[target]) continue;
    const targetExports = exportsMap[target];
    const names = namesRaw.split(',').map(n => n.trim()).filter(Boolean);
    const valid = names.filter(name => {
      const asMatch = name.match(/^(\w+)\s+as\s+(\w+)$/);
      const orig = asMatch ? asMatch[1] : name;
      return targetExports.has(orig);
    });
    if (valid.length !== names.length) {
      const removed = names.filter(n => !valid.includes(n));
      totalFixes += removed.length;
      console.log(`[fix] ${f}: removed ${JSON.stringify(removed)} from import of ${spec}`);
    }
    if (valid.length === 0) {
      // 整個 import 移除
      newSrc = newSrc.replace(full + '\n', '');
    } else {
      newSrc = newSrc.replace(full, `import { ${valid.join(', ')} } from '${spec}'`);
    }
  }
  if (newSrc !== src) await writeFile(join(SRC, f), newSrc);
}

console.log(`\n[fix-stale-imports] done — ${totalFixes} stale names removed`);
