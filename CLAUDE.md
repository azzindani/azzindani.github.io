# CLAUDE.md

Guidance for Claude (and any agent) working in this repo. Read this first
before making changes — every section here is load-bearing.

## Working principles for this repo

1. **Write long content in chunks.** Never produce a long file in a single
   `Write`. Start with a short skeleton (Write), then `Edit` or append section
   by section. Same rule for long markdown posts, long CSS rewrites, long JS
   modules. This avoids tool truncation, makes diffs reviewable, and lets the
   user halt early. **Apply this rule to *every* file longer than ~200 lines
   you create from scratch, including this one.**
2. **Edit existing files; don't create parallel ones.** The site is a SPA
   served as static files. Anything new must wire into `index.html`,
   `js/app.js`, `js/neural-bg.js`, or `css/style.css` — don't fork.
3. **No build step.** GitHub Pages serves these files directly. No bundler,
   no transpilation. Vanilla ES2017+ only. Lazy-load heavy libs from CDN
   (already the pattern for hljs, pdf.js, mermaid, katex).
4. **Don't add dependencies casually.** If you reach for npm, ask first or
   keep it dev-only (vitest, playwright are dev-only, never shipped).
5. **Preserve the architecture.** Phases 1–7 in `js/app.js` are stable
   contract points. Add new phases at the end; don't shuffle existing ones.
6. **Commit on the working branch only.** This repo's working branch is
   `claude/portfolio-neural-network-Dv6SU`. `main` is what GitHub Pages
   serves; never push directly to `main`.

## What this repo is

A single-page personal portfolio + blog hosted on GitHub Pages at
`azzindani.github.io`. Content lives as markdown in `content/posts/`, indexed
by `content/posts.json`. There is also an admin UI (gated by a GitHub PAT
in localStorage) that writes back to the same repo via the GitHub Contents
API — that's how new posts get published.

The neural network canvas (`js/neural-bg.js`) renders an animated brain ↔
AI neural mesh as the page background. It is decorative and must stay
performant on mobile.

## Top-level layout

```
.
├── index.html              # SPA shell. All routes render into #app.
├── css/style.css           # All styles. CSS variables in :root.
├── js/
│   ├── app.js              # Router, content service, pages, admin, editor.
│   └── neural-bg.js        # Canvas-based 3D neural network background.
├── content/
│   ├── posts.json          # Post manifest (single source of truth).
│   └── posts/              # Markdown post files referenced by manifest.
├── uploads/
│   ├── images/             # Image assets uploaded via admin.
│   └── pdfs/               # PDF assets uploaded via admin.
├── tests/                  # Vitest unit tests + Playwright e2e tests.
├── .github/workflows/      # CI: unit + e2e on every push.
└── 404.html                # GitHub Pages SPA fallback (redirects to #/).
```

## Routing

Hash-based router in `js/app.js` (search for `Router.add`). Hash format
is `#/path?key=value` — `Router.query` exposes the parsed query string.

| Hash                       | Page                                              |
| -------------------------- | ------------------------------------------------- |
| `#/`                       | Landing page (scroll-driven neural split).        |
| `#/projects`               | Projects feed (`kind: "project"`).                |
| `#/blog`                   | Blog feed (`kind: "blog"`).                       |
| `#/projects?p=2`, `#/blog?p=2` | Pagination (page param, persists via `history.replaceState`). |
| `#/post/:slug`             | Single post view (markdown rendered).             |
| `#/pdf/:slug`              | Full-page PDF viewer.                             |
| `#/collection/:slug`       | Posts grouped by `collection` field.              |
| `#/collections`            | Index of all collections.                         |
| `#/tag/:slug`              | Posts with that tag.                              |
| `#/category/:slug`         | Posts in that category.                           |
| `#/docs`                   | Docs landing (left tree + first doc + right TOC). |
| `#/docs/:slug`             | Specific doc page.                                |
| `#/admin`                  | Admin dashboard (PAT-gated).                      |
| `#/admin/new`              | New-post editor.                                  |
| `#/admin/edit/:slug`       | Edit existing post.                               |
| `#/admin/upload`           | File upload UI for images & PDFs.                 |

Adding a new route: register it in the `Router.add` block at the bottom of
`app.js` and write a `renderXxxPage` function next to its peers. If the
route should appear in the navbar, also add a `<a class="nav-tab">` to
`index.html` and a corresponding entry in `Router.resolve()`'s tabKey map.

## Landing page & the neural phase system

`#/` renders `renderLandingPage` (in `js/app.js`). It is seven stages, and
**scroll position drives the shared background canvas** through a matching
sequence of phases. Every stage is `min-height: 100vh`, because the stages are
scroll-snap targets and a stage shorter than the viewport leaves slivers of its
neighbours on screen, which stops the snap reading as a stop at all. It is a
floor, not a fixed height: content taller than the viewport still grows the
stage, and `phaseFromScroll` measures each stage's own height, so an oversized
stage owns a longer slice of the timeline. The cost is that the light stages sit
around 28–47% full, which is why the type scale is a step up. Panels are capped well short of the
viewport width for measure, not decoration: at 900px the lead ran past 110
characters and the wide stages came out letterboxed.

**The panel is exactly half the content box**, which lands its inner edge on
the viewport centre at every width: the stage's outer padding is symmetric, so
half of what is left inside it is half the screen. Do not cap that width in
pixels — a cap that bites stops the edge reaching the centre and the alignment
goes with it; the container's own max-width is the limit.

That makes the centre line a hard boundary the figure must stay off, and it is
`HEAD_FIT_W` that keeps it off. Width only binds below ~1420px, where the
figure stops being limited by height — and it has to stay under
`(0.5 - LANE_FRACTION) * 2`, or the figure's inner edge lands on the centre too
and the two touch on a narrow desktop. At 0.40 against a lane of 0.21 that came
out at 0.49 × W, an 8px gutter; 0.37 leaves 20–36px across the range and leaves
the figure untouched at 1440 and up, where height is what binds.

**The panel grows outward, never inward.** Its inner edge lands on 50% of the
viewport whatever the container is — the stage's padding is symmetric, so
`(100% - pad) - 0.5 * (100% - 2*pad)` collapses to exactly 50% — so widening
the container (1280 → 1440, floor 4vw → 3.2vw) never moves the centre line or
eats the figure's gutter. That is the one free lever for a bigger content box.

**Panel fill is levelled with a floor, not a height.** It ran from 76% of the
viewport on stage 1 to 28% on stage 6, so the page lurched between crowded and
empty; `min-height: min(62vh, 620px)` on the split panels and
`min(46vh, 460px)` on the wide ones grows the short ones to meet the rest. In
vh, so the short-viewport tiers do not have to restate it, and dropped entirely
below 900px where stacked full-width panels set their own rhythm.

