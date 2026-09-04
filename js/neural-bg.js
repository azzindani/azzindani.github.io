/* ============================================
   3D Neural Network Background
   AI ↔ Human Brain Neuron Interconnection
   ============================================ */
(function() {
    'use strict';

    const CFG = {
        NEURON_COUNT: 150,
        NEURON_COUNT_MOBILE: 70,
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
        WIRE_ALPHA_FORM: 0.72,    // wiring that draws a formation, not texture
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

        // ── Phase / split system (driven by landing-page scroll) ──
        // The mesh splits into its bio and ai halves and recombines as the
        // visitor scrolls. Each phase pushes one kind into a "lane" so the
        // opposite side of the viewport is left clear for page content.
        LANE_FRACTION: 0.26,      // lane offset as a fraction of viewport width
        EXIT_FRACTION: 0.78,      // how far the departing kind is pushed off
        PHASE_EASE: 0.055,        // per-frame easing toward phase targets
        // Fraction of a stage that HOLDS its state before morphing to the next.
        // Without this the mesh is permanently mid-transition, which reads as
        // aimless drifting; holding then breaking late is what makes each
        // split feel like a deliberate event.
        PHASE_HOLD: 0.55,
        // Neurons shrink as they gather into a figure — at full size the
        // somata and dendrites blur the silhouette into a smudge.
        FORM_SCALE: 0.42,
        RUPTURE_DECAY: 0.045,     // per-frame decay of the rupture flash
        RUPTURE_IMPULSE: 2.6,     // velocity kick applied when the mesh snaps
        SEVER_FRAMES: 26,         // life of a cut wire's recoiling stub
        MAX_SEVERED: 70,
        PRESENCE_CONNECT_MIN: 0.25,   // below this a neuron makes no wires
        PRESENCE_CROSS_MIN: 0.55,     // both kinds must exceed this to bridge
    };

    // Phase stops. Index = integer phase; the renderer interpolates between
    // neighbouring stops using the fractional part of the current phase.
    //   0 hero        — full mesh, centered
    //   1 section 1   — human/bio neurons only, pulled into the left lane
    //   2 section 2   — recombined, centered
    //   3 section 3   — artificial neurons only, pulled into the right lane
    //   4 section 4   — recombined, centered
    // `shape` pulls the visible neurons into a formation for that stage;
    // null lets them drift freely. A stage that forms a shape centres it,
    // so it carries no lane offset — the figure *is* the composition.
    const PHASE_STOPS = [
        { bio: 1, ai: 1, bioX:  0,   aiX:  0,   shape: null },
        { bio: 1, ai: 0, bioX: -1,   aiX: -1.6, shape: 'brain' },
        { bio: 1, ai: 1, bioX:  0,   aiX:  0,   shape: null },
        { bio: 0, ai: 1, bioX:  1.6, aiX:  1,   shape: 'network' },
        { bio: 1, ai: 1, bioX:  0,   aiX:  0,   shape: null },
        { bio: 1, ai: 0, bioX: -1,   aiX: -1.6, shape: 'face' },
        { bio: 1, ai: 1, bioX:  0,   aiX:  0,   shape: null },
    ];

    // ── Formation shapes ──
    //
    // Stages can pull their neurons into a recognisable figure instead of
    // letting them drift. With ~50 neurons per kind on screen a filled shape
    // is hopeless, but an *outline* reads instantly, so the organic shapes are
    // authored as SVG paths sampled at runtime (no build step, no data files)
    // and the structured ones are generated.
    //
    // All paths are authored in a 0–100 box and normalised to centred
    // -1..1 units; `scale` then maps that onto the viewport.
    const SHAPES = {
        // Side profile of a brain, facing left. The two interior strokes are
        // the sulcus folds — without them the silhouette reads as a bean.
        brain: {
            scale: 0.36,
            paths: [
                // Cerebrum: high domed top, blunt frontal lobe at the left,
                // occipital taper at the right, flat underside.
                'M 30 20 C 16 22, 8 32, 10 42 C 4 48, 6 58, 14 62 ' +
                'C 16 70, 24 74, 32 72 C 38 78, 48 78, 54 74 ' +
                'C 66 76, 76 70, 78 60 C 88 56, 90 42, 82 34 ' +
                'C 84 20, 72 10, 58 12 C 46 6, 34 10, 30 20 Z',
                // Cerebellum, tucked under the occipital end.
                'M 62 72 C 74 78, 84 72, 84 64 C 84 58, 78 56, 74 58',
                // Brain stem dropping from the underside.
                'M 56 74 C 56 82, 54 88, 50 94',
                // Sulci — the folds are what stop the silhouette reading as a
                // bean. Two long ones following the cortical curve.
                'M 34 24 C 46 28, 44 42, 30 46 C 40 52, 40 62, 30 66',
                'M 60 18 C 70 26, 68 40, 58 44 C 66 50, 66 60, 58 64',
            ],
            weights: [1.5, 1, 0.8, 1, 1],
        },
        // Human head in profile, facing left: forehead, nose, lips, chin, jaw.
        face: {
            scale: 0.42,
            paths: [
                // The front profile, crown to jaw. Every landmark needs a hard
                // excursion or the smoothing turns the whole thing into an egg:
                // brow, a nose that juts well past the forehead line, the
                // philtrum dip, both lips, then the chin.
                'M 60 8 C 40 8, 28 22, 27 38 C 27 43, 25 45, 22 48 ' +   // forehead, brow
                'C 18 52, 12 57, 12 60 C 12 63, 18 63, 21 64 ' +          // nose out and back
                'C 19 66, 20 68, 22 69 C 26 70, 26 73, 22 75 ' +          // philtrum, upper lip
                'C 26 77, 26 80, 23 82 ' +                                // lower lip
                'C 27 86, 30 90, 36 92 C 42 94, 50 94, 56 92',            // chin and jaw
                // Cranium and the back of the neck.
                'M 60 8 C 80 10, 90 26, 89 46 C 88 68, 74 86, 56 92',
            ],
            // The profile carries every landmark; the cranium is one arc.
            weights: [2.6, 1],
        },
    };

    // A structured feed-forward network: evenly spaced columns of nodes with
    // explicit layer-to-layer edges, so in this formation the mesh is wired
    // like the diagram rather than by proximity.
    const NETWORK_LAYERS = [5, 8, 8, 4];

    function buildNetworkShape(spanX, spanY) {
        const pts = [], edges = [];
        const cols = NETWORK_LAYERS.length;
        const layerIdx = [];
        for (let c = 0; c < cols; c++) {
            const count = NETWORK_LAYERS[c];
            const x = (c / (cols - 1) - 0.5) * spanX;
            const idxs = [];
            for (let r = 0; r < count; r++) {
                const y = count === 1 ? 0 : (r / (count - 1) - 0.5) * spanY;
                idxs.push(pts.length);
                pts.push({ x, y, z: 0 });
            }
            layerIdx.push(idxs);
        }
        for (let c = 0; c < cols - 1; c++) {
            for (const a of layerIdx[c]) {
                for (const b of layerIdx[c + 1]) edges.push([a, b]);
            }
        }
        return { pts, edges };
    }

    // Sample points evenly along a shape's paths, allocating each path a share
    // of the budget proportional to its length so long strokes aren't
    // under-sampled. Uses SVGPathElement measurement on a detached node.
    function sampleShape(def, count) {
        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        const els = def.paths.map(d => {
            const el = document.createElementNS(NS, 'path');
            el.setAttribute('d', d);
            svg.appendChild(el);
            return el;
        });
        let lengths, weighted, total;
        try {
            lengths = els.map(el => el.getTotalLength());
        } catch (e) {
            return null;      // no SVG geometry support — stage stays free-form
        }
        // Budget is shared by length × weight: a long smooth cranium arc needs
        // far fewer points than a short stretch carrying brow, nose and chin.
        const w = def.weights || [];
        weighted = lengths.map((len, i) => len * (w[i] === undefined ? 1 : w[i]));
        total = weighted.reduce((a, b) => a + b, 0);
        if (!total) return null;

        // Points are emitted per path, and consecutive points of the same
        // path are wired together. Without these edges the formed neurons sit
        // inside each other's connection radius and the proximity wiring fills
        // the figure with a web that hides the very outline being drawn.
        const pts = [], edges = [];
        for (let i = 0; i < els.length; i++) {
            const share = Math.max(2, Math.round(count * (weighted[i] / total)));
            const start = pts.length;
            for (let s = 0; s < share; s++) {
                const p = els[i].getPointAtLength(lengths[i] * (s / share));
                // 0–100 box → centred -1..1.
                pts.push({ x: (p.x - 50) / 50, y: (p.y - 50) / 50, z: 0 });
                if (s > 0) edges.push([pts.length - 2, pts.length - 1]);
            }
            // Closed subpaths join back to their first point.
            if (/[zZ]\s*$/.test(def.paths[i].trim())) edges.push([pts.length - 1, start]);
        }
        return { pts, edges };
    }

    // Scroll positions (in phase units) at which the mesh visibly snaps apart.
    // These sit just past PHASE_HOLD, so the tear fires exactly when the stage
    // stops holding and starts morphing into the next one.
    const RUPTURE_POINTS = [0.58, 1.58, 2.58, 3.58, 4.58, 5.58];

    let canvas, ctx, W, H, dpr;
    let neurons = [], connections = [], signals = [], numberBubbles = [];
    let frameCount = 0, lastTime = 0, paused = false;
    // ── Phase state ──
    // `phase` is the scroll-driven target (0..PHASE_STOPS.length-1). Presence
    // and lane offsets ease toward the interpolated stop every frame, so the
    // mesh never teleports even if the visitor scroll-jumps.
    let phase = 0, lastPhase = 0;
    let bioPresence = 1, aiPresence = 1;
    let rupture = 0;
    let severed = [];
    // Formation state: which figure the visible neurons are gathering into,
    // how strongly, and the sampled target points per shape (keyed by name,
    // cleared on resize).
    let shapeCache = {};
    let formAmount = 0, formShapeName = null, formEdges = null, formMemberCount = 0;
    let formShrink = 1;      // radius/neurite multiplier, 1 = free, FORM_SCALE = formed
    // Reused per-frame buffers — avoid per-frame array allocations (a major
    // GC pressure source that shows up as jitter).
    let projSx = null, projSy = null, projS = null;
    let zSortedIdx = null;   // Int32Array of neuron indices sorted by z asc
    let bubbleFontCache = null;
    // Reused point pool for soma outlines — grown once, mutated per draw.
    const somaScratch = [];
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

    // ── Organic path helpers ──
    //
    // Cell bodies, dendrites and axons in real tissue have no straight edges
    // or hard corners, so nothing bio-side is drawn with lineTo.

    // Trace a closed, smooth curve through `pts` ([{x,y}, …]).
    // Each input point becomes a quadratic control point and the midpoint of
    // every edge becomes an on-curve anchor, which turns a wobbly polygon into
    // a continuous lobed blob for the same number of path operations.
    function traceSmoothClosed(pts, len) {
        if (len < 3) return;
        let prev = pts[len - 1];
        let cur = pts[0];
        ctx.moveTo((prev.x + cur.x) * 0.5, (prev.y + cur.y) * 0.5);
        for (let i = 0; i < len; i++) {
            cur = pts[i];
            const next = pts[(i + 1) % len];
            ctx.quadraticCurveTo(cur.x, cur.y, (cur.x + next.x) * 0.5, (cur.y + next.y) * 0.5);
        }
        ctx.closePath();
    }

    // Trace a neurite (dendrite / axon) as a closed ribbon that tapers from
    // `halfW` at the base to a point at the tip, following the same quadratic
    // the stroked version used. Filling this gives a continuous taper, which a
    // constant-width stroke cannot express.
    function traceTaperedNeurite(bx, by, cpx, cpy, tipX, tipY, perpX, perpY, halfW) {
        const ox = perpX * halfW, oy = perpY * halfW;
        // Control offset is halved so the ribbon narrows smoothly toward the tip.
        const cox = perpX * halfW * 0.5, coy = perpY * halfW * 0.5;
        ctx.moveTo(bx + ox, by + oy);
        ctx.quadraticCurveTo(cpx + cox, cpy + coy, tipX, tipY);
        ctx.quadraticCurveTo(cpx - cox, cpy - coy, bx - ox, by - oy);
        // Round the base off across the soma side rather than closing flat.
        ctx.quadraticCurveTo(bx - ox * 0.4, by - oy * 0.4, bx + ox, by + oy);
        ctx.closePath();
    }

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
        const bvx = rand(-CFG.DRIFT_SPEED, CFG.DRIFT_SPEED);
        const bvy = rand(-CFG.DRIFT_SPEED, CFG.DRIFT_SPEED);
        const bvz = rand(-CFG.DRIFT_SPEED * 0.3, CFG.DRIFT_SPEED * 0.3);
        const n = {
            x: rand(-W / 2, W / 2),
            y: rand(-H / 2, H / 2),
            z: rand(-halfD, halfD),
            vx: bvx, vy: bvy, vz: bvz,
            // Baseline drift, restored after a rupture impulse decays.
            bvx, bvy, bvz,
            radius, kind, subtype, color,
            // Phase-driven display state. `presence` fades the neuron in/out,
            // `laneX` slides it sideways without disturbing drift/wrap logic
            // (which still operates on the untouched x).
            presence: 1,
            laneX: 0,
            // Display position (drift + lane + formation), refreshed each
            // frame in updatePhase. Seeded here so the first connection build
            // has real coordinates to work with.
            wx: 0, wy: 0, wz: 0,
            formIdx: -1,      // slot in the active formation, -1 = not taking part
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

        // Fixed first: the soma is shaped around this axis and the dendrites
        // are distributed away from it.
        const axonAngle = rand(0, Math.PI * 2);

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

        // Dendrites are biased away from the axon (so they don't overlap).
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

        n.soma = buildSoma(n, radius, subtype, axonAngle);
        return n;
    }

    // ── Soma outline ──
    //
    // Built last, because its shape is a consequence of where the neurites
    // leave the cell. A real multipolar soma is not an oval: the membrane
    // flares outward into each dendrite root and falls away *inward* between
    // adjacent roots, so the outline is a scalloped rounded star. Deriving it
    // from the neurite angles is what makes dendrites look grown out of the
    // body rather than pasted onto it.
    //
    // Vertices are placed where they matter instead of at uniform angles: a
    // peak on every neurite, a valley in every gap between neighbours. Wide
    // gaps get extra valley points so the spline doesn't sag across them.
    // Returns offsets in pixels, ready to scale — no trigonometry per frame.
    function buildSoma(n, radius, subtype, axonAngle) {
        const PEAK = subtype === 'pyramidal' ? 1.16 : 1.1;   // bulge at a root
        const VALLEY = subtype === 'pyramidal' ? 0.66 : 0.72; // dip between roots
        const MAX_GAP = 1.15;                                 // rad before subdividing

        // Collect neurite directions, axon included — the axon hillock is a
        // flare too, usually a slightly narrower one.
        const roots = [{ angle: axonAngle, weight: 0.9 }];
        for (const d of n.dendrites) roots.push({ angle: d.angle, weight: 1 });

        // Normalise to [0, 2π) and order around the cell.
        for (const r of roots) {
            r.angle = ((r.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        }
        roots.sort((a, b) => a.angle - b.angle);

        const verts = [];
        const push = (angle, rr) => {
            verts.push({ dx: Math.cos(angle) * rr, dy: Math.sin(angle) * rr });
        };

        for (let i = 0; i < roots.length; i++) {
            const cur = roots[i];
            const next = roots[(i + 1) % roots.length];

            // Peak at this root. Two dendrites leaving close together share one
            // broad flare rather than each getting a spike, so the bulge is
            // damped when a neighbour is very near.
            let gapPrev = cur.angle - roots[(i - 1 + roots.length) % roots.length].angle;
            if (gapPrev < 0) gapPrev += Math.PI * 2;
            const crowd = Math.min(1, gapPrev / 0.5);
            push(cur.angle, radius * (1 + (PEAK - 1) * cur.weight * crowd) * rand(0.94, 1.06));

            // Valley(s) spanning the gap to the next root.
            let gap = next.angle - cur.angle;
            if (gap <= 0) gap += Math.PI * 2;
            const steps = Math.max(1, Math.ceil(gap / MAX_GAP));
            for (let s = 1; s <= steps; s++) {
                const t = s / (steps + 1);
                // Dip hardest mid-gap; a wide gap stays fuller so the cell
                // doesn't collapse into a thin sliver on its axon side.
                const depth = Math.sin(t * Math.PI);
                const fullness = Math.min(1, 1.6 / gap);
                const rr = radius * (1 - (1 - VALLEY) * depth * fullness) * rand(0.95, 1.05);
                push(cur.angle + gap * t, rr);
            }
        }
        return verts;
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
            const n = createNeuron();
            n.wx = n.x; n.wy = n.y; n.wz = n.z;
            neurons.push(n);
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
        // Shapes are sampled in viewport units, so they must be rebuilt and
        // re-assigned when the viewport changes.
        shapeCache = {};
        if (formShapeName) assignFormationTargets(formShapeName);
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ── Phase system ──

    function smoothstep(t) { return t * t * (3 - 2 * t); }

    // Resolve the interpolated stop for the current phase value.
    function phaseTargets() {
        const maxI = PHASE_STOPS.length - 1;
        const p = Math.max(0, Math.min(maxI, phase));
        const i = Math.min(maxI - 1, Math.floor(p));
        // Hold this stage's state for the first PHASE_HOLD of its scroll range,
        // then morph to the next stop over the remainder.
        const raw = Math.max(0, Math.min(1, p - i));
        const hold = CFG.PHASE_HOLD;
        const f = smoothstep(Math.max(0, Math.min(1, (raw - hold) / (1 - hold))));
        const a = PHASE_STOPS[i], b = PHASE_STOPS[i + 1] || PHASE_STOPS[maxI];
        const lane = W * CFG.LANE_FRACTION, exit = W * CFG.EXIT_FRACTION;
        // bioX/aiX are authored as multiples of the lane width; values beyond
        // ±1 push the departing kind off toward the exit distance instead.
        const toPx = (v) => (Math.abs(v) <= 1 ? v * lane : Math.sign(v) * exit);
        // Formation does not morph one figure directly into the next — it
        // falls to zero mid-transition so the mesh scatters and re-gathers.
        // That gives the rupture something to tear apart and keeps two
        // unrelated silhouettes from sliding through each other.
        const formShape = f < 0.5 ? a.shape : b.shape;
        const formAmt = f < 0.5
            ? (a.shape ? 1 - f * 2 : 0)
            : (b.shape ? f * 2 - 1 : 0);

        return {
            bio:  a.bio + (b.bio - a.bio) * f,
            ai:   a.ai  + (b.ai  - a.ai)  * f,
            bioX: toPx(a.bioX) + (toPx(b.bioX) - toPx(a.bioX)) * f,
            aiX:  toPx(a.aiX)  + (toPx(b.aiX)  - toPx(a.aiX))  * f,
            shape: formShape,
            form: Math.max(0, Math.min(1, formAmt)),
        };
    }

    // Resolve (and memoise) a shape's target points at the current viewport
    // size, sampled to exactly `count` points so that every point receives a
    // neuron. That matters: the contour edges join consecutive sample points,
    // so an unoccupied point would break the outline into fragments.
    // Sampled once per shape per member-count per resize, never per frame.
    function getShapePoints(name, count) {
        if (!name) return null;
        const key = name + ':' + (count || 0);
        if (shapeCache[key]) return shapeCache[key];

        const span = Math.min(W, H);
        let entry = null;
        if (name === 'network') {
            // Must fit the half of the viewport the copy is not using.
            const net = buildNetworkShape(Math.min(W * 0.32, 440), Math.min(H * 0.5, 460));
            entry = { pts: net.pts, edges: net.edges };
        } else {
            const def = SHAPES[name];
            if (!def) return null;
            const raw = sampleShape(def, Math.max(24, count || neuronCount));
            if (!raw) return null;
            const k = span * def.scale;
            entry = {
                pts: raw.pts.map(p => ({ x: p.x * k, y: p.y * k, z: 0 })),
                edges: raw.edges,
            };
        }
        shapeCache[key] = entry;
        return entry;
    }

    // The mesh "breaks": cut every cross-kind wire into recoiling stubs, kick
    // every neuron outward toward the lane it is heading for, and drop signals
    // that were mid-flight along wires which no longer exist.
    function triggerRupture(targets) {
        if (reducedMotion) return;
        rupture = 1;

        severed.length = 0;
        for (let c = 0; c < connections.length && severed.length < CFG.MAX_SEVERED; c++) {
            const conn = connections[c];
            if (conn.type !== 'bridge') continue;
            severed.push({ i: conn.i, j: conn.j, life: CFG.SEVER_FRAMES });
        }

        const kick = CFG.RUPTURE_IMPULSE;
        for (const n of neurons) {
            const dir = Math.sign((n.kind === 'ai' ? targets.aiX : targets.bioX) || 0) || (Math.random() < 0.5 ? -1 : 1);
            n.vx += dir * kick * rand(0.5, 1.4);
            n.vy += rand(-kick, kick) * 0.7;
            n.vz += rand(-kick, kick) * 0.5;
        }

        signals.length = 0;
        buildConnections();
    }

    // Called by the landing page with a continuous scroll-derived value.
    function setPhase(p) {
        if (typeof p !== 'number' || !isFinite(p)) return;
        const maxI = PHASE_STOPS.length - 1;
        phase = Math.max(0, Math.min(maxI, p));

        // Fire a rupture whenever the scroll crosses a break point, in either
        // direction, so scrolling back up breaks the mesh again.
        const targets = phaseTargets();
        for (const t of RUPTURE_POINTS) {
            const crossedDown = lastPhase < t && phase >= t;
            const crossedUp   = lastPhase > t && phase <= t;
            if (crossedDown || crossedUp) { triggerRupture(targets); break; }
        }
        lastPhase = phase;
    }

    // Ease per-neuron presence / lane offset toward the current phase targets.
    function updatePhase() {
        const t = phaseTargets();
        const e = reducedMotion ? 1 : CFG.PHASE_EASE;
        bioPresence += (t.bio - bioPresence) * e;
        aiPresence  += (t.ai  - aiPresence)  * e;

        for (const n of neurons) {
            let tp = n.kind === 'ai' ? t.ai  : t.bio;
            const tx = n.kind === 'ai' ? t.aiX : t.bioX;
            // A visible neuron with no slot in the active figure would drift
            // across it and blur the silhouette, so it fades for the duration.
            if (t.form > 0 && n.formIdx < 0) tp *= 1 - t.form;
            n.presence += (tp - n.presence) * e;
            n.laneX    += (tx - n.laneX)    * e;
        }

        // Formation strength eases; the shape identity switches only while the
        // mesh is scattered (form ≈ 0), so a figure never snaps into another.
        formAmount += (t.form - formAmount) * e;
        if (t.shape !== formShapeName && (formAmount < 0.02 || t.form > formAmount)) {
            formShapeName = t.shape;
            assignFormationTargets(formShapeName);
        }

        // World-space display positions: free drift, slid by the lane offset,
        // then pulled toward the formation. Everything downstream (projection,
        // connections, signals) reads these rather than the raw x/y/z, so the
        // wiring follows what is actually on screen.
        const shape = formAmount > 0.001 ? getShapePoints(formShapeName, formMemberCount) : null;
        formEdges = (shape && shape.edges && formAmount > 0.35) ? shape.edges : null;
        const k = formAmount;
        for (const n of neurons) {
            const fx = n.x + n.laneX, fy = n.y, fz = n.z;
            if (shape && n.formIdx >= 0) {
                const tgt = shape.pts[n.formIdx % shape.pts.length];
                const tx = tgt.x + n.laneX;   // figure assembles inside the lane
                n.wx = fx + (tx - fx) * k;
                n.wy = fy + (tgt.y - fy) * k;
                n.wz = fz + (tgt.z - fz) * k;
            } else {
                n.wx = fx; n.wy = fy; n.wz = fz;
            }
        }

        formShrink = 1 - (1 - CFG.FORM_SCALE) * formAmount;

        if (rupture > 0) rupture = Math.max(0, rupture - CFG.RUPTURE_DECAY);
        for (let k2 = severed.length - 1; k2 >= 0; k2--) {
            if (--severed[k2].life <= 0) severed.splice(k2, 1);
        }
    }

    // Hand out formation slots. Only the neurons that are actually visible in
    // this stage take part, and they are matched to targets in angular order
    // around the centre so the swarm converges without threading through
    // itself. Runs once per shape change, never per frame.
    function assignFormationTargets(name) {
        for (const n of neurons) n.formIdx = -1;

        const stop = PHASE_STOPS[Math.round(phase)] || PHASE_STOPS[0];
        const members = neurons.filter(n =>
            (n.kind === 'ai' ? stop.ai : stop.bio) > 0.5);
        if (!members.length) return;

        formMemberCount = members.length;
        const shape = getShapePoints(name, formMemberCount);
        if (!shape) return;

        // Neurons take slots in the shape's own point order. Sorting them by
        // angle first keeps the swarm from threading through itself on the way
        // in, without disturbing the order of the targets themselves.
        members.sort((p, q) => Math.atan2(p.y, p.x) - Math.atan2(q.y, q.x));

        const total = shape.pts.length;
        for (let m = 0; m < members.length; m++) {
            // One neuron per point while points last; any surplus (the
            // structured network has far fewer nodes than neurons) sits out —
            // stacking neurons on a node only thickens it, and leaving them
            // adrift smears the figure. They fade instead, see updatePhase.
            members[m].formIdx = m < total ? m : -1;
        }
    }

    // ── Update Neurons ──
    function updateNeurons(dt) {
        const halfW = W / 2 + 100, halfH = H / 2 + 100, halfD = CFG.DEPTH_RANGE / 2;
        for (const n of neurons) {
            n.x += n.vx * dt; n.y += n.vy * dt; n.z += n.vz * dt;
            n.pulsePhase += 0.02 * dt;

            // Bleed any rupture impulse back off toward the baseline drift, so
            // the mesh settles instead of scattering permanently.
            n.vx += (n.bvx - n.vx) * 0.035 * dt;
            n.vy += (n.bvy - n.vy) * 0.035 * dt;
            n.vz += (n.bvz - n.vz) * 0.035 * dt;

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

        // In a structured formation the wiring is the diagram's, not
        // proximity's: every node of one layer joins every node of the next.
        if (formEdges) {
            const slot = new Map();
            for (let i = 0; i < neurons.length; i++) {
                if (neurons[i].formIdx >= 0) slot.set(neurons[i].formIdx, i);
            }
            for (const [from, to] of formEdges) {
                const i = slot.get(from), j = slot.get(to);
                if (i === undefined || j === undefined) continue;
                const a = neurons[i], b = neurons[j];
                const dx = a.wx - b.wx, dy = a.wy - b.wy, dz = a.wz - b.wz;
                connections.push({
                    i, j,
                    dist: Math.sqrt(dx * dx + dy * dy + dz * dz),
                    type: _connTypeOf(a, b),
                    structured: true,
                });
            }
            return;
        }

        const dist2 = CFG.CONNECTION_DIST * CFG.CONNECTION_DIST;
        const N = neurons.length;
        // Bitset-style flat buffer for "is pair connected" — much cheaper than
        // a Set of composite keys.
        const seen = new Uint8Array(N * N);
        const degree = new Int32Array(N);
        // Phase gating: faded-out neurons make no wires, and the bio↔ai bridge
        // wires only exist while both halves of the mesh are actually present.
        const minP = CFG.PRESENCE_CONNECT_MIN;
        const crossOk = Math.min(bioPresence, aiPresence) >= CFG.PRESENCE_CROSS_MIN;
        const allowed = (a, b) =>
            a.presence >= minP && b.presence >= minP &&
            (crossOk || a.kind === b.kind);

        for (let i = 0; i < N; i++) {
            const a = neurons[i];
            if (a.presence < minP) continue;
            const ax = a.wx, ay = a.wy, az = a.wz;
            for (let j = i + 1; j < N; j++) {
                const b = neurons[j];
                if (!allowed(a, b)) continue;
                const dx = ax - b.wx, dy = ay - b.wy, dz = az - b.wz;
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
            if (a.presence < minP) continue;
            // Gather candidate distances into a small typed array.
            const cand = [];
            for (let j = 0; j < N; j++) {
                if (j === i) continue;
                const lo = i < j ? i : j, hi = i < j ? j : i;
                if (seen[lo * N + hi]) continue;
                const b = neurons[j];
                if (!allowed(a, b)) continue;
                const dx = a.wx - b.wx, dy = a.wy - b.wy, dz = a.wz - b.wz;
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
                    x: a.wx + (b.wx - a.wx) * t,
                    y: a.wy + (b.wy - a.wy) * t,
                    z: a.wz + (b.wz - a.wz) * t,
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
                    // Don't fire down a wire whose endpoints are fading out.
                    const na = neurons[conn.i], nb = neurons[conn.j];
                    if (!na || !nb) continue;
                    if (Math.min(na.presence, nb.presence) < 0.5) continue;
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
            const s = CFG.PERSPECTIVE / (CFG.PERSPECTIVE + n.wz);
            // wx/wy/wz are the display positions computed in updatePhase:
            // drift + lane offset + formation pull. n.x/y/z stay untouched so
            // drift and edge-wrapping keep working underneath.
            projSx[i] = n.wx * s + W / 2;
            projSy[i] = n.wy * s + H / 2;
            projS[i]  = s;
        }

        // Insertion-sort indices by z. We reuse the array across frames, so it
        // is already nearly sorted — insertion sort is O(N) on near-sorted
        // input, far faster than a fresh map+sort each frame.
        for (let i = 1; i < N; i++) {
            const cur = zSortedIdx[i];
            const cz = neurons[cur].wz;
            let j = i - 1;
            while (j >= 0 && neurons[zSortedIdx[j]].wz > cz) {
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
            const distFalloff = conn.structured
                ? 1                                  // diagram wiring, not proximity
                : Math.max(0.15, 1 - conn.dist / CFG.CONNECTION_DIST);
            const lo = i < j ? i : j, hi = i < j ? j : i;
            const isActive = activeWires[lo * 10000 + hi] === 1;

            // A formation's own wiring *is* the picture, so it is drawn far
            // stronger than ambient proximity wiring, which is only texture.
            const wireBase = conn.structured
                ? (isActive ? CFG.WIRE_ALPHA_ACTIVE : CFG.WIRE_ALPHA_FORM)
                : (isActive ? CFG.WIRE_ALPHA_ACTIVE : CFG.WIRE_ALPHA_BASE);
            const baseAlpha = wireBase * distFalloff * avgScale
                * Math.min(a.presence, b.presence);
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

        // ── Severed wires ──
        // On a phase rupture every bio↔ai wire is cut. Each stub retracts from
        // the break point back toward its own neuron and fades, so the split
        // reads as the mesh tearing rather than the halves drifting apart.
        for (let s = 0; s < severed.length; s++) {
            const cut = severed[s];
            const i = cut.i, j = cut.j;
            if (i >= N || j >= N) continue;
            const t = cut.life / CFG.SEVER_FRAMES;        // 1 → 0 over its life
            const ax = projSx[i], ay = projSy[i];
            const bx = projSx[j], by = projSy[j];
            const scale = (projS[i] + projS[j]) * 0.5;
            // Stub length collapses toward each endpoint as it retracts.
            const reach = 0.5 * t;
            ctx.strokeStyle = rgba(CFG.COLOR_SIGNAL_BRIDGE, t * 0.9);
            ctx.lineWidth = (CFG.WIRE_WIDTH_ACTIVE + 0.6) * scale * t;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax + (bx - ax) * reach, ay + (by - ay) * reach);
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + (ax - bx) * reach, by + (ay - by) * reach);
            ctx.stroke();

            // Spark at each retracting tip while the cut is fresh.
            if (perfLevel === 1 && t > 0.45) {
                const spark = (t - 0.45) / 0.55;
                ctx.fillStyle = rgba(CFG.COLOR_SIGNAL_BRIDGE, spark);
                const tipR = 1.8 * scale * spark;
                ctx.beginPath();
                ctx.arc(ax + (bx - ax) * reach, ay + (by - ay) * reach, tipR, 0, Math.PI * 2);
                ctx.arc(bx + (ax - bx) * reach, by + (ay - by) * reach, tipR, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw signals (with motion trails)
        for (let s = 0; s < signals.length; s++) {
            const sig = signals[s];
            const a = neurons[sig.fromIdx], b = neurons[sig.toIdx];
            if (!a || !b) continue;
            const t = sig.progress;
            const sx = a.wx + (b.wx - a.wx) * t;
            const sy = a.wy + (b.wy - a.wy) * t;
            const sz = a.wz + (b.wz - a.wz) * t;
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
            const r = n.radius * ps * pulse * formShrink;
            const alpha = Math.min(ps * 0.8, 0.85) * n.presence;
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
                const baseLen = d.length * ps * pulse * formShrink;
                const cosA = Math.cos(d.angle), sinA = Math.sin(d.angle);
                // Tangent unit perpendicular for curving control point
                const perpX = -sinA, perpY = cosA;
                const endX = sx + cosA * baseLen;
                const endY = sy + sinA * baseLen;
                const cpX = sx + cosA * baseLen * 0.55 + perpX * d.curve * baseLen * 0.45;
                const cpY = sy + sinA * baseLen * 0.55 + perpY * d.curve * baseLen * 0.45;

                // Real dendrites are thick at the soma and taper to a fine
                // tip. A stroke has one width for its whole length, so at full
                // perf the neurite is a filled ribbon instead; degraded perf
                // falls back to the cheaper constant-width stroke.
                if (perfLevel === 1) {
                    const halfW = Math.max(0.35, d.width * ps * 1.5);
                    ctx.fillStyle = rgba(n.color, alpha * 0.65);
                    ctx.beginPath();
                    traceTaperedNeurite(sx, sy, cpX, cpY, endX, endY, perpX, perpY, halfW);
                    ctx.fill();
                } else {
                    ctx.strokeStyle = rgba(n.color, alpha * 0.65);
                    ctx.lineWidth = Math.max(0.4, d.width * ps);
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.quadraticCurveTo(cpX, cpY, endX, endY);
                    ctx.stroke();
                }

                // Sub-branches — skip when degraded.
                if (perfLevel < 1) continue;
                for (const b of d.branches) {
                    // Quadratic-bezier point at parameter t
                    const t = b.fromT, mt = 1 - t;
                    const bx = mt * mt * sx + 2 * mt * t * cpX + t * t * endX;
                    const by = mt * mt * sy + 2 * mt * t * cpY + t * t * endY;
                    const childAngle = d.angle + b.angleOff;
                    const cLen = b.length * ps * pulse * formShrink;
                    const childCosA = Math.cos(childAngle), childSinA = Math.sin(childAngle);
                    const childPerpX = -childSinA, childPerpY = childCosA;
                    const cEndX = bx + childCosA * cLen;
                    const cEndY = by + childSinA * cLen;
                    const cCpX = bx + childCosA * cLen * 0.55 + childPerpX * b.curve * cLen * 0.5;
                    const cCpY = by + childSinA * cLen * 0.55 + childPerpY * b.curve * cLen * 0.5;
                    // Branches taper too, and start narrower than their parent
                    // so the fork reads as a smooth split rather than a joint.
                    const cHalfW = Math.max(0.25, d.width * ps * 0.95);
                    ctx.fillStyle = rgba(n.color, alpha * 0.55);
                    ctx.beginPath();
                    traceTaperedNeurite(bx, by, cCpX, cCpY, cEndX, cEndY, childPerpX, childPerpY, cHalfW);
                    ctx.fill();
                }
            }
        }

        // ── Axon (single long curved line + terminal bulb) ──
        if (n.axon) {
            const a = n.axon;
            const len = a.length * ps * pulse * formShrink;
            const cosA = Math.cos(a.angle), sinA = Math.sin(a.angle);
            const perpX = -sinA, perpY = cosA;
            const endX = sx + cosA * len;
            const endY = sy + sinA * len;
            const cpX = sx + cosA * len * 0.5 + perpX * a.curve * len * 0.4;
            const cpY = sy + sinA * len * 0.5 + perpY * a.curve * len * 0.4;

            // The axon keeps a near-constant calibre for most of its length,
            // so it tapers far less than a dendrite — hence the tip is pulled
            // back to a stub width rather than a point.
            if (perfLevel === 1) {
                const halfW = Math.max(0.4, a.width * ps * 0.9);
                const stubX = endX - cosA * len * 0.06;
                const stubY = endY - sinA * len * 0.06;
                ctx.fillStyle = rgba(n.color, alpha * 0.55);
                ctx.beginPath();
                traceTaperedNeurite(sx, sy, cpX, cpY, stubX, stubY, perpX, perpY, halfW);
                ctx.fill();
            } else {
                ctx.strokeStyle = rgba(n.color, alpha * 0.55);
                ctx.lineWidth = Math.max(0.5, a.width * ps);
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.quadraticCurveTo(cpX, cpY, endX, endY);
                ctx.stroke();
            }

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
                    const spread = (i - (a.terminals - 1) / 2) * 0.6;
                    const ta = a.angle + spread;
                    const tlen = len * 0.18;
                    const tx = endX + Math.cos(ta) * tlen;
                    const ty = endY + Math.sin(ta) * tlen;
                    // Curved, not straight: the terminal arborises away from
                    // the axon's own heading rather than kinking off it.
                    const tCpX = endX + cosA * tlen * 0.5;
                    const tCpY = endY + sinA * tlen * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(endX, endY);
                    ctx.quadraticCurveTo(tCpX, tCpY, tx, ty);
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
            // Reused scratch array — this runs for every bio neuron every
            // frame, so it must not allocate.
            const count = n.soma.length;
            while (somaScratch.length < count) somaScratch.push({ x: 0, y: 0 });
            // Offsets are baked at creation, so this is a scale — no
            // trigonometry in the per-frame path.
            const k = ps * pulse;
            for (let i = 0; i < count; i++) {
                const v = n.soma[i];
                const p = somaScratch[i];
                p.x = sx + v.dx * k;
                p.y = sy + v.dy * k;
            }
            ctx.beginPath();
            traceSmoothClosed(somaScratch, count);
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

        // Phase easing runs even under reduced motion (it snaps instantly
        // there), so the landing page still shows the correct split state.
        updatePhase();

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

    // ── Public API ──
    // The landing page drives `setPhase` from scroll position; every other
    // route resets to phase 0 so the mesh returns to its normal full state.
    window.NeuralBG = {
        setPhase,
        reset() { setPhase(0); },
        phaseCount: PHASE_STOPS.length,
        reducedMotion,
    };

    // ── Start ──
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
