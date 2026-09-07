#!/usr/bin/env node
/**
 * trace-lineart.js — raster line art to a node-and-edge graph.
 *
 * The head graph came from real vector geometry, so extraction was only
 * welding coincident endpoints. A PNG has no endpoints to weld, so this is
 * the brain-graph route instead: work from the ink itself.
 *
 *   1. threshold to binary ink/paper
 *   2. Zhang-Suen thinning to 1px runs
 *   3. endpoints (1 neighbour) and junctions (>=3) become candidate nodes
 *   4. weld the junction CLUSTERS thinning always leaves at a crossing
 *   5. trace the runs between nodes into edges
 *   6. Douglas-Peucker along each run; the tolerance sets the node count
 *   7. closed loops (the joint circles) have no junction at all and are
 *      detected separately, then resampled into polygons
 *
 * The ink is thinned, NOT the white interiors. Thinning the interiors gives a
 * stick figure; thinning the ink keeps it an outline drawing, which is what
 * the head graph is and what the mesh renders.
 *
 * Usage:  node tools/trace-lineart.js input.png [--tol 1.4] [--min-run 6]
 *                                              [--svg out.svg] [--json out.json]
 *
 * Dev-only, like everything in tools/. Nothing here ships.
 */

'use strict';

const fs = require('fs');
const zlib = require('zlib');

// ── PNG decode ──
// Enough of the spec for what a line-art export actually contains: 8-bit
// greyscale, RGB or RGBA, no interlace. Anything else is rejected loudly
// rather than silently mis-read.
function decodePNG(buf) {
    if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
    let p = 8, w = 0, h = 0, depth = 0, color = 0, interlace = 0;
    const idat = [];
    while (p < buf.length) {
        const len = buf.readUInt32BE(p);
        const type = buf.toString('ascii', p + 4, p + 8);
        const data = buf.slice(p + 8, p + 8 + len);
        if (type === 'IHDR') {
            w = data.readUInt32BE(0); h = data.readUInt32BE(4);
            depth = data[8]; color = data[9]; interlace = data[12];
        } else if (type === 'IDAT') idat.push(data);
        else if (type === 'IEND') break;
        p += 12 + len;
    }
    if (depth !== 8) throw new Error(`unsupported bit depth ${depth} (need 8)`);
    if (interlace) throw new Error('interlaced PNG not supported');
    const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[color];
    if (!ch) throw new Error(`unsupported colour type ${color}`);

    const raw = zlib.inflateSync(Buffer.concat(idat));
    const stride = w * ch;
    const px = Buffer.alloc(h * stride);
    const paeth = (a, b, c) => {
        const pp = a + b - c;
        const pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
        return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
    };
    let o = 0, ri = 0;
    for (let y = 0; y < h; y++) {
        const f = raw[ri++];
        for (let x = 0; x < stride; x++) {
            const v = raw[ri++];
            const A = x >= ch ? px[o + x - ch] : 0;
            const B = y > 0 ? px[o - stride + x] : 0;
            const C = x >= ch && y > 0 ? px[o - stride + x - ch] : 0;
            px[o + x] = (f === 0 ? v : f === 1 ? v + A : f === 2 ? v + B
                : f === 3 ? v + ((A + B) >> 1) : v + paeth(A, B, C)) & 255;
        }
        o += stride;
    }
    return { w, h, ch, px };
}

// Ink mask. Line art is dark on light, and an alpha channel (a transparent
// export) means anything opaque is ink regardless of its colour.
function inkMask(img, threshold = 160) {
    const { w, h, ch, px } = img;
    const m = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * ch;
            let lum, alpha = 255;
            if (ch === 1) lum = px[i];
            else if (ch === 2) { lum = px[i]; alpha = px[i + 1]; }
            else { lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
                   if (ch === 4) alpha = px[i + 3]; }
            m[y * w + x] = (alpha > 128 && lum < threshold) ? 1 : 0;
        }
    }
    return m;
}