**Panels otherwise grow by type size, not by width.** The panel's width is bounded on one
side by the figure's gutter and on the other by the measure, so there is very
little of it to give; the room is vertical, and it is free. The landing type
scale is deliberately a step above the rest of the site for that reason — the
figure beside it is most of a screen tall, and body copy at feed size reads as
a caption next to it.

### Panel type: rem at the ends, cqi in between

**Neither rem nor px adapts to the screen; that is not what the choice is
for.** rem scales with the reader's browser font-size setting and px ignores
it, so type is rem — but a bare rem is as fixed as a px against the viewport,
and `.lp-lead` at `1.14rem` came out identical at 1920 and at 390, where it was
the largest body text on the page. What adapts is `clamp(min-rem, <length>,
max-rem)`: rem at both ends so the reader's setting still works, a relative
length in the middle so the type tracks the column. px stays for the things
that must not scale with text — hairlines, radii, canvas coordinates.

**The relative length is `cqi`, not `vw`, because the panel is not the
window.** `.lp-panel` is 50% of a container capped at 1280, so it is frozen at
640px on every viewport past 1280 while `.lp-panel-wide` is 820. A `3.9vw`
heading therefore gave the same words **22 characters per line in a split
panel and 31 in a wide one**, and below 1280 the panel shrank to 506px while
the heading barely moved — down to **18 cpl**, a heading breaking every three
words. `.lp-panel` declares `container-type: inline-size` and everything
inside it sizes off that. Measured after: 30/33 cpl at 1920, and the split
panel holds 28-30 cpl all the way down to 1100.

The hero is the exception and stays on `vw`: `.lp-hero-inner` is centred in
the full width, so there the window *is* the column.

**Measures are capped in `ch`, which tracks the font size.** Two places
outgrow their type: the centred wide panels ran to **82 characters**, the worst
case for a long measure — centred copy gives the eye no ragged edge to find the
next line by — and the tablet range below 900px, where the split panel goes
full width. `.lp-lead` gets `max-width: 50ch`, which bites in exactly those two
and leaves the desktop split panel (already just inside it) alone.
`.lp-hero-sub`'s 560px was set against the size it clamps *up* to; once the
font floors at 1rem the same box is 77 characters, so it is `min(560px, 48ch)`
and the ch term takes over on the way down.

**Height is a breakpoint axis here, and the width query never saw it.** A
1366×768 or 1152×720 laptop is wide enough to keep the split layout but has
130–180px less height than the desktop the panels were sized on. A split stage
that outgrows `100vh` stops being centreable at all: the settle lands it in the
middle and cuts the kicker off the top and the last card off the bottom at
once. Measured before: stage 1 needed **888px** and overflowed at 1366×768,
1280×800, 1152×720 and 960×720, where its panel alone was **106% of the
viewport**.

The fix is box, not type — the cards were **61% of that panel** (3 × 137px) and
shrinking their copy to fit is the wrong trade when there is padding to give
back. Two tiers, `max-height: 820px` and `max-height: 760px`, tighten stage
padding, panel padding and card padding. **56px is the floor for the stage's
top padding**: it is exactly `--nav-height`, and below it a full panel runs
under the navbar. After: every stage fits every viewport tested, worst case
83% at 960×720, and stage 1 keeps its third card.

**Two sizes that were doing one job.** `.lp-kicker` (0.84rem/0.14em) and
`.lp-eyebrow` (0.8rem/0.18em) are the same mono label two stages apart and now
share one rule, differing only in colour. `.lp-stat-value` capped at 2.8rem tied
with the heading above it (44.8 against 46.4) and stage 2 had nothing leading
it; it is 2.3rem. `.lp-card h3` and `.lp-lead` were 1.16rem and 1.14rem — the
same size in the same panel, so the card title carried no step.

The split stages hold their panel inside a **centred measure**
(`max(4vw, (100% - 1280px) / 2)`) rather than pinning it to the viewport edge,
and `LANE_FRACTION` decides how far the figure slides the other way. Those two
numbers are one control between them: the panel flush against the edge reads as
flung to one side, and on a wide screen it drifts further out while the figure —
offset by a fraction of `W` — drifts the opposite way, so the composition comes
apart the wider the window gets. Pulling the figure toward the middle also
*widens* the air outside it, because the figure is narrower than its half; that
trade is unavoidable without growing the figure, and the gutter between the two
is the number to keep honest — it should not be larger than the margin outside
the panel, or the panel reads as closer to the screen edge than to the mesh.

| Stage | Mesh state                                   | Content      |
| ----- | -------------------------------------------- | ------------ |
| 0     | full mesh, drifting                          | hero, title  |
| 1     | bio figure + ai ghost, **brain graph**       | panel right  |
| 2     | recombined, drifting                         | full width   |
| 3     | ai figure + bio ghost, **network band**      | panel below  |
| 4     | recombined, drifting                         | full width   |
| 5     | bio figure + ai ghost, **head graph**        | panel right  |
| 6     | recombined, drifting                         | full width   |

**Stage 3 is the one stage that is not a split**, and the only one whose panel
is not beside the mesh — see "The network band" below.

### Formations

`PHASE_STOPS` entries carry a `shape` name. The structured network is generated
from `NETWORK_LEVELS`. The head figures in `SHAPES` are SVG paths in a 0–100
box, sampled and hit-tested at runtime — no build step, no data files.

**A head is not made of neurons, and it is not drawn.** Both were tried at
length. Spending the neuron budget on a contour leaves ~80 fat cells strung
around a loop and reads as wire. Tracing the reference photographs never
survived contact with a face, because a threshold cannot tell a jaw from the
shadow under it. Deriving a smooth contour from a head mesh and then setting
the eyes, nose and mouth on top of it by hand read as a mask, not a head.

What is drawn now is a **low-poly head SVG's own line work**, extracted once,
offline, and pasted in as static path data.

| Key           | What it is                                    | How it is used                    |
| ------------- | --------------------------------------------- | --------------------------------- |
| `silhouette`  | The mesh boundary — edges used by one polygon | **Stroked**: a wide soft pass, then a thin bright one. |
| `mesh`        | Every other edge, chained into trails         | **Stroked** well under the rim. This is the face. |
| `brain`       | The cranium                                   | **Populated** with dust + neurons. |
| `folds`       | Gyri                                          | **Populated**, brighter than the area fill. |

### Where the path data came from

Two set operations over the SVG's polygons, and nothing else:

- **`silhouette`** — count how many polygons use each edge. The ones used once
  are the boundary; chain them into a loop. That is the outline, exactly. No
  threshold, no morphology, no smoothing, nothing to tune.
- **`mesh`** — every edge used twice, chained into **trails** (walk unused
  edges from an odd-degree vertex until you cannot continue, repeat). 2007
  edges become 274 polylines of 2281 points. Written as separate `M..L..`
  segments the same edges cost twice as much source, because a trail reuses its
  previous endpoint.
