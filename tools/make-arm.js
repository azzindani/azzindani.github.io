#!/usr/bin/env node
/**
 * make-arm.js — the stage 7 robot arm, authored rather than traced.
 *
 * Three stock wireframes were traced first and none of them worked. The
 * technical one came closest and still lost its joint circles at the budget;
 * the mesh ones have no outline to preserve at all, because their silhouette
 * is only the boundary of thousands of quads, so decimation keeps corners
 * everywhere and returns a web. All of them were watermarked stock besides,
 * which the geometry would have inherited.
 *
 * A robot arm is a parametric object — a base, three joints, two links and a
 * gripper — so authoring it gives what no trace could: an exact node count at
 * every level, joint circles that stay circles because they ARE circles, and
 * no provenance question.
 *
 * Authoring space is the 0..100 box the other graphs use, y DOWN to match the
 * extracted data. Run it to print the arrays for GRAPH_FIGURES, or with --svg
 * to eyeball the figure first.
 *
 * Usage:  node tools/make-arm.js [--coarse] [--svg out.svg]
 */

'use strict';

const fs = require('fs');

// Joint centres, base upward. The pose is a working reach: the arm rises from
// the base, folds forward at the elbow and levels off at the wrist, which
// reads as a machine mid-task rather than a diagram at rest.
const SHOULDER = [27, 70];
const ELBOW    = [43, 33];
const WRIST    = [72, 27];

// Fine / coarse. The coarse level exists for the same reason the head's does:
// a phone's neuron budget cannot fill the fine one, and a graph whose
// junctions cannot all be filled is broken rather than sparse.
const LEVELS = {
    fine:   { ring: 10, wristRing: 8, baseArc: 9 },
    coarse: { ring: 6,  wristRing: 5, baseArc: 5 },
};

function build(level) {
    const L = LEVELS[level];
    const P = [];                       // [x, y]
    const E = [];                       // [i, j]
    const at = (x, y) => { P.push([+x.toFixed(1), +y.toFixed(1)]); return P.length - 1; };
    const link = (a, b) => { if (a !== b) E.push([a, b]); };
    const chain = (ids, close) => {
        for (let i = 1; i < ids.length; i++) link(ids[i - 1], ids[i]);
        if (close && ids.length > 2) link(ids[ids.length - 1], ids[0]);
    };

    // A ring of `n` points. The joints are the whole reason for authoring
    // this: traced, they were the first thing decimation threw away, and they
    // are what makes the figure read as articulated rather than as a bent bar.
    const ring = (cx, cy, r, n, from = 0) => {
        const ids = [];
        for (let i = 0; i < n; i++) {
            const t = from + (i / n) * Math.PI * 2;
            ids.push(at(cx + Math.cos(t) * r, cy + Math.sin(t) * r));
        }
        chain(ids, true);
        return ids;
    };

    // A link drawn as its own outline — a rectangle around the segment ab,
    // squared off at both ends. Outline, not centreline, because every other
    // figure in the mesh is an outline drawing and the cells sit on its edges.
    const bar = (a, b, halfW) => {
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len * halfW, ny = dx / len * halfW;
        const ids = [
            at(a[0] + nx, a[1] + ny), at(b[0] + nx, b[1] + ny),
            at(b[0] - nx, b[1] - ny), at(a[0] - nx, a[1] - ny),
        ];
        chain(ids, true);
        return ids;
    };

    return { P, E, at, link, chain, ring, bar, L };
}

// ── The figure ──
function arm(level = 'fine') {
    const g = build(level);
    const { P, at, link, chain, ring, bar, L } = g;

    // Base: a plinth, a tapered column and the turret the shoulder sits on.
    const plinth = [at(9, 97), at(45, 97), at(41, 90), at(13, 90)];
    chain(plinth, true);
    const column = [at(16, 90), at(38, 90), at(34, 78), at(20, 78)];
    chain(column, true);
    link(plinth[3], column[0]); link(plinth[2], column[1]);

    // The turret arc: the shoulder housing, drawn as a half ring so the joint
    // reads as seated in something rather than floating.
    const turret = [];
    for (let i = 0; i <= L.baseArc; i++) {
        const t = Math.PI + (i / L.baseArc) * Math.PI;
        turret.push(at(SHOULDER[0] + Math.cos(t) * 11, SHOULDER[1] + Math.sin(t) * 8));
    }
    chain(turret, false);
    link(column[3], turret[0]); link(column[2], turret[turret.length - 1]);

    // Upper arm, forearm, and the three joints.
    const upper = bar(SHOULDER, ELBOW, 7);
    const fore  = bar(ELBOW, WRIST, 5.5);
    const jShoulder = ring(SHOULDER[0], SHOULDER[1], 8, L.ring);
    const jElbow    = ring(ELBOW[0], ELBOW[1], 6.5, L.ring);
    const jWrist    = ring(WRIST[0], WRIST[1], 4.5, L.wristRing);

    // Tie each link to the joint it pivots on, so the figure is one component
    // and formEdges never has to bridge a gap.
    link(upper[0], jShoulder[0]); link(upper[3], jShoulder[Math.floor(L.ring / 2)]);
    link(upper[1], jElbow[0]);    link(upper[2], jElbow[Math.floor(L.ring / 2)]);
    link(fore[0], jElbow[1]);     link(fore[3], jElbow[Math.floor(L.ring / 2) + 1]);
    link(fore[1], jWrist[0]);     link(fore[2], jWrist[Math.floor(L.wristRing / 2)]);

    // Gripper: a palm and two fingers, open. This is the part that says HANDS,
    // which is the whole reason the stage exists, so it keeps its detail even
    // at the coarse level.
    const palm = [at(78, 21), at(85, 21), at(85, 33), at(78, 33)];
    chain(palm, true);
    link(jWrist[0], palm[0]); link(jWrist[Math.floor(L.wristRing / 2)], palm[3]);
    const fingerA = [at(85, 22), at(96, 16), at(98, 19), at(87, 25)];
    const fingerB = [at(85, 32), at(96, 38), at(98, 35), at(87, 29)];
    chain(fingerA, true); chain(fingerB, true);
    link(palm[1], fingerA[0]); link(palm[2], fingerB[0]);

    return { nodes: P, edges: g.E };
}

const fmt  = (n) => n.map(([x, y]) => `${x} ${y}`).join(' ');
const fmtE = (e) => e.map(([a, b]) => `${a} ${b}`).join(' ');

function preview(nodes, edges, path) {
    const line = edges.map(([a, b]) =>
        `<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}"/>`).join('');
    const dot = nodes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.8"/>`).join('');
    fs.writeFileSync(path,
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 110 110" width="540" height="540">` +
        `<rect x="-4" y="-4" width="110" height="110" fill="#fff"/>` +
        `<g stroke="#7c5cff" stroke-width="0.6" fill="none">${line}</g>` +
        `<g fill="#3b2a99">${dot}</g></svg>`);
}

module.exports = { arm, build, SHOULDER, ELBOW, WRIST, LEVELS, fmt, fmtE, preview };

if (require.main === module) {
    const args = process.argv.slice(2);
    const level = args.includes('--coarse') ? 'coarse' : 'fine';
    const r = arm(level);
    const i = args.indexOf('--svg');
    if (i >= 0) preview(r.nodes, r.edges, args[i + 1]);
    console.error(`${level}: ${r.nodes.length} nodes / ${r.edges.length} edges`);
    console.log(`XY: '${fmt(r.nodes)}'`);
    console.log(`E:  '${fmtE(r.edges)}'`);
}