// ── Zhang-Suen thinning ──
// Two sub-iterations per pass, each deleting boundary pixels whose removal
// cannot break connectivity. Repeats until a pass deletes nothing, which for
// line art a few pixels thick is a handful of passes.
function thin(mask, w, h) {
    const m = Uint8Array.from(mask);
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : m[y * w + x];
    let changed = true;
    while (changed) {
        changed = false;
        for (let step = 0; step < 2; step++) {
            const kill = [];
            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    if (!m[y * w + x]) continue;
                    // P2..P9 clockwise from north.
                    const n = [at(x, y - 1), at(x + 1, y - 1), at(x + 1, y), at(x + 1, y + 1),
                               at(x, y + 1), at(x - 1, y + 1), at(x - 1, y), at(x - 1, y - 1)];
                    let b = 0, a = 0;
                    for (let i = 0; i < 8; i++) {
                        b += n[i];
                        if (n[i] === 0 && n[(i + 1) % 8] === 1) a++;
                    }
                    if (b < 2 || b > 6 || a !== 1) continue;
                    const [P2, P3, P4, P5, P6, P7, P8, P9] = n;
                    if (step === 0) {
                        if (P2 * P4 * P6 || P4 * P6 * P8) continue;
                    } else {
                        if (P2 * P4 * P8 || P2 * P6 * P8) continue;
                    }
                    kill.push(y * w + x);
                }
            }
            if (kill.length) { changed = true; for (const k of kill) m[k] = 0; }
        }
    }
    return m;
}

const N8 = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];

function neighbours(sk, w, h, x, y) {
    const out = [];
    for (const [dx, dy] of N8) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && sk[ny * w + nx]) out.push([nx, ny]);
    }
    return out;
}

// Crossing number: 0->1 transitions walking the 8-ring. This, NOT the raw
// neighbour count, is what says whether a pixel is a branch.
//
// A skeleton curve running diagonally staircases, and a staircase pixel has
// THREE 8-neighbours while being a perfectly ordinary point on a line — two of
// the three are adjacent to each other, so the ring still crosses only twice.
// Counting neighbours instead turned every such pixel into a junction: on a
// test drawing with 9 real corners it found 19 nodes, twelve of them scattered
// around two plain circles, and the circles then had junctions so they were
// never recognised as closed loops at all.
function crossings(sk, w, h, x, y) {
    const ring = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
    const at = (dx, dy) => {
        const nx = x + dx, ny = y + dy;
        return (nx < 0 || ny < 0 || nx >= w || ny >= h) ? 0 : sk[ny * w + nx];
    };
    let c = 0;
    for (let i = 0; i < 8; i++) {
        if (!at(...ring[i]) && at(...ring[(i + 1) % 8])) c++;
    }
    return c;
}