- Both are clipped to a crop line under the chin before they are normalised.

Only the **brain** is not in the SVG. It is the silhouette above the brow line,
pulled inside the skull along the direction to the cranium's centre, closed by
a base that dips where the temporal lobes hang. Draw it to a comfortable margin
instead and the back of the skull is a large empty balloon.

### The graph figures (stages 1 and 5)

Stages 1 and 5 are not line work. They are **node-and-edge graphs assembled out
of the neurons themselves** — the cells sit on the nodes, `formEdges` supplies
the wiring, and nothing is stroked for either. `buildHeadFigure` returns null
for the names in `GRAPH_FIGURES` and `drawHeadFigure` bails; that is by design,
not an oversight. There is no offscreen shell because there is no static line
work. Stage 1 is a brain in lateral view, stage 5 a head in front view, and both
run through `buildGraphShape` — the entry in `GRAPH_FIGURES` carries the levels,
the fit constants, whether to mirror, and the cell size.

**Where the data came from.** A low-poly brain graphic, which turned out not to
be paths at all: it is one gradient rectangle clipped by two clipPaths, so every
circle and line lives as a subpath of `clip-1` (`clip-2` is an exact duplicate).
The strokes had been unioned before export, so there is no subpath per line —
each outline wraps a node together with several of its lines, and reading them
directly yields "bars" 150 units wide. Two things made it recoverable:

- **Nodes** are the holes inside the rings, which *are* separate subpaths. Round
  loops with a radius that barely varies give the 30 centres exactly.
- **Edges** come from the ink, not the outlines. Rasterise the artwork once,
  then join a pair of nodes when the run between them is ink the whole way
  **and** is stroke-thin — empty space either side at its midpoints. That last
  test is the load-bearing one: without it, any two nodes inside the same blob
  get joined.

Density comes from subdividing the graph's own **faces** (planar traversal:
neighbours sorted by angle, always take the next one round, drop the face whose
signed area is largest). That keeps the silhouette exact and every original
vertex in place, where scattering points and re-triangulating would drift both.
Level 0 is the source, 30 nodes / 66 edges; level 2 is 345 / 936.

**The neuron budget picks the level, and it is smaller than it looks.**
`NEURON_COUNT` is 150 (70 on mobile) and 45% is ai, so stage 1 has about **82
bio cells on a desktop and 38 on a phone**. Counting drawn arcs suggests ten
times that — those are dust and signal trails, not cells. A graph whose
junctions cannot all be filled is not a sparser graph, it is a broken one: the
edges meeting an empty node have nothing to join. So `brainGraphData(count)`
returns the densest level whose node count the budget covers, and level 2 only
becomes reachable if `NEURON_COUNT` goes past ~350.

**The figure is mirrored in x.** The source graphic faces left and the figure
has to face the page's content, which sits on the right. The flip lives in
`buildBrainGraphShape`'s transform rather than in the coordinates, so the
extracted data stays faithful to the source; mirroring about the figure's own
centre leaves `dx`, `dy` and the edge list untouched.

Nodes are laid first and never dropped; whatever is left spreads along the edges
**by length**, so cells are evenly spaced rather than bunching on the short ones.
The rounding remainder is carried along the edge list, or the total lands tens of
cells short of the budget.

**Raising `NEURON_COUNT` does not cost what you would expect.** Measured at
1440×900, going from 150 to 400 (with `MAX_SIGNALS` 45 → 120):

| stage | 150 | 400 |
| --- | --- | --- |
| 0 — drifting | 16.6ms | **21.3ms** (worst 62.5) |
| 1 — brain graph | 17.2ms | 17.6ms |
| 3 — network | 16.7ms | 16.8ms |
| 5 — head | 16.7ms | 17.3ms |

The dense graph is nearly free, because a formation replaces proximity wiring
with its own fixed edge list. What breaks is the **drifting** stages, where
wiring is O(n²) over every pair. If stage 1 ever needs level 2, the thing to
solve is stage 0, not the brain.

**Cells, not dots — and the light theme needed fixing to show them.**
`FORM_SCALE` shrinks every cell to 0.3 while a figure is held, because the head
figures smear into a smudge otherwise. The graph is the opposite case: its nodes
*are* the figure, so at 0.3 it is a drawing of wires with nothing at the
junctions. `FORM_SCALE_GRAPH` (0.85) is declared by the shape and read off it,
not switched on the name. Measured at 1440x900, scale against stage-1 frame
time: 0.45, 0.55, 0.65, 0.75 and 0.85 all sit at 17.1-17.6ms, so the size is
free here and was chosen on looks.

`tissueBoost` (1.45 on light) used to multiply the **dust alone**. That was
invisible while the figures were fill and line work, and obvious the moment one
was made of wires and cells: it now applies to wire and neuron alpha as well,
both clamped to 0.95. Mean contrast against the page over the figure's half of
the viewport went **23.3 to 32.5** on light, against 29.3 on dark.

**A held formation is pinned exactly on its targets, which reads as a diagram.**
`FORM_FLOAT` orbits each cell 5.5px around its target, scaled by `formAmount`
so it fades in with the figure. It reuses `pulsePhase` at two different
multiples — already seeded per neuron and already advanced with `dt` — rather
than adding a field or a second clock. The wires follow the cells, so the whole
figure breathes.

One trap when measuring any of this: a slow run trips the adaptive degradation
(`SLOW_FRAME_MS` 28), which sheds halos, trails and bubbles and roughly halves
the lit pixels. That looked exactly like a down/up formation mismatch
(15951-16500 down against 7968-8037 up) and was machine contention — every
stage was slow in that run, including ones that draw no graph. Re-measure
before believing it.

**The head graph came from a different kind of source, and needed thinning
rather than thickening.** `Wireframe-Head.svg` is real line geometry — polygons,
polylines and lines — so extraction was only welding coincident endpoints: 89
nodes, 206 edges, one connected component. What it needed was a COARSE level for
the mobile budget, and the obvious way to make one is wrong. Collapsing the
shortest edge first is how you thin any mesh, and on a face it destroys the only
thing that makes it a face: its identity IS its short edges — eye rings,
nostrils, lips — so those go first and leave a blob with dangling spikes.
Ranking collapses by a 2D quadric instead (how far does the local line work move
if these two merge?) is cheap along a straight run and expensive at a corner, so
flat cranium and cheek panels thin out and features hold. Even then a face needs
its full 89 nodes; the 34-node level is a head, not a face, and exists only
because a phone cannot fill more.

**`NEURON_COUNT` is 200 because of that 89.** At 150 a bio stage had ~75 cells,
which cannot fill the head's junctions. The cost is not where you would guess:

| stage | 150 | 200 | 240 |
| --- | --- | --- | --- |
| 0 — drifting | 16.6ms | 16.5ms | 17.6ms, worst 53.4 |
| 1 — brain graph | 17.2ms | 17.1ms | 17.2ms |

