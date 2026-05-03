/* ============================================
   3D Neural Network Background
   AI ↔ Human Brain Neuron Interconnection
   ============================================ */
(function() {
    'use strict';

    const CFG = {
        NEURON_COUNT: 110,
        NEURON_COUNT_MOBILE: 55,
        AI_RATIO: 0.45,
        CONNECTION_DIST: 220,
        MIN_NEIGHBORS: 3,
        SIGNAL_SPEED: 0.0085,
        SIGNAL_SPAWN_RATE: 0.018,
        MAX_SIGNALS: 45,
        MAX_BUBBLES: 30,
        PERSPECTIVE: 800,
        DEPTH_RANGE: 600,
        DRIFT_SPEED: 0.25,
        TRAIL_LENGTH: 10,
        ARRIVAL_PULSE_FRAMES: 22,
        BUBBLE_LIFE_FRAMES: 70,
        BUBBLE_RISE: 0.45,
        // Wire (connection) visibility
        WIRE_ALPHA_BASE: 0.28,
        WIRE_ALPHA_ACTIVE: 0.85,
        WIRE_WIDTH_BASE: 0.7,
        WIRE_WIDTH_ACTIVE: 1.6,
        COLOR_AI: [37, 99, 235],
        COLOR_AI_GLOW: [96, 165, 250],
        COLOR_BIO: [168, 85, 247],
        COLOR_BIO_GLOW: [236, 130, 200],
        COLOR_SIGNAL_AI: [96, 205, 255],
        COLOR_SIGNAL_BIO: [232, 160, 255],
        COLOR_SIGNAL_BRIDGE: [200, 190, 255],
        CONN_RECALC_INTERVAL: 60,
        // Adaptive degradation thresholds (ms per frame).
        SLOW_FRAME_MS: 28,    // ~36 fps
        FAST_FRAME_MS: 20,    // ~50 fps
    };

    let canvas, ctx, W, H, dpr;
    let neurons = [], connections = [], signals = [], numberBubbles = [];
    let frameCount = 0, lastTime = 0, paused = false;
    // Reused per-frame buffers — avoid per-frame array allocations (a major
    // GC pressure source that shows up as jitter).
    let projSx = null, projSy = null, projS = null;
    let zSortedIdx = null;   // Int32Array of neuron indices sorted by z asc
    let bubbleFontCache = null;
    // Adaptive perf state — if frames take too long, we shed work.
    let perfLevel = 1;       // 1 = full, 0.5 = degraded (no extras)
    let slowFrames = 0, fastFrames = 0;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const neuronCount = reducedMotion
        ? Math.floor((isMobile ? CFG.NEURON_COUNT_MOBILE : CFG.NEURON_COUNT) * 0.5)
        : (isMobile ? CFG.NEURON_COUNT_MOBILE : CFG.NEURON_COUNT);

    // ── 3D → 2D Projection ──
    function project(x, y, z) {
        const s = CFG.PERSPECTIVE / (CFG.PERSPECTIVE + z);
        return { sx: x * s + W / 2, sy: y * s + H / 2, s };
    }

    function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

    function rand(min, max) { return min + Math.random() * (max - min); }

    // ── Neuron Creation ──
    //
    // Bio neuron: soma (cell body) + nucleus + nucleolus + branching dendrite
    //             tree + a single longer axon ending in a terminal bulb.
    // AI neuron:  hexagon ('node') or hex-with-inner-hex ('layer'), crisp edges.
    function createNeuron() {
        const isAI = Math.random() < CFG.AI_RATIO;
        const kind = isAI ? 'ai' : 'bio';
        let subtype, radius, color;

        if (isAI) {
            subtype = Math.random() < 0.33 ? 'layer' : 'node';
            radius = subtype === 'layer' ? rand(5, 7) : rand(3, 4.5);
            color = CFG.COLOR_AI;
        } else {
            // 'pyramidal' (large) vs 'interneuron' (small) — both look cell-like.
            subtype = Math.random() < 0.5 ? 'pyramidal' : 'interneuron';
            radius = subtype === 'pyramidal' ? rand(6, 9) : rand(3.5, 5);
            color = CFG.COLOR_BIO;
        }

        const halfD = CFG.DEPTH_RANGE / 2;
        const n = {
            x: rand(-W / 2, W / 2),
            y: rand(-H / 2, H / 2),
            z: rand(-halfD, halfD),
            vx: rand(-CFG.DRIFT_SPEED, CFG.DRIFT_SPEED),
            vy: rand(-CFG.DRIFT_SPEED, CFG.DRIFT_SPEED),
            vz: rand(-CFG.DRIFT_SPEED * 0.3, CFG.DRIFT_SPEED * 0.3),
            radius, kind, subtype, color,
            pulsePhase: rand(0, Math.PI * 2),
            rotation: rand(0, Math.PI * 2),    // for AI hex orientation
            soma: null,
            dendrites: null,
            axon: null,
            nucleus: null,
        };

        if (isAI) {
            // Random orientation for hex variety.
            return n;
        }

        // ── Build bio anatomy ──

        // Soma (cell body) — slightly irregular polygon for organic look.
        // Pre-compute relative-to-center vertices once.
        const somaPoints = subtype === 'pyramidal' ? 7 : 6;
        n.soma = [];
        for (let i = 0; i < somaPoints; i++) {
            const a = (i / somaPoints) * Math.PI * 2;
            const wobble = rand(0.85, 1.15);
            n.soma.push({ angle: a, r: radius * wobble });
        }

        // Nucleus inside soma, slightly off-center.
        n.nucleus = {
            offX: rand(-0.15, 0.15) * radius,
            offY: rand(-0.15, 0.15) * radius,
            r: radius * 0.45,
            nucleolusR: radius * 0.13,
        };

        // Branching dendrite tree.
        const dendCount = subtype === 'pyramidal'
            ? Math.floor(rand(5, 8))
            : Math.floor(rand(3, 5));

        // Bias dendrites away from where the axon will go (so they don't overlap).
        const axonAngle = rand(0, Math.PI * 2);
        n.dendrites = [];
        for (let i = 0; i < dendCount; i++) {
            // Distribute dendrites in the half-plane opposite the axon.
            const baseAngle = axonAngle + Math.PI + rand(-Math.PI * 0.65, Math.PI * 0.65);
            const length = rand(2.0, 3.4) * radius;
            const dend = {
                angle: baseAngle,
                length,
                curve: rand(-0.5, 0.5),
                width: rand(0.5, 0.9),
                branches: [],
            };
            // Each dendrite has 0–2 sub-branches starting at ~60–80% of length.
            const subCount = Math.random() < 0.7 ? Math.floor(rand(1, 3)) : 0;
            for (let j = 0; j < subCount; j++) {
                dend.branches.push({
                    fromT: rand(0.55, 0.85),
                    angleOff: rand(-Math.PI * 0.45, Math.PI * 0.45),
                    length: length * rand(0.35, 0.6),
                    curve: rand(-0.4, 0.4),
                });
            }
            n.dendrites.push(dend);
        }

        // Axon: 1 long line opposite the dendrite cluster, ending in a terminal bulb.
        n.axon = {
            angle: axonAngle,
            length: rand(4.5, 7) * radius,
            curve: rand(-0.25, 0.25),
            width: rand(0.7, 1.0),
            terminalR: radius * 0.35,
            // Optional: 0–2 small terminal branches (axon arborization)
            terminals: Math.random() < 0.5 ? Math.floor(rand(1, 3)) : 0,
        };

        return n;
    }

    // ── Init ──
    function init() {
        canvas = document.getElementById('neural-bg');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        resize();
        window.addEventListener('resize', resize);

        // Spawn neurons
        for (let i = 0; i < neuronCount; i++) {
            neurons.push(createNeuron());
        }

        // Pre-allocate reusable per-frame buffers.
        projSx = new Float32Array(neuronCount);
        projSy = new Float32Array(neuronCount);
        projS  = new Float32Array(neuronCount);
        zSortedIdx = new Int32Array(neuronCount);
        for (let i = 0; i < neuronCount; i++) zSortedIdx[i] = i;

        // Cache the font string once — getComputedStyle() inside the render
        // loop forces style/layout work every frame.
        const monoFamily = (getComputedStyle(document.documentElement)
            .getPropertyValue('--font-mono') || 'monospace').trim();
        bubbleFontCache = `500 11px ${monoFamily}, 'JetBrains Mono', monospace`;

        // Visibility handler
        document.addEventListener('visibilitychange', () => {
            paused = document.hidden;
            if (!paused) { lastTime = performance.now(); requestAnimationFrame(animate); }
        });

        lastTime = performance.now();
        requestAnimationFrame(animate);
    }

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ── Update Neurons ──
    function updateNeurons(dt) {
        const halfW = W / 2 + 100, halfH = H / 2 + 100, halfD = CFG.DEPTH_RANGE / 2;
        for (const n of neurons) {
            n.x += n.vx * dt; n.y += n.vy * dt; n.z += n.vz * dt;
            n.pulsePhase += 0.02 * dt;

            // Wrap around bounds
            if (n.x < -halfW) n.x = halfW;
            else if (n.x > halfW) n.x = -halfW;
            if (n.y < -halfH) n.y = halfH;
            else if (n.y > halfH) n.y = -halfH;
            if (n.z < -halfD) n.z = halfD;
            else if (n.z > halfD) n.z = -halfD;
        }
    }

    // ── Build Connections (throttled) ──
    // First pass: collect pairs within CONNECTION_DIST. Second pass: force-add
    // MIN_NEIGHBORS-nearest for any under-connected neuron so nothing floats.
    // Allocates only per-recalc (every CONN_RECALC_INTERVAL frames), never per
    // frame, so the GC stays quiet.
    const _connTypeOf = (a, b) =>
        (a.kind === 'ai' && b.kind === 'ai') ? 'ai'
        : (a.kind === 'bio' && b.kind === 'bio') ? 'bio'
        : 'bridge';

    function buildConnections() {
        connections.length = 0;
        const dist2 = CFG.CONNECTION_DIST * CFG.CONNECTION_DIST;
        const N = neurons.length;
        // Bitset-style flat buffer for "is pair connected" — much cheaper than
        // a Set of composite keys.
        const seen = new Uint8Array(N * N);
        const degree = new Int32Array(N);

        for (let i = 0; i < N; i++) {
            const a = neurons[i];
            const ax = a.x, ay = a.y, az = a.z;
            for (let j = i + 1; j < N; j++) {
                const b = neurons[j];
                const dx = ax - b.x, dy = ay - b.y, dz = az - b.z;
                const d2 = dx * dx + dy * dy + dz * dz;
                if (d2 < dist2) {
                    seen[i * N + j] = 1;
                    connections.push({ i, j, dist: Math.sqrt(d2), type: _connTypeOf(a, b) });
                    degree[i]++; degree[j]++;
                }
            }
        }

        // Top up neurons that are still under-connected. Compute distances on
        // demand only for these (typically a small fraction of N).
        const minN = CFG.MIN_NEIGHBORS;
        for (let i = 0; i < N; i++) {
            if (degree[i] >= minN) continue;
            const a = neurons[i];
            // Gather candidate distances into a small typed array.
            const cand = [];
            for (let j = 0; j < N; j++) {
                if (j === i) continue;
                const lo = i < j ? i : j, hi = i < j ? j : i;
                if (seen[lo * N + hi]) continue;
                const b = neurons[j];
                const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
                cand.push(j, Math.sqrt(dx * dx + dy * dy + dz * dz));
            }
            // Pair-sort: cand is [idx, dist, idx, dist, …].
            const pairs = [];
            for (let k = 0; k < cand.length; k += 2) pairs.push([cand[k], cand[k + 1]]);
            pairs.sort((p, q) => p[1] - q[1]);
            for (const [j, d] of pairs) {
                if (degree[i] >= minN) break;
                const lo = i < j ? i : j, hi = i < j ? j : i;
                if (seen[lo * N + hi]) continue;
                seen[lo * N + hi] = 1;
                connections.push({ i, j, dist: d, type: _connTypeOf(a, neurons[j]) });
                degree[i]++; degree[j]++;
            }
        }
    }

    // ── Update Signals ──
    function updateSignals(dt) {
        // Advance existing
        for (let k = signals.length - 1; k >= 0; k--) {
            const sig = signals[k];
            sig.progress += sig.speed * dt;

            // Record trail point (current 3D pos)
            const a = neurons[sig.fromIdx], b = neurons[sig.toIdx];
            if (a && b) {
                const t = sig.progress;
                sig.trail.push({
                    x: a.x + (b.x - a.x) * t,
                    y: a.y + (b.y - a.y) * t,
                    z: a.z + (b.z - a.z) * t,
                });
                if (sig.trail.length > CFG.TRAIL_LENGTH) sig.trail.shift();
            }

            if (signals[k].progress >= 1) {
                triggerArrival(signals[k].toIdx);
                // Bridge cascade: spawn 1 follow-up signal from target
                const s = signals[k];
                if (s.type === 'bridge' && signals.length < CFG.MAX_SIGNALS) {
                    const targetIdx = s.toIdx;
                    const targetKind = neurons[targetIdx].kind;
                    // Find a connection from target to same-kind neighbor
                    const candidates = connections.filter(c =>
                        (c.i === targetIdx || c.j === targetIdx) && c.type === targetKind
                    );
                    if (candidates.length > 0) {
                        const pick = candidates[Math.floor(Math.random() * candidates.length)];
                        const fromI = pick.i === targetIdx ? pick.i : pick.j;
                        const toI = pick.i === targetIdx ? pick.j : pick.i;
                        signals.push({
                            fromIdx: fromI, toIdx: toI,
                            progress: 0, speed: CFG.SIGNAL_SPEED * rand(0.8, 1.2),
                            type: targetKind,
                            trail: [],
                        });
                    }
                }
                signals.splice(k, 1);
            }
        }

        // Spawn new signals
        if (connections.length > 0 && signals.length < CFG.MAX_SIGNALS) {
            for (const conn of connections) {
                if (Math.random() < CFG.SIGNAL_SPAWN_RATE / 60) {
                    const dir = Math.random() < 0.5;
                    signals.push({
                        fromIdx: dir ? conn.i : conn.j,
                        toIdx: dir ? conn.j : conn.i,
                        progress: 0,
                        speed: CFG.SIGNAL_SPEED * rand(0.7, 1.3),
                        type: conn.type,
                        trail: [],   // 3D positions of recent points (for afterglow)
                    });
                    if (signals.length >= CFG.MAX_SIGNALS) break;
                }
            }
        }
    }

    // Random readable float for a "neuron is computing" feel.
    // Returns strings like "0.482", "-0.193", "1.024".
    function randomFloatText() {
        const v = (Math.random() * 2 - 1) * (Math.random() < 0.15 ? 10 : 1);
        const fixed = v.toFixed(Math.random() < 0.5 ? 3 : 4);
        // Use a real minus sign for typographic crispness.
        return fixed.replace('-', '−');
    }

    // Spawn a small floating-point number bubble at a neuron position.
    function spawnNumberBubble(idx) {
        const n = neurons[idx];
        if (!n || numberBubbles.length >= CFG.MAX_BUBBLES) return;
        if (perfLevel < 1) return;     // skip extras on degraded perf
        numberBubbles.push({
            x: n.x + rand(-n.radius, n.radius),
            y: n.y - n.radius * 1.6,
            z: n.z,
            vx: rand(-0.15, 0.15),
            vy: -CFG.BUBBLE_RISE - rand(0, 0.25),
            text: randomFloatText(),
            kind: n.kind,
            age: 0,
            maxAge: CFG.BUBBLE_LIFE_FRAMES,
        });
    }

    // Trigger an arrival "ping" on the target neuron when a signal completes.
    function triggerArrival(idx) {
        const n = neurons[idx];
        if (!n) return;
        n.pulseUntil = frameCount + CFG.ARRIVAL_PULSE_FRAMES;
        // ~70% of arrivals show a floating number — sparse enough to feel alive,
        // not noisy. Skipped entirely under reduced motion.
        if (!reducedMotion && Math.random() < 0.7) spawnNumberBubble(idx);
    }

    // Stroke the wire from a→b. Bio↔bio wires are slightly curved for an
    // axon-like feel; ai/bridge wires are straight (PCB-trace style).
    // Raw form takes coords directly (no proj-object alloc).
    function drawWirePathRaw(conn, ax, ay, bx, by) {
        ctx.beginPath();
        if (conn.type === 'bio') {
            const mx = (ax + bx) * 0.5 + (ay - by) * 0.1;
            const my = (ay + by) * 0.5 + (bx - ax) * 0.1;
            ctx.moveTo(ax, ay);
            ctx.quadraticCurveTo(mx, my, bx, by);
        } else {
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
        }
        ctx.stroke();
    }

    // ── Update Number Bubbles ──
    function updateNumberBubbles(dt) {
        for (let k = numberBubbles.length - 1; k >= 0; k--) {
            const b = numberBubbles[k];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.age += dt;
            // Decelerate and fade over time
            b.vy *= 0.985;
            if (b.age >= b.maxAge) numberBubbles.splice(k, 1);
        }
    }

    // ── Render ──
    function render(time) {
        ctx.clearRect(0, 0, W, H);

        const N = neurons.length;

        // Project all neurons into the reused Float32Arrays (no per-frame
        // object allocation).
        for (let i = 0; i < N; i++) {
            const n = neurons[i];
            const s = CFG.PERSPECTIVE / (CFG.PERSPECTIVE + n.z);
            projSx[i] = n.x * s + W / 2;
            projSy[i] = n.y * s + H / 2;
            projS[i]  = s;
        }

        // Insertion-sort indices by z. We reuse the array across frames, so it
        // is already nearly sorted — insertion sort is O(N) on near-sorted
        // input, far faster than a fresh map+sort each frame.
        for (let i = 1; i < N; i++) {
            const cur = zSortedIdx[i];
            const cz = neurons[cur].z;
            let j = i - 1;
            while (j >= 0 && neurons[zSortedIdx[j]].z > cz) {
                zSortedIdx[j + 1] = zSortedIdx[j];
                j--;
            }
            zSortedIdx[j + 1] = cur;
        }

        // Build a set of "wire is currently carrying a signal" pairs so we can
        // light those wires up as the data travels through them. Plain object
        // is faster than Set for these small lookups.
        const activeWires = Object.create(null);
        for (let s = 0; s < signals.length; s++) {
            const sig = signals[s];
            const lo = sig.fromIdx < sig.toIdx ? sig.fromIdx : sig.toIdx;
            const hi = sig.fromIdx < sig.toIdx ? sig.toIdx : sig.fromIdx;
            activeWires[lo * 10000 + hi] = 1;
        }

        ctx.lineCap = 'round';
        // Draw connections (wires) — visible enough to read as a network.
        for (let c = 0; c < connections.length; c++) {
            const conn = connections[c];
            const i = conn.i, j = conn.j;
            const a = neurons[i], b = neurons[j];
            const sax = projSx[i], say = projSy[i], sa = projS[i];
            const sbx = projSx[j], sby = projSy[j], sb = projS[j];
            const avgScale = (sa + sb) * 0.5;
            const distFalloff = Math.max(0.15, 1 - conn.dist / CFG.CONNECTION_DIST);
            const lo = i < j ? i : j, hi = i < j ? j : i;
            const isActive = activeWires[lo * 10000 + hi] === 1;

            const baseAlpha = (isActive ? CFG.WIRE_ALPHA_ACTIVE : CFG.WIRE_ALPHA_BASE)
                * distFalloff * avgScale;
            if (baseAlpha < 0.04) continue;       // skip near-invisible wires
            const baseWidth = (isActive ? CFG.WIRE_WIDTH_ACTIVE : CFG.WIRE_WIDTH_BASE) * avgScale;

            // Bridge connections used to allocate a linear gradient per frame
            // (very expensive). Use the average kind color instead — visually
            // similar at this opacity.
            if (conn.type === 'bridge') {
                ctx.strokeStyle = rgba(CFG.COLOR_SIGNAL_BRIDGE, baseAlpha);
            } else if (conn.type === 'ai') {
                ctx.strokeStyle = rgba(CFG.COLOR_AI, baseAlpha);
            } else {
                ctx.strokeStyle = rgba(CFG.COLOR_BIO, baseAlpha);
            }
            ctx.lineWidth = baseWidth;

            // Active wires get a cheap "halo" via a wider, softer over-stroke
            // instead of shadowBlur (which is 5–10× slower on canvas).
            if (isActive && perfLevel === 1) {
                const glowColor = conn.type === 'bridge' ? CFG.COLOR_SIGNAL_BRIDGE
                    : conn.type === 'ai' ? CFG.COLOR_SIGNAL_AI : CFG.COLOR_SIGNAL_BIO;
                ctx.lineWidth = baseWidth + 3 * avgScale;
                ctx.strokeStyle = rgba(glowColor, baseAlpha * 0.35);
                drawWirePathRaw(conn, sax, say, sbx, sby);
                ctx.lineWidth = baseWidth;
                ctx.strokeStyle = conn.type === 'bridge' ? rgba(CFG.COLOR_SIGNAL_BRIDGE, baseAlpha)
                    : conn.type === 'ai' ? rgba(CFG.COLOR_AI, baseAlpha)
                    : rgba(CFG.COLOR_BIO, baseAlpha);
            }
            drawWirePathRaw(conn, sax, say, sbx, sby);
        }

        // Draw signals (with motion trails)
        for (let s = 0; s < signals.length; s++) {
            const sig = signals[s];
            const a = neurons[sig.fromIdx], b = neurons[sig.toIdx];
            if (!a || !b) continue;
            const t = sig.progress;
            const sx = a.x + (b.x - a.x) * t;
            const sy = a.y + (b.y - a.y) * t;
            const sz = a.z + (b.z - a.z) * t;
            const ps = CFG.PERSPECTIVE / (CFG.PERSPECTIVE + sz);
            const px = sx * ps + W / 2;
            const py = sy * ps + H / 2;

            let color, r, glowR;
            if (sig.type === 'bridge') {
                color = CFG.COLOR_SIGNAL_BRIDGE; r = 3 * ps; glowR = 9 * ps;
            } else if (sig.type === 'ai') {
                color = CFG.COLOR_SIGNAL_AI; r = 2.2 * ps; glowR = 6 * ps;
            } else {
                color = CFG.COLOR_SIGNAL_BIO; r = 2.5 * ps; glowR = 7 * ps;
            }

            // Trail — fading line through trail points (skip when degraded).
            if (perfLevel === 1 && sig.trail.length > 1) {
                const tl = sig.trail.length;
                for (let i = 1; i < tl; i++) {
                    const t0 = sig.trail[i - 1], t1 = sig.trail[i];
                    const ps0 = CFG.PERSPECTIVE / (CFG.PERSPECTIVE + t0.z);
                    const ps1 = CFG.PERSPECTIVE / (CFG.PERSPECTIVE + t1.z);
                    const x0 = t0.x * ps0 + W / 2, y0 = t0.y * ps0 + H / 2;
                    const x1 = t1.x * ps1 + W / 2, y1 = t1.y * ps1 + H / 2;
                    const segAlpha = (i / tl) * 0.45 * ps;
                    ctx.strokeStyle = rgba(color, segAlpha);
                    ctx.lineWidth = (i / tl) * r * 1.4;
                    ctx.beginPath();
                    ctx.moveTo(x0, y0);
                    ctx.lineTo(x1, y1);
                    ctx.stroke();
                }
            }

            // Glow — radial gradient is one of the more expensive ops, but we
            // only have a few signals so this is acceptable.
            if (perfLevel === 1) {
                const grd = ctx.createRadialGradient(px, py, 0, px, py, glowR);
                grd.addColorStop(0, rgba(color, 0.7 * ps));
                grd.addColorStop(1, rgba(color, 0));
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(px, py, glowR, 0, Math.PI * 2);
                ctx.fill();
            }

            // Core
            ctx.fillStyle = rgba(color, 0.95 * ps);
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw neurons (sorted back to front, indices reused across frames).
        for (let k = 0; k < N; k++) {
            const idx = zSortedIdx[k];
            const n = neurons[idx];
            const px = projSx[idx], py = projSy[idx], ps = projS[idx];
            let pulse = 1 + Math.sin(n.pulsePhase) * 0.08;
            // Arrival burst: brief expand + flash when a signal hits this neuron.
            let arrival = 0;
            if (n.pulseUntil && frameCount < n.pulseUntil) {
                const left = (n.pulseUntil - frameCount) / CFG.ARRIVAL_PULSE_FRAMES;
                arrival = left;
                pulse += 0.6 * left;
            }
            const r = n.radius * ps * pulse;
            const alpha = Math.min(ps * 0.8, 0.85);
            if (r < 0.3 || alpha < 0.02) continue;

            // Arrival ring (fades outward)
            if (arrival > 0) {
                const ringR = r + (1 - arrival) * 18 * ps;
                const ringColor = n.kind === 'ai' ? CFG.COLOR_AI_GLOW : CFG.COLOR_BIO_GLOW;
                ctx.strokeStyle = rgba(ringColor, arrival * 0.7);
                ctx.lineWidth = 1.2 * ps;
                ctx.beginPath();
                ctx.arc(px, py, ringR, 0, Math.PI * 2);
                ctx.stroke();
            }

            if (n.kind === 'ai') {
                drawAINeuron(n, px, py, ps, r, alpha);
            } else {
                drawBioNeuron(n, px, py, ps, r, alpha, pulse);
            }
        }

        // ── Number bubbles (rendered last so they sit on top) ──
        ctx.font = bubbleFontCache;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Skip the bubble layer entirely on degraded perf — it's the most
        // expensive text/effect work in the loop.
        if (perfLevel === 1) {
            for (let i = 0; i < numberBubbles.length; i++) {
                const b = numberBubbles[i];
                const ps = CFG.PERSPECTIVE / (CFG.PERSPECTIVE + b.z);
                if (ps < 0.2) continue;
                const px = b.x * ps + W / 2;
                const py = b.y * ps + H / 2;
                const lifeFrac = 1 - b.age / b.maxAge;
                const alpha = Math.min(1, lifeFrac * 1.4) * ps;
                if (alpha < 0.02) continue;

                const color = b.kind === 'ai' ? CFG.COLOR_SIGNAL_AI : CFG.COLOR_SIGNAL_BIO;
                // shadowBlur is the single most expensive 2D-canvas op per draw;
                // a darker outer color stop gives the same legibility for ~free.
                ctx.fillStyle = rgba(color, Math.min(1, alpha * 1.1));
                ctx.fillText(b.text, px, py);
            }
        }
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }

    // ── AI neuron drawing — hexagons & nested hexagons ──
    function drawAINeuron(n, sx, sy, ps, r, alpha) {
        const sides = 6;
        const rot = n.rotation;

        // Outer glow halo (skipped on degraded perf — biggest fill area).
        if (perfLevel === 1) {
            const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.2);
            halo.addColorStop(0, rgba(CFG.COLOR_AI_GLOW, alpha * 0.25));
            halo.addColorStop(1, rgba(CFG.COLOR_AI_GLOW, 0));
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(sx, sy, r * 2.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Filled hexagon body
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const a = rot + (i / sides) * Math.PI * 2;
            const x = sx + Math.cos(a) * r;
            const y = sy + Math.sin(a) * r;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = rgba(n.color, alpha * 0.9);
        ctx.fill();

        // Crisp outer stroke
        ctx.strokeStyle = rgba(CFG.COLOR_AI_GLOW, alpha);
        ctx.lineWidth = Math.max(0.6, 0.8 * ps);
        ctx.stroke();

        if (n.subtype === 'layer') {
            // Inner hex (smaller, rotated 30°) for "layer node" look
            ctx.beginPath();
            for (let i = 0; i < sides; i++) {
                const a = rot + Math.PI / sides + (i / sides) * Math.PI * 2;
                const x = sx + Math.cos(a) * r * 0.55;
                const y = sy + Math.sin(a) * r * 0.55;
                i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = rgba(CFG.COLOR_AI_GLOW, alpha * 0.85);
            ctx.lineWidth = Math.max(0.5, 0.7 * ps);
            ctx.stroke();
        }

        // Center dot — pulse anchor
        ctx.fillStyle = rgba(CFG.COLOR_AI_GLOW, alpha);
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.8, r * 0.18), 0, Math.PI * 2);
        ctx.fill();
    }

    // ── Bio neuron drawing — soma + nucleus + dendrite tree + axon ──
    function drawBioNeuron(n, sx, sy, ps, r, alpha, pulse) {
        // Soft cell-body glow (only for larger pyramidal cells, full perf only).
        if (n.subtype === 'pyramidal' && perfLevel === 1) {
            const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3.2);
            grd.addColorStop(0, rgba(CFG.COLOR_BIO_GLOW, alpha * 0.2));
            grd.addColorStop(1, rgba(CFG.COLOR_BIO_GLOW, 0));
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(sx, sy, r * 3.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── Dendrites (drawn first so soma sits on top of their roots) ──
        if (n.dendrites) {
            for (const d of n.dendrites) {
                const baseLen = d.length * ps * pulse;
                const cosA = Math.cos(d.angle), sinA = Math.sin(d.angle);
                // Tangent unit perpendicular for curving control point
                const perpX = -sinA, perpY = cosA;
                const endX = sx + cosA * baseLen;
                const endY = sy + sinA * baseLen;
                const cpX = sx + cosA * baseLen * 0.55 + perpX * d.curve * baseLen * 0.45;
                const cpY = sy + sinA * baseLen * 0.55 + perpY * d.curve * baseLen * 0.45;

                // Tapering line (slightly thicker near soma)
                ctx.strokeStyle = rgba(n.color, alpha * 0.65);
                ctx.lineWidth = Math.max(0.4, d.width * ps);
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.quadraticCurveTo(cpX, cpY, endX, endY);
                ctx.stroke();

                // Sub-branches — skip when degraded.
                if (perfLevel < 1) continue;
                for (const b of d.branches) {
                    // Quadratic-bezier point at parameter t
                    const t = b.fromT, mt = 1 - t;
                    const bx = mt * mt * sx + 2 * mt * t * cpX + t * t * endX;
                    const by = mt * mt * sy + 2 * mt * t * cpY + t * t * endY;
                    const childAngle = d.angle + b.angleOff;
                    const cLen = b.length * ps * pulse;
                    const childCosA = Math.cos(childAngle), childSinA = Math.sin(childAngle);
                    const childPerpX = -childSinA, childPerpY = childCosA;
                    const cEndX = bx + childCosA * cLen;
                    const cEndY = by + childSinA * cLen;
                    const cCpX = bx + childCosA * cLen * 0.55 + childPerpX * b.curve * cLen * 0.5;
                    const cCpY = by + childSinA * cLen * 0.55 + childPerpY * b.curve * cLen * 0.5;
                    ctx.lineWidth = Math.max(0.3, d.width * ps * 0.7);
                    ctx.beginPath();
                    ctx.moveTo(bx, by);
                    ctx.quadraticCurveTo(cCpX, cCpY, cEndX, cEndY);
                    ctx.stroke();
                }
            }
        }

        // ── Axon (single long curved line + terminal bulb) ──
        if (n.axon) {
            const a = n.axon;
            const len = a.length * ps * pulse;
            const cosA = Math.cos(a.angle), sinA = Math.sin(a.angle);
            const perpX = -sinA, perpY = cosA;
            const endX = sx + cosA * len;
            const endY = sy + sinA * len;
            const cpX = sx + cosA * len * 0.5 + perpX * a.curve * len * 0.4;
            const cpY = sy + sinA * len * 0.5 + perpY * a.curve * len * 0.4;

            ctx.strokeStyle = rgba(n.color, alpha * 0.55);
            ctx.lineWidth = Math.max(0.5, a.width * ps);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(cpX, cpY, endX, endY);
            ctx.stroke();

            // Terminal bulb (synaptic bouton)
            const bulbR = Math.max(0.6, a.terminalR * ps);
            ctx.fillStyle = rgba(CFG.COLOR_BIO_GLOW, alpha * 0.85);
            ctx.beginPath();
            ctx.arc(endX, endY, bulbR, 0, Math.PI * 2);
            ctx.fill();

            // Optional: tiny axon-terminal branches (skipped on degraded perf).
            if (perfLevel === 1 && a.terminals > 0) {
                ctx.strokeStyle = rgba(n.color, alpha * 0.45);
                ctx.lineWidth = Math.max(0.3, a.width * ps * 0.6);
                for (let i = 0; i < a.terminals; i++) {
                    const ta = a.angle + ((i - (a.terminals - 1) / 2) * 0.6);
                    const tlen = len * 0.18;
                    const tx = endX + Math.cos(ta) * tlen;
                    const ty = endY + Math.sin(ta) * tlen;
                    ctx.beginPath();
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(tx, ty);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(tx, ty, bulbR * 0.6, 0, Math.PI * 2);
                    ctx.fillStyle = rgba(CFG.COLOR_BIO_GLOW, alpha * 0.7);
                    ctx.fill();
                }
            }
        }

        // ── Soma (cell body) — irregular polygon, gradient-filled ──
        if (n.soma && n.soma.length) {
            ctx.beginPath();
            for (let i = 0; i < n.soma.length; i++) {
                const v = n.soma[i];
                const sr = v.r * ps * pulse;
                const x = sx + Math.cos(v.angle) * sr;
                const y = sy + Math.sin(v.angle) * sr;
                i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            }
            ctx.closePath();
            // Gradient on degraded perf becomes a flat fill — visually similar
            // at this scale, far cheaper.
            if (perfLevel === 1) {
                const bodyGrd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
                bodyGrd.addColorStop(0, rgba(CFG.COLOR_BIO_GLOW, alpha * 0.95));
                bodyGrd.addColorStop(1, rgba(n.color, alpha));
                ctx.fillStyle = bodyGrd;
            } else {
                ctx.fillStyle = rgba(n.color, alpha * 0.95);
            }
            ctx.fill();
            // Faint cell-membrane outline
            ctx.strokeStyle = rgba(n.color, alpha * 0.6);
            ctx.lineWidth = Math.max(0.4, 0.5 * ps);
            ctx.stroke();
        }

        // ── Nucleus + nucleolus inside the soma ──
        if (n.nucleus) {
            const nx = sx + n.nucleus.offX * ps;
            const ny = sy + n.nucleus.offY * ps;
            const nr = n.nucleus.r * ps * pulse;

            // Nucleus — flat fill on degraded perf.
            if (perfLevel === 1) {
                const nucGrd = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
                nucGrd.addColorStop(0, rgba([255, 220, 250], alpha * 0.55));
                nucGrd.addColorStop(1, rgba(n.color, alpha * 0.4));
                ctx.fillStyle = nucGrd;
            } else {
                ctx.fillStyle = rgba(n.color, alpha * 0.45);
            }
            ctx.beginPath();
            ctx.arc(nx, ny, nr, 0, Math.PI * 2);
            ctx.fill();

            // Nucleolus (small dark spot inside nucleus)
            ctx.fillStyle = rgba([90, 30, 110], alpha * 0.65);
            ctx.beginPath();
            ctx.arc(nx, ny, Math.max(0.5, n.nucleus.nucleolusR * ps), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ── Animation Loop ──
    function animate(now) {
        if (paused) return;
        const frameMs = now - lastTime;
        const dt = Math.min(frameMs / 16.667, 3); // normalize to ~60fps, cap at 3
        lastTime = now;

        // Adaptive degradation: if frames are consistently slow we shed the
        // expensive extras (radial-gradient halos, signal trails, bubbles).
        // Recover gradually once frames are healthy again.
        if (frameMs > CFG.SLOW_FRAME_MS) {
            slowFrames++; fastFrames = 0;
            if (slowFrames > 30 && perfLevel === 1) perfLevel = 0.5;
        } else if (frameMs < CFG.FAST_FRAME_MS) {
            fastFrames++; slowFrames = 0;
            if (fastFrames > 240 && perfLevel < 1) perfLevel = 1;
        } else {
            slowFrames = Math.max(0, slowFrames - 1);
            fastFrames = Math.max(0, fastFrames - 1);
        }

        // Reduced-motion users get a (mostly) static frame: no drift, slow signals.
        if (!reducedMotion) updateNeurons(dt);

        frameCount++;
        if (frameCount % CFG.CONN_RECALC_INTERVAL === 0) {
            buildConnections();
        }

        if (!reducedMotion) {
            updateSignals(dt);
            updateNumberBubbles(dt);
        }
        render(now);

        // Throttle to ~30fps when motion is reduced (still draw, but cheaper).
        if (reducedMotion) {
            setTimeout(() => requestAnimationFrame(animate), 33);
        } else {
            requestAnimationFrame(animate);
        }
    }

    // ── Start ──
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