// ── Skeleton to graph ──
//
// Thinning leaves a CLUSTER of junction pixels at every crossing, not a single
// one: an X of 3px strokes thins to a few adjacent pixels each with 3+
// neighbours. Taken literally that is four nodes joined by three 1px edges
// where the drawing has one node, so adjacent junction pixels are welded into
// one node at their centroid before any run is traced.
function skeletonGraph(sk, w, h) {
    const deg = new Int8Array(w * h);      // neighbour count, for the loop pass
    const cn = new Int8Array(w * h);       // crossing number, for classification
    const px = [];
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (!sk[y * w + x]) continue;
            deg[y * w + x] = neighbours(sk, w, h, x, y).length;
            cn[y * w + x] = crossings(sk, w, h, x, y);
            px.push([x, y]);
        }
    }
    const isNode = (x, y) =>
        deg[y * w + x] === 1 || cn[y * w + x] >= 3;

    // Weld adjacent node pixels into one node.
    const nodeId = new Int32Array(w * h).fill(-1);
    const nodes = [];
    for (const [x, y] of px) {
        if (!isNode(x, y) || nodeId[y * w + x] >= 0) continue;
        const stack = [[x, y]], group = [];
        nodeId[y * w + x] = nodes.length;
        while (stack.length) {
            const [cx, cy] = stack.pop();
            group.push([cx, cy]);
            for (const [nx, ny] of neighbours(sk, w, h, cx, cy)) {
                if (isNode(nx, ny) && nodeId[ny * w + nx] < 0) {
                    nodeId[ny * w + nx] = nodes.length;
                    stack.push([nx, ny]);
                }
            }
        }
        const cx = group.reduce((a, g) => a + g[0], 0) / group.length;
        const cy = group.reduce((a, g) => a + g[1], 0) / group.length;
        nodes.push({ x: cx, y: cy, px: group });
    }

    // Everything that is not a node pixel belongs to some edge. Take those as
    // 8-connected COMPONENTS rather than walking outward from each node: a
    // component that touches nodes is a path between them, one that touches
    // none is a closed ring. Walking from the nodes instead, marking pixels
    // used as it went, stranded whatever the walk did not happen to reach —
    // on the test drawing that split two rectangles and two circles into
    // thirteen fragments.
    // The node pixels are DILATED by one before the flood. A welded junction is
    // often a single pixel, and 8-connectivity lets the arms meeting there join
    // around it, so the component stays one piece: on the test drawing two
    // rectangles sharing an edge came back as a single component, which chain()
    // then traced as one snake and cut a diagonal straight across the shape.
    // Removing the junction's immediate neighbourhood as well guarantees the
    // arms separate. Ends are snapped back onto the node centroid afterwards,
    // so nothing is lost by taking a pixel or two extra.
    const mark = new Uint8Array(w * h);
    const nearId = new Int32Array(w * h).fill(-1);
    for (let i = 0; i < nodes.length; i++) {
        for (const [x, y] of nodes[i].px) { mark[y * w + x] = 1; nearId[y * w + x] = i; }
    }
    const dilate = [];
    for (let i = 0; i < nodes.length; i++) {
        for (const [x, y] of nodes[i].px) {
            for (const [nx, ny] of neighbours(sk, w, h, x, y)) {
                if (!mark[ny * w + nx]) dilate.push([nx, ny, i]);
            }
        }
    }
    for (const [x, y, i] of dilate) { mark[y * w + x] = 1; if (nearId[y * w + x] < 0) nearId[y * w + x] = i; }

    // Chain a component into an ordered run. At a staircase pixel the skeleton
    // offers more than one continuation, and the right one is the straightest:
    // picking arbitrarily is what fragmented the rings.
    const chain = (comp, from) => {
        const inComp = new Set(comp.map(([x, y]) => y * w + x));
        const taken = new Set();
        let cur = from, prev = null;
        const path = [];
        while (cur) {
            path.push(cur); taken.add(cur[1] * w + cur[0]);
            const opts = neighbours(sk, w, h, cur[0], cur[1])
                .filter(([nx, ny]) => inComp.has(ny * w + nx) && !taken.has(ny * w + nx));
            if (!opts.length) break;
            if (!prev || opts.length === 1) { prev = cur; cur = opts[0]; continue; }
            const hx = cur[0] - prev[0], hy = cur[1] - prev[1];
            opts.sort((a, b) => {
                const da = (a[0] - cur[0]) * hx + (a[1] - cur[1]) * hy;
                const db = (b[0] - cur[0]) * hx + (b[1] - cur[1]) * hy;
                return db - da;          // most nearly straight ahead first
            });
            prev = cur; cur = opts[0];
        }
        return path;
    };

    const runs = [], loops = [];
    const seenPx = new Uint8Array(w * h);
    for (const [sx, sy] of px) {
        if (mark[sy * w + sx] || seenPx[sy * w + sx]) continue;
        // Flood the component.
        const comp = [], stack = [[sx, sy]];
        seenPx[sy * w + sx] = 1;
        while (stack.length) {
            const [cx, cy] = stack.pop();
            comp.push([cx, cy]);
            for (const [nx, ny] of neighbours(sk, w, h, cx, cy)) {
                if (mark[ny * w + nx] || seenPx[ny * w + nx]) continue;
                seenPx[ny * w + nx] = 1; stack.push([nx, ny]);
            }
        }
        // Which nodes does it touch, and from which pixel?
        const ends = [];
        for (const [cx, cy] of comp) {
            for (const [nx, ny] of neighbours(sk, w, h, cx, cy)) {
                const id = nearId[ny * w + nx];
                if (id >= 0 && !ends.some(e => e.id === id && e.at[0] === cx && e.at[1] === cy)) {
                    ends.push({ id, at: [cx, cy] });
                }
            }
        }
        if (ends.length >= 2) {
            const path = chain(comp, ends[0].at);
            const last = path[path.length - 1];
            const exit = ends.find(e => e.at[0] === last[0] && e.at[1] === last[1]) ||
                         ends.find(e => e.id !== ends[0].id) || ends[1];
            runs.push({ a: ends[0].id, b: exit.id, path });
        } else if (ends.length === 1) {
            runs.push({ a: ends[0].id, b: ends[0].id, path: chain(comp, ends[0].at) });
        } else if (comp.length > 8) {
            loops.push(chain(comp, comp[0]));
        }
    }
    return { nodes, runs, loops };
}

