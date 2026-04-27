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

Hash-based router in `js/app.js` (search for `Router.add`). Routes:

| Hash                       | Page                                             |
| -------------------------- | ------------------------------------------------ |
| `#/`                       | Feed (filterable list of posts).                 |
| `#/post/:slug`             | Single post view (markdown rendered).            |
| `#/pdf/:slug`              | Full-page PDF viewer.                            |
| `#/collection/:slug`       | Posts grouped by `collection` field.             |
| `#/collections`            | Index of all collections.                        |
| `#/docs`                   | Docs landing (sidebar + first doc).              |
| `#/docs/:slug`             | Specific doc page.                               |
| `#/admin`                  | Admin dashboard (PAT-gated).                     |
| `#/admin/new`              | New-post editor.                                 |
| `#/admin/edit/:slug`       | Edit existing post.                              |
| `#/admin/upload`           | File upload UI for images & PDFs.                |

Adding a new route: register it in the `Router.add` block at the bottom of
`app.js` and write a `renderXxxPage` function next to its peers.

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
