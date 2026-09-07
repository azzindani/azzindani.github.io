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
const fs = require('fs');
const path = require('path');

// The dark theme's own values, so the card matches the site a click later.
const BG = '#0b1020';
const INK = '#f8fafc';
const MUTED = '#94a3b8';
const PRIMARY = '#6d8cff';
const AI  = '#4a7ddb';   // COLOR_AI in neural-bg.js — the receded half
const BIO = '#a855f7';   // COLOR_BIO in neural-bg.js — the brain is a bio figure

const MARK = `
<svg width="86" height="86" viewBox="0 0 32 32" style="color:${PRIMARY}">
  <g fill="none" stroke="currentColor" stroke-width="2.9" stroke-linecap="round">
    <path d="M12.4 19.4 L6.6 6.6"/><path d="M12.4 19.4 L25.4 8"/>
    <path d="M12.4 19.4 L25.4 25.6"/><path d="M25.4 8 L25.4 25.6"/>
  </g>
  <g fill="currentColor">
    <circle cx="6.6" cy="6.6" r="3.3"/><circle cx="25.4" cy="8" r="3.3"/>
    <circle cx="25.4" cy="25.6" r="3.3"/><circle cx="12.4" cy="19.4" r="5.2"/>
  </g>
</svg>`;

// The brain is READ from js/neural-bg.js rather than copied here, so the card
// cannot drift from the figure the page actually draws. Level 1 (97 nodes /
// 244 edges) is what a desktop budget reaches on stage 1.
function brainGraph() {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'neural-bg.js'), 'utf8');
    const grab = (name) => {
        const i = src.indexOf('const ' + name);
        if (i < 0) throw new Error(name + ' not found in js/neural-bg.js');
        return src.slice(i, src.indexOf(';', i))
            .replace(/^[^=]*=/, '').replace(/'/g, '').replace(/\+/g, '')
            .trim().split(/\s+/).map(Number);
    };
    const f = grab('BRAIN_GRAPH_XY1'), nodes = [];
    for (let i = 0; i + 1 < f.length; i += 2) nodes.push({ x: f[i], y: f[i + 1] });
    const e = grab('BRAIN_GRAPH_E1'), edges = [];
    for (let i = 0; i + 1 < e.length; i += 2) edges.push([e[i], e[i + 1]]);
    return { nodes, edges };
}

// Deterministic randomness. The card must regenerate identically or every
// rebuild is a diff, so nothing here uses Math.random.
function rng(seed) {
    return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// A bio cell the way neural-bg.js draws one: soma, a lighter nucleus, and a
// few curved dendrites biased AWAY from the axon so they do not overlap it.
// Kept short on purpose — the head figure taught this the hard way, that a
// starburst longer than the gap between nodes turns a graph into a mush.
function bioCell(x, y, r, rand) {
    const axon = rand() * Math.PI * 2;
    let d = '';
    const n = 2 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i++) {
        const a = axon + Math.PI + (rand() - 0.5) * 2.4;
        const len = r * (2.6 + rand() * 1.8);
        const cx = x + Math.cos(a) * len * 0.55 + (rand() - 0.5) * len * 0.4;
        const cy = y + Math.sin(a) * len * 0.55 + (rand() - 0.5) * len * 0.4;
        d += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ` +
             `${(x + Math.cos(a) * len).toFixed(1)} ${(y + Math.sin(a) * len).toFixed(1)}"/>`;
    }
    // The axon: one longer process the other way.
    const alen = r * (3.2 + rand() * 1.6);
    d += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} L${(x + Math.cos(axon) * alen).toFixed(1)} ` +
         `${(y + Math.sin(axon) * alen).toFixed(1)}"/>`;
    return {
        neurites: d,
        soma: `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>`,
        nucleus: `<circle cx="${(x + r * 0.12).toFixed(1)}" cy="${(y - r * 0.1).toFixed(1)}" r="${(r * 0.45).toFixed(1)}"/>`,
    };
}