// ── Simplify ──
// Douglas-Peucker along each traced run. The tolerance is the one knob that
// sets the final node count: a run that is dead straight collapses to its two
// endpoints, a curve keeps whatever vertices it needs to stay a curve.
function rdp(pts, tol) {
    if (pts.length < 3) return pts.slice();
    let worst = 0, idx = 0;
    const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    for (let i = 1; i < pts.length - 1; i++) {
        const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
        if (d > worst) { worst = d; idx = i; }
    }
    if (worst <= tol) return [pts[0], pts[pts.length - 1]];
    return rdp(pts.slice(0, idx + 1), tol).slice(0, -1).concat(rdp(pts.slice(idx), tol));
}

// Build the final node list and edge list. Run endpoints are the welded
// junctions; interior vertices kept by rdp become new nodes on the way.
function buildGraph(g, { tol = 1.4, minRun = 6, loopStep = 7 } = {}) {
    const out = [], key = new Map();
    const add = (x, y) => {
        const k = `${Math.round(x * 4)},${Math.round(y * 4)}`;
        if (key.has(k)) return key.get(k);
        key.set(k, out.length); out.push([x, y]); return out.length - 1;
    };
    const edges = [];
    const link = (a, b) => { if (a !== b) edges.push([a, b]); };

    for (const r of g.runs) {
        if (r.path.length < minRun && r.a !== r.b) {
            link(add(g.nodes[r.a].x, g.nodes[r.a].y), add(g.nodes[r.b].x, g.nodes[r.b].y));
            continue;
        }
        const simp = rdp(r.path, tol);
        // Snap the ends onto the welded node centroids so junctions stay shared.
        simp[0] = [g.nodes[r.a].x, g.nodes[r.a].y];
        simp[simp.length - 1] = [g.nodes[r.b].x, g.nodes[r.b].y];
        let prev = add(simp[0][0], simp[0][1]);
        for (let i = 1; i < simp.length; i++) {
            const id = add(simp[i][0], simp[i][1]);
            link(prev, id); prev = id;
        }
    }
    // Rings are resampled at a fixed step rather than by rdp: a circle has no
    // corner for rdp to find, so it would collapse to a triangle.
    for (const ring of g.loops) {
        const ids = [];
        for (let i = 0; i < ring.length; i += loopStep) ids.push(add(ring[i][0], ring[i][1]));
        for (let i = 0; i < ids.length; i++) link(ids[i], ids[(i + 1) % ids.length]);
    }
    // Dedupe undirected edges.
    const seen = new Set(), E = [];
    for (const [a, b] of edges) {
        const k = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (seen.has(k)) continue;
        seen.add(k); E.push([a, b]);
    }
    return { nodes: out, edges: E };
}

