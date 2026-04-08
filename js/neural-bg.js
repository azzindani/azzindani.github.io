/* ============================================
   3D Neural Network Background
   AI ↔ Human Brain Neuron Interconnection
   ============================================ */
(function() {
    'use strict';

    const CFG = {
        NEURON_COUNT: 180,
        NEURON_COUNT_MOBILE: 90,
        AI_RATIO: 0.45,
        CONNECTION_DIST: 180,
        SIGNAL_SPEED: 0.006,
        SIGNAL_SPAWN_RATE: 0.015,
        MAX_SIGNALS: 50,
        PERSPECTIVE: 800,
        DEPTH_RANGE: 600,
        DRIFT_SPEED: 0.25,
        COLOR_AI: [37, 99, 235],
        COLOR_AI_GLOW: [96, 165, 250],
        COLOR_BIO: [168, 85, 247],
        COLOR_BIO_GLOW: [236, 130, 200],
        COLOR_SIGNAL_AI: [96, 205, 255],
        COLOR_SIGNAL_BIO: [232, 160, 255],
        COLOR_SIGNAL_BRIDGE: [200, 190, 255],
        CONN_RECALC_INTERVAL: 30,
    };

    let canvas, ctx, W, H, dpr;
    let neurons = [], connections = [], signals = [];
    let frameCount = 0, lastTime = 0, paused = false;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const neuronCount = isMobile ? CFG.NEURON_COUNT_MOBILE : CFG.NEURON_COUNT;

    // ── 3D → 2D Projection ──
    function project(x, y, z) {
        const s = CFG.PERSPECTIVE / (CFG.PERSPECTIVE + z);
        return { sx: x * s + W / 2, sy: y * s + H / 2, s };
    }

    function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

    function rand(min, max) { return min + Math.random() * (max - min); }

    // ── Neuron Creation ──
    function createNeuron() {
        const isAI = Math.random() < CFG.AI_RATIO;
        const kind = isAI ? 'ai' : 'bio';
        let subtype, radius, color;

        if (isAI) {
            subtype = Math.random() < 0.33 ? 'layer' : 'node';
            radius = subtype === 'layer' ? rand(4, 6) : rand(2, 3.5);
            color = CFG.COLOR_AI;
        } else {
            subtype = Math.random() < 0.36 ? 'nucleus' : 'synapse';
            radius = subtype === 'nucleus' ? rand(4.5, 7) : rand(2, 3.5);
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
            dendrites: null,
        };

        // Bio neurons get dendrite stubs
        if (!isAI) {
            const count = subtype === 'nucleus' ? Math.floor(rand(4, 7)) : Math.floor(rand(2, 4));
            n.dendrites = [];
            for (let i = 0; i < count; i++) {
                n.dendrites.push({
                    angle: rand(0, Math.PI * 2),
                    length: rand(1.5, 3) * radius,
                    curve: rand(-0.4, 0.4), // bezier control point offset factor
                });
            }
        }

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
    function buildConnections() {
        connections = [];
        const dist2 = CFG.CONNECTION_DIST * CFG.CONNECTION_DIST;
        for (let i = 0; i < neurons.length; i++) {
            for (let j = i + 1; j < neurons.length; j++) {
                const a = neurons[i], b = neurons[j];
                const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
                const d2 = dx * dx + dy * dy + dz * dz;
                if (d2 < dist2) {
                    const dist = Math.sqrt(d2);
                    let type;
                    if (a.kind === 'ai' && b.kind === 'ai') type = 'ai';
                    else if (a.kind === 'bio' && b.kind === 'bio') type = 'bio';
                    else type = 'bridge';
                    connections.push({ i, j, dist, type });
                }
            }
        }
    }

    // ── Update Signals ──
    function updateSignals(dt) {
        // Advance existing
        for (let k = signals.length - 1; k >= 0; k--) {
            signals[k].progress += signals[k].speed * dt;
            if (signals[k].progress >= 1) {
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
                    });
                    if (signals.length >= CFG.MAX_SIGNALS) break;
                }
            }
        }
    }

    // ── Render ──
    function render(time) {
        ctx.clearRect(0, 0, W, H);

        // Sort neurons by z (back to front)
        const sorted = neurons.map((n, idx) => ({ n, idx })).sort((a, b) => a.n.z - b.n.z);

        // Project all neurons
        const proj = new Array(neurons.length);
        for (let i = 0; i < neurons.length; i++) {
            proj[i] = project(neurons[i].x, neurons[i].y, neurons[i].z);
        }

        // Draw connections
        for (const conn of connections) {
            const a = neurons[conn.i], b = neurons[conn.j];
            const pa = proj[conn.i], pb = proj[conn.j];
            const avgScale = (pa.s + pb.s) / 2;
            const alpha = (1 - conn.dist / CFG.CONNECTION_DIST) * 0.12 * avgScale;
            if (alpha < 0.005) continue;

            ctx.lineWidth = 0.5 * avgScale;

            if (conn.type === 'bridge') {
                // Gradient from AI blue to Bio purple
                const grad = ctx.createLinearGradient(pa.sx, pa.sy, pb.sx, pb.sy);
                const aColor = a.kind === 'ai' ? CFG.COLOR_AI : CFG.COLOR_BIO;
                const bColor = b.kind === 'ai' ? CFG.COLOR_AI : CFG.COLOR_BIO;
                grad.addColorStop(0, rgba(aColor, alpha * 1.5));
                grad.addColorStop(1, rgba(bColor, alpha * 1.5));
                ctx.strokeStyle = grad;
                ctx.lineWidth = 0.7 * avgScale;
            } else if (conn.type === 'ai') {
                ctx.strokeStyle = rgba(CFG.COLOR_AI, alpha);
            } else {
                ctx.strokeStyle = rgba(CFG.COLOR_BIO, alpha);
            }

            ctx.beginPath();
            if (conn.type === 'bio') {
                // Slightly curved bio connections
                const mx = (pa.sx + pb.sx) / 2 + (pa.sy - pb.sy) * 0.1;
                const my = (pa.sy + pb.sy) / 2 + (pb.sx - pa.sx) * 0.1;
                ctx.moveTo(pa.sx, pa.sy);
                ctx.quadraticCurveTo(mx, my, pb.sx, pb.sy);
            } else {
                ctx.moveTo(pa.sx, pa.sy);
                ctx.lineTo(pb.sx, pb.sy);
            }
            ctx.stroke();
        }

        // Draw signals
        for (const sig of signals) {
            const a = neurons[sig.fromIdx], b = neurons[sig.toIdx];
            const t = sig.progress;
            // Interpolate in 3D, then project
            const sx = a.x + (b.x - a.x) * t;
            const sy = a.y + (b.y - a.y) * t;
            const sz = a.z + (b.z - a.z) * t;
            const p = project(sx, sy, sz);

            let color, r, glowR;
            if (sig.type === 'bridge') {
                color = CFG.COLOR_SIGNAL_BRIDGE;
                r = 3 * p.s;
                glowR = 8 * p.s;
            } else if (sig.type === 'ai') {
                color = CFG.COLOR_SIGNAL_AI;
                r = 2 * p.s;
                glowR = 5 * p.s;
            } else {
                color = CFG.COLOR_SIGNAL_BIO;
                r = 2.5 * p.s;
                glowR = 6 * p.s;
            }

            // Glow
            const grd = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, glowR);
            grd.addColorStop(0, rgba(color, 0.6 * p.s));
            grd.addColorStop(1, rgba(color, 0));
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, glowR, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = rgba(color, 0.9 * p.s);
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw neurons (sorted back to front)
        for (const { n, idx } of sorted) {
            const p = proj[idx];
            const pulse = 1 + Math.sin(n.pulsePhase) * 0.08;
            const r = n.radius * p.s * pulse;
            const alpha = Math.min(p.s * 0.8, 0.85);
            if (r < 0.3 || alpha < 0.02) continue;

            if (n.kind === 'ai') {
                // AI: crisp circle
                ctx.fillStyle = rgba(n.color, alpha);
                ctx.beginPath();
                ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
                ctx.fill();

                // Layer subtype: concentric ring
                if (n.subtype === 'layer') {
                    ctx.strokeStyle = rgba(CFG.COLOR_AI_GLOW, alpha * 0.4);
                    ctx.lineWidth = 0.6 * p.s;
                    ctx.beginPath();
                    ctx.arc(p.sx, p.sy, r * 1.8, 0, Math.PI * 2);
                    ctx.stroke();
                }
            } else {
                // Bio: soft glow for nucleus
                if (n.subtype === 'nucleus') {
                    const grd = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, r * 3);
                    grd.addColorStop(0, rgba(CFG.COLOR_BIO_GLOW, alpha * 0.15));
                    grd.addColorStop(1, rgba(CFG.COLOR_BIO_GLOW, 0));
                    ctx.fillStyle = grd;
                    ctx.beginPath();
                    ctx.arc(p.sx, p.sy, r * 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Cell body with gradient
                const bodyGrd = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, r);
                bodyGrd.addColorStop(0, rgba(CFG.COLOR_BIO_GLOW, alpha * 0.9));
                bodyGrd.addColorStop(1, rgba(n.color, alpha));
                ctx.fillStyle = bodyGrd;
                ctx.beginPath();
                ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
                ctx.fill();

                // Dendrite stubs
                if (n.dendrites) {
                    ctx.strokeStyle = rgba(n.color, alpha * 0.5);
                    ctx.lineWidth = 0.6 * p.s;
                    for (const d of n.dendrites) {
                        const len = d.length * p.s * pulse;
                        const endX = p.sx + Math.cos(d.angle) * len;
                        const endY = p.sy + Math.sin(d.angle) * len;
                        const cpX = p.sx + Math.cos(d.angle) * len * 0.6 + d.curve * len * 0.4;
                        const cpY = p.sy + Math.sin(d.angle) * len * 0.6 + d.curve * len * 0.4;
                        ctx.beginPath();
                        ctx.moveTo(p.sx, p.sy);
                        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
                        ctx.stroke();
                    }
                }
            }
        }
    }

    // ── Animation Loop ──
    function animate(now) {
        if (paused) return;
        const dt = Math.min((now - lastTime) / 16.667, 3); // normalize to ~60fps, cap at 3
        lastTime = now;

        updateNeurons(dt);

        frameCount++;
        if (frameCount % CFG.CONN_RECALC_INTERVAL === 0) {
            buildConnections();
        }

        updateSignals(dt);
        render(now);

        requestAnimationFrame(animate);
    }

    // ── Start ──
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
