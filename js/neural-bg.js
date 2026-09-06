/* ============================================
   3D Neural Network Background
   AI ↔ Human Brain Neuron Interconnection
   ============================================ */
(function() {
    'use strict';

    const CFG = {
        // 200, not 150. A head graph needs one cell per junction and the
        // reference has 89 of them; 150 yields ~75 bio cells, which cannot fill
        // it, and a graph with empty junctions is broken rather than sparse.
        // 200 gives ~110. Measured at 1440x900, the binding stage is 0 — the
        // drifting one, where wiring is O(n^2) over every pair, not the
        // formations, which supply their own edge list: 150 -> 16.6ms,
        // 200 -> 16.5ms, 240 -> 17.6ms with a 53ms worst frame. 200 is the
        // ceiling. Mobile stays at 70 and falls back to the coarse levels.
        NEURON_COUNT: 200,
        NEURON_COUNT_MOBILE: 70,
        AI_RATIO: 0.45,
        CONNECTION_DIST: 220,
        MIN_NEIGHBORS: 3,
        SIGNAL_SPEED: 0.0085,
        SIGNAL_SPAWN_RATE: 0.018,
        MAX_SIGNALS: 60,          // moves with NEURON_COUNT
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
        // A held figure IS the screen for that stage, so its own wiring is
        // drawn heavier than ambient texture. Width matters here as much as
        // alpha: a 0.7px line antialiases to a grey smear at any opacity, and
        // the figures measured 14.0% lit / 24.1 mean contrast (brain), 11.2 /
        // 14.3 (network) and 6.7 / 11.5 (head) against 17-19% / 29-33 for a
        // drifting stage.
        WIRE_WIDTH_FORM: 1.3,
        FORM_GLOW: 1.4,           // multiplies cell + wire alpha, faded by formAmount

        // ── The network band (stage 3) ──
        // A feed-forward diagram reads left to right. Sized into half a
        // viewport it came out 546 wide by 642 tall — PORTRAIT — which forces
        // every layer's fan-out to overlap itself into a scribble, and it
        // measured the weakest stage of the seven at 11.2% lit / 14.3 contrast.
        // Full bleed and landscape, with the copy below it rather than beside.
        NET_FIT_W: 0.96,
        NET_FIT_H: 0.30,
        // The panel is anchored to the bottom of stage 3, so this centres the
        // band in what is left above it rather than in the viewport.
        NET_CENTER_Y: 0.33,       // band centre as a fraction of H
        NET_FORM_SCALE: 0.8,      // nodes are the layers; at FORM_SCALE they vanish
        NET_FANOUT: 4,            // wires per node into the next layer, not all of them
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
        LANE_FRACTION: 0.21,      // lane offset as a fraction of viewport width
        EXIT_FRACTION: 0.78,      // how far the departing kind is pushed off
        // Easing toward phase targets, as a fraction per frame at 60fps —
        // updatePhase converts it with dt, so it means the same thing at any
        // frame rate. It is the ONE number that decides whether the mesh
        // arrives with the page or long after it: the settle glide runs
        // 300-720ms, and an exponential ease is 95% done after
        // ln(0.05)/ln(1 - e) frames. At 0.055 that was 883ms, so the mesh was
        // still visibly morphing most of a second after the scroll had come to
        // rest, which reads as the graphic being detached from the page.
        PHASE_EASE: 0.09,         // ~530ms to settle, against a ~490ms glide
        // Fraction of a stage that HOLDS its state before morphing to the next.
        // Without this the mesh is permanently mid-transition, which reads as
        // aimless drifting; holding then breaking late is what makes each
        // split feel like a deliberate event.
        PHASE_HOLD: 0.55,
        // Neurons shrink as they gather into a figure — at full size the
        // somata and dendrites blur the silhouette into a smudge.
        FORM_SCALE: 0.3,
        // Graph figures declare their own cell size (GRAPH_FIGURES.scale): the
        // drawn head figures need theirs small or the somata smear the
        // silhouette, while a graph's nodes ARE the figure and vanish at 0.3.
        // A formation pins every cell exactly on its target, which reads as a
        // diagram rather than tissue. A slow orbit around the target keeps it
        // alive; the wires follow the cells, so the whole figure breathes.
        FORM_FLOAT: 5.5,
        RUPTURE_DECAY: 0.045,     // per-frame decay of the rupture flash
        RUPTURE_IMPULSE: 2.6,     // velocity kick applied when the mesh snaps
        SEVER_FRAMES: 26,         // life of a cut wire's recoiling stub
        MAX_SEVERED: 70,
        PRESENCE_CONNECT_MIN: 0.25,   // below this a neuron makes no wires
        PRESENCE_CROSS_MIN: 0.55,     // both kinds must exceed this to bridge

        // ── Head figures ──
        // The head is a LINE. Nothing about it is filled or shaded, so the
        // whole figure rests on the accuracy of the geometry — which is why
        // the lines are a head mesh's own edges rather than a drawing of one.
        // Width only binds below ~1420px, where the figure stops being limited
        // by height. It has to stay under (0.5 - LANE_FRACTION) * 2 or the
        // figure's inner edge lands on the viewport centre — which is where the
        // panel's edge now is — and the two touch on a narrow desktop.
        // The brain graph is LANDSCAPE (100 x 77), where the head figures are
        // tall and narrow, so width binds here rather than height and it needs
        // its own pair. The ceiling is not the viewport: the figure sits in the
        // left half and must not cross the centre line, where the panel's edge
        // is. Centred in that half (see the dx in getShapePoints) the widest it
        // can be is 0.5 of W. 0.46 left ~29px either side at 1440, which the
        // FORM_FLOAT orbit and the soma radius then spent: the figure was
        // measured touching x = 0. The fit is the SKELETON's width, not the
        // drawn width, so it needs the cells' own margin on top of it.
        BRAIN_FIT_W: 0.44,
        BRAIN_FIT_H: 0.62,
        // The head graph is tall (0.64 wide per unit high) like the head figure
        // it replaces, so height binds and width never does. It cannot use the
        // head figure's 0.9 though: that one is allowed to run off the bottom
        // because the rim fade dissolves the neck, and a graph has no fade — a
        // chin cut off at the viewport edge just looks cut off. 0.78 leaves
        // about 75px top and bottom at 900.
        HEAD_GRAPH_FIT_W: 0.40,
        HEAD_GRAPH_FIT_H: 0.78,
        // Both graph figures are centred low rather than on H/2: at the height
        // they fill, a figure centred in the viewport puts its crown under the
        // navbar.
        HEAD_CENTER_Y: 0.545,         // figure centre, as a fraction of H
    };

    // Phase stops. Index = integer phase; the renderer interpolates between
    // neighbouring stops using the fractional part of the current phase.
    //   0 hero        — full mesh, centered
    //   1 section 1   — human/bio neurons only, pulled into the left lane
    //   2 section 2   — recombined, centered
    //   3 section 3   — artificial neurons only, pulled into the right lane
    //   4 section 4   — recombined, centered
    // `shape` pulls the visible neurons into a formation for that stage;
    // null lets them drift freely.
    // The departing kind RECEDES; it does not leave. At 0 presence and an exit
    // lane, 45% of the cells vanished and the rest collapsed into the figure,
    // so a figure stage had nothing at all outside the figure's bounding box —
    // measured at 6.7% of its half lit on stage 5 against 17-19% while
    // drifting. GHOST (0.3) keeps it above PRESENCE_CONNECT_MIN so it still
    // wires into a faint field, and below PRESENCE_CROSS_MIN so the bio-ai
    // bridge still breaks, which is what makes the split read as a split. It
    // is also below the 0.5 that assignFormationTargets and signal spawning
    // both test, so ghosts never take formation slots and never fire.
    //
    // The lane it recedes into is short (0.35 of a lane width, not the 1.6 that
    // means "exit"): pushed the full distance the ghosts are simply off-screen
    // and fill nothing.
    const GHOST = 0.45;
    // The ghost keeps its lane at 0 — it recedes in DEPTH, not sideways. Pushed
    // even a third of a lane it bunches on the figure's side and leaves the
    // corners as bare as before; left where it is, it covers the whole frame at
    // an alpha well under the figure's, which is what a background should do.
    const PHASE_STOPS = [
        { bio: 1,     ai: 1,     bioX:  0, aiX: 0, shape: null },
        { bio: 1,     ai: GHOST, bioX: -1, aiX: 0, shape: 'brainGraph' },
        { bio: 1,     ai: 1,     bioX:  0, aiX: 0, shape: null },
        // The network is a full-bleed band, so it takes no lane either. Its
        // ghost is bio, and a bio cell is a starburst with dendrites and a glow
        // where an ai cell is a plain circle — so the same GHOST value reads
        // markedly busier here than the ai ghosts do on stages 1 and 5. It gets
        // its own, lower.
        { bio: 0.34,  ai: 1,     bioX:  0, aiX: 0, shape: 'network' },
        { bio: 1,     ai: 1,     bioX:  0, aiX: 0, shape: null },
        { bio: 1,     ai: GHOST, bioX: -1, aiX: 0, shape: 'headGraph' },
        { bio: 1,     ai: 1,     bioX:  0, aiX: 0, shape: null },
    ];

    // ── Head graph ──
    //
    // The same idea as the brain graph and the same machinery: stage 5 is a
    // head assembled out of neurons, nodes and wires, with nothing stroked.
    // Lifted from a low-poly head wireframe, which unlike the brain logo is
    // real line geometry, so extraction was only welding shared endpoints:
    // 89 nodes, 206 edges, one connected component.
    //
    // The coarse level is for the mobile budget and was NOT made by
    // collapsing the shortest edges. That is the obvious way to thin a mesh
    // and it is exactly wrong for a face, whose identity IS its short edges:
    // eye rings, nostrils, lips go first and a blob with spikes is left.
    // Ranking collapses by a 2D quadric instead — how far the local line
    // work moves if two nodes merge — is cheap along a straight run and
    // expensive at a corner, so the flat cranium and cheek panels thin out
    // and the features hold. Even so, a face needs its full 89 nodes; 34 is
    // a head, not a face.
    // level 0: 34 nodes / 84 edges
    const HEAD_GRAPH_XY0 =
        '38.9 0.0 57.8 7.7 65.5 27.5 65.0 49.0 61.4 70.4 56.8 88.7 40.9 99.0 26.6 100.0 6.5 87.3 2.8 ' +
        '69.1 0.0 47.9 0.0 27.2 8.5 7.8 21.3 0.5 23.3 13.7 42.0 13.6 32.4 27.5 9.5 22.8 8.2 39.3 56.0 ' +
        '23.0 55.5 43.5 12.4 80.0 31.7 81.5 51.1 81.0 11.7 60.9 52.5 62.0 22.3 81.1 41.2 80.4 39.0 ' +
        '69.1 26.0 68.8 30.4 52.3 14.2 46.8 28.5 42.8 40.5 45.5';
    const HEAD_GRAPH_E0 =
        '0 1 0 15 0 13 0 14 1 2 1 19 1 15 2 3 2 19 2 20 3 4 3 25 3 20 4 5 4 23 4 25 5 6 5 23 6 7 6 22 ' +
        '6 23 6 27 7 22 7 8 7 21 7 26 8 9 8 21 9 10 9 21 9 24 10 11 10 31 10 24 10 18 11 12 11 17 11 ' +
        '18 12 13 12 14 12 17 13 14 14 15 14 16 14 17 15 16 15 19 16 17 16 18 16 20 16 19 16 33 16 32 ' +
        '17 18 18 32 18 31 19 20 20 33 20 25 21 24 21 29 21 26 22 26 22 27 22 29 23 25 23 28 23 27 24 ' +
        '31 24 29 25 28 26 27 26 29 27 28 28 30 28 29 28 33 29 30 29 31 30 32 30 31 30 33 31 32 32 33';
    // level 1: 89 nodes / 206 edges
    const HEAD_GRAPH_XY1 =
        '43.9 0.9 56.7 8.0 64.3 27.5 63.7 48.6 60.2 69.5 55.7 87.5 40.1 97.6 30.7 100.0 21.5 97.1 6.4 ' +
        '86.1 2.7 68.2 0.0 47.4 0.0 27.2 8.3 8.1 20.9 1.0 32.4 0.0 22.8 13.9 41.2 13.9 31.8 27.4 9.3 ' +
        '22.8 11.4 36.2 4.7 40.7 54.9 23.0 52.4 36.6 59.2 41.5 12.2 78.9 31.0 86.4 50.1 79.9 11.4 ' +
        '60.2 51.4 61.3 24.6 81.9 18.5 79.3 25.8 79.4 36.4 79.6 37.3 82.4 43.7 80.0 40.2 68.4 37.5 ' +
        '76.5 31.1 76.4 31.0 82.3 24.8 76.1 22.3 68.0 28.9 76.3 31.1 69.2 25.1 69.0 27.2 66.7 31.2 ' +
        '66.7 35.2 66.7 37.3 69.2 33.2 76.4 31.5 52.3 35.1 53.6 11.4 38.7 7.3 47.4 24.7 40.9 15.4 ' +
        '43.6 12.2 45.2 11.6 49.0 38.8 41.2 56.4 48.2 19.7 45.4 31.9 41.3 30.2 44.8 24.9 47.8 27.7 ' +
        '53.5 52.4 39.2 51.3 46.1 48.0 44.1 38.4 48.2 43.9 45.9 32.7 44.7 31.1 79.6 13.5 49.3 13.5 ' +
        '44.8 18.1 45.0 17.9 49.3 37.0 63.2 42.9 49.7 45.2 49.9 49.9 49.9 20.6 49.1 25.6 63.2 15.9 ' +
        '49.3 45.2 45.4 50.2 45.4 50.2 49.9 51.6 49.4 47.2 49.8 15.6 49.6';
    const HEAD_GRAPH_E1 =
        '0 1 1 2 2 3 3 4 4 5 5 6 6 7 7 8 8 9 9 10 10 11 11 12 12 13 13 14 14 15 0 15 14 16 15 16 15 ' +
        '17 0 17 13 16 16 17 17 18 16 18 16 19 13 19 18 19 18 20 19 20 12 19 12 21 19 21 22 23 18 23 ' +
        '18 22 22 24 2 24 2 22 1 22 1 17 17 22 9 25 8 25 8 26 6 26 6 27 5 27 10 25 25 28 10 28 4 27 4 ' +
        '29 27 29 30 31 31 32 32 33 33 34 34 35 35 36 36 37 35 37 33 35 33 37 32 38 33 38 33 39 32 39 ' +
        '37 38 38 40 31 40 31 41 32 41 30 32 30 39 34 39 41 42 42 43 43 44 41 44 41 45 43 45 43 46 46 ' +
        '47 47 48 48 49 36 47 43 47 42 44 44 45 45 46 46 50 47 50 47 51 20 21 20 52 21 52 11 21 11 53 ' +
        '21 53 20 54 52 54 52 55 21 55 21 56 53 56 28 53 28 57 53 57 23 58 23 24 3 24 3 59 24 59 54 ' +
        '60 55 60 54 55 18 58 58 61 18 61 18 54 54 61 61 62 54 62 54 63 62 63 50 62 50 64 62 64 23 65 ' +
        '24 65 24 66 66 67 24 67 65 67 58 67 58 65 67 68 58 68 58 69 58 70 61 70 68 70 51 68 51 70 59 ' +
        '66 29 59 29 36 27 36 27 35 6 35 6 34 26 34 26 39 39 71 38 71 38 43 43 48 36 48 36 49 43 49 ' +
        '11 28 28 41 25 41 25 31 8 31 8 30 26 30 7 26 57 72 72 73 73 74 74 75 72 75 50 70 50 51 51 76 ' +
        '68 76 68 77 77 78 78 79 59 79 75 80 63 80 63 81 41 81 41 82 28 82 80 81 64 81 63 64 60 63 78 ' +
        '83 83 84 84 85 29 86 3 29 29 87 36 87 36 76 76 87 45 64 45 81 81 88 55 56 76 77 45 50';

    // ── Brain graph ──
    //
    // A lateral brain as a NODE-AND-EDGE graph, not line work: this one is
    // assembled out of the neurons themselves, so the figure needs target
    // points and a wiring list, which is exactly what a graph is. Nothing is
    // stroked for it and there is no offscreen shell.
    //
    // Lifted from a low-poly brain graphic and subdivided twice on its own
    // faces. Subdividing faces rather than scattering new points and
    // re-triangulating is what keeps the silhouette exact and keeps every
    // original vertex where it was; the 30 hubs the graphic is built around
    // stay indices 0-29 and stay the highest-degree nodes.
    //
    // 345 nodes / 936 edges, in the same 0-100 authoring box as everything
    // else. Stored as flat strings and parsed once: as JS array literals the
    // same numbers cost roughly three times the source.
    const BRAIN_GRAPH_XY0 =
        '81.9 67.2 49.7 2.0 90.8 36.0 68.2 4.0 28.2 25.1 97.3 43.4 76.6 64.9 61.0 18.7 31.2 54.3 59.3 ' +
        '37.9 81.5 35.3 16.3 10.5 37.8 39.4 77.6 77.3 66.0 55.4 29.2 12.8 83.9 9.8 51.5 29.6 96.4 ' +
        '27.3 41.2 58.7 58.2 64.4 92.3 54.9 91.8 48.3 12.4 45.1 31.4 4.3 53.6 7.9 93.3 20.3 26.1 46.3 ' +
        '54.0 53.8 4.0 29.0';
    const BRAIN_GRAPH_E0 =
        '0 6 0 10 0 21 1 3 1 24 1 25 2 5 2 10 2 18 2 22 2 26 3 7 3 16 3 25 4 7 4 12 4 15 4 17 4 29 5 ' +
        '18 5 22 6 10 6 13 6 14 7 9 7 10 7 15 7 16 7 17 7 24 7 25 8 12 8 19 8 27 9 10 9 17 9 19 9 28 ' +
        '10 14 10 16 10 21 10 26 10 28 11 15 11 24 11 29 12 17 12 19 12 23 12 27 12 29 13 14 13 20 14 ' +
        '20 14 28 15 24 15 29 16 26 17 19 18 26 19 28 20 28 21 22 23 27 23 29 24 25';

    // level 1: 97 nodes / 244 edges
    const BRAIN_GRAPH_XY1 =
        '81.9 67.2 49.7 2.0 90.8 36.0 68.2 4.0 28.2 25.1 97.3 43.4 76.6 64.9 61.0 18.7 31.2 54.3 59.3 ' +
        '37.9 81.5 35.3 16.3 10.5 37.8 39.4 77.6 77.3 66.0 55.4 29.2 12.8 83.9 9.8 51.5 29.6 96.4 ' +
        '27.3 41.2 58.7 58.2 64.4 92.3 54.9 91.8 48.3 12.4 45.1 31.4 4.3 53.6 7.9 93.3 20.3 26.1 46.3 ' +
        '54.0 53.8 4.0 29.0 79.2 66.0 81.7 51.2 87.1 61.0 58.9 3.0 40.5 3.2 51.7 4.9 94.0 39.7 86.2 ' +
        '35.6 93.6 31.6 91.3 42.1 92.1 28.1 64.6 11.3 76.0 6.9 60.9 6.0 44.6 21.9 33.0 32.3 28.7 18.9 ' +
        '39.9 27.3 16.1 27.0 96.8 35.3 94.5 45.9 79.0 50.1 77.1 71.1 71.3 60.1 60.2 28.3 71.3 27.0 ' +
        '45.1 15.7 72.5 14.3 56.3 24.2 46.2 11.5 57.3 13.3 34.5 46.9 36.2 56.5 28.6 50.3 70.4 36.6 ' +
        '55.4 33.8 50.3 48.3 56.6 45.9 73.8 45.3 82.7 22.6 86.9 45.1 87.4 27.8 67.7 44.5 22.8 11.7 ' +
        '23.9 7.4 10.2 19.8 44.6 34.5 39.5 49.1 25.1 42.3 31.9 42.9 20.9 34.2 71.8 66.3 67.9 70.8 ' +
        '62.1 59.9 60.0 54.6 30.3 8.6 16.6 20.9 88.6 15.0 46.4 44.2 94.9 23.8 47.6 56.3 56.1 59.1 ' +
        '92.0 51.6 19.2 45.7 8.2 37.0 42.5 6.1 89.1 43.6';
    const BRAIN_GRAPH_E1 =
        '0 30 6 30 0 31 10 31 0 32 21 32 1 33 3 33 1 34 24 34 1 35 25 35 2 36 5 36 2 37 10 37 2 38 18 ' +
        '38 2 39 22 39 2 40 26 40 3 41 7 41 3 42 16 42 3 43 25 43 4 44 7 44 4 45 12 45 4 46 15 46 4 ' +
        '47 17 47 4 48 29 48 5 49 18 49 5 50 22 50 6 51 10 51 6 52 13 52 6 53 14 53 7 54 9 54 7 55 10 ' +
        '55 7 56 15 56 7 57 16 57 7 58 17 58 7 59 24 59 7 60 25 60 8 61 12 61 8 62 19 62 8 63 27 63 9 ' +
        '64 10 64 9 65 17 65 9 66 19 66 9 67 28 67 10 68 14 68 10 69 16 69 10 70 21 70 10 71 26 71 10 ' +
        '72 28 72 11 73 15 73 11 74 24 74 11 75 29 75 12 76 17 76 12 77 19 77 12 78 23 78 12 79 27 79 ' +
        '12 80 29 80 13 81 14 81 13 82 20 82 14 83 20 83 14 84 28 84 15 85 24 85 15 86 29 86 16 87 26 ' +
        '87 17 88 19 88 18 89 26 89 19 90 28 90 20 91 28 91 21 92 22 92 23 93 27 93 23 94 29 94 24 95 ' +
        '25 95 30 31 31 51 30 51 31 32 32 70 31 70 33 35 35 43 33 43 34 95 35 95 34 35 36 49 38 49 36 ' +
        '38 36 39 39 50 36 50 37 96 70 96 92 96 39 96 37 40 40 71 37 71 38 89 40 89 38 40 41 57 42 57 ' +
        '41 42 41 43 43 60 41 60 44 56 46 56 44 46 44 47 47 58 44 58 45 76 47 76 45 47 45 48 48 80 45 ' +
        '80 46 86 48 86 46 48 51 68 53 68 51 53 52 53 53 81 52 81 54 64 55 64 54 55 54 58 58 65 54 65 ' +
        '55 69 57 69 55 57 56 59 59 85 56 85 59 60 60 95 59 95 61 79 63 79 61 63 61 62 62 77 61 77 64 ' +
        '67 67 72 64 72 65 88 66 88 65 66 66 90 67 90 66 67 68 72 72 84 68 84 69 71 71 87 69 87 73 85 ' +
        '74 85 73 74 73 75 75 86 73 86 76 77 77 88 76 88 78 93 79 93 78 79 78 80 80 94 78 94 81 83 82 ' +
        '83 81 82 83 84 84 91 83 91';
    const BRAIN_GRAPH_XY2 =
        '81.9 67.2 49.7 2.0 90.8 36.0 68.2 4.0 28.2 25.1 97.3 43.4 76.6 64.9 61.0 18.7 31.2 54.3 59.3 ' +
        '37.9 81.5 35.3 16.3 10.5 37.8 39.4 77.6 77.3 66.0 55.4 29.2 12.8 83.9 9.8 51.5 29.6 96.4 ' +
        '27.3 41.2 58.7 58.2 64.4 92.3 54.9 91.8 48.3 12.4 45.1 31.4 4.3 53.6 7.9 93.3 20.3 26.1 46.3 ' +
        '54.0 53.8 4.0 29.0 79.2 66.0 81.7 51.2 87.1 61.0 58.9 3.0 40.5 3.2 51.7 4.9 94.0 39.7 86.2 ' +
        '35.6 93.6 31.6 91.3 42.1 92.1 28.1 64.6 11.3 76.0 6.9 60.9 6.0 44.6 21.9 33.0 32.3 28.7 18.9 ' +
        '39.9 27.3 16.1 27.0 96.8 35.3 94.5 45.9 79.0 50.1 77.1 71.1 71.3 60.1 60.2 28.3 71.3 27.0 ' +
        '45.1 15.7 72.5 14.3 56.3 24.2 46.2 11.5 57.3 13.3 34.5 46.9 36.2 56.5 28.6 50.3 70.4 36.6 ' +
        '55.4 33.8 50.3 48.3 56.6 45.9 73.8 45.3 82.7 22.6 86.9 45.1 87.4 27.8 67.7 44.5 22.8 11.7 ' +
        '23.9 7.4 10.2 19.8 44.6 34.5 39.5 49.1 25.1 42.3 31.9 42.9 20.9 34.2 71.8 66.3 67.9 70.8 ' +
        '62.1 59.9 60.0 54.6 30.3 8.6 16.6 20.9 88.6 15.0 46.4 44.2 94.9 23.8 47.6 56.3 56.1 59.1 ' +
        '92.0 51.6 19.2 45.7 8.2 37.0 42.5 6.1 89.1 43.6 80.5 66.6 77.9 65.5 81.8 59.2 81.6 43.2 84.5 ' +
        '64.1 89.7 57.9 54.3 2.5 63.6 3.5 45.1 2.6 36.0 3.8 50.7 3.4 52.6 6.4 92.4 37.8 95.7 41.5 ' +
        '88.5 35.8 83.8 35.4 92.2 33.8 95.0 29.5 91.1 39.1 91.5 45.2 91.4 32.0 92.7 24.2 66.4 7.7 ' +
        '62.8 15.0 72.1 5.5 80.0 8.4 64.5 5.0 57.3 6.9 36.4 23.5 52.8 20.3 30.6 28.7 35.4 35.9 28.5 ' +
        '22.0 29.0 15.9 34.1 26.2 45.7 28.5 22.2 26.0 10.1 28.0 97.1 39.3 96.6 31.3 95.9 44.6 93.2 ' +
        '47.1 77.8 57.5 80.3 42.7 76.8 68.0 77.3 74.2 73.9 62.5 68.7 57.8 60.6 23.5 59.7 33.1 66.2 ' +
        '22.8 76.4 31.1 53.1 17.2 37.2 14.3 66.8 16.5 78.2 12.0 58.7 21.4 53.9 26.9 53.6 15.1 38.8 ' +
        '7.9 59.2 16.0 55.5 10.6 32.8 50.6 36.1 43.2 33.7 55.4 38.7 57.6 29.9 52.3 27.4 48.3 64.9 ' +
        '37.2 76.0 35.9 57.4 35.8 53.5 31.7 54.8 43.1 45.7 53.5 58.0 41.9 55.3 49.8 77.6 40.3 69.9 ' +
        '50.3 82.1 28.9 83.3 16.2 84.2 40.2 89.6 50.0 84.5 31.5 90.4 24.0 74.6 39.9 60.9 49.2 19.5 ' +
        '11.1 26.0 12.2 20.1 9.0 27.6 5.9 13.2 15.1 7.1 24.4 41.2 37.0 48.1 32.1 38.6 44.3 40.3 53.9 ' +
        '31.4 40.9 18.7 43.7 34.8 41.2 29.0 44.6 29.3 36.8 12.5 31.6 74.7 71.8 68.9 60.8 72.8 74.0 ' +
        '63.1 67.6 64.1 57.6 60.2 62.2 63.0 55.0 57.0 54.2 29.8 10.7 30.8 6.5 22.9 16.8 10.3 24.9 ' +
        '86.3 12.4 91.0 17.7 48.9 36.9 43.8 51.4 95.6 25.5 94.1 22.0 44.4 57.5 50.8 55.0 57.2 61.8 ' +
        '55.0 56.5 92.2 53.2 91.9 50.0 15.8 45.4 22.7 46.0 10.3 41.1 6.1 33.0 36.9 5.2 48.1 7.0 80.5 ' +
        '58.6 80.4 50.7 79.1 58.1 84.4 56.1 87.0 53.0 84.3 48.1 55.3 4.0 56.3 5.4 59.9 4.5 41.5 4.6 ' +
        '47.1 5.5 46.1 4.0 95.4 37.5 95.2 33.5 93.8 35.6 92.7 40.9 92.9 44.0 94.3 42.8 87.6 39.6 88.0 ' +
        '44.3 90.6 47.6 90.2 42.9 89.1 31.9 89.7 27.9 86.8 31.7 94.2 27.7 93.5 25.9 92.8 29.9 68.5 ' +
        '12.8 74.3 10.6 70.3 9.1 62.8 8.7 59.1 9.6 61.0 12.3 44.9 18.8 36.9 17.3 36.7 20.4 42.3 24.6 ' +
        '48.1 25.8 50.5 23.0 38.8 33.4 42.3 30.9 36.4 29.8 24.6 29.6 18.5 30.6 26.9 33.2 22.7 19.9 ' +
        '16.4 24.0 22.4 23.0 76.4 47.7 72.5 52.7 75.2 55.1 74.2 65.6 71.5 63.2 74.4 68.7 65.3 32.4 ' +
        '70.8 31.8 65.7 27.6 58.2 26.2 55.8 29.0 57.8 31.0 77.0 24.8 77.6 18.4 71.9 20.6 45.7 13.6 ' +
        '38.3 10.0 37.7 12.2 51.8 12.4 49.9 9.7 44.4 8.8 33.2 44.9 30.3 46.6 31.6 48.6 35.3 51.7 37.8 ' +
        '52.8 37.0 48.0 63.5 41.2 62.2 45.2 69.1 40.6 50.9 39.0 48.3 46.2 52.8 41.0 48.9 52.3 52.1 ' +
        '51.1 53.5 47.1 70.8 44.9 63.9 49.6 66.9 49.9 85.1 25.2 88.0 21.4 85.7 18.8 26.5 10.1 27.1 ' +
        '8.0 23.3 9.5 16.5 15.7 13.4 20.3 19.7 16.3 42.1 41.8 42.9 46.6 45.5 39.4 22.2 44.0 25.6 44.3 ' +
        '28.5 42.6 23.0 38.2 14.5 35.6 16.6 39.6 67.0 63.1 65.0 65.4 69.9 68.6 61.1 57.2 58.1 56.8 ' +
        '59.1 59.5 89.3 39.3 85.9 39.9 91.1 46.4 90.1 48.8';
    const BRAIN_GRAPH_E2 =
        '0 97 30 97 6 98 30 98 0 99 31 99 10 100 31 100 0 101 32 101 21 102 32 102 1 103 33 103 3 104 ' +
        '33 104 1 105 34 105 24 106 34 106 1 107 35 107 25 108 35 108 2 109 36 109 5 110 36 110 2 111 ' +
        '37 111 10 112 37 112 2 113 38 113 18 114 38 114 2 115 39 115 22 116 39 116 2 117 40 117 26 ' +
        '118 40 118 3 119 41 119 7 120 41 120 3 121 42 121 16 122 42 122 3 123 43 123 25 124 43 124 4 ' +
        '125 44 125 7 126 44 126 4 127 45 127 12 128 45 128 4 129 46 129 15 130 46 130 4 131 47 131 ' +
        '17 132 47 132 4 133 48 133 29 134 48 134 5 135 49 135 18 136 49 136 5 137 50 137 22 138 50 ' +
        '138 6 139 51 139 10 140 51 140 6 141 52 141 13 142 52 142 6 143 53 143 14 144 53 144 7 145 ' +
        '54 145 9 146 54 146 7 147 55 147 10 148 55 148 7 149 56 149 15 150 56 150 7 151 57 151 16 ' +
        '152 57 152 7 153 58 153 17 154 58 154 7 155 59 155 24 156 59 156 7 157 60 157 25 158 60 158 ' +
        '8 159 61 159 12 160 61 160 8 161 62 161 19 162 62 162 8 163 63 163 27 164 63 164 9 165 64 ' +
        '165 10 166 64 166 9 167 65 167 17 168 65 168 9 169 66 169 19 170 66 170 9 171 67 171 28 172 ' +
        '67 172 10 173 68 173 14 174 68 174 10 175 69 175 16 176 69 176 10 177 70 177 21 178 70 178 ' +
        '10 179 71 179 26 180 71 180 10 181 72 181 28 182 72 182 11 183 73 183 15 184 73 184 11 185 ' +
        '74 185 24 186 74 186 11 187 75 187 29 188 75 188 12 189 76 189 17 190 76 190 12 191 77 191 ' +
        '19 192 77 192 12 193 78 193 23 194 78 194 12 195 79 195 27 196 79 196 12 197 80 197 29 198 ' +
        '80 198 13 199 81 199 14 200 81 200 13 201 82 201 20 202 82 202 14 203 83 203 20 204 83 204 ' +
        '14 205 84 205 28 206 84 206 15 207 85 207 24 208 85 208 15 209 86 209 29 210 86 210 16 211 ' +
        '87 211 26 212 87 212 17 213 88 213 19 214 88 214 18 215 89 215 26 216 89 216 19 217 90 217 ' +
        '28 218 90 218 20 219 91 219 28 220 91 220 21 221 92 221 22 222 92 222 23 223 93 223 27 224 ' +
        '93 224 23 225 94 225 29 226 94 226 24 227 95 227 25 228 95 228 30 229 31 229 31 230 51 230 ' +
        '30 231 51 231 31 232 32 232 32 233 70 233 31 234 70 234 33 235 35 235 35 236 43 236 33 237 ' +
        '43 237 34 238 95 238 35 239 95 239 34 240 35 240 36 241 49 241 38 242 49 242 36 243 38 243 ' +
        '36 244 39 244 39 245 50 245 36 246 50 246 37 247 96 247 70 248 96 248 92 249 96 249 39 250 ' +
        '96 250 37 251 40 251 40 252 71 252 37 253 71 253 38 254 89 254 40 255 89 255 38 256 40 256 ' +
        '41 257 57 257 42 258 57 258 41 259 42 259 41 260 43 260 43 261 60 261 41 262 60 262 44 263 ' +
        '56 263 46 264 56 264 44 265 46 265 44 266 47 266 47 267 58 267 44 268 58 268 45 269 76 269 ' +
        '47 270 76 270 45 271 47 271 45 272 48 272 48 273 80 273 45 274 80 274 46 275 86 275 48 276 ' +
        '86 276 46 277 48 277 51 278 68 278 53 279 68 279 51 280 53 280 52 281 53 281 53 282 81 282 ' +
        '52 283 81 283 54 284 64 284 55 285 64 285 54 286 55 286 54 287 58 287 58 288 65 288 54 289 ' +
        '65 289 55 290 69 290 57 291 69 291 55 292 57 292 56 293 59 293 59 294 85 294 56 295 85 295 ' +
        '59 296 60 296 60 297 95 297 59 298 95 298 61 299 79 299 63 300 79 300 61 301 63 301 61 302 ' +
        '62 302 62 303 77 303 61 304 77 304 64 305 67 305 67 306 72 306 64 307 72 307 65 308 88 308 ' +
        '66 309 88 309 65 310 66 310 66 311 90 311 67 312 90 312 66 313 67 313 68 314 72 314 72 315 ' +
        '84 315 68 316 84 316 69 317 71 317 71 318 87 318 69 319 87 319 73 320 85 320 74 321 85 321 ' +
        '73 322 74 322 73 323 75 323 75 324 86 324 73 325 86 325 76 326 77 326 77 327 88 327 76 328 ' +
        '88 328 78 329 93 329 79 330 93 330 78 331 79 331 78 332 80 332 80 333 94 333 78 334 94 334 ' +
        '81 335 83 335 82 336 83 336 81 337 82 337 83 338 84 338 84 339 91 339 83 340 91 340 97 99 99 ' +
        '229 97 229 98 231 139 231 98 139 99 101 101 232 99 232 100 234 177 234 100 177 100 140 140 ' +
        '230 100 230 102 178 178 233 102 233 103 107 107 235 103 235 104 237 123 237 104 123 105 240 ' +
        '107 240 105 107 106 227 227 238 106 238 108 239 228 239 108 228 108 124 124 236 108 236 109 ' +
        '243 113 243 109 113 109 115 115 244 109 244 110 246 137 246 110 137 110 135 135 241 110 241 ' +
        '111 341 247 341 250 341 115 341 111 117 117 251 111 251 112 253 179 253 112 179 112 342 177 ' +
        '342 248 342 247 342 113 256 117 256 113 117 114 242 136 242 114 136 114 215 215 254 114 254 ' +
        '116 343 250 343 249 343 222 343 116 138 138 245 116 245 118 255 216 255 118 216 118 180 180 ' +
        '252 118 252 119 259 121 259 119 121 119 123 123 260 119 260 120 262 157 262 120 157 120 151 ' +
        '151 257 120 257 122 258 152 258 122 152 124 158 158 261 124 261 125 265 129 265 125 129 125 ' +
        '131 131 266 125 266 126 268 153 268 126 153 126 149 149 263 126 263 127 271 131 271 127 131 ' +
        '127 133 133 272 127 272 128 274 197 274 128 197 128 189 189 269 128 269 129 277 133 277 129 ' +
        '133 130 264 150 264 130 150 130 209 209 275 130 275 132 270 190 270 132 190 132 154 154 267 ' +
        '132 267 134 276 210 276 134 210 134 198 198 273 134 273 139 280 143 280 139 143 140 173 173 ' +
        '278 140 278 141 143 143 281 141 281 142 283 199 283 142 199 144 279 174 279 144 174 144 200 ' +
        '200 282 144 282 145 286 147 286 145 147 145 153 153 287 145 287 146 289 167 289 146 167 146 ' +
        '165 165 284 146 284 147 292 151 292 147 151 148 285 166 285 148 166 148 175 175 290 148 290 ' +
        '149 155 155 293 149 293 150 295 207 295 150 207 152 291 176 291 152 176 154 168 168 288 154 ' +
        '288 155 157 157 296 155 296 156 298 227 298 156 227 156 208 208 294 156 294 158 228 228 297 ' +
        '158 297 159 301 163 301 159 163 159 161 161 302 159 302 160 304 191 304 160 191 160 195 195 ' +
        '299 160 299 162 192 192 303 162 303 164 300 196 300 164 196 165 171 171 305 165 305 166 307 ' +
        '181 307 166 181 167 310 169 310 167 169 168 213 213 308 168 308 169 313 171 313 169 171 170 ' +
        '309 214 309 170 214 170 217 217 311 170 311 172 312 218 312 172 218 172 182 182 306 172 306 ' +
        '173 181 181 314 173 314 174 316 205 316 174 205 175 179 179 317 175 317 176 319 211 319 176 ' +
        '211 178 344 221 344 249 344 248 344 180 212 212 318 180 318 182 206 206 315 182 315 183 322 ' +
        '185 322 183 185 183 187 187 323 183 323 184 325 209 325 184 209 184 207 207 320 184 320 186 ' +
        '321 208 321 186 208 188 210 210 324 188 324 189 191 191 326 189 326 190 328 213 328 190 213 ' +
        '192 214 214 327 192 327 193 331 195 331 193 195 193 197 197 332 193 332 194 334 225 334 194 ' +
        '225 194 223 223 329 194 329 196 330 224 330 196 224 198 226 226 333 198 333 199 337 201 337 ' +
        '199 201 200 203 203 335 200 335 202 336 204 336 202 204 203 205 205 338 203 338 204 340 219 ' +
        '340 204 219 206 220 220 339 206 339 229 230 230 231 229 231 232 233 233 234 232 234 235 236 ' +
        '236 237 235 237 238 239 239 240 238 240 241 242 242 243 241 243 244 245 245 246 244 246 251 ' +
        '252 252 253 251 253 254 255 255 256 254 256 257 258 258 259 257 259 260 261 261 262 260 262 ' +
        '263 264 264 265 263 265 266 267 267 268 266 268 269 270 270 271 269 271 272 273 273 274 272 ' +
        '274 275 276 276 277 275 277 278 279 279 280 278 280 281 282 282 283 281 283 284 285 285 286 ' +
        '284 286 287 288 288 289 287 289 290 291 291 292 290 292 293 294 294 295 293 295 296 297 297 ' +
        '298 296 298 299 300 300 301 299 301 302 303 303 304 302 304 305 306 306 307 305 307 308 309 ' +
        '309 310 308 310 311 312 312 313 311 313 314 315 315 316 314 316 317 318 318 319 317 319 320 ' +
        '321 321 322 320 322 323 324 324 325 323 325 326 327 327 328 326 328 329 330 330 331 329 331 ' +
        '332 333 333 334 332 334 335 336 336 337 335 337 338 339 339 340 338 340';

    // Parse the flat strings once and cache. Nodes keep their index: the edge
    // list refers to them, and so does formIdx once a neuron is assigned.
    // ── Graph figures ──
    //
    // Two figures, one mechanism. Each is a list of density levels of the SAME
    // graph, and the neuron budget picks between them: `NEURON_COUNT` is 200
    // (70 on mobile) and 45% of that is ai, so a bio stage has about 110 cells
    // on a desktop and 38 on a phone. A level whose junctions the budget cannot
    // fill is not a sparser figure, it is a broken one — the edges meeting an
    // empty node have nothing to join — so only levels that fit are offered.
    const GRAPH_FIGURES = {
        brainGraph: {
            raw: [[BRAIN_GRAPH_XY0, BRAIN_GRAPH_E0], [BRAIN_GRAPH_XY1, BRAIN_GRAPH_E1],
                  [BRAIN_GRAPH_XY2, BRAIN_GRAPH_E2]],
            kind: 'bio',
            fitW: 'BRAIN_FIT_W', fitH: 'BRAIN_FIT_H', scale: 0.85,
            // The source graphic faces left and the figure has to face the
            // page's content, which is on the right. Mirroring here rather than
            // in the coordinates keeps the extracted data faithful to the
            // source, and mirroring about the figure's own centre leaves the
            // offsets and the edge list untouched.
            mirror: true,
        },
        headGraph: {
            kind: 'bio',
            raw: [[HEAD_GRAPH_XY0, HEAD_GRAPH_E0], [HEAD_GRAPH_XY1, HEAD_GRAPH_E1]],
            fitW: 'HEAD_GRAPH_FIT_W', fitH: 'HEAD_GRAPH_FIT_H',
            // Cell size is per figure, not global. The head's median edge is
            // 9.2 units against the brain's 16.8, so at the brain's 0.85 the
            // somata overlap their own wires and the face turns to mush.
            // 0.38 was set when the wires were WIRE_WIDTH_BASE thin; against
            // WIRE_WIDTH_FORM the cells disappeared into their own wiring and
            // stage 5 stayed the emptiest of the seven. Still well under the
            // brain's 0.85 — the head's median edge is 9.2 units to the brain's
            // 16.8, and at 0.85 the somata swallow the face.
            scale: 0.48,
            mirror: false,       // a front view has no handedness to correct
        },
    };

    // Which half of the mesh a figure is made of — for the lane the figure
    // rides, and for deciding which neurons a formation is allowed to fade out.
    function figureKind(name) {
        if (!name) return null;
        if (name === 'network') return 'ai';
        if (GRAPH_FIGURES[name]) return GRAPH_FIGURES[name].kind || 'bio';
        return null;
    }

    function graphLevels(name, count) {
        const def = GRAPH_FIGURES[name];
        if (!def) return null;
        if (!def.levels) {
            def.levels = def.raw.map(([xy, ed]) => {
                const f = xy.split(' ').map(Number), nodes = [];
                for (let i = 0; i + 1 < f.length; i += 2) nodes.push({ x: f[i], y: f[i + 1] });
                const e = ed.split(' ').map(Number), edges = [];
                for (let i = 0; i + 1 < e.length; i += 2) edges.push([e[i], e[i + 1]]);
                return { nodes, edges };
            });
        }
        let pick = def.levels[0];
        for (const lv of def.levels) if (lv.nodes.length <= count) pick = lv;
        return { def, level: pick };
    }

    // Lay `count` neuron targets on a graph.
    //
    // Nodes come FIRST and are never dropped. Whatever is left over is spread
    // along the edges BY LENGTH rather than per edge, so the cells are evenly
    // spaced instead of bunching on the short ones, and the rounding remainder
    // is carried along the list or the total lands tens of cells short.
    function buildGraphShape(name, count) {
        const got = graphLevels(name, count || 0);
        if (!got) return null;
        const { def, level: g } = got;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const n of g.nodes) {
            x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x);
            y0 = Math.min(y0, n.y); y1 = Math.max(y1, n.y);
        }
        const bw = Math.max(1, x1 - x0), bh = Math.max(1, y1 - y0);
        const k = Math.min((W * CFG[def.fitW]) / bw, (H * CFG[def.fitH]) / bh);
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        const sx = def.mirror ? -1 : 1;
        const at = (n) => ({ x: sx * (n.x - cx) * k, y: (n.y - cy) * k, z: 0, g: 1 });

        const pts = g.nodes.map(at);
        const extra = Math.max(0, (count || 0) - pts.length);
        if (extra > 0) {
            const P = g.nodes;
            const len = g.edges.map(([a, b]) => Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y));
            const total = len.reduce((m, v) => m + v, 0) || 1;
            let carry = 0;
            for (let i = 0; i < g.edges.length; i++) {
                const want = (len[i] / total) * extra + carry;
                const take = Math.floor(want);
                carry = want - take;
                if (take <= 0) continue;
                const [a, b] = g.edges[i];
                for (let j = 1; j <= take; j++) {
                    const t = j / (take + 1);
                    pts.push(at({ x: P[a].x + (P[b].x - P[a].x) * t,
                                  y: P[a].y + (P[b].y - P[a].y) * t }));
                }
            }
        }
        return { pts, edges: g.edges, scale: def.scale };
    }

    // A structured feed-forward network: evenly spaced columns of nodes with
    // explicit layer-to-layer edges, so in this formation the mesh is wired
    // like the diagram rather than by proximity.
    // Two levels, picked by the ai budget the way the graph figures pick
    // theirs — 25 nodes cannot fill a band this wide, and a phone cannot fill
    // 58. Edges are the product across each consecutive pair, so the count
    // climbs fast: [6,10,13,13,10,6] is 58 nodes and 549 wires.
    // Density has a ceiling that node count reaches long before edge count
    // does: [6,10,13,13,10,6] is 58 nodes but 549 wires, and across a band
    // 270px tall every fan-out overlapped the next into a solid moiré ribbon
    // with the layers no longer legible inside it. Fewer, wider-spaced columns
    // read as a network; more of them read as hatching.
    const NETWORK_LEVELS = [
        [5, 9, 11, 9, 5],
        [4, 6, 7, 5],
    ];
    function networkLevel(budget) {
        for (const lv of NETWORK_LEVELS) {
            let n = 0;
            for (const c of lv) n += c;
            if (n <= budget) return lv;
        }
        return NETWORK_LEVELS[NETWORK_LEVELS.length - 1];
    }

    function buildNetworkShape(layers, spanX, spanY, fanout) {
        const pts = [], edges = [];
        const cols = layers.length;
        const layerIdx = [];
        // Each layer's vertical extent scales with its node count, so the net
        // bulges through the middle. That is not decoration: with every layer
        // spanning the full height, all five columns share a top, a bottom and
        // (every count being odd) a centre node at exactly the same y, and the
        // fan then draws three dead-straight rails right across the viewport.
        // Different extents mean no edge is horizontal.
        let lo = Infinity, hi = 0;
        for (const c of layers) { if (c < lo) lo = c; if (c > hi) hi = c; }
        for (let c = 0; c < cols; c++) {
            const count = layers[c];
            const x = (c / (cols - 1) - 0.5) * spanX;
            const ext = hi === lo ? 1 : 0.55 + 0.45 * (count - lo) / (hi - lo);
            const idxs = [];
            for (let r = 0; r < count; r++) {
                const y = count === 1 ? 0 : (r / (count - 1) - 0.5) * spanY * ext;
                idxs.push(pts.length);
                pts.push({ x, y, z: 0 });
            }
            layerIdx.push(idxs);
        }
        // Each node fans to the FANOUT nodes nearest its own height in the next
        // layer, not to all of them. All-to-all is 288 wires across a 270px
        // band, which overlap into a mat: stage 3 measured 18.6% of the
        // viewport lit at mean alpha 26.8, against 4.2-12.5% and 5.3-7.9 for
        // every other stage — 3.4x the ink of the next heaviest. It also
        // destroys the thing it is meant to show, because no layer is legible
        // inside the crossing. A banded fan leaves the diagonals visible.
        for (let c = 0; c < cols - 1; c++) {
            const from = layerIdx[c], to = layerIdx[c + 1];
            const k = Math.max(1, Math.min(fanout, to.length));
            const wired = new Set();
            for (let a = 0; a < from.length; a++) {
                const centre = from.length === 1
                    ? (to.length - 1) / 2
                    : (a / (from.length - 1)) * (to.length - 1);
                const start = Math.max(0, Math.min(to.length - k, Math.round(centre - (k - 1) / 2)));
                for (let t = start; t < start + k; t++) {
                    edges.push([from[a], to[t]]);
                    wired.add(t);
                }
            }
            // A node with no incoming edge sits on the diagram unwired, which
            // reads as a mistake rather than as sparsity.
            for (let t = 0; t < to.length; t++) {
                if (wired.has(t)) continue;
                const src = Math.round((t / Math.max(1, to.length - 1)) * (from.length - 1));
                edges.push([from[src], to[t]]);
            }
        }
        return { pts, edges };
    }

    // ── Head figure construction ──
    //
    // Everything here works in the 0–100 authoring space and is built exactly
    // once per shape. The layout is size-independent, so a resize only changes
    // the scale applied at draw time — points never get reshuffled, which is
    // what keeps the figure stable while the window is being dragged.
    let hitCanvas = null, hitCtx = null;

    function svgPathEl(d) {
        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        const el = document.createElementNS(NS, 'path');
        el.setAttribute('d', d);
        svg.appendChild(el);
        return el;
    }

    // Points along a path, offset sideways by up to `jitter` so a fold seeds a
    // band of tissue rather than a drawn line.
    function samplePath(d, count, jitter) {
        const out = [];
        let el, len;
        try {
            el = svgPathEl(d);
            len = el.getTotalLength();
        } catch (e) { return out; }
        if (!len) return out;
        for (let i = 0; i < count; i++) {
            const t = (i + 0.5) / count;
            const p = el.getPointAtLength(len * t);
            if (jitter) {
                // Perpendicular to the local tangent, so the band follows the
                // fold instead of smearing across it.
                const q = el.getPointAtLength(Math.min(len, len * t + 0.5));
                const dx = q.x - p.x, dy = q.y - p.y;
                const m = Math.hypot(dx, dy) || 1;
                const off = rand(-jitter, jitter);
                out.push({ x: p.x - (dy / m) * off, y: p.y + (dx / m) * off });
            } else {
                out.push({ x: p.x, y: p.y });
            }
        }
        return out;
    }

    // A spatial hash over the authoring box, used both to enforce minimum
    // spacing while scattering and to find link candidates afterwards.
    function makeGrid(cell) {
        const buckets = new Map();
        const key = (gx, gy) => gx * 1000 + gy;
        return {
            add(p, idx) {
                const k = key(Math.floor(p.x / cell), Math.floor(p.y / cell));
                const b = buckets.get(k);
                if (b) b.push(idx); else buckets.set(k, [idx]);
            },
            near(p, radius, pts, fn) {
                const r = Math.ceil(radius / cell);
                const gx = Math.floor(p.x / cell), gy = Math.floor(p.y / cell);
                for (let i = -r; i <= r; i++) {
                    for (let j = -r; j <= r; j++) {
                        const b = buckets.get(key(gx + i, gy + j));
                        if (!b) continue;
                        for (let k = 0; k < b.length; k++) fn(b[k], pts[b[k]]);
                    }
                }
            },
        };
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
    // Signal weather, asked for by the held shape and faded in with it. 1 is
    // the ambient behaviour every other stage runs at.
    let formDirected = false, sigSpeedMul = 1, sigSpawnMul = 1, sigMaxMul = 1;
    // Per-shape wire weight. A figure whose wiring is sparse wants the full
    // WIRE_ALPHA_FORM; one that covers the screen in lines does not, and the
    // per-point `g` cannot express that because wire alpha is already at its
    // 0.95 clamp — scaling underneath the clamp moved the band's mean ink by
    // 4% where cutting the base moved it by a third.
    let formWireAlpha = 1, formWireWidth = 1;
    // Lane offset the current figure is assembling in. The drawn shell and
    // the neurons inside it both read this, so they can never separate.
    let formLaneX = 0;
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

    // Glowing tissue has a dark page to bloom against; on white it washes
    // out, so the light theme needs the points carrying more of it.
    let tissueBoost = 1;
    function refreshInk() {
        const attr = document.documentElement.getAttribute('data-theme');
        const dark = attr === 'dark' || (attr !== 'light' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);
        tissueBoost = dark ? 1 : 1.45;
    }

    function watchTheme() {
        refreshInk();
        const mo = new MutationObserver(refreshInk);
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        if (mq.addEventListener) mq.addEventListener('change', refreshInk);
        else if (mq.addListener) mq.addListener(refreshInk);
    }

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
            formGlow: 1,      // per-path brightness within a formation
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

        watchTheme();

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
    // size. Sampled once per shape per member-count per resize, never per frame.
    //
    // Head figures place their neurons *inside* the brain, not along an
    // outline, so a slot going unfilled costs nothing — the shell is drawn
    // separately and is never made of neurons.
    function getShapePoints(name, count) {
        if (!name) return null;
        const key = name + ':' + (count || 0);
        if (shapeCache[key]) return shapeCache[key];

        let entry = null;
        if (GRAPH_FIGURES[name]) {
            const shape = buildGraphShape(name, count || neuronCount);
            if (!shape) return null;
            // The lane offset alone parks the figure at LANE_FRACTION from the
            // centre, which is not the middle of the half it has to fill. This
            // nudge centres it there, which is what lets BRAIN_FIT_W reach 0.46
            // without the figure crossing the centre line or the viewport edge.
            // Both graph figures use it, so they share a vertical axis.
            const dx = -(0.25 - CFG.LANE_FRACTION) * W;
            const dy = (CFG.HEAD_CENTER_Y - 0.5) * H;
            entry = { pts: shape.pts.map(q => ({ ...q, x: q.x + dx, y: q.y + dy,
                                                g: CFG.FORM_GLOW })),
                      edges: shape.edges, scale: shape.scale };
        } else if (name === 'network') {
            // A band across the whole viewport, with the copy below it — not a
            // figure in a lane. Edges are authored layer c -> layer c+1 and
            // buildConnections preserves that order into conn.i/j, which is
            // what `directed` then spends: signals run with the network
            // instead of a coin flip per signal.
            const net = buildNetworkShape(
                networkLevel(Math.round((count || neuronCount) * 0.9)),
                W * CFG.NET_FIT_W, Math.min(H * CFG.NET_FIT_H, 300), CFG.NET_FANOUT);
            const dy = (CFG.NET_CENTER_Y - 0.5) * H;
            entry = {
                // Less emphasis than the graph figures, not more: the band's
                // wires supply their own weight by sheer count, and at
                // FORM_GLOW it turned into a solid block of colour.
                pts: net.pts.map(q => ({ ...q, y: q.y + dy, g: 0.95 })),
                edges: net.edges,
                scale: CFG.NET_FORM_SCALE,
                // The band covers the whole viewport in lines where the graph
                // figures occupy a corner of it, so it is drawn lighter and
                // thinner. Same wires, a third of the ink.
                wireAlpha: 0.55, wireWidth: 0.8,
                directed: true,
                // Tuned for this stage alone. Raising SIGNAL_SPEED and
                // SIGNAL_SPAWN_RATE globally would change stage 0's character
                // and its cost; a formation can ask for its own weather.
                sigSpeed: 2.6, sigSpawn: 9, sigMax: 1.7,
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
    function updatePhase(dt) {
        const t = phaseTargets();
        // PHASE_EASE is authored per frame at 60fps; dt is already frames at
        // 60fps, so compounding it over dt keeps the ease running at the same
        // speed in wall-clock time whatever the frame rate. Without this the
        // mesh eased half as fast on a 30fps device as on a 60fps one — the
        // last frame-rate-dependent update left in the file.
        const e = reducedMotion ? 1 : 1 - Math.pow(1 - CFG.PHASE_EASE, dt);
        bioPresence += (t.bio - bioPresence) * e;
        aiPresence  += (t.ai  - aiPresence)  * e;

        // Fading applies to the FORMING kind only. The receding half has no
        // formation slots by definition, so fading every slotless neuron took
        // the ghost field to zero and emptied the screen exactly as before.
        const formKind = t.form > 0 ? figureKind(t.shape) : null;
        for (const n of neurons) {
            let tp = n.kind === 'ai' ? t.ai  : t.bio;
            const tx = n.kind === 'ai' ? t.aiX : t.bioX;
            // A visible neuron with no slot in the active figure would drift
            // across it and blur the silhouette, so it fades for the duration.
            if (t.form > 0 && n.formIdx < 0 && n.kind === formKind) tp *= 1 - t.form;
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
        formDirected = !!(formEdges && shape.directed);
        const mix = (v) => 1 + ((v || 1) - 1) * formAmount;
        sigSpeedMul = shape ? mix(shape.sigSpeed) : 1;
        sigSpawnMul = shape ? mix(shape.sigSpawn) : 1;
        sigMaxMul   = shape ? mix(shape.sigMax)   : 1;
        formWireAlpha = shape ? mix(shape.wireAlpha) : 1;
        formWireWidth = shape ? mix(shape.wireWidth) : 1;
        const k = formAmount;
        for (const n of neurons) {
            const fx = n.x + n.laneX, fy = n.y, fz = n.z;
            if (shape && n.formIdx >= 0) {
                const tgt = shape.pts[n.formIdx % shape.pts.length];
                const tx = tgt.x + n.laneX;   // figure assembles inside the lane
                // Orbit the target rather than sitting on it. pulsePhase is
                // already seeded per neuron and advanced with dt, so two
                // different multiples of it give a slow, per-cell, frame-rate
                // independent wander without another field or another clock.
                const amp = CFG.FORM_FLOAT * k;
                n.wx = fx + (tx - fx) * k + Math.sin(n.pulsePhase * 0.35) * amp;
                n.wy = fy + (tgt.y - fy) * k + Math.cos(n.pulsePhase * 0.27) * amp;
                n.wz = fz + (tgt.z - fz) * k;
            } else {
                n.wx = fx; n.wy = fy; n.wz = fz;
            }
        }

        // The shell rides the same lane as the neurons forming inside it.
        const laneTarget = figureKind(formShapeName) === 'ai' ? t.aiX : t.bioX;
        formLaneX += (laneTarget - formLaneX) * e;

        // Per shape, not global: graph figures declare their own cell size.
        const fScale = (shape && shape.scale) || CFG.FORM_SCALE;
        formShrink = 1 - (1 - fScale) * formAmount;

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
        if (!name) return;

        // Take the stop that OWNS this shape, not the one nearest the current
        // phase. The two disagree, and only in one direction: `phaseTargets`
        // switches shape when the eased fraction f crosses 0.5, which happens
        // at raw 0.775 of a stage's range (f = smoothstep((raw - PHASE_HOLD) /
        // (1 - PHASE_HOLD))), while Math.round(phase) flips at raw 0.5. Coming
        // DOWN into stage 3 that lands on stop 3 and is right; going UP into it
        // the phase reads 3.775, rounds to 4 — a stop where both kinds are
        // present — so every neuron became a member, bio cells took network
        // slots, and since bio is invisible at stage 3 those nodes simply did
        // not appear. Measured: 124 cells drawn arriving downward, 112 upward.
        const stop = PHASE_STOPS.find(st => st.shape === name) || PHASE_STOPS[0];
        const members = neurons.filter(n =>
            (n.kind === 'ai' ? stop.ai : stop.bio) > 0.5);
        if (!members.length) return;

        const shape = getShapePoints(name, members.length);
        if (!shape) return;
        formMemberCount = members.length;

        // Both sides are sorted by angle around the centre before being
        // paired, so the swarm converges without threading through itself.
        // The target ORDER is a permutation, not a reindexing — formIdx stays
        // the real point index, which is what the formation edges refer to.
        members.sort((p, q) => Math.atan2(p.y, p.x) - Math.atan2(q.y, q.x));
        const total = shape.pts.length;
        const order = [];
        for (let i = 0; i < total; i++) order.push(i);
        order.sort((i, j) =>
            Math.atan2(shape.pts[i].y, shape.pts[i].x) -
            Math.atan2(shape.pts[j].y, shape.pts[j].x));

        for (let m = 0; m < members.length; m++) {
            // One neuron per point while points last; any surplus (the
            // structured network has far fewer nodes than neurons) sits out —
            // stacking neurons on a node only thickens it, and leaving them
            // adrift smears the figure. They fade instead, see updatePhase.
            const slot = m < total ? order[m] : -1;
            members[m].formIdx = slot;
            members[m].formGlow = slot >= 0 ? (shape.pts[slot].g || 1) : 1;
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
            // The ghost field still wires. This branch replaces proximity
            // wiring wholesale, so without a pass of its own the receding half
            // is a scatter of unconnected dots. Restricted to neurons with no
            // formation slot, and to same-kind pairs, so it can never throw a
            // wire across the figure: ~90 ghosts is 4k pairs against 20k for
            // the full mesh, and the degree cap keeps a clump from mattting.
            const gd2 = CFG.CONNECTION_DIST * CFG.CONNECTION_DIST;
            const ghosts = [];
            for (let g = 0; g < neurons.length; g++) {
                const n = neurons[g];
                if (n.formIdx < 0 && n.presence >= CFG.PRESENCE_CONNECT_MIN) ghosts.push(g);
            }
            const gdeg = new Int32Array(neurons.length);
            for (let ga = 0; ga < ghosts.length; ga++) {
                const i = ghosts[ga], na = neurons[i];
                if (gdeg[i] >= CFG.MIN_NEIGHBORS) continue;
                for (let gb = ga + 1; gb < ghosts.length; gb++) {
                    const j = ghosts[gb], nb = neurons[j];
                    if (na.kind !== nb.kind || gdeg[j] >= CFG.MIN_NEIGHBORS) continue;
                    const gx = na.wx - nb.wx, gy = na.wy - nb.wy, gz = na.wz - nb.wz;
                    const d2 = gx * gx + gy * gy + gz * gz;
                    if (d2 > gd2) continue;
                    gdeg[i]++; gdeg[j]++;
                    connections.push({
                        i, j, dist: Math.sqrt(d2), type: _connTypeOf(na, nb),
                    });
                    if (gdeg[i] >= CFG.MIN_NEIGHBORS) break;
                }
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
    // A signal outlives the wire it was fired down. Connections are rebuilt
    // every CONN_RECALC_INTERVAL frames — proximity pairs drift apart, and a
    // formation replaces proximity wiring wholesale with its own edge list — so
    // a pair joined a moment ago may not be joined now. The signal keeps
    // travelling between the two cells with nothing drawn under it, which reads
    // as a dot shooting across open space rather than down a wire. Measured
    // over a full scroll of the landing page before this existed: 20% of live
    // signals were in that state, and some frames were 100% of them.
    //
    // Called right after every rebuild, which is the only moment a wire can
    // disappear. Dropping is what rupture already does to every signal at once.
    function cullOrphanSignals() {
        if (!signals.length) return;
        const live = new Set();
        for (const c of connections) {
            const lo = c.i < c.j ? c.i : c.j, hi = c.i < c.j ? c.j : c.i;
            live.add(lo * 10000 + hi);
        }
        for (let k = signals.length - 1; k >= 0; k--) {
            const s = signals[k];
            const lo = s.fromIdx < s.toIdx ? s.fromIdx : s.toIdx;
            const hi = s.fromIdx < s.toIdx ? s.toIdx : s.fromIdx;
            if (!live.has(lo * 10000 + hi)) signals.splice(k, 1);
        }
    }

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
        const sigCap = Math.round(CFG.MAX_SIGNALS * sigMaxMul);
        if (connections.length > 0 && signals.length < sigCap) {
            const rate = CFG.SIGNAL_SPAWN_RATE * sigSpawnMul / 60;
            for (const conn of connections) {
                if (Math.random() < rate) {
                    // Don't fire down a wire whose endpoints are fading out.
                    const na = neurons[conn.i], nb = neurons[conn.j];
                    if (!na || !nb) continue;
                    if (Math.min(na.presence, nb.presence) < 0.5) continue;
                    // A directed formation already knows which way its wires
                    // run — formEdges is authored layer c -> layer c+1 and
                    // buildConnections keeps that order in conn.i/j. A coin
                    // flip here sent half the network's signals BACKWARDS
                    // through it. Proximity wiring has no direction to respect,
                    // so it keeps the flip.
                    const dir = (formDirected && conn.structured) || Math.random() < 0.5;
                    signals.push({
                        fromIdx: dir ? conn.i : conn.j,
                        toIdx: dir ? conn.j : conn.i,
                        progress: 0,
                        speed: CFG.SIGNAL_SPEED * sigSpeedMul * rand(0.7, 1.3),
                        type: conn.type,
                        trail: [],   // 3D positions of recent points (for afterglow)
                    });
                    if (signals.length >= sigCap) break;
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
        // A neuron in the hidden lane is skipped by the draw loop but still
        // receives signals, so without this its numbers print into empty space
        // with nothing anywhere near them — which is most of what read as the
        // bubbles being detached from the cells.
        if (n.presence < 0.35) return;
        // Spawn on the DISPLAY position, not the raw drift one. `n.x/y/z` is
        // where the neuron would be with no lane offset and no formation pull;
        // during a head stage that is most of a screen away from where the cell
        // is actually drawn, and the number pops off on its own in open space.
        // Everything else downstream reads n.wx/wy/wz — so does this.
        const r = n.radius * formShrink;
        numberBubbles.push({
            x: n.wx + rand(-r, r),
            y: n.wy - r * 1.6,
            z: n.wz,
            vx: rand(-0.15, 0.15),
            vy: -CFG.BUBBLE_RISE - rand(0, 0.25),
            text: randomFloatText(),
            kind: n.kind,
            // The cell can keep fading after the bubble is spawned; carry its
            // presence so the number goes with it instead of outliving it.
            presence: n.presence,
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
                ? (isActive ? CFG.WIRE_ALPHA_ACTIVE : CFG.WIRE_ALPHA_FORM * formWireAlpha)
                : (isActive ? CFG.WIRE_ALPHA_ACTIVE : CFG.WIRE_ALPHA_BASE);
            const wireGlow = 1 + (Math.min(a.formGlow, b.formGlow) - 1) * formAmount;
            // tissueBoost belongs here as much as on the dust. It used to apply
            // to dust alone, which is why the light theme looked washed out the
            // moment a figure was made of wires and cells rather than fill.
            const baseAlpha = Math.min(0.95, wireBase * distFalloff * avgScale
                * Math.min(a.presence, b.presence) * wireGlow * tissueBoost);
            if (baseAlpha < 0.04) continue;       // skip near-invisible wires
            // A figure's own wiring is drawn thicker as well as brighter. At
            // WIRE_WIDTH_BASE the line antialiases to a grey smear and the
            // figure reads as a stain rather than a diagram, whatever its alpha.
            const restWidth = conn.structured
                ? CFG.WIRE_WIDTH_FORM * formWireWidth : CFG.WIRE_WIDTH_BASE;
            const baseWidth = (isActive ? CFG.WIRE_WIDTH_ACTIVE : restWidth) * avgScale;

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
            ctx.fillStyle = rgba(color, Math.min(1, 0.95 * ps));
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
            const glow = 1 + (n.formGlow - 1) * formAmount;
            const alpha = Math.min(0.95, Math.min(ps * 0.8, 0.85) * n.presence * glow * tissueBoost);
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
                const alpha = Math.min(1, lifeFrac * 1.4) * ps * b.presence;
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
        updatePhase(dt);

        // Reduced-motion users get a (mostly) static frame: no drift, slow signals.
        if (!reducedMotion) updateNeurons(dt);

        frameCount++;
        if (frameCount % CFG.CONN_RECALC_INTERVAL === 0) {
            buildConnections();
            cullOrphanSignals();
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