// ── Simplify the GRAPH, which is where the node count actually lives ──
//
// Douglas-Peucker only removes vertices along a run. It cannot touch a
// junction, so on a busy drawing the junction count is a floor: the arm traced
// to 983 junctions and 719 runs, and going from tolerance 1.4 to 4.0 moved the
// total from 859 nodes to 752. Everything worth removing is here instead.
//
// Three passes to a fixpoint:
//   weld     nodes closer than `weld` units, which is one crossing of thick
//            lines read as several
//   prune    degree-1 nodes on a short edge — line-end and raster spurs, and
//            whole isolated fragments once their last edge goes
//   dissolve degree-2 nodes whose removal barely moves the line, which were
//            never junctions in the drawing, only in the skeleton
//
// The dissolve test is PERPENDICULAR DEVIATION, not the angle at the node.
// Angle was tried first and quietly destroyed every curve: each individual turn
// on a polygon looks nearly straight, and the pass runs to a fixpoint, so a
// circle keeps losing nodes until its turns are sharp enough to survive — the
// test drawing's two rings came back as a square and a pentagon. Deviation has
// the memory that angle lacks: removing a node from a circle moves the chord by
// the sagitta, which GROWS as the circle coarsens, so the erosion stops itself.
// It is Douglas-Peucker's own criterion, applied across junctions.
function simplifyGraph(nodes, edges, { weld = 2.5, minLeaf = 7, dissolve = 1.2 } = {}) {
    let N = nodes.map(n => n.slice()), E = edges.map(e => e.slice());

    const rebuild = () => {
        const adj = N.map(() => []);
        E.forEach(([a, b], i) => { adj[a].push({ to: b, i }); adj[b].push({ to: a, i }); });
        return adj;
    };
    const dedupe = () => {
        const seen = new Set(), out = [];
        for (const [a, b] of E) {
            if (a === b) continue;
            const k = a < b ? `${a}-${b}` : `${b}-${a}`;
            if (seen.has(k)) continue;
            seen.add(k); out.push([a, b]);
        }
        E = out;
    };
    // Drop nodes no edge references, and renumber.
    const compact = () => {
        const used = new Set();
        for (const [a, b] of E) { used.add(a); used.add(b); }
        const map = new Map();
        const out = [];
        N.forEach((n, i) => { if (used.has(i)) { map.set(i, out.length); out.push(n); } });
        N = out;
        E = E.map(([a, b]) => [map.get(a), map.get(b)]);
    };

    let changed = true, guard = 0;
    while (changed && guard++ < 40) {
        changed = false;

        // weld
        const owner = N.map((_, i) => i);
        const find = (i) => { while (owner[i] !== i) { owner[i] = owner[owner[i]]; i = owner[i]; } return i; };
        const w2 = weld * weld;
        for (let i = 0; i < N.length; i++) {
            for (let j = i + 1; j < N.length; j++) {
                const dx = N[i][0] - N[j][0], dy = N[i][1] - N[j][1];
                if (dx * dx + dy * dy <= w2) {
                    const a = find(i), b = find(j);
                    if (a !== b) { owner[Math.max(a, b)] = Math.min(a, b); changed = true; }
                }
            }
        }
        if (changed) {
            const groups = new Map();
            for (let i = 0; i < N.length; i++) {
                const r = find(i);
                if (!groups.has(r)) groups.set(r, []);
                groups.get(r).push(i);
            }
            const map = new Map(), out = [];
            for (const [, g] of groups) {
                const cx = g.reduce((a, i) => a + N[i][0], 0) / g.length;
                const cy = g.reduce((a, i) => a + N[i][1], 0) / g.length;
                for (const i of g) map.set(i, out.length);
                out.push([cx, cy]);
            }
            N = out;
            E = E.map(([a, b]) => [map.get(a), map.get(b)]);
            dedupe();
        }

        // prune short leaves, repeatedly
        for (;;) {
            const adj = rebuild();
            const kill = new Set();
            for (let i = 0; i < N.length; i++) {
                if (adj[i].length !== 1) continue;
                const o = adj[i][0].to;
                if (Math.hypot(N[i][0] - N[o][0], N[i][1] - N[o][1]) < minLeaf) kill.add(adj[i][0].i);
            }
            if (!kill.size) break;
            E = E.filter((_, i) => !kill.has(i));
            changed = true;
        }
        compact();

        // dissolve straight-through degree-2 nodes
        for (;;) {
            const adj = rebuild();
            let did = false;
            for (let i = 0; i < N.length; i++) {
                if (adj[i].length !== 2) continue;
                const [p, q] = adj[i];
                if (p.to === q.to) continue;
                // How far does the line move if i goes? That is the distance
                // from i to the chord joining its two neighbours.
                const [px1, py1] = N[p.to], [qx1, qy1] = N[q.to];
                const dx = qx1 - px1, dy = qy1 - py1;
                const len = Math.hypot(dx, dy);
                const dev = len < 1e-6
                    ? Math.hypot(N[i][0] - px1, N[i][1] - py1)
                    : Math.abs(dy * N[i][0] - dx * N[i][1] + qx1 * py1 - qy1 * px1) / len;
                if (dev > dissolve) continue;
                const drop = new Set([p.i, q.i]);
                E = E.filter((_, k) => !drop.has(k));
                E.push([p.to, q.to]);
                dedupe();
                did = true; changed = true;
                break;
            }
            if (!did) break;
            compact();
        }
        compact();
    }
    return { nodes: N, edges: E };
}