The formations are nearly free at any count, because each supplies its own fixed
edge list. The binding stage is **0**, the drifting one, where wiring is O(n²)
over every pair — so 200 is the ceiling and 240 is where it starts to spike.
`MAX_SIGNALS` moved 45 → 60 with it. The extra budget also lifts the brain from
its 30-node level to its 97-node one on its own, which is the point of keeping
the levels rather than one fixed graph.

**Cell size is per figure, not global.** The head's median edge is 9.2 units
against the brain's 16.8, so at the brain's 0.85 the somata overlap their own
wires and the face turns to mush; the head uses 0.38. Likewise the head cannot
borrow `HEAD_FIT_H` 0.9 from the drawn head figure: that one is allowed to run
off the bottom because the rim fade dissolves the neck, and a graph has no fade,
so a chin at the viewport edge just looks cut off. 0.78 leaves ~75px top and
bottom at 900.

**Sizing is the one place it fights the layout.** The graph is landscape
(100 × 77) where the head figures are tall and narrow, so `BRAIN_FIT_W` binds
where `HEAD_FIT_H` does for the head. Its ceiling is not the viewport but the
centre line, where the panel's edge sits. The lane offset alone parks the figure
at `LANE_FRACTION` from centre, which is *not* the middle of the half it has to
fill, so `getShapePoints` adds `dx = -(0.25 - LANE_FRACTION) * W` to centre it
there — and that is what lets `BRAIN_FIT_W` reach 0.46 instead of the ~0.40 the
lane alone would allow. At 1440 the figure is 672 × 554 with about 29px either
side.

**The SVG is a front view, so there is no profile to extract.** Both stages
draw the same figure. A real side view needs a side-view wireframe SVG of the
same kind — depth cannot be recovered from a front projection, and every
attempt to lay a profile out by hand from the front head's landmarks produced
something worse than the mesh it was derived from.

### The background wash

`#bg-wash` is a fixed radial vignette behind the canvas, on the landing route
only. Four things about it are load-bearing:

- **Fixed to the VIEWPORT, not the document.** The landing page is ~6300px
  tall, so a gradient on `<body>` is a 6300px ramp: invisible within any one
  screen while quietly making the top and bottom of the page different colours,
  which is exactly the premise ("each stage is one screen") the scroll system
  is built on.
- **It sits at `z-index: -1`.** The canvas clears with `clearRect` and is fully
  transparent, so anything behind it shows through; `body` is static and opens
  no stacking context, so -1 lands the wash behind `#neural-bg`'s 0 and
  `.landing`'s 1 and still in front of the root background.
- **What stops the wash competing with the mesh is FREQUENCY, not amplitude.**
  This was got wrong first, with a self-imposed 4% ceiling reasoned from the
  mesh's own 11-13% mean contrast. At that ceiling — light 2.8%, dark 3.5% —
  the wash measured real (a 240.4..247.6 ramp on light) and was **invisible**:
  seven levels out of 255, spread smoothly across 1440px, with no edge anywhere
  for the eye to catch. Amplitude was the wrong axis. The wash is one smooth
  ramp across the whole screen and the mesh is thousands of 1px lines, and that
  separation is what keeps them apart. It now runs **light 22.6/255 (8.9%),
  dark 26.1/255 (10.2%)** — three times the old ceiling — and the mesh's own
  contrast is unchanged at 1.20 against 1.14 (light) and 2.14 against 2.33
  (dark), measured by diffing each frame against the same frame with the canvas
  hidden, which isolates the mesh exactly.

  The lesson generalises: "the gradient renders" and "the gradient is visible"
  are different claims, and only the first one was checked.
- **Light vignettes, dark does the opposite.** Light sinks toward the edges,
  dark lifts toward the middle, so `--wash-core` / `--wash-rim` swap roles
  between the themes and the geometry stays one gradient.

Two things that measured wrong before they measured right:

- **The ending shape has to land near the corners.** At `125% 95%` the
  ellipse's horizontal radius was 1800px against the 720px to the viewport
  edge, so the screen only ever saw the first 40% of the ramp and the whole
  thing came out at 1.1%. `78% 68%`.
- **Aliasing `--color-bg-tertiary` as the rim is not enough on light** — it is
  6/255 from `--color-bg-secondary`, and at any sane opacity that is invisible.
  The wash colours are literals in the theme blocks, which is where every other
  theme colour lives; that is the rule, not an exception to it.

Banding was the risk worth checking and did not materialise, even at the deeper
setting: scanned across 1440px the wash resolves to 14-15 distinct levels with
**no step larger than one level** and a top-decile run of 1px, i.e. the
compositor dithers it. The longest flat runs (28px light, 36px dark) are the
genuinely constant centre. Re-run `banding.js` if the stops move again — a
deeper ramp is the case that would show it.

The route gate follows the `.has-toc` pattern — `document.body.classList.add`
in `renderLandingPage`, removed by `Cleanup` — so it survives leaving and
returning. The feed, post and docs routes are reading surfaces and a gradient
behind body text is noise, so they do not get it.

### The ghost field, and why a figure stage looked empty

**The departing kind RECEDES; it does not leave.** `PHASE_STOPS` used to send it
to `{ ai: 0 }` and an exit lane, so 45% of the cells vanished outright and the
remaining 55% collapsed into the figure — a figure stage had nothing at all
outside the figure's own bounding box. Measured as lit pixels (>4/255 against
the page) over the mesh's half of a 1440×900 viewport:

| stage | before | after |
| --- | --- | --- |
| 0 / 2 / 4 — drifting | 17–19% lit, 29–33 contrast | unchanged |
| 1 — brain | 14.0% / 24.1 | **16.3% / 27.7** |
| 3 — network | 11.2% / 14.3 | **20.0% / 27.5** |
| 5 — head | 6.7% / 11.5 | **10.0% / 16.3** |

`GHOST` is 0.45, and the value is load-bearing in three directions at once.
It must stay **above `PRESENCE_CONNECT_MIN` (0.25)** so the
ghosts still wire into a field rather than scatter as loose dots; **below
`PRESENCE_CROSS_MIN` (0.55)** so the bio↔ai bridge still breaks, which is what
makes a split read as a split; and **below 0.5**, which is the threshold both
`assignFormationTargets` and signal spawning test, so ghosts never take
formation slots and never fire.

Two things that were not obvious:

- **The ghost keeps its lane at 0.** Pushed even a third of a lane width it
  bunches on the figure's side and leaves the corners as bare as before. It
  recedes in *depth* — alpha — not sideways.
