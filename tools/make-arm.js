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

// Joint centres, in 3D. x right, y down, z toward the viewer; the arm swings
// in the xy plane and every joint pivots about z, which is what makes the
// joints read as cylinders seen three-quarter on.
const SHOULDER = [27, 70, 0];
const ELBOW    = [43, 33, 0];
const WRIST    = [72, 27, 0];

// Fine / coarse. The coarse level exists for the same reason the head's does:
// a phone's neuron budget cannot fill the fine one, and a graph whose
// junctions cannot all be filled is broken rather than sparse.
// The coarse level is FLAT, not a thinner version of the fine one. A phone's
// budget is NEURON_COUNT_MOBILE 70 at 45% ai, so about 31 cells, and no 3D
// wireframe survives that — every box costs eight nodes before the figure has
// said anything. Dropping depth buys the whole silhouette back for the price
// of one face. The head level hit the same wall at 34 nodes and made the same
// trade: a head rather than a face.
const LEVELS = {
    fine:   { ring: 7, wristRing: 5, flat: false },
    coarse: { ring: 4, wristRing: 3, flat: true, spare: true },
};

// Three-quarter view. Yaw then pitch, then drop z — orthographic rather than
// perspective, because the mesh applies its OWN perspective to whatever this
// emits and two projections stacked would read as a lens error.
const YAW = 34 * Math.PI / 180;
const PITCH = 20 * Math.PI / 180;
function project([x, y, z]) {
    const cx = x - 50, cy = y - 50;
    const rx = cx * Math.cos(YAW) + z * Math.sin(YAW);
    const rz = -cx * Math.sin(YAW) + z * Math.cos(YAW);
    const ry = cy * Math.cos(PITCH) - rz * Math.sin(PITCH);
    return [rx + 50, ry + 50];
}

function build(level) {
    const L = LEVELS[level];
    const V = [];                       // 3D vertices
    const E = [];
    const at = (x, y, z) => { V.push([x, y, z]); return V.length - 1; };
    const link = (a, b) => { if (a !== b && !E.some(([p, q]) => (p === a && q === b) || (p === b && q === a))) E.push([a, b]); };
    const chain = (ids, close) => {
        for (let i = 1; i < ids.length; i++) link(ids[i - 1], ids[i]);
        if (close && ids.length > 2) link(ids[ids.length - 1], ids[0]);
    };

    // A box around the segment a->b: four corners at each end, the near face,
    // the far face, and the rails between them. Eight nodes buy the depth that
    // four never could.
    const box = (a, b, halfW, halfD) => {
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len * halfW, ny = dx / len * halfW;
        const near = [], far = [];
        for (const [p, sgn] of [[a, 1], [a, -1], [b, -1], [b, 1]]) {
            near.push(at(p[0] + nx * sgn, p[1] + ny * sgn, L.flat ? 0 :  halfD));
            if (!L.flat) far.push(at(p[0] + nx * sgn, p[1] + ny * sgn, -halfD));
        }
        chain(near, true);
        if (L.flat) return { near, far: near };
        chain(far, true);
        for (let i = 0; i < 4; i++) link(near[i], far[i]);
        return { near, far };
    };

    // A joint is a cylinder: two rings on the z axis with rails between them.
    const joint = (c, r, n, halfD) => {
        const near = [], far = [];
        for (let i = 0; i < n; i++) {
            const t = (i / n) * Math.PI * 2;
            const x = c[0] + Math.cos(t) * r, y = c[1] + Math.sin(t) * r;
            near.push(at(x, y, L.flat ? 0 :  halfD));
            if (!L.flat) far.push(at(x, y, -halfD));
        }
        chain(near, true);
        if (L.flat) return { near, far: near };
        chain(far, true);
        for (let i = 0; i < n; i++) link(near[i], far[i]);
        return { near, far };
    };

    // A claw: four corners tapering to a single point. The tip is one node and
    // it is the whole difference between a gripper and a pair of blocks.
    const claw = (root, tip, halfW, halfD) => {
        const dx = tip[0] - root[0], dy = tip[1] - root[1];
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len * halfW, ny = dx / len * halfW;
        const base = L.flat
            ? [at(root[0] + nx, root[1] + ny, 0), at(root[0] - nx, root[1] - ny, 0)]
            : [at(root[0] + nx, root[1] + ny,  halfD), at(root[0] - nx, root[1] - ny,  halfD),
               at(root[0] - nx, root[1] - ny, -halfD), at(root[0] + nx, root[1] + ny, -halfD)];
        const point = at(tip[0], tip[1], 0);
        chain(base, true);
        for (const b of base) link(b, point);
        return { base, point };
    };

    return { V, E, at, link, chain, box, joint, claw, L };
}