// ── Decimate to a target node count, by quadric error ──
//
// This is the pass that matters, and welding by DISTANCE was the wrong tool:
// it merges whatever is nearby whether or not the shape moves, so on a dense
// mesh whole regions collapsed to a point and every edge that crossed their
// boundary survived as a spoke — the traced arm came back as a starburst.
//
// Rank collapses by how far the local line work MOVES instead. Each node
// carries a quadric summed from the lines through its own edges, so the error
// of putting a merged node at p is Qu(p) + Qv(p): cheap along a straight run,
// expensive at a corner. Flat panels thin out and corners hold, which is the
// same reason CLAUDE.md gives for the head graph's coarse level.
//
// The quadric is the homogeneous 2D form E(x,y) = ax^2 + 2bxy + cy^2 + 2dx +
// 2ey + f, stored as [a,b,c,d,e,f]. A line with unit normal (nx,ny) and offset
// w contributes exactly (nx*x + ny*y + w)^2.
function lineQuadric(x1, y1, x2, y2) {
    let nx = y1 - y2, ny = x2 - x1;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len; ny /= len;
    const w = -(nx * x1 + ny * y1);
    return [nx * nx, nx * ny, ny * ny, nx * w, ny * w, w * w];
}
const qAdd = (A, B) => A.map((v, i) => v + B[i]);
const qEval = (Q, x, y) =>
    Q[0] * x * x + 2 * Q[1] * x * y + Q[2] * y * y + 2 * Q[3] * x + 2 * Q[4] * y + Q[5];