- **`updatePhase` fades slotless neurons, and that has to be restricted to the
  forming kind.** The receding half has no formation slots by definition, so
  the original `if (t.form > 0 && n.formIdx < 0) tp *= 1 - t.form` took the
  ghost field to zero and emptied the screen exactly as before. `figureKind`
  answers which half a figure is made of (`SHAPES` carries it for the drawn
  figures; the graph figures and the network needed it adding).
- **The structured branch of `buildConnections` returns early**, so the ghosts
  need a proximity pass of their own or they have no wires at all. It is
  restricted to slotless, same-kind pairs with a degree cap, which is ~4k pairs
  against 20k for the full mesh and cannot throw a wire across the figure.

**A figure is drawn heavier than ambient texture, and width matters as much as
alpha.** `WIRE_WIDTH_FORM` (1.3 against `WIRE_WIDTH_BASE` 0.7) is most of the
gain: a 0.7px line antialiases to a grey smear at any opacity, so raising alpha
alone barely moved the measurements. `FORM_GLOW` (1.4) rides on the existing
per-point `g` → `formGlow` channel, so it fades in with `formAmount` and needs
no new state. The head graph's cell scale went 0.38 → 0.48 with it — 0.38 was
set when the wires were thin, and against the new width the cells disappeared
into their own wiring.

**`BRAIN_FIT_W` is the skeleton's width, not the drawn width.** At 0.46 the
brain measured touching x = 0: the ~29px of clearance either side at 1440 is
exactly what `FORM_FLOAT`'s orbit plus the soma radius then spend. 0.44.

### The network band (stage 3)

Sized into half a viewport the network came out **546 wide by 642 tall —
portrait**, which forces every layer's fan-out to overlap the next and reads as
a scribble rather than as layers. It measured the weakest stage of the seven,
11.2% lit at 14.3 mean contrast. It is now a **full-bleed horizontal band**
(`NET_FIT_W` 0.96) with the copy underneath it, so nothing covers the input
layers and the left-to-right flow reads end to end.

- **The panel is bottom-anchored and `NET_CENTER_Y` (0.33) centres the band in
  what is left above it** — not in the viewport. The two numbers are one
  control between them; move the panel's height and the band wants moving too.
- **Density has a ceiling that node count reaches long before edge count
  does.** Edges are the product across each consecutive pair of layers, so
  `[6,10,13,13,10,6]` is 58 nodes but **549 wires**, and across a 270px band
  every fan-out overlapped the next into a solid moiré ribbon. `[5,9,11,9,5]`
  is 39 nodes. Two levels, picked by the ai budget the way the graph figures
  pick theirs.
- **It is not all-to-all.** `NET_FANOUT` (4) wires each node to the nodes
  nearest its own height in the next layer. Fully connected, stage 3 measured
  **18.6% of the viewport lit at mean alpha 26.8** against 4.2-12.5% and
  5.3-7.9 for every other stage — **3.4x the ink of the next heaviest**, which
  is what "heavy" means when someone says a section is. It also destroyed what
  it was meant to show: no layer is legible inside the crossing.
- **Every layer's vertical extent scales with its node count**, so the net
  bulges through the middle. Not decoration: at equal extents all five columns
  share a top, a bottom and — every count being odd — a centre node at exactly
  the same y, and the banded fan then draws three dead-straight rails right
  across the viewport.
- **Per-shape wire weight, because `g` could not do it.** Wire alpha was
  already at its 0.95 clamp, so scaling underneath the clamp moved the band's
  mean ink by 4% where cutting the base moved it by a third. `wireAlpha` (0.55)
  and `wireWidth` (0.8) multiply `WIRE_ALPHA_FORM` / `WIRE_WIDTH_FORM` before
  the clamp, eased in with `formAmount` like the rest of the shape's weather.
  The band covers the whole viewport in lines where the graph figures occupy a
  corner of it, so it earns less weight per line, not more.
- **The ghost is bio here, and bio is busier.** A bio cell is a starburst with
  dendrites and a glow where an ai cell is a plain circle, so the same `GHOST`
  reads markedly heavier on stage 3 than the ai ghosts do on stages 1 and 5.
  Stop 3 carries its own, 0.34.

Together those took stage 3 from **18.6% lit / 26.8 mean to 10.4% / 9.9** — in
the same band as the drifting stages (12.1% / 7.6) rather than three times
them. Frame cost was never the issue: every stage measured 16.7ms median
throughout, before and after.
- **`NET_FORM_SCALE` is 0.8**, not `FORM_SCALE` 0.3 — the nodes *are* the
  layers here, and at 0.3 the band is wires joining nothing.

**Signals ran backwards half the time, and the direction was already in the
data.** `formEdges` is authored layer *c* → layer *c+1* and `buildConnections`
preserves that order into `conn.i/j`, but the spawn site chose with
`Math.random() < 0.5` — a coin flip per signal — so half the network's signals
travelled against it. A shape can now declare `directed`, and only then is the
flip skipped: proximity wiring has no direction to respect, and the brain and
head graphs' edge order is just extraction order, so giving them a flow would
be inventing one. Measured over 40 samples per stage: stage 3 is **100.0%
left-to-right**, stage 0 stays 47.8 / 50.8 as it should.

**Signal weather is per shape**, faded in with `formAmount`: `sigSpeed` 2.6,
`sigSpawn` 9, `sigMax` 1.7 on the band alone. Raising `SIGNAL_SPEED` and
`SIGNAL_SPAWN_RATE` globally would change stage 0's character and its cost —
the drifting stages are the expensive ones. Live signals in the band went 2–8
to ~35, and all four stages still measure 60fps median.

Load-bearing details:

- **The shell is baked, not stroked.** Glow, rim and wireframe come to ~2300
  line segments and are identical every frame — same geometry, same fade, only
  the overall alpha moves. Stroking them live costs about 9fps, so
  `figureShell` renders them once per (fitted scale, dpr) into an offscreen
  canvas and the frame blits that under `globalAlpha`. Two things there are
  easy to get wrong: the pad must be in **authoring units** (`lineWidth / k`),
  or the buffer comes out k times larger than it needs to be; and the buffer is
  sized at `k * dpr` so the blit lands 1:1 on device pixels instead of being
  resampled.
- **The wireframe must sit well under the rim.** At equal weight the triangles
  win and the head stops having an edge. `HEAD_MESH_ALPHA` is a third of
  `HEAD_LINE_ALPHA` and the mesh is stroked at just over half its width.
- **Round joins are per-vertex geometry.** The mesh has a few thousand of them;
  `miter`/`butt` for that pass is worth several fps and is invisible at this
  line weight. The rim keeps round joins — there it shows.
- **`HEAD_RIM_FADE_START` is a neck control.** The figure is cropped under the
  chin, so the last stretch of the box *is* the neck, and the rim fade is what
  dissolves the cut edge. Set it low — it was 0.6, left over from when the head
  was a filled mass whose outline had to give out first — and the fade eats the
  jaw and chin.