// The ai half of the mesh, as stage 1 actually shows it: not absent but
// RECEDED — a sparse field of plain circles wired to near neighbours. It fills
// the ground behind the copy the way the ghost field fills the page, and it is
// the only reason the card carries both kinds the site is named for.
function ghostField(rand, avoid) {
    const pts = [];
    for (let i = 0; i < 400 && pts.length < 24; i++) {
        const x = rand() * 1200, y = rand() * 630;
        if (x > avoid.x && x < avoid.x + avoid.w && y > avoid.y && y < avoid.y + avoid.h) continue;
        if (pts.some(p => Math.hypot(p[0] - x, p[1] - y) < 88)) continue;
        pts.push([x, y]);
    }
    // Pairs first, then a degree test. A lone segment joining two far-apart
    // dots over open ground does not read as a mesh, it reads as a scratch on
    // the image — so a wire is only drawn where one of its ends is part of a
    // cluster. What survives is constellations, which is what the ghost field
    // looks like on the page.
    const pairs = [], deg = pts.map(() => 0);
    for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++)
            if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) < 118) {
                pairs.push([i, j]); deg[i]++; deg[j]++;
            }
    const wires = pairs.filter(([i, j]) => deg[i] > 1 || deg[j] > 1).map(([i, j]) =>
        `<line x1="${pts[i][0].toFixed(1)}" y1="${pts[i][1].toFixed(1)}" ` +
        `x2="${pts[j][0].toFixed(1)}" y2="${pts[j][1].toFixed(1)}"/>`).join('');
    const dots = pts.map(([x, y]) =>
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(2.1 + rand() * 1.8).toFixed(1)}"/>`).join('');
    return `<g stroke="${AI}" stroke-width="1" stroke-opacity="0.15" fill="none">${wires}</g>` +
           `<g fill="${AI}" fill-opacity="0.28">${dots}</g>`;
}

// Laid out the way stage 1 lays it out: mirrored in x so the figure faces the
// copy, which sits on its right. Cells on the nodes and wires between them —
// no fill, no outline, because nothing in the mesh is stroked line work.
function meshSVG(box, avoid) {
    const { nodes, edges } = brainGraph();
    const rand = rng(20260907);
    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = Math.min(box.w / (x1 - x0), box.h / (y1 - y0));
    const w = (x1 - x0) * k, h = (y1 - y0) * k;
    const ox = box.x + (box.w - w) / 2, oy = box.y + (box.h - h) / 2;
    const P = nodes.map(n => [ox + w - (n.x - x0) * k, oy + (n.y - y0) * k]);
    const wires = edges.map(([a, b]) =>
        `<line x1="${P[a][0].toFixed(1)}" y1="${P[a][1].toFixed(1)}" ` +
        `x2="${P[b][0].toFixed(1)}" y2="${P[b][1].toFixed(1)}"/>`).join('');
    let neurites = '', somata = '', nuclei = '';
    for (const [x, y] of P) {
        const c = bioCell(x, y, 4.2, rand);
        neurites += c.neurites; somata += c.soma; nuclei += c.nucleus;
    }
    return `<svg width="1200" height="630" style="position:absolute;inset:0">
        ${ghostField(rng(7717), avoid)}
        <g stroke="${BIO}" stroke-width="1.05" stroke-opacity="0.6" fill="none"
           stroke-linecap="round">${neurites}</g>
        <g stroke="${BIO}" stroke-width="1.7" stroke-opacity="0.62" fill="none">${wires}</g>
        <g fill="${BIO}" fill-opacity="0.95">${somata}</g>
        <g fill="${INK}" fill-opacity="0.42">${nuclei}</g></svg>`;
}

const HTML = `<body style="margin:0">
<div style="position:relative;width:1200px;height:630px;overflow:hidden;background:${BG};
     background-image:radial-gradient(ellipse 78% 68% at 34% 46%, #18244a 0%, ${BG} 72%);
     font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK}">
  ${meshSVG({ x: 34, y: 92, w: 496, h: 446 }, { x: 560, y: 150, w: 600, h: 340 })}
  <div style="position:absolute;left:576px;top:0;width:568px;height:630px;
       display:flex;flex-direction:column;justify-content:center">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:30px">
      ${MARK}
      <span style="font-size:47px;font-weight:800;letter-spacing:-0.03em">Azzindani</span>
    </div>
    <div style="font-size:46px;font-weight:700;line-height:1.16;letter-spacing:-0.025em">
      Empowering<br>Artificial Intelligence
    </div>
    <div style="font-size:24px;color:${MUTED};margin-top:28px;line-height:1.5">
      Data you trust. Automation at scale.<br>Productivity you can measure.
    </div>
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