function decimate(nodes, edges, target) {
    const N = nodes.map(n => n.slice());
    const alive = new Uint8Array(N.length).fill(1);
    const adj = N.map(() => new Set());
    for (const [a, b] of edges) { if (a !== b) { adj[a].add(b); adj[b].add(a); } }

    const Q = N.map(() => [0, 0, 0, 0, 0, 0]);
    for (const [a, b] of edges) {
        if (a === b) continue;
        const q = lineQuadric(N[a][0], N[a][1], N[b][0], N[b][1]);
        Q[a] = qAdd(Q[a], q); Q[b] = qAdd(Q[b], q);
    }

    // Where to put a merged pair, and what it costs. The optimal point solves
    // the 2x2 system from the summed quadric; a degenerate one (two collinear
    // runs give no unique minimum) falls back to the midpoint.
    const place = (u, v) => {
        const S = qAdd(Q[u], Q[v]);
        const det = S[0] * S[2] - S[1] * S[1];
        let x, y;
        if (Math.abs(det) > 1e-9) {
            x = (S[1] * S[4] - S[2] * S[3]) / det;
            y = (S[1] * S[3] - S[0] * S[4]) / det;
        } else {
            x = (N[u][0] + N[v][0]) / 2; y = (N[u][1] + N[v][1]) / 2;
        }
        return { x, y, cost: Math.max(0, qEval(S, x, y)) };
    };

    let live = N.length;
    let guard = 0;
    while (live > target && guard++ < nodes.length * 4) {
        // Cheapest surviving edge.
        let best = null;
        for (let u = 0; u < N.length; u++) {
            if (!alive[u]) continue;
            for (const v of adj[u]) {
                if (v <= u || !alive[v]) continue;
                const p = place(u, v);
                if (!best || p.cost < best.cost) best = { u, v, ...p };
            }
        }
        if (!best) break;
        const { u, v, x, y } = best;
        N[u] = [x, y];
        Q[u] = qAdd(Q[u], Q[v]);
        for (const w of adj[v]) {
            if (w === u) continue;
            adj[w].delete(v); adj[w].add(u); adj[u].add(w);
        }
        adj[u].delete(v); adj[v].clear();
        alive[v] = 0; live--;
    }

    const map = new Map(), out = [];
    for (let i = 0; i < N.length; i++) if (alive[i]) { map.set(i, out.length); out.push(N[i]); }
    const seen = new Set(), E = [];
    for (let u = 0; u < N.length; u++) {
        if (!alive[u]) continue;
        for (const v of adj[u]) {
            if (!alive[v] || v === u) continue;
            const a = map.get(u), b = map.get(v);
            const k = a < b ? `${a}-${b}` : `${b}-${a}`;
            if (seen.has(k)) continue;
            seen.add(k); E.push([a, b]);
        }
    }
    return { nodes: out, edges: E };
}

// Drop components smaller than `min` nodes.
//
// Decimation cannot merge across components — it only collapses along edges —
// so a fragmented trace has a hard floor at one node per component, and
// pushing past it just turns whole fragments into isolated dots. The arm
// traced to 149 components, 113 of them three nodes or fewer, and asking for
// 90 nodes returned 90 nodes with 12 edges. A small weld stitches the pieces
// that are one line in the drawing broken by rasterisation; this removes what
// is left, which is debris.
function dropSmallComponents(nodes, edges, min = 5) {
    const adj = nodes.map(() => []);
    edges.forEach(([a, b], i) => { adj[a].push(b); adj[b].push(a); });
    const comp = new Int32Array(nodes.length).fill(-1);
    const size = [];
    for (let i = 0; i < nodes.length; i++) {
        if (comp[i] >= 0) continue;
        const id = size.length, stack = [i];
        comp[i] = id; let n = 0;
        while (stack.length) {
            const u = stack.pop(); n++;
            for (const v of adj[u]) if (comp[v] < 0) { comp[v] = id; stack.push(v); }
        }
        size.push(n);
    }
    const keep = (i) => size[comp[i]] >= min;
    const map = new Map(), out = [];
    for (let i = 0; i < nodes.length; i++) if (keep(i)) { map.set(i, out.length); out.push(nodes[i]); }
    return { nodes: out, edges: edges.filter(([a, b]) => keep(a) && keep(b))
                                     .map(([a, b]) => [map.get(a), map.get(b)]),
             components: size.length, kept: size.filter(n => n >= min).length };
}

