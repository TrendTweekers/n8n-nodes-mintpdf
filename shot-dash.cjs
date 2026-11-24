// Screenshots of the Klipownia dashboard for the restyle. Usage: node shot-dash.cjs <prefix>
const { chromium } = require('playwright');
const exe = '/home/plastgaffel/.cache/ms-playwright/chromium_headless_shell-1246/chrome-headless-shell-linux64/chrome-headless-shell';
const out = '/tmp/claude-1000/dash-oxy';
const prefix = process.argv[2] || 'r';
const only = process.argv[3];
const pages = [
  ['home', '#/'], ['setup', '#/setup'], ['story', '#/story'], ['story-product', '#/story/product'], ['settings', '#/settings'],
  ['editor', '#/p/2026-10-26-img-4821'],
];
(async () => {
  const b = await chromium.launch({ executablePath: exe });
  for (const [w, h, tag] of [[1440, 900, 'd'], [390, 844, 'm']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await ctx.addInitScript(() => { try { localStorage.setItem('reel-studio-lang', 'pl'); } catch {} });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => console.log('pageerror', e.message));
    for (const [name, hash] of pages) {
      if (only && !name.startsWith(only)) continue;
      await p.goto('http://localhost:8787/' + hash, { waitUntil: 'networkidle' });
      await p.waitForTimeout(1200);
      await p.screenshot({ path: `${out}/${prefix}-${tag}-${name}.png` });
      if (name === 'editor') {
        for (const panel of ['words', 'effects', 'style']) {
          await p.evaluate((id) => { const el = document.getElementById('panel-' + id); if (el) el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); }, panel);
          await p.waitForTimeout(500);
          await p.screenshot({ path: `${out}/${prefix}-${tag}-editor-${panel}.png` });
        }
      }
    }
    await ctx.close();
  }
  await b.close();
})();
