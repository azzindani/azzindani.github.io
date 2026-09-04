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

`#/` renders `renderLandingPage` (in `js/app.js`). It is seven full-height
stages, and **scroll position drives the shared background canvas** through a
matching sequence of phases:

| Stage | Mesh state                          | Content     |
| ----- | ----------------------------------- | ----------- |
| 0     | full mesh, drifting                 | hero, title |
| 1     | bio only, forms **head + brain, profile** | panel right |
| 2     | recombined, drifting                | full width  |
| 3     | ai only, forms a **network**        | panel left  |
| 4     | recombined, drifting                | full width  |
| 5     | bio only, forms **head + brain, front**   | panel right |
| 6     | recombined, drifting                | full width  |

### Formations

`PHASE_STOPS` entries carry a `shape` name. Organic shapes (`SHAPES`) are SVG
paths authored in a 0–100 box and sampled at runtime via
`SVGPathElement.getPointAtLength` — no build step, no data files. The
structured network is generated from `NETWORK_LAYERS`.

Adding a formation = add a `SHAPES` entry (or a generator) plus a
`PHASE_STOPS` row and a matching `.lp-stage` section. Four things are load-
bearing:

- **Sample count must equal the member count.** Contour edges join
  *consecutive sample points*, so an unoccupied point breaks the outline into
  fragments. `getShapePoints(name, count)` caches per shape *and* count.
- **Formations supply their own edges.** Without them the gathered neurons sit
  inside each other's `CONNECTION_DIST` and proximity wiring fills the figure
  with a web that hides the very outline being drawn. `formEdges` replaces
  distance-based wiring entirely while a shape is held.
- **`weights` allocates the point budget**, not path length alone. A long
  smooth cranium arc needs far fewer points than a short stretch carrying
  brow, nose and chin.
- **Neurons with no slot fade out** (`formIdx < 0`), otherwise they drift
  across the figure and blur it.
- **`glow` holds the head dim and the brain bright.** The head composites are
  a mask over live tissue, and that contrast is the whole read — a uniformly
  lit outline just looks like a wire head. Values are per-path multipliers on
  neuron and wire alpha, applied only in proportion to `formAmount`.

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

Two details in `neural-bg.js` that are easy to break:

- **`PHASE_HOLD`** keeps each stage in its own state for the first 55% of its
  scroll range, then morphs over the rest. Without it the mesh is permanently
  mid-transition and reads as aimless floating rather than deliberate splits.
- **Rupture.** Crossing a `RUPTURE_POINTS` value cuts every bio↔ai wire into
  recoiling stubs (`severed[]`), kicks each neuron toward its target lane, and
  clears in-flight signals. The impulse decays back to each neuron's stored
  `bvx/bvy/bvz` baseline drift — remove that restoration and neurons scatter
  permanently.

Lane offsets are applied as a render-time `n.laneX`, never by mutating `n.x`,
so drift and edge-wrapping stay untouched. Anything projecting a neuron's x
must use `n.x + n.laneX` (signals and their trails included).

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