// Fit into a 0..100 box on the long side, the space the other graphs author in.
function normalise(nodes) {
    const xs = nodes.map(n => n[0]), ys = nodes.map(n => n[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = 100 / Math.max(x1 - x0, y1 - y0);
    return nodes.map(([x, y]) => [ (x - x0) * k, (y - y0) * k ]);
}

const fmt = (nodes) => nodes.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
const fmtE = (edges) => edges.map(([a, b]) => `${a} ${b}`).join(' ');

function preview(nodes, edges, path) {
    const line = edges.map(([a, b]) =>
        `<line x1="${nodes[a][0].toFixed(1)}" y1="${nodes[a][1].toFixed(1)}" ` +
        `x2="${nodes[b][0].toFixed(1)}" y2="${nodes[b][1].toFixed(1)}"/>`).join('');
    const dot = nodes.map(([x, y]) =>
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="0.7"/>`).join('');
    fs.writeFileSync(path,
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 108 108" width="540" height="540">` +
        `<rect x="-4" y="-4" width="108" height="108" fill="#fff"/>` +
        `<g stroke="#7c5cff" stroke-width="0.5" fill="none">${line}</g>` +
        `<g fill="#3b2a99">${dot}</g></svg>`);
}

function trace(file, opts = {}) {
    const img = decodePNG(fs.readFileSync(file));
    const mask = inkMask(img, opts.threshold);
    const sk = thin(mask, img.w, img.h);
    const g = skeletonGraph(sk, img.w, img.h);
    const built = buildGraph(g, opts);
    // Prune spurs first — they are raster noise, not geometry, and decimation
    // would happily spend collapses on them. Then decimate to the budget.
    let simp = built, comps = null;
    if (!opts.raw) {
        // Stitch, then clear the debris, then decimate. Order matters: welding
        // first is what turns 149 fragments back into a drawing.
        simp = simplifyGraph(built.nodes, built.edges,
            { weld: opts.weld, minLeaf: opts.minLeaf, dissolve: 0 });
        const d = dropSmallComponents(simp.nodes, simp.edges, opts.minComp);
        comps = { total: d.components, kept: d.kept };
        simp = { nodes: d.nodes, edges: d.edges };
        if (opts.target && simp.nodes.length > opts.target) {
            simp = decimate(simp.nodes, simp.edges, opts.target);
        }
    }
    return { img, mask, sk, raw: g, before: built.nodes.length, comps,
             nodes: normalise(simp.nodes), edges: simp.edges };
}

module.exports = { decodePNG, inkMask, thin, neighbours, crossings, skeletonGraph,
                   rdp, buildGraph, simplifyGraph, dropSmallComponents, decimate, normalise, trace, preview, fmt, fmtE };

if (require.main === module) {
    const args = process.argv.slice(2);
    const file = args[0];
    if (!file) { console.error('usage: node tools/trace-lineart.js input.png [--tol n] [--svg out]'); process.exit(1); }
    const opt = (name, d) => { const i = args.indexOf('--' + name); return i < 0 ? d : Number(args[i + 1]); };
    const r = trace(file, { tol: opt('tol', 1.4), minRun: opt('min-run', 6), loopStep: opt('loop-step', 7),
                            weld: opt('weld', 2.5), minLeaf: opt('min-leaf', 7),
                            dissolve: opt('dissolve', 1.2), target: opt('target', 0), minComp: opt('min-comp', 5),
                            raw: args.includes('--raw') });
    const svgI = args.indexOf('--svg');
    if (svgI >= 0) preview(r.nodes, r.edges, args[svgI + 1]);
    console.error(`${r.img.w}x${r.img.h}  ink ${r.mask.reduce((a, b) => a + b, 0)}px  ` +
                  `junctions ${r.raw.nodes.length}  runs ${r.raw.runs.length}  loops ${r.raw.loops.length}  ` +
                  `-> ${r.before} raw` +
                  (r.comps ? `  components ${r.comps.total} -> ${r.comps.kept}` : '') +
                  `  -> ${r.nodes.length} nodes / ${r.edges.length} edges`);
    console.log(`XY: '${fmt(r.nodes)}'`);
    console.log(`E:  '${fmtE(r.edges)}'`);
}
