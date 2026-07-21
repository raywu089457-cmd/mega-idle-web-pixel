// scripts/render-shot.mjs — 整合驗證:對真實遊戲三種渲染後端各截圖 + 抓 page error
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = 8790;
const MIME = { '.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml' };

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const file = join(ROOT, p);
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Service-Worker-Allowed':'/' });
    res.end(body);
  } catch (e) { res.writeHead(404); res.end('404'); }
});
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch();
const results = [];
for (const mode of ['canvas2d','iso','three']) {
  const ctx = await browser.newContext({ viewport:{ width:420, height:760 }, serviceWorkers:'block' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type()==='error') errs.push('CONSOLE: ' + m.text()); });
  await page.goto(`http://127.0.0.1:${PORT}/index.html?render=${mode}`, { waitUntil:'load' });
  await sleep(2000);
  // 關掉首次啟動的導覽/歡迎 modal,露出場景
  await page.evaluate(() => {
    try { window.closeOnboard && window.closeOnboard(); } catch (e) {}
    document.querySelectorAll('.modal, .modal-backdrop, [id^="modal-"]').forEach(m => { m.classList.remove('show','open'); m.style.display='none'; });
  }).catch(()=>{});
  await sleep(2500);
  await page.screenshot({ path: resolve(ROOT, `poc/_game_${mode}.png`) });
  await ctx.close();
  results.push(`[${mode}] errors=${errs.length}${errs.length?'\n  '+errs.slice(0,8).join('\n  '):''}`);
}
await browser.close();
server.close();
console.log(results.join('\n'));
