#!/usr/bin/env node
/**
 * make-og-card.js — the 1200x630 social preview card, rendered once.
 *
 * index.html declares `twitter:card = summary_large_image` but shipped with no
 * og:image at all, and only 10 of 91 posts carry a cover. So every share of the
 * site — and of the other 81 posts — rendered as a large EMPTY card, which is
 * worse than declaring no card at all. This generates the default.
 *
 * It repeats favicon.svg's geometry, the same one `<symbol id="brand-mark">`
 * uses, so the tab icon, the wordmark and the share card read as one object.
 * Change the favicon and re-run this. Dev-only: playwright is already a dev
 * dependency for the e2e suite and nothing here ships.
 *
 * Usage:  node tools/make-og-card.js [out.png]
 */

'use strict';

const { chromium } = require('playwright');

// The dark theme's own values, so the card matches the site a click later.
const BG = '#0b1020';
const INK = '#f8fafc';
const MUTED = '#94a3b8';
const PRIMARY = '#6d8cff';

const MARK = `
<svg width="132" height="132" viewBox="0 0 32 32" style="color:${PRIMARY}">
  <g fill="none" stroke="currentColor" stroke-width="2.9" stroke-linecap="round">
    <path d="M12.4 19.4 L6.6 6.6"/><path d="M12.4 19.4 L25.4 8"/>
    <path d="M12.4 19.4 L25.4 25.6"/><path d="M25.4 8 L25.4 25.6"/>
  </g>
  <g fill="currentColor">
    <circle cx="6.6" cy="6.6" r="3.3"/><circle cx="25.4" cy="8" r="3.3"/>
    <circle cx="25.4" cy="25.6" r="3.3"/><circle cx="12.4" cy="19.4" r="5.2"/>
  </g>
</svg>`;

const HTML = `<body style="margin:0">
<div style="width:1200px;height:630px;box-sizing:border-box;background:${BG};
     background-image:radial-gradient(ellipse 78% 68% at 50% 42%, #16203c 0%, ${BG} 100%);
     display:flex;flex-direction:column;justify-content:center;padding:0 96px;
     font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK}">
  <div style="display:flex;align-items:center;gap:26px;margin-bottom:38px">
    ${MARK}
    <span style="font-size:74px;font-weight:800;letter-spacing:-0.03em">Azzindani</span>
  </div>
  <div style="font-size:52px;font-weight:700;line-height:1.18;letter-spacing:-0.02em;max-width:1000px">
    Empowering Artificial Intelligence
  </div>
  <div style="font-size:31px;color:${MUTED};margin-top:26px;line-height:1.45;max-width:960px">
    Data you trust. Automation at scale. Productivity you can measure.
  </div>
</div></body>`;

(async () => {
    const out = process.argv[2] || 'og-card.png';
    const browser = await chromium.launch({
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
    });
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.setContent(HTML);
    await page.waitForTimeout(300);
    await page.screenshot({ path: out });
    await browser.close();
    console.error(`Wrote ${out} (1200x630)`);
})();