- **Don't re-proportion the head to match the reference images.** Their
  craniums are enlarged to make room for the brain graphic; in the side
  reference the brow sits at 61% of head height against ~42% on a real skull.
- **Formations supply their own edges.** Without them the gathered neurons sit
  inside each other's `CONNECTION_DIST` and proximity wiring throws long wires
  across the figure. `formEdges` replaces distance-based wiring entirely while
  a shape is held.
- **Fold dust must outshine area dust.** Seeded points are tagged `fold` and
  drawn larger and brighter. Without that contrast the region is one
  undifferentiated cloud — the folds are what make it read as tissue.
- **Geometry is built once, in authoring space.** `figureCache` is *not*
  cleared on resize — only `shapeCache` is. A resize changes `figureTransform`,
  never the point layout, so the tissue does not reshuffle mid-drag.
- **`figureTransform` is the single source of placement**, which is what keeps
  the drawn shell and the neurons inside it from separating. It fits the figure
  into `HEAD_FIT_W` × `HEAD_FIT_H` and applies the vertical shift, so anything
  positional belongs *in it* rather than in a draw call — the shell and the
  formation targets both subtract its `cy`, and only one of them would move if
  the shift lived anywhere else.
- **The figure is tall and narrow** — its box is 0.65 wide per unit high — so
  `HEAD_FIT_H` binds and `HEAD_FIT_W` never does on a desktop viewport. Filling
  the half it is given means filling the viewport's *height*.
- **Centred on `H/2`, a full-height figure puts its crown under the navbar.**
  `HEAD_CENTER_Y` centres it low instead, and `HEAD_TOP_PX` is a hard floor for
  the crown that catches short landscape viewports, where the offset alone is
  not enough. The neck is the end allowed to run past the bottom edge: it is
  inside the rim fade by then, so it dissolves rather than being cut.
- **The network at stage 3 is sized separately** (`buildNetworkShape`) and has
  to be kept in step by hand. It shares the same half-viewport slot as the head
  figures, and left at its old caps it read as a small diagram parked beside two
  large ones.
- **Neurons with no slot fade out** (`formIdx < 0`), otherwise they drift
  across the figure and blur it.

Formation does not morph one figure into the next: it falls to zero
mid-transition so the mesh scatters and re-gathers, which is what the rupture
tears apart.

The contract between the two files is one function:

```js
window.NeuralBG.setPhase(p)   // p = 0..6, continuous (PHASE_STOPS.length-1)
window.NeuralBG.reset()       // back to phase 0 (called on route change)
```

`setupLandingScroll()` maps scroll offset to `p` using a mid-viewport
reference line, coalesced into a single `requestAnimationFrame`. **Don't add a
second rAF loop** — the canvas already runs one with adaptive degradation, and
a competing loop trips it on mobile. Everything else (reveals, the topic
ticker) is CSS-only for the same reason.

### Section settling

Stages align to the middle of the screen once scrolling has **stopped**, in
`setupLandingScroll` — not with `scroll-snap-type`.

CSS scroll snap was implemented first and had to be taken out. It re-snaps on
every discrete wheel event, and a mouse wheel sends exactly that: unphased,
one-off events with no gesture end for the browser to wait for. A trackpad
escapes this; a wheel does not. Measured on this page with 1800px of wheel
input delivered in 60px ticks:

| | ends at | backward travel |
| --- | --- | --- |
| snap off | 1856 | 0px |
| `mandatory` | 56 | 1649px |
| `proximity` | 56 | 1646px |

It never left the first stage. `scroll-behavior: auto` changed nothing, and
neither strictness helped — the pull is the snap itself. Big synthetic shoves
hide it completely, which is why the first round of testing missed it; test
with many small deltas.

The replacement is a debounced settle: 180ms after the last scroll event, ease
to the nearest rest position. Free scrolling measures identical to snapping off
(0px backward), and a gesture that ends near a stage centre still lands it
exactly at phase *i* + 0.500.

**How hard it is allowed to pull is the whole design.** The first version
reached for the nearest stop from any distance and got there with
`scrollTo({ behavior: 'smooth' })`, and that read as the page grabbing at you.
Two separate causes, both measured at 1440×900:

| | worst pull | peak speed |
| --- | --- | --- |
| nearest stop, `behavior: 'smooth'` | 272px | 105px/frame |
| bounded reach, eased over a scaled duration | 180px | 12px/frame |

- **Smooth scrolling picks its own duration**, so the peak speed climbs with
  the distance — exactly backwards from what feels calm. `glideTo` eases the
  scroll itself over `260ms + 0.8 × distance`, capped at 600. That rAF is
  transient and ends itself; it is not a second render loop.
- **The curve is a quintic smoothstep, not the obvious cosine.** Both start and
  end at zero *velocity*, but the cosine's *acceleration* jumps from nothing to
  `pi²d/2T²` the instant it starts, and the opening frames measured
  `2 2 6 5 6 7 10` px — a 3× jump on the third frame and a drop back on the
  fourth. `6t⁵ - 15t⁴ + 10t³` has zero first *and* second derivative at both
  ends and ramps `1 1 3 3 4 6 8` instead. It peaks 19% higher for the same
  duration, which the min/max are set against.
- **The glide drives `setPhase` itself.** Left to the scroll listener it costs
  a frame to schedule and another for the canvas to draw, so for the whole
  glide the mesh trails the page it belongs to. Doing it inline also removed
  the late frames: max gap 21.0ms and 3-of-24 frames over 20ms became 18.9ms
  and 0-of-27.
- **Integer scroll offsets are the floor.** At dpr 1 the document scrolls in
  whole pixels, so the first and last frames of any ease are 1px steps however
  the curve is shaped. Native smooth scrolling has the same floor; it is not
  worth chasing.
- **Every frame of that glide must scroll with `behavior: 'instant'`.** `html`
  carries `scroll-behavior: smooth`, so a bare `scrollTo(0, y)` hands each of
  our frames back to the browser's easing and the two compound — which is how
  the "eased" version first measured *worse* than the one it replaced, at
  125px/frame.
- **The reach is bounded, and it is not symmetric.** `SETTLE_REACH_FWD` (0.4 of
  the gap between stage centres) and `SETTLE_REACH_BACK` (0.2); past those the
  stop was deliberate and is left alone. Carrying someone the rest of the way
  they were already going reads as the gesture completing; pulling them back
  reads as the page taking the scroll away from them, so backward gets half the
  budget. The cost is that a stop stranded mid-stage stays there — that is the
  point, and it is what `proximity` snapping was reaching for.

Four things it also has to get right:

- **Centre, not top.** `phaseFromScroll` reads the stage under the mid-viewport
  line, so a centred stage rests at phase *i* + 0.5 — inside `PHASE_HOLD`,
  where the formation is fully held. Aligning to the top would rest every stage
  at 0.61, half-morphed into the next.