// ── The figure ──
function arm(level = 'fine') {
    const g = build(level);
    const { V, at, link, chain, box, joint, claw, L } = g;

    // Base: a plinth box and the column standing on it.
    // At the coarse level the base is one tapered block rather than a plinth
    // and a column: two boxes is eight nodes spent on a detail that a 31-cell
    // budget cannot afford, and the taper alone still reads as a base.
    const plinth = L.spare
        ? box([27, 97, 0], [27, 79, 0], 16, 11)   // one taller block, up to the shoulder
        : box([27, 97, 0], [27, 90, 0], 19, 11);
    const column = L.spare ? plinth : box([27, 90, 0], [27, 78, 0], 11, 7);
    if (!L.spare) {
        for (let i = 0; i < 4; i++) { link(plinth.near[i], column.near[i]); link(plinth.far[i], column.far[i]); }
    }
    void V;

    // Links and the three joints.
    const upper = box(SHOULDER, ELBOW, 7, 5);
    const fore  = box(ELBOW, WRIST, 5.5, 4);
    const jS = joint(SHOULDER, 8.5, L.ring, 6.5);
    const jE = joint(ELBOW, 6.5, L.ring, 5);
    const jW = joint(WRIST, 4.5, L.wristRing, 3.5);

    // Seat the column under the shoulder, and tie every link to the joint it
    // pivots on, so the figure is one component and formEdges never bridges a
    // gap.
    link(column.near[2], jS.near[0]); link(column.near[3], jS.near[Math.floor(L.ring / 2)]);
    if (L.spare) link(column.near[1], jS.near[Math.min(1, L.ring - 1)]);
    link(column.far[2],  jS.far[0]);  link(column.far[3],  jS.far[Math.floor(L.ring / 2)]);
    link(upper.near[0], jS.near[1]); link(upper.far[0], jS.far[1]);
    link(upper.near[2], jE.near[0]); link(upper.far[2], jE.far[0]);
    link(fore.near[0], jE.near[Math.floor(L.ring / 2)]); link(fore.far[0], jE.far[Math.floor(L.ring / 2)]);
    link(fore.near[2], jW.near[0]); link(fore.far[2], jW.far[0]);

    // Gripper: a palm box, then two claws tapering to points. The palm is set
    // clear of the wrist and tied to it by two rails rather than four — run
    // through the whole ring it crossed itself into a knot, and the gripper is
    // the one part of this figure that has to stay legible.
    // Same trade at the wrist: coarse hangs the claws straight off the joint.
    const palm = L.spare ? jW : box([79, 27, 0], [87, 27, 0], 6, 4.5);
    if (!L.spare) {
        link(jW.near[0], palm.near[0]); link(jW.far[0], palm.far[0]);
        link(jW.near[Math.floor(L.wristRing / 2)], palm.near[1]);
        link(jW.far[Math.floor(L.wristRing / 2)], palm.far[1]);
    }
    const upperClaw = claw([87, 22, 0], [100, 12, 0], 2.4, 2.2);
    const lowerClaw = claw([87, 32, 0], [100, 42, 0], 2.4, 2.2);
    const cb = (c, i) => c.base[Math.min(i, c.base.length - 1)];
    const pn = (i) => palm.near[Math.min(i, palm.near.length - 1)];
    const pf = (i) => palm.far[Math.min(i, palm.far.length - 1)];
    link(pn(3), cb(upperClaw, 0)); link(pf(3), cb(upperClaw, 3));
    link(pn(2), cb(lowerClaw, 1)); link(pf(2), cb(lowerClaw, 2));

    // Project once, at the end, then fit the 0..100 box the other graphs use.
    const P = V.map(project);
    const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = 100 / Math.max(x1 - x0, y1 - y0);
    const nodes = P.map(([x, y]) => [+((x - x0) * k).toFixed(1), +((y - y0) * k).toFixed(1)]);
    return { nodes, edges: g.E };
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