- **The end of the document is a rest position too.** Without it in the
  candidate list the last stage pulls back from the bottom and the footer is
  unreachable — measured resting at 5456 of 5704 with the footer off-screen.
- **Ignore the scroll events the glide itself fires**, or it reschedules
  forever. The `settling` flag covers the animation.
- **Any wheel, touch or key cancels a settle in flight**, in-flight rAF
  included, so it can never fight someone who has started scrolling again.

Disabled under `prefers-reduced-motion`, and it lives inside
`setupLandingScroll` so `Cleanup` removes it with the route — `html` is the
scroll container for every page, and the feed must not settle.

Two details in `neural-bg.js` that are easy to break:

- **`PHASE_EASE` decides whether the mesh arrives with the page or long after
  it.** It is an exponential ease, so it is 95% done after
  `ln(0.05)/ln(1 - e)` frames — at the old 0.055 that was 883ms, against a
  settle glide of 300-500ms, and the graphic was still visibly morphing most of
  a second after the page had come to rest. Measured as frame-to-frame change
  in the canvas decaying to the drift floor: **2049ms at 0.055, 1426ms at
  0.09.** It is also the one update in the file that used to ignore `dt`, so it
  ran at half speed on a 30fps device; `updatePhase` now compounds it over `dt`
  like every other update. Isolated at 4x CPU throttle, that alone is the
  difference between settling in 2367ms and not settling inside 2400ms at all.
  The `dt` cap of 3 in `animate` bounds this below 20fps.
- **`PHASE_HOLD`** keeps each stage in its own state for the first 55% of its
  scroll range, then morphs over the rest. Without it the mesh is permanently
  mid-transition and reads as aimless floating rather than deliberate splits.
- **Rupture.** Crossing a `RUPTURE_POINTS` value cuts every bio↔ai wire into
  recoiling stubs (`severed[]`), kicks each neuron toward its target lane, and
  clears in-flight signals. The impulse decays back to each neuron's stored
  `bvx/bvy/bvz` baseline drift — remove that restoration and neurons scatter
  permanently.

**`n.x/y/z` is physics; `n.wx/wy/wz` is what you see.** Drift and edge-wrapping
own the raw coordinates and nothing else may touch them. `updatePhase` folds in
the lane offset (`n.laneX`, applied at render time so wrapping stays intact)
and the formation pull, and writes the result to `n.wx/wy/wz`. **Everything
downstream reads those** — projection, connections, signals, trails, and the
floating number bubbles. Reading `n.x` instead is silent and invisible until a
stage offsets a lane or gathers a figure, at which point the thing you drew is
most of a screen away from the cell it belongs to; that is exactly how the
number bubbles ended up detached from their neurons.

**A signal outlives the wire it was fired down.** `connections` is rebuilt every
`CONN_RECALC_INTERVAL` frames — proximity pairs drift apart, and a formation
replaces proximity wiring wholesale with its own edge list — but a signal stores
neuron indices, so it keeps travelling between two cells with nothing drawn
under it. That reads as a dot shooting across open space rather than down a
wire. Measured over a full scroll of the landing page: **20% of live signals
were orphaned, and some frames were 100% of them.** It got worse when the
graph figures landed, because their edge lists are far sparser than proximity
wiring, so more pairs vanish the moment a formation takes hold.
`cullOrphanSignals` runs immediately after every rebuild, which is the only
moment a wire can disappear. Dropping is what rupture already does to every
signal at once, and it costs nothing visually: signal counts came out the same
or higher afterwards, because orphans were holding `MAX_SIGNALS` slots.

A neuron whose `presence` has eased to ~0 is skipped by the draw loop but still
receives signals, so anything spawned on arrival must check `presence` too, or
it appears in open space with nothing anywhere near it.

## Pagination

`renderFeedPage` uses numbered pagination (not infinite scroll). Page size
is `CONFIG.postsPerPage`. The current page comes from `Router.query.get('p')`.
Page changes call `history.replaceState` so the URL stays shareable but
no `hashchange` event fires (we render in place).

## Post manifest schema (`content/posts.json`)

Every post is an entry in `posts.json`. Fields:

```jsonc
{
  "slug":        "kebab-case-id",        // required, unique
  "title":       "Display title",         // required
  "description": "Short blurb",           // shown on feed cards
  "date":        "YYYY-MM-DD",            // sort key (newest first)
  "category":    "data-science",          // single category
  "tags":        ["python", "tutorial"], // any number
  "image":       "uploads/images/x.png",  // optional cover image
  "type":        "article|pdf|repo|doc",  // controls rendering
  "kind":        "project|blog",          // controls which top-nav tab it appears in
  "file":        "slug.md",               // markdown file (for article/pdf/doc)
  "draft":       false,                   // hide from feed if true
  "featured":    false,                   // pin to top of feed
  "collection":  "intro-to-ml",           // groups related posts (optional)
  "order":       1,                       // sort order *within* a collection
  "pdf":         "uploads/pdfs/x.pdf",    // for type=pdf
  "repo":        "https://github.com/u/r",// for type=repo (fetches README)
  "media":       { "type": "youtube",     // optional inline media
                   "url": "https://..." }
}
```

### `type` vs `kind`

- `type` controls the **renderer**: how the post body is fetched and shown
  (article = markdown file, pdf = carousel viewer, repo = fetch README,
  doc = markdown in docs sidebar layout).
- `kind` controls the **navigation tab**: `"project"` posts appear under
  the Projects tab (the home `/`), `"blog"` posts appear under `/blog`.
  Defaults: explicit `kind` wins; otherwise `type === "repo"` is treated
  as `project`, everything else as `blog`. Docs (`type === "doc"`) ignore
  `kind` and live under `/docs`.

**`postKind` has no case for docs**, and that is a trap: a doc carries no
`kind` and is not a repo, so it falls through to `'blog'` and the two docs
pages showed up on `/blog` as untyped, unbadged rows. `renderFeedPage`'s
`kindMatch` now drops `type === 'doc'` before any other test, for every feed
rather than only the unfiltered one.

**A `type: "pdf"` post may point at a single image.** `pdf:` taking a `.png`
(or jpg/gif/webp/avif/svg) gets the same slot in the feed and the same
`#/pdf/:slug` route — it is simply one page instead of many, and the feed badge
reads IMAGE rather than PDF. pdf.js rejects a non-PDF outright, so both render
sites (`initInlinePdfs` and `renderPdfPage`) branch on `isImageMedia()` *before*
they load the library. It is an extension test, not a regex — see the note in
js/app.js.

When you edit the manifest manually, keep it sorted by date (descending) —
the admin UI sorts on read but human edits should match.

## Markdown rendering pipeline

Centralised in `configureMarked(options)` in `js/app.js`. It returns a
`marked.Renderer` and side-effects `marked.setOptions`. Every page that
parses markdown (post view, editor preview, repo README, doc page) calls
`configureMarked` with the same shape. The pipeline supports:

- **GFM** (tables, strikethrough, task lists) via `marked.setOptions({gfm:true})`.
- **Code highlighting** via `highlight.js` (lazy-loaded).
- **Mermaid diagrams** in ` ```mermaid ` fences (lazy-loaded).
- **LaTeX/KaTeX** for `$inline$` and `$$display$$` math (lazy-loaded).
- **YouTube auto-embed** for bare YouTube URLs on their own line.
- **Heading anchors** with deep-link support (`#/post/slug#heading-id`).
- **Auto table-of-contents** for posts with > 2 headings.

Adding a new markdown feature: extend `configureMarked` (renderer hooks) and,
if it needs a DOM pass after parse, add a helper like `renderMermaidBlocks`
and call it from each consumer. **Don't** sprinkle marked customisation
across pages.

## Repo README fetcher

`ContentService.getRepoReadme(url)` supports:

- GitHub: `https://github.com/{owner}/{repo}` → `/repos/{o}/{r}/readme`.
- HuggingFace models/datasets/spaces: `https://huggingface.co[/datasets|/spaces]/{owner}/{name}`.
- GitLab: `https://gitlab.com/{owner}/{repo}` → public raw README.

Relative image paths in the README (e.g. `![](docs/img.png)`) are rewritten
to absolute raw URLs (`raw.githubusercontent.com/...` or HF equivalent)
before passing to `marked`. If you add another host, mirror this pattern:
fetch raw markdown → rewrite relatives → cache → return.

## Admin editor & uploads

- Auth = GitHub PAT in `localStorage` under key `gh_token`. The editor
  validates the token against the repo on login (401/404 → reject).
- `GitHubAPI.putFile` uses `b64EncodeUtf8` (TextEncoder-based) — never
  `unescape(encodeURIComponent(...))`, that's deprecated and breaks on
  large strings.
- Binary uploads (`uploadBinary`) chunk-read with `FileReader.readAsDataURL`
  and POST with the JSON body GitHub expects. There is a hard limit of
  **100 MB per file** at the GitHub API; the editor warns at 25 MB.
- Rate limit (403 with `X-RateLimit-Remaining: 0`) is surfaced to the user
  with a wait-time toast — never silently retry forever.

## Neural background

`js/neural-bg.js` is self-contained. Tunables at the top in `CFG`. Notable
properties:

- 3D positions, projected each frame (`PERSPECTIVE`, `DEPTH_RANGE`).
- Two neuron kinds: `ai` (sharp circles, blue) and `bio` (gradient blobs
  with dendrite stubs, purple).
- Connections rebuilt every `CONN_RECALC_INTERVAL` frames (cheap O(n²)).
- Signals travel along connections at `SIGNAL_SPEED`; bridge signals
  (AI ↔ bio) cascade once into a same-kind neighbour.
- Pauses on `visibilitychange` to spare battery.

If you boost particle count, also boost `MAX_SIGNALS` proportionally and
re-test on a mid-tier phone.

## Theming

CSS variables are split into two layers in `css/style.css`:

- A theme-independent `:root` block holds typography, radii, shadows, transitions.
- Theme color blocks live under `:root, [data-theme="light"]` and
  `[data-theme="dark"]`. A `prefers-color-scheme: dark` media query mirrors
  the dark block for users who haven't explicitly chosen a theme.

The early inline script in `index.html` reads `localStorage.theme` and sets
`data-theme` on `<html>` *before* paint to avoid theme flash. The toggle
button cycles `system → light → dark → light → dark…`. **Never hard-code
backgrounds or text colors in CSS** — always use the variables.

## SEO and per-page metadata

`Head` (in `js/app.js`) updates `<title>`, `<meta name="description">`, all
OpenGraph and Twitter Card tags, the `<link rel="canonical">`, and a
`<script type="application/ld+json">` blob on every route change. Each
route renderer that should differ from the default calls `Head.set(...)`;
post pages also call `Head.setJsonLd(...)` with a `BlogPosting` schema.

`tools/build-content-files.js` reads `content/posts.json` and writes
`sitemap.xml` and `feed.xml` (Atom 1.0). Run it after editing posts:

```
node tools/build-content-files.js
```

## Accessibility

- Skip link (`.skip-link`) lives outside the navbar so keyboard/SR users
  can jump straight to `<main id="app">`.
- The neural canvas has `aria-hidden="true"` and respects
  `prefers-reduced-motion: reduce` (no drift, no signal updates,
  ~30fps render).
- A global `prefers-reduced-motion` media query in CSS also
  disables transitions and animations site-wide.

## Pure helpers (`js/lib/pure.js`)

A small UMD module holding side-effect-free utilities:
`slugify`, `extractYouTubeId`, `parseRepoUrl`, `rewriteRelativeAssetPaths`,
`parseFrontmatter`, `extractMath`, `filterPosts`. Loaded as a global
`window.Pure` in the browser and as a CommonJS module in tests. **Add new
pure helpers here** so they're testable in Node without jsdom.

## Tests & CI

- `tests/unit/` — Vitest. Pure-function coverage of `Utils`, frontmatter
  parser, search filter, repo-URL parser, image-path rewriter.
- `tests/e2e/` — Playwright (Chromium only by default). Smokes: feed
  loads, navigation works, post page renders markdown, mermaid renders,
  KaTeX renders, neural canvas mounts.
- `package.json` carries dev-only deps. `npm test` runs unit; `npm run e2e`
  runs Playwright; `npm run check` runs both.
- CI: `.github/workflows/ci.yml` runs both on push & PR. Caches `~/.npm`.
- **Do not** add runtime npm deps. The site must remain a zero-build static
  bundle.

## Common tasks

- **Add a post manually**: drop `slug.md` in `content/posts/`, append entry
  to `content/posts.json`, commit. The frontmatter on the markdown file is
  optional — fields in `posts.json` win.
- **Add a doc page**: same as a post but with `"type": "doc"` and a
  `collection` to control sidebar grouping.
- **Pin a featured post**: set `"featured": true`. The feed shows up to
  three featured items in a "Featured" row at the top.
- **Add a tutorial collection**: give related posts the same `collection`
  slug and an `order` integer. They'll render as a series at
  `#/collection/<slug>`.
- **Run locally**: any static server. `python3 -m http.server 8000` or
  `npx serve` from the repo root. The hash router needs no rewrite rules.

## Don'ts

- Don't introduce a build step, framework, or runtime npm dep.
- Don't commit the GitHub PAT or anything that looks like one.
- Don't bypass `configureMarked` — every markdown render goes through it.
- Don't push to `main` from a Claude session. Push to the working branch.
- Don't write CLAUDE.md, large docs, or large refactors in a single tool
  call. Always Write a skeleton, then Edit/append. (See principle #1.)
