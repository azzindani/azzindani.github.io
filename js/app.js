/* ============================================
   Phase 1: Configuration, Utilities & Router
   ============================================ */

const CONFIG = {
    siteName: 'Portfolio',
    siteDescription: 'A personal space for sharing projects, ideas, and explorations.',
    author: 'Azzindani',
    authorInitial: 'A',
    github: { username: 'azzindani', repo: 'azzindani.github.io', branch: 'main' },
    social: {
        github: 'https://github.com/azzindani',
        linkedin: 'https://linkedin.com/in/azzindani',
        email: 'user@example.com'
    },
    postsPerPage: 9,
    contentPath: 'content',
    uploadsPath: 'uploads'
};

// ── Utilities ──

const Utils = {
    formatDate(d) {
        if (!d) return '';
        return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },
    slugify(t) {
        return t.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-');
    },
    debounce(fn, ms) {
        let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    },
    escapeHtml(s) {
        const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
    },
    readingTime(text) {
        return `${Math.max(1, Math.ceil((text || '').trim().split(/\s+/).length / 200))} min read`;
    },
    parseFrontmatter(content) {
        const m = content.match(/^---\n([\s\S]*?)\n---/);
        if (!m) return { meta: {}, body: content };
        const meta = {};
        m[1].split('\n').forEach(line => {
            const i = line.indexOf(':');
            if (i === -1) return;
            const key = line.slice(0, i).trim();
            let val = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
            if (val.startsWith('[') && val.endsWith(']'))
                val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
            if (val === 'true') val = true;
            if (val === 'false') val = false;
            meta[key] = val;
        });
        return { meta, body: content.slice(m[0].length).trim() };
    },
    extractYouTubeId(url) {
        const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return m ? m[1] : null;
    }
};

// Repo URL helpers live in js/lib/pure.js (window.Pure). They're loaded
// by index.html before this script. Aliases for readability:
const parseRepoUrl = Pure.parseRepoUrl;
const rewriteRelativeAssetPaths = Pure.rewriteRelativeAssetPaths;

// ── Lazy library loader ──

const LibLoader = {
    _hljs: null,
    _pdfjs: null,

    loadHighlightJs() {
        if (this._hljs) return this._hljs;
        this._hljs = new Promise((resolve, reject) => {
            if (window.hljs) { resolve(window.hljs); return; }
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
            s.onload = () => resolve(window.hljs);
            s.onerror = reject;
            document.head.appendChild(s);
        });
        return this._hljs;
    },

    loadPdfJs() {
        if (this._pdfjs) return this._pdfjs;
        this._pdfjs = new Promise((resolve, reject) => {
            if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            s.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve(window.pdfjsLib);
            };
            s.onerror = reject;
            document.head.appendChild(s);
        });
        return this._pdfjs;
    },

    _mermaid: null,
    loadMermaid() {
        if (this._mermaid) return this._mermaid;
        this._mermaid = new Promise((resolve, reject) => {
            if (window.mermaid) { resolve(window.mermaid); return; }
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
            s.onload = () => {
                window.mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
                resolve(window.mermaid);
            };
            s.onerror = reject;
            document.head.appendChild(s);
        });
        return this._mermaid;
    },

    _purify: null,
    loadPurify() {
        if (this._purify) return this._purify;
        this._purify = new Promise((resolve, reject) => {
            if (window.DOMPurify) { resolve(window.DOMPurify); return; }
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js';
            s.onload = () => resolve(window.DOMPurify);
            s.onerror = reject;
            document.head.appendChild(s);
        });
        return this._purify;
    },

    _katex: null,
    loadKatex() {
        if (this._katex) return this._katex;
        this._katex = new Promise((resolve, reject) => {
            if (window.katex) { resolve(window.katex); return; }
            // CSS first
            if (!document.querySelector('link[data-katex]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
                link.setAttribute('data-katex', '1');
                document.head.appendChild(link);
            }
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js';
            s.onload = () => resolve(window.katex);
            s.onerror = reject;
            document.head.appendChild(s);
        });
        return this._katex;
    }
};

// ── Toast notifications ──

function showToast(message, type = 'info') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = message;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('toast-exit'); setTimeout(() => t.remove(), 300); }, 3000);
}

// ── Cleanup registry (for observers, listeners) ──

const Cleanup = {
    _fns: [],
    add(fn) { this._fns.push(fn); },
    run() { this._fns.forEach(fn => fn()); this._fns = []; }
};

// ── Head: per-route document title, description, OG/Twitter, JSON-LD ──
//
// Updates the tags that already exist in index.html and (optionally) injects
// a JSON-LD <script type="application/ld+json"> for posts so search engines
// understand them as articles.

const SITE_ORIGIN = (typeof window !== 'undefined' && window.location && window.location.origin)
    ? window.location.origin
    : '';

const Head = {
    _setMeta(selector, attr, value) {
        const el = document.querySelector(selector);
        if (el) el.setAttribute(attr, value);
    },
    set({ title, description, image, url, type = 'website', publishedDate }) {
        const fullTitle = title ? `${title} — ${CONFIG.siteName}` : CONFIG.siteName;
        document.title = fullTitle;
        const desc = description || CONFIG.siteDescription;
        const canonical = url || (SITE_ORIGIN + window.location.pathname + window.location.hash);

        this._setMeta('meta[name="description"]', 'content', desc);
        this._setMeta('meta[property="og:title"]', 'content', fullTitle);
        this._setMeta('meta[property="og:description"]', 'content', desc);
        this._setMeta('meta[property="og:type"]', 'content', type);
        this._setMeta('meta[name="twitter:title"]', 'content', fullTitle);
        this._setMeta('meta[name="twitter:description"]', 'content', desc);
        this._setMeta('link[rel="canonical"]', 'href', canonical);

        // og:url & og:image are added/removed dynamically.
        const setOrCreate = (selector, attr, value) => {
            let el = document.querySelector(selector);
            if (!value) { if (el) el.remove(); return; }
            if (!el) {
                el = document.createElement('meta');
                if (selector.includes('property')) {
                    el.setAttribute('property', selector.match(/property="([^"]+)"/)[1]);
                } else {
                    el.setAttribute('name', selector.match(/name="([^"]+)"/)[1]);
                }
                document.head.appendChild(el);
            }
            el.setAttribute(attr, value);
        };
        setOrCreate('meta[property="og:url"]', 'content', canonical);
        setOrCreate('meta[property="og:image"]', 'content', image || '');
        setOrCreate('meta[name="twitter:image"]', 'content', image || '');

        // Article-specific OG fields
        setOrCreate('meta[property="article:published_time"]', 'content', publishedDate || '');
    },
    setJsonLd(json) {
        let s = document.querySelector('script[data-jsonld]');
        if (!json) { if (s) s.remove(); return; }
        if (!s) {
            s = document.createElement('script');
            s.type = 'application/ld+json';
            s.setAttribute('data-jsonld', '1');
            document.head.appendChild(s);
        }
        s.textContent = JSON.stringify(json);
    },
    reset() {
        this.set({ title: '', description: '' });
        this.setJsonLd(null);
    }
};

// ── Router ──

const Router = {
    routes: {},
    currentRoute: null,
    query: new URLSearchParams(),

    add(pattern, handler) { this.routes[pattern] = handler; },

    resolve() {
        Cleanup.run(); // destroy observers, PDF docs, listeners from previous page
        // Hash format: #/path/here?key=value
        const fullHash = window.location.hash.slice(1) || '/';
        const qIdx = fullHash.indexOf('?');
        const hash = qIdx >= 0 ? fullHash.slice(0, qIdx) : fullHash;
        this.query = new URLSearchParams(qIdx >= 0 ? fullHash.slice(qIdx + 1) : '');
        window.scrollTo(0, 0);

        // Hide reading progress bar unless on post page
        const prog = document.getElementById('reading-progress');
        if (prog) prog.style.width = '0';

        // Highlight current navbar tab
        document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
        const tabKey = hash === '/' ? 'projects'
            : hash.startsWith('/blog') ? 'blog'
            : hash.startsWith('/docs') ? 'docs'
            : hash.startsWith('/admin') ? 'admin'
            : '';
        if (tabKey) document.querySelector(`.nav-tab[data-tab="${tabKey}"]`)?.classList.add('active');

        if (this.routes[hash]) {
            this.currentRoute = hash;
            this.routes[hash]();
            return;
        }
        for (const pattern of Object.keys(this.routes)) {
            const paramNames = [];
            const re = pattern.replace(/:([^/]+)/g, (_, n) => { paramNames.push(n); return '([^/]+)'; });
            const match = hash.match(new RegExp(`^${re}$`));
            if (match) {
                const params = {};
                paramNames.forEach((n, i) => params[n] = decodeURIComponent(match[i + 1]));
                this.currentRoute = pattern;
                this.routes[pattern](params);
                return;
            }
        }
        document.getElementById('app').innerHTML =
            '<div class="empty-state" style="padding-top:120px;"><div class="empty-state-icon">&#128566;</div><h3>Page Not Found</h3><p>The page you\'re looking for doesn\'t exist.</p><a href="#/" class="btn btn-primary" style="margin-top:16px;">Go Home</a></div>';
    },

    init() {
        window.addEventListener('hashchange', () => this.resolve());
        this.resolve();
    }
};

/* ============================================
   Phase 2: Content Service + Repo README
   ============================================ */

const ContentService = {
    _cache: null,
    _postCache: new Map(),
    _readmeCache: new Map(),

    async getPosts(includeDrafts = false) {
        if (this._cache) {
            return includeDrafts ? this._cache : this._cache.filter(p => !p.draft);
        }
        try {
            const r = await fetch(`${CONFIG.contentPath}/posts.json`);
            if (!r.ok) throw new Error('Cannot load manifest');
            const data = await r.json();
            data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            this._cache = data.posts;
            return includeDrafts ? this._cache : this._cache.filter(p => !p.draft);
        } catch (e) { console.error('getPosts:', e); return []; }
    },

    async getPost(slug) {
        if (this._postCache.has(slug)) return this._postCache.get(slug);
        const posts = await this.getPosts(true);
        const entry = posts.find(p => p.slug === slug);
        if (!entry) return null;

        // Repo type: fetch README from GitHub/HuggingFace
        if (entry.type === 'repo' && entry.repo) {
            const body = await this.getRepoReadme(entry.repo);
            const result = { ...entry, body: body || '*README could not be loaded.*' };
            this._postCache.set(slug, result);
            return result;
        }

        // Regular post: fetch markdown file
        try {
            const r = await fetch(`${CONFIG.contentPath}/posts/${entry.file}`);
            if (!r.ok) throw new Error('Not found');
            const raw = await r.text();
            const { meta, body } = Utils.parseFrontmatter(raw);
            const result = { ...entry, ...meta, body };
            this._postCache.set(slug, result);
            return result;
        } catch (e) { console.error('getPost:', e); return null; }
    },

    async getRepoReadme(repoUrl) {
        if (this._readmeCache.has(repoUrl)) return this._readmeCache.get(repoUrl);
        try {
            const info = parseRepoUrl(repoUrl);
            if (!info) throw new Error('Unsupported repo URL');

            let body = '', branch = info.branch;
            if (info.host === 'github') {
                const r = await fetch(
                    `https://api.github.com/repos/${info.owner}/${info.name}/readme`,
                    { headers: { 'Accept': 'application/vnd.github.v3+json' } }
                );
                if (!r.ok) throw new Error(`GitHub API ${r.status}`);
                const data = await r.json();
                body = atob(data.content.replace(/\n/g, ''));
                branch = data.url?.match(/ref=([^&]+)/)?.[1] || 'main';
            } else if (info.host === 'huggingface') {
                // Try main, then master. Owner may be empty for canonical datasets.
                let pathPart;
                if (info.subtype) {
                    pathPart = info.owner
                        ? `${info.subtype}/${info.owner}/${info.name}`
                        : `${info.subtype}/${info.name}`;
                } else {
                    pathPart = `${info.owner}/${info.name}`;
                }
                const base = `https://huggingface.co/${pathPart}`;
                let r = await fetch(`${base}/raw/main/README.md`);
                if (!r.ok) r = await fetch(`${base}/raw/master/README.md`);
                if (!r.ok) throw new Error(`HuggingFace ${r.status}`);
                body = await r.text();
                branch = 'main';
            } else if (info.host === 'gitlab') {
                let r = await fetch(
                    `https://gitlab.com/${info.owner}/${info.name}/-/raw/main/README.md`
                );
                if (!r.ok) r = await fetch(
                    `https://gitlab.com/${info.owner}/${info.name}/-/raw/master/README.md`
                );
                if (!r.ok) throw new Error(`GitLab ${r.status}`);
                body = await r.text();
            }

            const { body: cleanBody } = Utils.parseFrontmatter(body);
            const rewritten = rewriteRelativeAssetPaths(cleanBody, info, branch);
            this._readmeCache.set(repoUrl, rewritten);
            return rewritten;
        } catch (e) {
            console.error('getRepoReadme:', e);
            const msg = `*README could not be loaded — ${Utils.escapeHtml(e.message || 'unknown error')}.*`;
            this._readmeCache.set(repoUrl, msg);
            return msg;
        }
    },

    getCategories(posts) {
        const cats = new Set();
        posts.forEach(p => { if (p.category) cats.add(p.category); });
        return Array.from(cats).sort();
    },

    filterPosts(posts, { search = '', category = 'all', type = 'all' } = {}) {
        return posts.filter(p => {
            const t = search.toLowerCase();
            const ms = !t || p.title.toLowerCase().includes(t) ||
                (p.description || '').toLowerCase().includes(t) ||
                (p.tags || []).some(tag => tag.toLowerCase().includes(t));
            const mc = category === 'all' || p.category === category;
            const mt = type === 'all' || p.type === type;
            return ms && mc && mt;
        });
    },

    invalidateCache() { this._cache = null; this._postCache.clear(); }
};

// ── Media embed helpers ──

function renderMediaEmbed(media) {
    if (!media || !media.url) return '';
    switch (media.type) {
        case 'youtube': {
            const id = Utils.extractYouTubeId(media.url);
            if (!id) return '';
            return `<div class="media-embed media-youtube">
                <iframe src="https://www.youtube-nocookie.com/embed/${id}" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen loading="lazy"></iframe></div>`;
        }
        case 'audio':
            return `<div class="media-embed media-audio">
                <audio controls preload="metadata" src="${Utils.escapeHtml(media.url)}"></audio></div>`;
        case 'gif':
            return `<div class="media-embed media-gif">
                <img src="${Utils.escapeHtml(media.url)}" alt="Media" loading="lazy"></div>`;
        default: return '';
    }
}

function getYouTubeRenderer() {
    return {
        paragraph(src) {
            // marked v5+ may pass {tokens, raw} object
            const text = (typeof src === 'object' && src !== null) ? (src.text || src.raw || '') : src;
            const plain = text.replace(/<[^>]+>/g, '').trim();
            const id = Utils.extractYouTubeId(plain);
            if (id && /^https?:\/\//.test(plain)) {
                return `<div class="media-embed media-youtube">
                    <iframe src="https://www.youtube-nocookie.com/embed/${id}" frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen loading="lazy"></iframe></div>`;
            }
            return `<p>${text}</p>`;
        }
    };
}

// ── LaTeX / KaTeX support ──
//
// We extract math expressions BEFORE marked.parse so its tokenizer can't
// mangle them (e.g. underscores becoming italic). Each expression is
// replaced with a placeholder span; after marked, we swap placeholders
// for KaTeX-rendered HTML.

const MathExtractor = {
    _store: new Map(),

    reset() { this._store.clear(); },

    // Replace each math span with a placeholder span that survives marked.parse.
    // Skips fenced code blocks and inline code so we don't touch syntax inside.
    extract(md) {
        if (!md) return md;
        this._store.clear();

        const codeBlocks = [];
        let safe = md.replace(/```[\s\S]*?```/g, (m) => {
            codeBlocks.push(m); return `CB${codeBlocks.length - 1}`;
        });
        const inlineCode = [];
        safe = safe.replace(/`[^`\n]+`/g, (m) => {
            inlineCode.push(m); return `IC${inlineCode.length - 1}`;
        });

        const place = (display, expr) => {
            const id = `kx-${this._store.size}`;
            this._store.set(id, { display, expr });
            return `<span class="math-placeholder" data-id="${id}"></span>`;
        };

        safe = safe.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => place(true, expr.trim()));
        safe = safe.replace(
            /(^|[^\\$])\$([^\s$][^$\n]*?[^\s$]|[^\s$])\$(?!\d)/g,
            (_, pre, expr) => `${pre}${place(false, expr)}`
        );

        safe = safe.replace(/IC(\d+)/g, (_, i) => inlineCode[+i]);
        safe = safe.replace(/CB(\d+)/g, (_, i) => codeBlocks[+i]);
        return safe;
    },

    // After marked.parse, swap placeholder spans for KaTeX HTML.
    async render(html) {
        if (this._store.size === 0) return html;
        let katex;
        try { katex = await LibLoader.loadKatex(); }
        catch { return html.replace(/<span class="math-placeholder"[^>]*><\/span>/g, ''); }

        return html.replace(
            /<span class="math-placeholder" data-id="(kx-\d+)"><\/span>/g,
            (_, id) => {
                const item = this._store.get(id);
                if (!item) return '';
                try {
                    return katex.renderToString(item.expr, {
                        displayMode: item.display,
                        throwOnError: false,
                        output: 'html',
                    });
                } catch (e) {
                    return `<span class="katex-error" title="${Utils.escapeHtml(e.message || '')}">${Utils.escapeHtml(item.expr)}</span>`;
                }
            }
        );
    }
};

// Parse markdown (with math support) and place rendered HTML into a target.
async function renderMarkdownInto(targetEl, markdown) {
    const withPlaceholders = MathExtractor.extract(markdown || '');
    const rawHtml = marked.parse(withPlaceholders);
    targetEl.innerHTML = await MathExtractor.render(rawHtml);
}

// ── Mermaid rendering helper ──

async function renderMermaidBlocks(containerSelector) {
    const containers = document.querySelectorAll(`${containerSelector} .mermaid-block`);
    if (containers.length === 0) return;
    try {
        const mermaid = await LibLoader.loadMermaid();
        for (let i = 0; i < containers.length; i++) {
            const el = containers[i];
            const code = el.getAttribute('data-mermaid');
            if (!code) continue;
            const id = `mermaid-${Date.now()}-${i}`;
            try {
                const { svg } = await mermaid.render(id, code);
                el.innerHTML = svg;
                el.classList.add('mermaid-rendered');
            } catch (e) {
                el.innerHTML = `<pre class="mermaid-error">Mermaid syntax error:\n${Utils.escapeHtml(e.message || String(e))}</pre>`;
            }
        }
    } catch (e) {
        containers.forEach(el => {
            el.innerHTML = `<pre class="mermaid-error">Failed to load Mermaid library</pre>`;
        });
    }
}

// ── Shared marked configuration ──

function configureMarked(options = {}) {
    const renderer = new marked.Renderer();
    const ytRenderer = getYouTubeRenderer();
    renderer.paragraph = ytRenderer.paragraph;

    // Mermaid code blocks → placeholder div; other code → highlighted
    const defaultCode = new marked.Renderer().code;
    renderer.code = function(src, language) {
        // marked v5+ may pass an object {text, lang} as first arg
        let code = src, lang = language;
        if (typeof src === 'object' && src !== null) { code = src.text; lang = src.lang; }
        if (lang === 'mermaid') {
            const encoded = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            return `<div class="mermaid-block" data-mermaid="${encoded}"><div class="mermaid-loading">Loading diagram...</div></div>`;
        }
        // Wrap every code block in .code-block so we can show a language label
        // and a copy button via CSS / a single delegated event listener.
        const labelText = lang ? Utils.escapeHtml(lang) : 'code';
        const wrap = (inner) => `<div class="code-block" data-lang="${labelText}">
            <span class="code-lang-label">${labelText}</span>
            ${inner}
        </div>`;
        if (options.hljs && lang && options.hljs.getLanguage(lang)) {
            const highlighted = options.hljs.highlight(code, { language: lang }).value;
            return wrap(`<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`);
        }
        if (options.hljs) {
            const highlighted = options.hljs.highlightAuto(code).value;
            return wrap(`<pre><code class="hljs">${highlighted}</code></pre>`);
        }
        return wrap(`<pre><code>${Utils.escapeHtml(code)}</code></pre>`);
    };

    // Heading anchors + TOC collection
    if (options.tocItems) {
        renderer.heading = function(src, level) {
            // marked v5+ passes {text, depth, raw} object
            let text = src, lvl = level;
            if (typeof src === 'object' && src !== null) { text = src.text || ''; lvl = src.depth || level; }
            const id = Utils.slugify(text.replace(/<[^>]+>/g, ''));
            if (lvl === 2 || lvl === 3) {
                options.tocItems.push({ id, text: text.replace(/<[^>]+>/g, ''), level: lvl });
            }
            const anchor = options.slug ? `#/post/${options.slug}#${id}` : `#${id}`;
            return `<h${lvl} id="${id}"><a class="heading-anchor" href="${anchor}">#</a>${text}</h${lvl}>`;
        };
    }

    // Table support — ensure GFM tables render with proper classes
    renderer.table = function(header, body) {
        // marked v5+ passes {header, rows} object
        if (typeof header === 'object' && header !== null && 'header' in header) {
            const h = header.header.map(cell => `<th>${cell.text}</th>`).join('');
            const rows = header.rows.map(row => `<tr>${row.map(cell => `<td>${cell.text}</td>`).join('')}</tr>`).join('');
            return `<div class="table-wrapper"><table><thead><tr>${h}</tr></thead><tbody>${rows}</tbody></table></div>`;
        }
        return `<div class="table-wrapper"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
    };

    // Callout / admonition blocks — GitHub-style > [!NOTE] syntax
    renderer.blockquote = function(src) {
        let body = src;
        if (typeof src === 'object' && src !== null) body = src.body || src.text || '';
        const typeMap = {
            note:      { icon: 'ℹ',  label: 'Note'      },
            tip:       { icon: '✦',  label: 'Tip'       },
            important: { icon: '★',  label: 'Important' },
            warning:   { icon: '⚠',  label: 'Warning'   },
            caution:   { icon: '⚡', label: 'Caution'   },
        };
        const m = body.match(/^<p>\[!(note|tip|important|warning|caution)\](<br\s*\/?>|<\/p>)/i);
        if (m) {
            const type = m[1].toLowerCase();
            const { icon, label } = typeMap[type];
            const content = body
                .replace(/^<p>\[![\w]+\]<br\s*\/?>/i, '<p>')
                .replace(/^<p>\[![\w]+\]<\/p>/i, '')
                .trim();
            return `<div class="callout callout-${type}">` +
                   `<div class="callout-header"><span class="callout-icon">${icon}</span><span class="callout-title">${label}</span></div>` +
                   `<div class="callout-body">${content}</div>` +
                   `</div>`;
        }
        return `<blockquote>${body}</blockquote>`;
    };

    marked.setOptions({ breaks: true, gfm: true, renderer });
    return renderer;
}

/* ============================================
   Phase 3: Feed Page + Feed Item Renderer
   ============================================ */

function renderFeedItem(post) {
    const link = post.type === 'pdf' ? `#/pdf/${post.slug}` : `#/post/${post.slug}`;
    const tags = (post.tags || []).slice(0, 4).map(t =>
        `<a class="tag" href="#/tag/${encodeURIComponent(t)}">${Utils.escapeHtml(t)}</a>`).join('');

    // Type badge
    let typeBadge = '';
    if (post.type === 'pdf') typeBadge = '<span class="feed-type-badge feed-type-pdf">PDF</span>';
    else if (post.type === 'repo') typeBadge = '<span class="feed-type-badge feed-type-repo">Repo</span>';

    // Repo link
    let repoLink = '';
    if (post.type === 'repo' && post.repo) {
        const platform = post.repo.includes('huggingface') ? 'HuggingFace' : 'GitHub';
        repoLink = `<a href="${Utils.escapeHtml(post.repo)}" class="feed-repo-link" target="_blank" rel="noopener noreferrer">View on ${platform} &#8599;</a>`;
    }

    // Media zone: inline PDF, media embed, or cover image
    let mediaZone = '';
    if (post.type === 'pdf' && post.pdf) {
        mediaZone = `<div class="inline-pdf" data-pdf="${Utils.escapeHtml(post.pdf)}" data-slug="${post.slug}">
            <div class="inline-pdf-loading"><div class="spinner"></div></div></div>`;
    } else if (post.media && post.media.url) {
        mediaZone = renderMediaEmbed(post.media);
    } else if (post.image) {
        mediaZone = `<div class="feed-image"><img src="${Utils.escapeHtml(post.image)}" alt="${Utils.escapeHtml(post.title)}" loading="lazy" onerror="this.parentElement.remove()"></div>`;
    }

    return `
    <article class="feed-item" id="feed-${post.slug}">
        <div class="feed-item-header">
            <div class="feed-avatar">${CONFIG.authorInitial}</div>
            <div class="feed-item-meta">
                <span class="feed-author">${Utils.escapeHtml(CONFIG.author)}</span>
                <span class="feed-date">${Utils.formatDate(post.date)} &middot; ${Utils.readingTime(post.description || '')} ${typeBadge}</span>
            </div>
        </div>
        <a href="${link}" class="feed-item-body">
            <h3 class="feed-item-title">${Utils.escapeHtml(post.title)}</h3>
            <p class="feed-item-excerpt">${Utils.escapeHtml(post.description || '')}</p>
        </a>
        ${mediaZone}
        <div class="feed-item-footer">
            <div class="feed-item-tags">${tags}</div>
            <div class="feed-item-actions">
                ${repoLink}
                <a href="${link}" class="feed-read-more">Read more &#8594;</a>
            </div>
        </div>
    </article>`;
}

// kindFilter: 'project' | 'blog' | null (null = all kinds, used by /collection etc.)
async function renderFeedPage(opts = {}) {
    const kindFilter = opts.kindFilter || null;
    // Home page (/) is the Projects feed — use the plain site name there.
    // Only label the page when it's an explicitly separate route (/blog).
    Head.set({
        title: kindFilter === 'blog' ? 'Blog' : '',
        description: kindFilter === 'blog' ? 'Posts and write-ups.'
            : kindFilter === 'project' ? 'Showcase work and projects.'
            : CONFIG.siteDescription,
    });

    const app = document.getElementById('app');
    const allPosts = await ContentService.getPosts();
    // Apply kind filter at the top so featured / counts / categories all reflect the page.
    const kindMatch = (p) => {
        if (!kindFilter) return p.type !== 'doc';        // home/blog/projects all hide docs
        if (kindFilter === 'project') return postKind(p) === 'project';
        if (kindFilter === 'blog')    return postKind(p) === 'blog';
        return true;
    };
    const scopedPosts = allPosts.filter(kindMatch);
    const categories = ContentService.getCategories(scopedPosts);

    const globalSearch = document.getElementById('global-search');
    const searchVal = globalSearch ? globalSearch.value : '';

    // Featured strip at the top — only shows when not searching/filtering.
    const featured = scopedPosts.filter(p => p.featured).slice(0, 3);
    const featuredHtml = featured.length ? `
        <section class="featured-row" id="featured-row">
            <div class="featured-row-header"><h3>Featured</h3></div>
            <div class="featured-grid">
                ${featured.map(p => {
                    const link = p.type === 'pdf' ? `#/pdf/${p.slug}` : `#/post/${p.slug}`;
                    return `<a class="featured-card" href="${link}">
                        <h4>${Utils.escapeHtml(p.title)}</h4>
                        <p>${Utils.escapeHtml(p.description || '')}</p>
                    </a>`;
                }).join('')}
            </div>
        </section>` : '';

    const heading = kindFilter === 'project' ? 'Projects'
        : kindFilter === 'blog' ? 'Blog'
        : 'Latest';

    app.innerHTML = `
    <div class="feed-layout">
        <div class="feed-page">
            <header class="feed-page-header">
                <h1>${heading}</h1>
                <p class="feed-page-sub">${kindFilter === 'project' ? 'Showcase work and projects.'
                    : kindFilter === 'blog' ? 'Posts and write-ups.'
                    : 'Recent posts and projects.'}</p>
            </header>
            ${featuredHtml}
            <div class="feed-filter-bar" id="feed-filter-bar">
                <div class="feed-tabs" id="feed-tabs">
                    <button class="feed-tab active" data-type="all">All</button>
                    <button class="feed-tab" data-type="article">Articles</button>
                    <button class="feed-tab" data-type="pdf">PDFs</button>
                    <button class="feed-tab" data-type="repo">Repos</button>
                </div>
                <select class="filter-select filter-select-sm" id="feed-category">
                    <option value="all">All Topics</option>
                    ${categories.map(c => `<option value="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('')}
                </select>
            </div>
            <div class="feed-list" id="feed-list"></div>
            <nav class="pagination" id="pagination" aria-label="Pagination"></nav>
        </div>
        <aside class="feed-sidebar" id="feed-sidebar"></aside>
    </div>`;

    function toggleFeatured() {
        const row = document.getElementById('featured-row');
        if (!row) return;
        const search = document.getElementById('global-search')?.value?.trim() || '';
        const isFiltering = search || currentType !== 'all' || currentCat !== 'all' || currentPage > 1;
        row.style.display = isFiltering ? 'none' : '';
    }

    let filtered = [...scopedPosts];
    let currentType = 'all';
    let currentCat = 'all';
    let currentPage = Math.max(1, parseInt(Router.query.get('p') || '1', 10) || 1);

    function applyFilters({ resetPage = true } = {}) {
        const search = document.getElementById('global-search')?.value || '';
        filtered = ContentService.filterPosts(scopedPosts, { search, category: currentCat, type: currentType });
        if (resetPage) currentPage = 1;
        renderPage();
        toggleFeatured();
    }

    function renderPage() {
        const list = document.getElementById('feed-list');
        if (!list) return;
        const totalPages = Math.max(1, Math.ceil(filtered.length / CONFIG.postsPerPage));
        if (currentPage > totalPages) currentPage = totalPages;
        const startIdx = (currentPage - 1) * CONFIG.postsPerPage;
        const slice = filtered.slice(startIdx, startIdx + CONFIG.postsPerPage);

        if (slice.length === 0) {
            list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">&#128269;</div><h3>No posts found</h3><p>Try different filters or search terms.</p></div>`;
        } else {
            list.innerHTML = slice.map(renderFeedItem).join('');
            initInlinePdfs();
        }
        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        const el = document.getElementById('pagination');
        if (!el) return;
        if (totalPages <= 1) { el.innerHTML = ''; return; }

        const cur = currentPage;
        // Build a small range around current page with ellipses.
        const pages = [];
        const add = (n) => pages.push(n);
        const range = (a, b) => { for (let i = a; i <= b; i++) add(i); };
        if (totalPages <= 7) range(1, totalPages);
        else if (cur <= 4)             { range(1, 5); add('…'); add(totalPages); }
        else if (cur >= totalPages - 3) { add(1); add('…'); range(totalPages - 4, totalPages); }
        else                            { add(1); add('…'); range(cur - 1, cur + 1); add('…'); add(totalPages); }

        const link = (n, label = n, extraClass = '') => {
            const active = n === cur ? 'active' : '';
            return `<button type="button" class="pagination-btn ${extraClass} ${active}" data-page="${n}" ${active ? 'aria-current="page"' : ''}>${label}</button>`;
        };

        el.innerHTML = `
            <button type="button" class="pagination-btn pagination-arrow" data-page="${Math.max(1, cur - 1)}" ${cur === 1 ? 'disabled' : ''} aria-label="Previous page">&#8592;</button>
            ${pages.map(p => p === '…' ? '<span class="pagination-ellipsis">…</span>' : link(p)).join('')}
            <button type="button" class="pagination-btn pagination-arrow" data-page="${Math.min(totalPages, cur + 1)}" ${cur === totalPages ? 'disabled' : ''} aria-label="Next page">&#8594;</button>
            <span class="pagination-meta">Page ${cur} of ${totalPages}</span>
        `;
        el.querySelectorAll('button[data-page]').forEach(btn => {
            btn.addEventListener('click', () => goToPage(+btn.dataset.page));
        });
    }

    function goToPage(n) {
        currentPage = n;
        // Update URL so the page is shareable / back-button works.
        const base = window.location.hash.split('?')[0] || '#/';
        const newHash = n > 1 ? `${base}?p=${n}` : base;
        // Update without triggering hashchange resolve (we render in place).
        history.replaceState(null, '', newHash);
        renderPage();
        toggleFeatured();
        // Scroll to feed top so the new page is in view
        document.getElementById('feed-filter-bar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Tab click handlers
    document.querySelectorAll('.feed-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentType = tab.dataset.type;
            applyFilters();
        });
    });

    document.getElementById('feed-category').addEventListener('change', (e) => {
        currentCat = e.target.value;
        applyFilters();
    });

    if (globalSearch) {
        const handler = Utils.debounce(() => applyFilters(), 300);
        globalSearch.addEventListener('input', handler);
        Cleanup.add(() => globalSearch.removeEventListener('input', handler));
    }

    // Initial render uses query-param page if present
    applyFilters({ resetPage: false });

    if (searchVal) applyFilters();

    renderSidebar(scopedPosts);
}

// What kind is a post? Defaults to 'blog' if not explicitly set, with one
// heuristic: type=='repo' is treated as a project unless overridden.
function postKind(p) {
    if (p.kind === 'project' || p.kind === 'blog') return p.kind;
    if (p.type === 'repo') return 'project';
    return 'blog';
}

// Convenience routes that delegate to renderFeedPage with a kind filter.
function renderProjectsPage() { return renderFeedPage({ kindFilter: 'project' }); }
function renderBlogPage()     { return renderFeedPage({ kindFilter: 'blog' }); }

// ── Sidebar ──

function renderSidebar(posts) {
    const sidebar = document.getElementById('feed-sidebar');
    if (!sidebar) return;

    // Collect tag frequencies
    const tagCounts = {};
    posts.forEach(p => {
        (p.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
    });
    const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(e => e[0]);

    // Recent posts (up to 5)
    const recent = posts.slice(0, 5);

    const collectionCount = new Set(posts.filter(p => p.collection).map(p => p.collection)).size;
    const docCount = posts.filter(p => p.type === 'doc').length;

    sidebar.innerHTML = `
        <div class="sidebar-card">
            <div class="sidebar-profile-avatar">${CONFIG.authorInitial}</div>
            <div class="sidebar-profile-name">${Utils.escapeHtml(CONFIG.author)}</div>
            <p class="sidebar-profile-bio">${Utils.escapeHtml(CONFIG.siteDescription)}</p>
            <div class="sidebar-social">
                <a href="${CONFIG.social.github}" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href="${CONFIG.social.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a href="mailto:${CONFIG.social.email}">Email</a>
            </div>
        </div>
        ${(collectionCount || docCount) ? `
        <div class="sidebar-card">
            <h4>Browse</h4>
            ${collectionCount ? `<div class="sidebar-recent-item">
                <a href="#/collections" class="sidebar-recent-title">Collections</a>
                <span class="sidebar-recent-date">${collectionCount} series</span>
            </div>` : ''}
            ${docCount ? `<div class="sidebar-recent-item">
                <a href="#/docs" class="sidebar-recent-title">Documentation</a>
                <span class="sidebar-recent-date">${docCount} doc${docCount === 1 ? '' : 's'}</span>
            </div>` : ''}
        </div>` : ''}
        ${topTags.length ? `
        <div class="sidebar-card">
            <h4>Popular Tags</h4>
            <div class="sidebar-tags">
                ${topTags.map(t => `<a class="sidebar-tag" href="#/tag/${encodeURIComponent(t)}">${Utils.escapeHtml(t)}</a>`).join('')}
            </div>
        </div>` : ''}
        <div class="sidebar-card">
            <h4>Recent Posts</h4>
            ${recent.map(p => {
                const link = p.type === 'pdf' ? `#/pdf/${p.slug}` : `#/post/${p.slug}`;
                return `<div class="sidebar-recent-item">
                    <a href="${link}" class="sidebar-recent-title">${Utils.escapeHtml(p.title)}</a>
                    <span class="sidebar-recent-date">${Utils.formatDate(p.date)}</span>
                </div>`;
            }).join('')}
        </div>`;

    // (tag clicks are real links to /#/tag/:slug now — no JS handler needed)
}

// ── Image lightbox ──
//
// Single global lightbox element, lazily created. Delegates clicks from the
// container selector — any <img> inside, except those wrapped in <a>, opens
// the lightbox.
function initLightbox(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    let box = document.querySelector('.lightbox');
    if (!box) {
        box = document.createElement('div');
        box.className = 'lightbox';
        box.innerHTML = '<button class="lightbox-close" aria-label="Close" type="button">&times;</button><img alt="">';
        document.body.appendChild(box);
        const close = () => box.classList.remove('open');
        box.querySelector('.lightbox-close').addEventListener('click', close);
        box.addEventListener('click', (e) => { if (e.target === box) close(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && box.classList.contains('open')) close();
        });
    }
    const handler = (e) => {
        const img = e.target.closest('img');
        if (!img || img.closest('a') || img.closest('.feed-avatar')) return;
        e.preventDefault();
        const lb = box.querySelector('img');
        lb.src = img.src;
        lb.alt = img.alt || '';
        box.classList.add('open');
    };
    container.addEventListener('click', handler);
    Cleanup.add(() => container.removeEventListener('click', handler));
}

// ── Inline PDF Carousel ──

function initInlinePdfs() {
    document.querySelectorAll('.inline-pdf:not([data-init])').forEach(container => {
        container.setAttribute('data-init', '1');
        const pdfPath = container.dataset.pdf;
        const slug = container.dataset.slug;

        // Use IntersectionObserver to lazy-load
        const observer = new IntersectionObserver(async (entries) => {
            if (!entries[0].isIntersecting) return;
            observer.disconnect();

            try {
                const pdfjsLib = await LibLoader.loadPdfJs();
                const pdfDoc = await pdfjsLib.getDocument(pdfPath).promise;
                const totalPages = pdfDoc.numPages;
                let currentPage = 1;
                let rendering = false;

                container.innerHTML = `
                    <div class="inline-pdf-stage">
                        <button class="pdf-nav pdf-nav-prev" disabled>&#8592;</button>
                        <canvas class="inline-pdf-canvas"></canvas>
                        <button class="pdf-nav pdf-nav-next" ${totalPages <= 1 ? 'disabled' : ''}>&#8594;</button>
                    </div>
                    <div class="inline-pdf-controls">
                        <span class="inline-pdf-info">Slide 1 of ${totalPages}</span>
                        <a href="#/pdf/${slug}" class="inline-pdf-fullscreen" title="Fullscreen">&#x26F6;</a>
                    </div>`;

                const canvas = container.querySelector('canvas');
                const ctx = canvas.getContext('2d');
                const prevBtn = container.querySelector('.pdf-nav-prev');
                const nextBtn = container.querySelector('.pdf-nav-next');
                const info = container.querySelector('.inline-pdf-info');

                async function renderSlide(num) {
                    if (rendering) return;
                    rendering = true;
                    const page = await pdfDoc.getPage(num);
                    const containerW = Math.min(container.clientWidth - 80, 620);
                    const vp1 = page.getViewport({ scale: 1 });
                    const scale = Math.max(containerW / vp1.width, 0.5);
                    const viewport = page.getViewport({ scale });
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    await page.render({ canvasContext: ctx, viewport }).promise;
                    info.textContent = `Slide ${num} of ${totalPages}`;
                    prevBtn.disabled = num <= 1;
                    nextBtn.disabled = num >= totalPages;
                    rendering = false;
                }

                function go(num) {
                    if (num < 1 || num > totalPages) return;
                    currentPage = num;
                    renderSlide(currentPage);
                }

                prevBtn.addEventListener('click', (e) => { e.preventDefault(); go(currentPage - 1); });
                nextBtn.addEventListener('click', (e) => { e.preventDefault(); go(currentPage + 1); });

                // Swipe support
                let touchX = 0;
                canvas.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
                canvas.addEventListener('touchend', e => {
                    const dx = touchX - e.changedTouches[0].clientX;
                    if (Math.abs(dx) > 50) dx > 0 ? go(currentPage + 1) : go(currentPage - 1);
                }, { passive: true });

                await renderSlide(1);

                // Memory cleanup when navigating away
                Cleanup.add(() => { pdfDoc.destroy(); });

            } catch (err) {
                container.innerHTML = `<div class="inline-pdf-error">Could not load PDF preview</div>`;
            }
        }, { rootMargin: '300px' });

        observer.observe(container);
        Cleanup.add(() => observer.disconnect());
    });
}

/* ============================================
   Phase 4: Post View (enhanced)
   ============================================ */

async function renderPostPage({ slug }) {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="post-view"><div class="loading-state"><div class="spinner"></div></div></div>';

    const post = await ContentService.getPost(slug);
    if (!post) {
        app.innerHTML = `<div class="post-view"><a href="#/" class="post-back">&#8592; Back</a>
            <div class="empty-state"><div class="empty-state-icon">&#128533;</div><h3>Post not found</h3></div></div>`;
        return;
    }

    // Load highlight.js
    const hljs = await LibLoader.loadHighlightJs();

    // Configure marked with YouTube auto-embed, heading anchors, mermaid, tables
    const tocItems = [];
    configureMarked({ hljs, tocItems, slug });

    // SEO / sharing tags for this post
    Head.set({
        title: post.title,
        description: post.description || '',
        image: post.image ? new URL(post.image, SITE_ORIGIN + '/').href : '',
        type: 'article',
        publishedDate: post.date,
    });
    Head.setJsonLd({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        datePublished: post.date,
        author: { '@type': 'Person', name: CONFIG.author },
        description: post.description || '',
        image: post.image ? [new URL(post.image, SITE_ORIGIN + '/').href] : undefined,
        keywords: (post.tags || []).join(', '),
        articleSection: post.category || undefined,
        url: SITE_ORIGIN + '/#/post/' + slug,
    });

    // Run math extraction *before* marked, KaTeX render *after*.
    const withMath = MathExtractor.extract(post.body);
    let rawHtml = marked.parse(withMath);
    // External-source content (repo READMEs) is sanitized with DOMPurify
    // before being injected — it contained user-written HTML we don't trust.
    if (post.type === 'repo') {
        try {
            const DOMPurify = await LibLoader.loadPurify();
            rawHtml = DOMPurify.sanitize(rawHtml, {
                ADD_TAGS: ['span'], // allow KaTeX placeholder spans
                ADD_ATTR: ['data-id', 'data-mermaid'],
                FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
            });
        } catch (e) {
            console.warn('DOMPurify failed to load; falling back to unsanitized render');
        }
    }
    const htmlContent = await MathExtractor.render(rawHtml);
    const readTime = Utils.readingTime(post.body);
    const tags = (post.tags || []).map(t =>
        `<a class="tag tag-primary" href="#/tag/${encodeURIComponent(t)}">${Utils.escapeHtml(t)}</a>`
    ).join('');

    const coverHtml = post.image
        ? `<img class="post-cover" src="${post.image}" alt="${Utils.escapeHtml(post.title)}" onerror="this.style.display='none'">`
        : '';

    // Media embed in post
    const mediaHtml = (post.media && post.media.url) ? renderMediaEmbed(post.media) : '';

    // Repo badge
    let repoBadge = '';
    if (post.type === 'repo' && post.repo) {
        const platform = post.repo.includes('huggingface') ? 'HuggingFace' : 'GitHub';
        repoBadge = `<a href="${Utils.escapeHtml(post.repo)}" class="feed-repo-link" target="_blank" rel="noopener noreferrer" style="margin-bottom:24px;display:inline-flex;">View on ${platform} &#8599;</a>`;
    }

    // Table of Contents
    let tocHtml = '';
    if (tocItems.length > 2) {
        tocHtml = `<aside class="toc" id="toc">
            <div class="toc-header">Contents</div>
            <nav>${tocItems.map(item =>
                `<a href="#/post/${slug}#${item.id}" class="toc-link toc-level-${item.level}" data-id="${item.id}">${Utils.escapeHtml(item.text)}</a>`
            ).join('')}</nav></aside>`;
    }

    // Related posts
    const allPosts = await ContentService.getPosts();
    const related = allPosts
        .filter(p => p.slug !== slug &&
            ((p.category && p.category === post.category) ||
             (p.tags || []).some(t => (post.tags || []).includes(t))))
        .slice(0, 3);

    // Prev / next navigation
    const linearList = allPosts.filter(p => p.type !== 'doc');
    const myIdx = linearList.findIndex(p => p.slug === slug);
    const prev = myIdx > 0 ? linearList[myIdx - 1] : null;
    const next = myIdx >= 0 && myIdx < linearList.length - 1 ? linearList[myIdx + 1] : null;
    function navHref(p) {
        return (p.type === 'pdf' ? '#/pdf/' : '#/post/') + p.slug;
    }
    const prevNextHtml = (prev || next) ? `
        <nav class="post-prev-next" aria-label="Previous and next post">
            ${prev ? `<a class="post-prev" href="${navHref(prev)}">
                <span class="post-prev-next-label">&#8592; Newer</span>
                <span class="post-prev-next-title">${Utils.escapeHtml(prev.title)}</span>
            </a>` : '<div></div>'}
            ${next ? `<a class="post-next" href="${navHref(next)}">
                <span class="post-prev-next-label">Older &#8594;</span>
                <span class="post-prev-next-title">${Utils.escapeHtml(next.title)}</span>
            </a>` : '<div></div>'}
        </nav>` : '';

    // Share + edit-on-github action bar
    const postUrl = `${SITE_ORIGIN}/#/post/${slug}`;
    const shareLinks = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(postUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
    };
    const editPath = post.file
        ? `https://github.com/${CONFIG.github.username}/${CONFIG.github.repo}/edit/${CONFIG.github.branch}/${CONFIG.contentPath}/posts/${post.file}`
        : null;
    const actionBarHtml = `
        <div class="post-actions" role="toolbar" aria-label="Post actions">
            <button class="post-action-btn" id="post-share-copy" type="button" title="Copy link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Copy link
            </button>
            <a class="post-action-btn" href="${shareLinks.twitter}" target="_blank" rel="noopener noreferrer" title="Share on Twitter">Twitter</a>
            <a class="post-action-btn" href="${shareLinks.linkedin}" target="_blank" rel="noopener noreferrer" title="Share on LinkedIn">LinkedIn</a>
            ${editPath ? `<a class="post-action-btn" href="${editPath}" target="_blank" rel="noopener noreferrer" title="Edit this page on GitHub">Edit on GitHub</a>` : ''}
        </div>`;

    const relatedHtml = related.length > 0 ? `
        <div class="related-posts">
            <h3>Related Posts</h3>
            <div class="related-grid">
                ${related.map(r => `<a href="#/${r.type === 'pdf' ? 'pdf' : 'post'}/${r.slug}" class="related-card">
                    <h4>${Utils.escapeHtml(r.title)}</h4>
                    <span class="related-date">${Utils.formatDate(r.date)}</span>
                </a>`).join('')}
            </div>
        </div>` : '';

    app.innerHTML = `
        <div class="post-layout">
            <article class="post-view">
                <div class="post-header">
                    <a href="#/" class="post-back">&#8592; Back to feed</a>
                    <h1 class="post-title">${Utils.escapeHtml(post.title)}</h1>
                    <div class="post-meta-bar">
                        <span>${Utils.formatDate(post.date)}</span>
                        <span class="post-meta-divider"></span>
                        <span>${readTime}</span>
                        ${post.category ? `<span class="post-meta-divider"></span><a href="#/category/${encodeURIComponent(post.category)}">${Utils.escapeHtml(post.category)}</a>` : ''}
                    </div>
                    ${repoBadge}
                </div>
                ${coverHtml}
                ${mediaHtml}
                <div class="post-content">${htmlContent}</div>
                ${tags ? `<div class="post-tags">${tags}</div>` : ''}
                ${actionBarHtml}
                ${prevNextHtml}
                ${relatedHtml}
            </article>
            ${tocHtml}
        </div>
        ${tocItems.length > 2 ? '<button class="toc-mobile-toggle" type="button" id="toc-mobile-toggle" aria-label="Show table of contents">&#9776; Contents</button>' : ''}
    `;
    document.body.classList.toggle('has-toc', tocItems.length > 2);

    // Wire copy-link button
    const copyBtn = document.getElementById('post-share-copy');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(postUrl)
                .then(() => showToast('Link copied!', 'success'))
                .catch(() => showToast('Copy failed', 'error'));
        });
    }

    // Image lightbox: clicking any post-content image opens a fullscreen view.
    initLightbox('.post-content');

    // Mobile TOC toggle
    const tocToggle = document.getElementById('toc-mobile-toggle');
    const tocEl = document.querySelector('.toc');
    if (tocToggle && tocEl) {
        tocToggle.addEventListener('click', () => {
            const open = tocEl.getAttribute('data-mobile-open') === '1';
            tocEl.setAttribute('data-mobile-open', open ? '0' : '1');
        });
        // Tap outside to close
        document.addEventListener('click', (e) => {
            if (!tocEl.contains(e.target) && e.target !== tocToggle) {
                tocEl.setAttribute('data-mobile-open', '0');
            }
        });
        Cleanup.add(() => document.body.classList.remove('has-toc'));
    } else {
        Cleanup.add(() => document.body.classList.remove('has-toc'));
    }

    // Render mermaid diagrams
    renderMermaidBlocks('.post-content');

    // Copy code buttons (delegated to .code-block wrapper)
    document.querySelectorAll('.post-content .code-block').forEach(block => {
        const btn = document.createElement('button');
        btn.className = 'code-copy-btn';
        btn.type = 'button';
        btn.textContent = 'Copy';
        btn.setAttribute('aria-label', 'Copy code to clipboard');
        btn.addEventListener('click', () => {
            const code = block.querySelector('code');
            const text = code ? code.textContent : block.textContent;
            navigator.clipboard.writeText(text)
                .then(() => { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000); })
                .catch(() => showToast('Copy failed', 'error'));
        });
        block.appendChild(btn);
    });

    // Reading progress bar
    const progressBar = document.getElementById('reading-progress');
    const postContent = document.querySelector('.post-content');
    if (progressBar && postContent) {
        const scrollHandler = () => {
            const rect = postContent.getBoundingClientRect();
            const total = postContent.offsetHeight;
            const visible = Math.min(Math.max(-rect.top, 0), total);
            progressBar.style.width = `${(visible / total) * 100}%`;
        };
        window.addEventListener('scroll', scrollHandler, { passive: true });
        Cleanup.add(() => { window.removeEventListener('scroll', scrollHandler); progressBar.style.width = '0'; });
    }

    // TOC active tracking
    if (tocItems.length > 2) {
        const tocLinks = document.querySelectorAll('.toc-link');
        const headings = tocItems.map(item => document.getElementById(item.id)).filter(Boolean);
        const tocScrollHandler = () => {
            let current = '';
            headings.forEach(h => {
                if (h.getBoundingClientRect().top < 120) current = h.id;
            });
            tocLinks.forEach(link => {
                link.classList.toggle('active', link.dataset.id === current);
            });
        };
        window.addEventListener('scroll', tocScrollHandler, { passive: true });
        Cleanup.add(() => window.removeEventListener('scroll', tocScrollHandler));
    }

    // Scroll to anchor if hash has one (e.g. #/post/slug#heading-id)
    const anchor = window.location.hash.split('#').pop();
    if (anchor && anchor !== slug) {
        const el = document.getElementById(anchor);
        if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
}

/* ============================================
   Phase 5: Full-page PDF Viewer
   ============================================ */

async function renderPdfPage({ slug }) {
    const app = document.getElementById('app');
    const posts = await ContentService.getPosts(true);
    const post = posts.find(p => p.slug === slug);

    if (post) Head.set({ title: post.title, description: post.description, type: 'article' });

    if (!post || !post.pdf) {
        app.innerHTML = `<div class="pdf-viewer"><a href="#/" class="post-back">&#8592; Back</a>
            <div class="pdf-error"><h3>PDF not found</h3></div></div>`;
        return;
    }

    app.innerHTML = `
    <div class="pdf-viewer">
        <div class="pdf-viewer-header">
            <a href="#/" class="post-back">&#8592; Back</a>
            <h2 class="pdf-viewer-title">${Utils.escapeHtml(post.title)}</h2>
            <a href="${post.pdf}" download class="btn btn-sm btn-secondary">&#8595; Download</a>
        </div>
        <div class="pdf-stage" id="pdf-stage">
            <div class="pdf-loading" id="pdf-loading"><div class="spinner"></div><p class="loading-text">Loading PDF...</p></div>
            <div class="pdf-canvas-wrap" id="pdf-canvas-wrap" style="display:none;">
                <button class="pdf-nav pdf-nav-prev" id="pdf-prev" disabled>&#8592;</button>
                <canvas id="pdf-canvas"></canvas>
                <button class="pdf-nav pdf-nav-next" id="pdf-next" disabled>&#8594;</button>
            </div>
        </div>
        <div class="pdf-controls" id="pdf-controls" style="display:none;">
            <span class="pdf-page-info" id="pdf-page-info">Slide 1 of 1</span>
        </div>
        <div class="pdf-thumbnails" id="pdf-thumbs"></div>
    </div>`;

    try {
        const pdfjsLib = await LibLoader.loadPdfJs();
        const pdfDoc = await pdfjsLib.getDocument(post.pdf).promise;
        const totalPages = pdfDoc.numPages;
        let currentPage = 1;
        let rendering = false;
        let pendingPage = false;
        const thumbCanvases = [];

        Cleanup.add(() => pdfDoc.destroy());

        const canvas = document.getElementById('pdf-canvas');
        const ctx = canvas.getContext('2d');

        function getScale(page) {
            const cw = Math.min(document.getElementById('pdf-stage').clientWidth - 120, 860);
            return Math.max(cw / page.getViewport({ scale: 1 }).width, 0.5);
        }

        async function renderSlide(num) {
            if (rendering) { pendingPage = num; return; }
            rendering = true; pendingPage = false;
            const page = await pdfDoc.getPage(num);
            const viewport = page.getViewport({ scale: getScale(page) });
            canvas.width = viewport.width; canvas.height = viewport.height;
            await page.render({ canvasContext: ctx, viewport }).promise;
            document.getElementById('pdf-page-info').textContent = `Slide ${num} of ${totalPages}`;
            document.getElementById('pdf-prev').disabled = num <= 1;
            document.getElementById('pdf-next').disabled = num >= totalPages;
            thumbCanvases.forEach((tc, i) => tc.parentElement.classList.toggle('active', i === num - 1));
            if (thumbCanvases[num - 1]) thumbCanvases[num - 1].parentElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            rendering = false;
            if (pendingPage !== false) { const p = pendingPage; pendingPage = false; renderSlide(p); }
        }

        async function renderThumb(num) {
            const page = await pdfDoc.getPage(num);
            const vp = page.getViewport({ scale: 0.18 });
            const wrap = document.createElement('div');
            wrap.className = 'pdf-thumb';
            wrap.addEventListener('click', () => goTo(num));
            const tc = document.createElement('canvas');
            tc.width = vp.width; tc.height = vp.height;
            await page.render({ canvasContext: tc.getContext('2d'), viewport: vp }).promise;
            wrap.appendChild(tc);
            document.getElementById('pdf-thumbs').appendChild(wrap);
            thumbCanvases.push(tc);
        }

        function goTo(num) { if (num >= 1 && num <= totalPages) { currentPage = num; renderSlide(currentPage); } }

        document.getElementById('pdf-prev').addEventListener('click', () => goTo(currentPage - 1));
        document.getElementById('pdf-next').addEventListener('click', () => goTo(currentPage + 1));

        const keyHandler = (e) => {
            if (Router.currentRoute !== '/pdf/:slug') { document.removeEventListener('keydown', keyHandler); return; }
            if (['ArrowLeft','ArrowUp','PageUp'].includes(e.key)) { e.preventDefault(); goTo(currentPage - 1); }
            if (['ArrowRight','ArrowDown','PageDown'].includes(e.key)) { e.preventDefault(); goTo(currentPage + 1); }
            if (e.key === 'Home') goTo(1);
            if (e.key === 'End') goTo(totalPages);
        };
        document.addEventListener('keydown', keyHandler);
        Cleanup.add(() => document.removeEventListener('keydown', keyHandler));

        let touchX = 0;
        canvas.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
        canvas.addEventListener('touchend', e => {
            const dx = touchX - e.changedTouches[0].clientX;
            if (Math.abs(dx) > 50) dx > 0 ? goTo(currentPage + 1) : goTo(currentPage - 1);
        }, { passive: true });

        let rt;
        const rh = () => { clearTimeout(rt); rt = setTimeout(() => { if (pdfDoc) renderSlide(currentPage); }, 250); };
        window.addEventListener('resize', rh);
        Cleanup.add(() => window.removeEventListener('resize', rh));

        document.getElementById('pdf-loading').style.display = 'none';
        document.getElementById('pdf-canvas-wrap').style.display = 'flex';
        document.getElementById('pdf-controls').style.display = 'flex';
        await renderSlide(1);
        for (let i = 1; i <= totalPages; i++) { await renderThumb(i); if (i === 1 && thumbCanvases[0]) thumbCanvases[0].parentElement.classList.add('active'); }

    } catch (err) {
        document.getElementById('pdf-loading').innerHTML = `<div class="pdf-error"><h3>Could not load PDF</h3><p>${Utils.escapeHtml(err.message)}</p></div>`;
    }
}

/* ============================================
   Phase 6: GitHub API + Admin + Editor + Upload
   ============================================ */

// UTF-8 safe base64 encode (replaces deprecated unescape(encodeURIComponent(...)))
function b64EncodeUtf8(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
}

// Read file → base64 (no data: prefix)
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const r = reader.result;
            const idx = r.indexOf(',');
            resolve(idx >= 0 ? r.slice(idx + 1) : r);
        };
        reader.onerror = () => reject(new Error('Read failed'));
        reader.readAsDataURL(file);
    });
}

// Surface a useful error from a GitHub API response.
async function ghError(r, defaultMsg) {
    let detail = defaultMsg || `GitHub API ${r.status}`;
    try {
        const e = await r.json();
        if (e && e.message) detail = e.message;
        if (r.status === 403 && r.headers.get('X-RateLimit-Remaining') === '0') {
            const reset = +r.headers.get('X-RateLimit-Reset');
            const waitS = reset ? Math.max(0, reset - Math.floor(Date.now() / 1000)) : 60;
            detail = `Rate-limited — retry in ${Math.ceil(waitS / 60)} min`;
        }
        if (r.status === 422) detail = `${detail} (file may already exist or path invalid)`;
    } catch { /* swallow */ }
    return new Error(detail);
}

const GitHubAPI = {
    GITHUB_FILE_LIMIT: 100 * 1024 * 1024, // 100 MB hard ceiling
    UPLOAD_WARN_LIMIT: 25 * 1024 * 1024,  // warn at 25 MB

    getToken() { return localStorage.getItem('gh_token') || ''; },
    setToken(t) { localStorage.setItem('gh_token', t); },
    clearToken() { localStorage.removeItem('gh_token'); },
    isAuthenticated() { return !!this.getToken(); },
    headers() {
        return {
            'Authorization': `token ${this.getToken()}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        };
    },

    async getFile(path) {
        const r = await fetch(
            `https://api.github.com/repos/${CONFIG.github.username}/${CONFIG.github.repo}/contents/${path}?ref=${CONFIG.github.branch}`,
            { headers: this.headers() }
        );
        if (r.status === 404) return null;
        if (!r.ok) throw await ghError(r, 'getFile failed');
        const d = await r.json();
        return { content: atob(d.content.replace(/\n/g, '')), sha: d.sha };
    },

    async putFile(path, content, message, sha) {
        const body = { message, content: b64EncodeUtf8(content), branch: CONFIG.github.branch };
        if (sha) body.sha = sha;
        const r = await fetch(
            `https://api.github.com/repos/${CONFIG.github.username}/${CONFIG.github.repo}/contents/${path}`,
            { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) }
        );
        if (!r.ok) throw await ghError(r, 'Save failed');
        return r.json();
    },

    // Binary upload with size validation and optional progress callback (0..1).
    async uploadBinary(path, file, message, onProgress) {
        if (file.size > this.GITHUB_FILE_LIMIT) {
            throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). GitHub limit is 100 MB.`);
        }
        if (onProgress) onProgress(0.05);
        const b64 = await fileToBase64(file);
        if (onProgress) onProgress(0.4);

        // If file already exists, fetch its sha so PUT can overwrite.
        let existingSha = null;
        try {
            const existing = await this.getFile(path);
            if (existing) existingSha = existing.sha;
        } catch { /* probably 404, fine */ }

        const body = { message, content: b64, branch: CONFIG.github.branch };
        if (existingSha) body.sha = existingSha;

        const r = await fetch(
            `https://api.github.com/repos/${CONFIG.github.username}/${CONFIG.github.repo}/contents/${path}`,
            { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) }
        );
        if (!r.ok) throw await ghError(r, 'Upload failed');
        if (onProgress) onProgress(1);
        return r.json();
    },

    async deleteFile(path, sha, message) {
        const r = await fetch(
            `https://api.github.com/repos/${CONFIG.github.username}/${CONFIG.github.repo}/contents/${path}`,
            { method: 'DELETE', headers: this.headers(), body: JSON.stringify({ message, sha, branch: CONFIG.github.branch }) }
        );
        if (!r.ok) throw await ghError(r, 'Delete failed');
    }
};

// ── Admin ──

function renderAdminLogin() {
    document.getElementById('app').innerHTML = `
        <div class="admin-auth">
            <h2>Admin Access</h2>
            <p>Enter your GitHub Personal Access Token.<br>Stored only in your browser's localStorage.</p>
            <div class="form-group"><label class="form-label">GitHub Token</label>
                <input type="password" class="form-input" id="admin-token" placeholder="ghp_xxxxxxxxxxxx"></div>
            <button class="btn btn-primary" id="admin-login-btn" style="width:100%;">Sign In</button>
            <p style="margin-top:16px;font-size:0.8rem;color:var(--color-text-muted);">Requires <code>repo</code> scope.</p>
        </div>`;

    async function doLogin() {
        const btn = document.getElementById('admin-login-btn');
        const t = document.getElementById('admin-token').value.trim();
        if (!t) { showToast('Enter a token', 'error'); return; }
        btn.disabled = true;
        btn.textContent = 'Verifying...';
        try {
            // Validate token against GitHub API before saving
            const r = await fetch(`https://api.github.com/repos/${CONFIG.github.username}/${CONFIG.github.repo}`, {
                headers: { 'Authorization': `token ${t}`, 'Accept': 'application/vnd.github.v3+json' }
            });
            if (r.status === 401) { showToast('Invalid token — check your PAT', 'error'); return; }
            if (r.status === 404) { showToast('Repo not found — check token scope (needs repo)', 'error'); return; }
            if (!r.ok) { showToast(`GitHub API error: ${r.status}`, 'error'); return; }
            GitHubAPI.setToken(t);
            renderAdminDashboard();
        } catch (e) {
            showToast('Connection error: ' + e.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
        }
    }

    document.getElementById('admin-login-btn').addEventListener('click', doLogin);
    document.getElementById('admin-token').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
}

async function renderAdminDashboard() {
    if (!GitHubAPI.isAuthenticated()) { renderAdminLogin(); return; }
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="admin-container">
            <div class="admin-header">
                <h1>Dashboard</h1>
                <div style="display:flex;gap:8px;">
                    <a href="#/admin/new" class="btn btn-primary btn-sm">+ New Post</a>
                    <a href="#/admin/upload" class="btn btn-secondary btn-sm">Upload</a>
                    <button class="btn btn-ghost btn-sm" id="admin-logout">Sign Out</button>
                </div>
            </div>
            <div class="admin-tabs">
                <button class="admin-tab active" data-tab="posts">Posts</button>
                <button class="admin-tab" data-tab="files">Files</button>
            </div>
            <div id="admin-tab-content"><div class="loading-state"><div class="spinner"></div></div></div>
        </div>`;

    document.getElementById('admin-logout').addEventListener('click', () => { GitHubAPI.clearToken(); showToast('Signed out'); renderAdminLogin(); });
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (tab.dataset.tab === 'posts') loadAdminPosts();
            if (tab.dataset.tab === 'files') loadAdminFiles();
        });
    });
    await loadAdminPosts();
}

async function loadAdminPosts() {
    const c = document.getElementById('admin-tab-content');
    c.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
    try {
        ContentService.invalidateCache();
        const posts = await ContentService.getPosts(true);
        if (!posts.length) { c.innerHTML = '<div class="empty-state"><h3>No posts</h3><a href="#/admin/new" class="btn btn-primary" style="margin-top:12px;">+ New Post</a></div>'; return; }
        c.innerHTML = `<div class="admin-posts-list">${posts.map(p => `
            <div class="admin-post-item">
                <div class="admin-post-info"><h4>${Utils.escapeHtml(p.title)}${p.draft ? ' <span style="color:var(--color-warning);font-size:0.8rem;">(draft)</span>' : ''}</h4>
                    <p>${Utils.formatDate(p.date)} &middot; ${p.type}${p.category ? ' &middot; ' + p.category : ''}</p></div>
                <div class="admin-post-actions">
                    <a href="#/admin/edit/${p.slug}" class="btn btn-ghost btn-sm">Edit</a>
                    <button class="btn btn-ghost btn-sm" data-delete="${p.slug}" style="color:var(--color-danger);">Delete</button>
                </div>
            </div>`).join('')}</div>`;
        c.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm(`Delete "${btn.dataset.delete}"?`)) return;
                try { await deletePost(btn.dataset.delete); showToast('Deleted', 'success'); loadAdminPosts(); }
                catch (e) { showToast('Delete failed: ' + e.message, 'error'); }
            });
        });
    } catch (e) { c.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${e.message}</p></div>`; }
}

async function deletePost(slug) {
    const f = await GitHubAPI.getFile(`${CONFIG.contentPath}/posts.json`);
    if (!f) throw new Error('Manifest not found');
    const m = JSON.parse(f.content);
    const idx = m.posts.findIndex(p => p.slug === slug);
    if (idx === -1) throw new Error('Not in manifest');
    const post = m.posts[idx];
    if (post.file) {
        const mf = await GitHubAPI.getFile(`${CONFIG.contentPath}/posts/${post.file}`);
        if (mf) await GitHubAPI.deleteFile(`${CONFIG.contentPath}/posts/${post.file}`, mf.sha, `Delete: ${post.title}`);
    }
    m.posts.splice(idx, 1);
    await GitHubAPI.putFile(`${CONFIG.contentPath}/posts.json`, JSON.stringify(m, null, 2), `Remove ${post.title}`, f.sha);
    ContentService.invalidateCache();
}

async function loadAdminFiles() {
    const c = document.getElementById('admin-tab-content');
    c.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
    try {
        const r = await fetch(`https://api.github.com/repos/${CONFIG.github.username}/${CONFIG.github.repo}/contents/${CONFIG.uploadsPath}`, { headers: GitHubAPI.headers() });
        const items = r.ok ? await r.json() : [];
        let all = [];
        for (const item of (Array.isArray(items) ? items : [])) {
            if (item.type === 'dir') {
                const sr = await fetch(item.url, { headers: GitHubAPI.headers() });
                if (sr.ok) all = all.concat((await sr.json()).filter(f => f.type === 'file' && f.name !== '.gitkeep'));
            } else if (item.type === 'file' && item.name !== '.gitkeep') all.push(item);
        }
        if (!all.length) { c.innerHTML = '<div class="empty-state"><h3>No files</h3><a href="#/admin/upload" class="btn btn-primary" style="margin-top:12px;">Upload</a></div>'; return; }
        c.innerHTML = `<div class="admin-posts-list">${all.map(f => `
            <div class="admin-post-item"><div class="admin-post-info"><h4>${Utils.escapeHtml(f.name)}</h4><p>${f.path} &middot; ${(f.size/1024).toFixed(1)} KB</p></div>
                <div class="admin-post-actions"><button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText('${f.path}');showToast('Copied!');">Copy Path</button></div></div>`).join('')}</div>`;
    } catch (e) { c.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${e.message}</p></div>`; }
}

// ── Editor (with draft, media, repo fields) ──

async function renderEditorPage({ slug } = {}) {
    if (!GitHubAPI.isAuthenticated()) { renderAdminLogin(); return; }
    const isEdit = !!slug;
    let post = null, existingBody = '';
    if (isEdit) {
        post = await ContentService.getPost(slug);
        if (!post) { showToast('Not found', 'error'); window.location.hash = '#/admin'; return; }
        existingBody = post.body || '';
    }

    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="editor-container">
        <div class="editor-toolbar">
            <div class="editor-toolbar-left"><a href="#/admin" class="btn btn-ghost btn-sm">&#8592; Dashboard</a><span style="color:var(--color-text-muted);font-size:0.9rem;">${isEdit ? 'Edit' : 'New'} Post</span></div>
            <div class="editor-toolbar-right"><button class="btn btn-primary btn-sm" id="editor-save">${isEdit ? 'Update' : 'Publish'}</button></div>
        </div>
        <div class="editor-meta">
            <div class="form-group"><label class="form-label">Title</label><input type="text" class="form-input" id="ed-title" value="${isEdit ? Utils.escapeHtml(post.title) : ''}"></div>
            <div class="form-group"><label class="form-label">Slug</label><input type="text" class="form-input" id="ed-slug" value="${isEdit ? slug : ''}" ${isEdit ? 'readonly' : ''}></div>
            <div class="form-group"><label class="form-label">Description</label><input type="text" class="form-input" id="ed-desc" value="${isEdit ? Utils.escapeHtml(post.description||'') : ''}"></div>
            <div class="form-group"><label class="form-label">Category</label><input type="text" class="form-input" id="ed-cat" value="${isEdit ? Utils.escapeHtml(post.category||'') : ''}"></div>
            <div class="form-group"><label class="form-label">Tags (comma separated)</label><input type="text" class="form-input" id="ed-tags" value="${isEdit && post.tags ? post.tags.join(', ') : ''}"></div>
            <div class="form-group"><label class="form-label">Cover Image Path</label><input type="text" class="form-input" id="ed-image" value="${isEdit ? Utils.escapeHtml(post.image||'') : ''}"></div>
            <div class="form-group"><label class="form-label">Type</label>
                <select class="form-select" id="ed-type">
                    <option value="article" ${!isEdit || post.type === 'article' ? 'selected' : ''}>Article</option>
                    <option value="pdf" ${isEdit && post.type === 'pdf' ? 'selected' : ''}>PDF</option>
                    <option value="repo" ${isEdit && post.type === 'repo' ? 'selected' : ''}>Repo</option>
                    <option value="doc" ${isEdit && post.type === 'doc' ? 'selected' : ''}>Doc</option>
                </select></div>
            <div class="form-group"><label class="form-label">Kind (which tab does this appear in?)</label>
                <select class="form-select" id="ed-kind">
                    <option value="blog" ${(!isEdit || (post.kind || (post.type === 'repo' ? 'project' : 'blog')) === 'blog') ? 'selected' : ''}>Blog post</option>
                    <option value="project" ${(isEdit && (post.kind === 'project' || (!post.kind && post.type === 'repo'))) ? 'selected' : ''}>Project (showcase)</option>
                </select></div>
            <div class="form-group"><label class="form-label">Collection (groups posts as a series)</label>
                <input type="text" class="form-input" id="ed-collection" placeholder="e.g. intro-to-ml" value="${isEdit && post.collection ? Utils.escapeHtml(post.collection) : ''}"></div>
            <div class="form-group"><label class="form-label">Order (within collection)</label>
                <input type="number" class="form-input" id="ed-order" placeholder="1" value="${isEdit && post.order != null ? post.order : ''}"></div>
            <div class="form-group"><label class="form-label" style="display:flex;align-items:center;gap:8px;">
                <input type="checkbox" id="ed-featured" ${isEdit && post.featured ? 'checked' : ''}> Featured (pin to top)</label></div>
            <div class="form-group"><label class="form-label" style="display:flex;align-items:center;gap:8px;">
                <input type="checkbox" id="ed-draft" ${isEdit && post.draft ? 'checked' : ''}> Draft (hidden from feed)</label></div>
            <div class="form-group" id="ed-pdf-group" style="${isEdit && post.type === 'pdf' ? '' : 'display:none;'}">
                <label class="form-label">PDF File</label>
                <input type="text" class="form-input" id="ed-pdf" placeholder="uploads/pdfs/file.pdf" value="${isEdit && post.pdf ? Utils.escapeHtml(post.pdf) : ''}">
                <div class="editor-pdf-upload" id="ed-pdf-upload">
                    <div>&#128196; Click or drop a PDF here to upload</div>
                    <div class="editor-pdf-upload-state" id="ed-pdf-upload-state"></div>
                    <div class="editor-pdf-upload-progress" id="ed-pdf-upload-progress" style="display:none;">
                        <div class="editor-pdf-upload-progress-bar" id="ed-pdf-upload-bar" style="width:0%;"></div>
                    </div>
                    <input type="file" id="ed-pdf-file" accept="application/pdf" hidden>
                </div></div>
            <div class="form-group" id="ed-repo-group" style="${isEdit && post.type === 'repo' ? '' : 'display:none;'}">
                <label class="form-label">Repo URL</label><input type="text" class="form-input" id="ed-repo" placeholder="https://github.com/user/repo" value="${isEdit && post.repo ? Utils.escapeHtml(post.repo) : ''}"></div>
            <div class="form-group" id="ed-media-group">
                <label class="form-label">Media Embed</label>
                <select class="form-select" id="ed-media-type" style="margin-bottom:8px;">
                    <option value="none" ${!isEdit || !post.media ? 'selected' : ''}>None</option>
                    <option value="youtube" ${isEdit && post.media?.type === 'youtube' ? 'selected' : ''}>YouTube</option>
                    <option value="audio" ${isEdit && post.media?.type === 'audio' ? 'selected' : ''}>Audio</option>
                    <option value="gif" ${isEdit && post.media?.type === 'gif' ? 'selected' : ''}>GIF</option>
                </select>
                <input type="text" class="form-input" id="ed-media-url" placeholder="Media URL" value="${isEdit && post.media?.url ? Utils.escapeHtml(post.media.url) : ''}" style="${isEdit && post.media ? '' : 'display:none;'}">
            </div>
        </div>
        <div class="editor-split" id="ed-split">
            <div class="editor-pane">
                <div class="editor-pane-header">
                    <span>Markdown</span>
                    <div class="md-toolbar" id="md-toolbar">
                        <button type="button" class="md-btn" data-action="bold" title="Bold (Ctrl+B)"><b>B</b></button>
                        <button type="button" class="md-btn" data-action="italic" title="Italic (Ctrl+I)"><i>I</i></button>
                        <button type="button" class="md-btn" data-action="strikethrough" title="Strikethrough"><s>S</s></button>
                        <span class="md-sep"></span>
                        <button type="button" class="md-btn" data-action="h2" title="Heading 2">H2</button>
                        <button type="button" class="md-btn" data-action="h3" title="Heading 3">H3</button>
                        <span class="md-sep"></span>
                        <button type="button" class="md-btn" data-action="link" title="Link">&#128279;</button>
                        <button type="button" class="md-btn" data-action="image" title="Image">&#128247;</button>
                        <button type="button" class="md-btn" data-action="code" title="Inline Code">&lt;/&gt;</button>
                        <button type="button" class="md-btn" data-action="codeblock" title="Code Block">&#9635;</button>
                        <span class="md-sep"></span>
                        <button type="button" class="md-btn" data-action="ul" title="Bullet List">&#8226;</button>
                        <button type="button" class="md-btn" data-action="ol" title="Numbered List">1.</button>
                        <button type="button" class="md-btn" data-action="quote" title="Blockquote">&#8221;</button>
                        <button type="button" class="md-btn" data-action="table" title="Table">&#9638;</button>
                        <button type="button" class="md-btn" data-action="hr" title="Horizontal Rule">&#8213;</button>
                        <span class="md-sep"></span>
                        <button type="button" class="md-btn md-btn-mermaid" data-action="mermaid" title="Mermaid Diagram">&#9672; Mermaid</button>
                    </div>
                </div>
                <textarea class="editor-textarea" id="ed-body">${existingBody}</textarea>
            </div>
            <div class="editor-pane"><div class="editor-pane-header"><span>Preview</span></div><div class="editor-preview post-content" id="ed-preview"></div></div>
        </div>
    </div>`;

    // Type field toggles
    const typeEl = document.getElementById('ed-type');
    typeEl.addEventListener('change', () => {
        document.getElementById('ed-pdf-group').style.display = typeEl.value === 'pdf' ? '' : 'none';
        document.getElementById('ed-repo-group').style.display = typeEl.value === 'repo' ? '' : 'none';
        document.getElementById('ed-split').style.display = typeEl.value === 'repo' ? 'none' : '';
    });
    if (isEdit && post.type === 'repo') document.getElementById('ed-split').style.display = 'none';

    // Media type toggle
    document.getElementById('ed-media-type').addEventListener('change', (e) => {
        document.getElementById('ed-media-url').style.display = e.target.value === 'none' ? 'none' : '';
    });

    // PDF inline upload — drag/drop or click
    const pdfDrop  = document.getElementById('ed-pdf-upload');
    const pdfInput = document.getElementById('ed-pdf-file');
    const pdfPathInput = document.getElementById('ed-pdf');
    const pdfState = document.getElementById('ed-pdf-upload-state');
    const pdfProg  = document.getElementById('ed-pdf-upload-progress');
    const pdfBar   = document.getElementById('ed-pdf-upload-bar');

    if (pdfDrop) {
        pdfDrop.addEventListener('click', (e) => {
            // ignore clicks on the path input itself
            if (e.target.tagName === 'INPUT') return;
            pdfInput.click();
        });
        pdfDrop.addEventListener('dragover', (e) => { e.preventDefault(); pdfDrop.classList.add('drag-over'); });
        pdfDrop.addEventListener('dragleave', () => pdfDrop.classList.remove('drag-over'));
        pdfDrop.addEventListener('drop', (e) => {
            e.preventDefault();
            pdfDrop.classList.remove('drag-over');
            if (e.dataTransfer.files[0]) handlePdfUpload(e.dataTransfer.files[0]);
        });
        pdfInput.addEventListener('change', (e) => {
            if (e.target.files[0]) handlePdfUpload(e.target.files[0]);
        });
    }

    async function handlePdfUpload(file) {
        if (file.type && file.type !== 'application/pdf') {
            showToast('Not a PDF', 'error'); return;
        }
        const sizeMb = (file.size / 1024 / 1024).toFixed(1);
        if (file.size > GitHubAPI.GITHUB_FILE_LIMIT) {
            showToast(`File too large (${sizeMb} MB) — GitHub limit 100 MB`, 'error');
            return;
        }
        if (file.size > GitHubAPI.UPLOAD_WARN_LIMIT) {
            showToast(`Large file (${sizeMb} MB) — upload may take a while`, 'info');
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${CONFIG.uploadsPath}/pdfs/${safeName}`;
        pdfState.textContent = `Uploading ${safeName} (${sizeMb} MB)…`;
        pdfState.style.color = 'var(--color-text-secondary)';
        pdfProg.style.display = '';
        pdfBar.style.width = '0%';
        try {
            await GitHubAPI.uploadBinary(path, file, `Upload PDF: ${safeName}`,
                (frac) => { pdfBar.style.width = `${Math.round(frac * 100)}%`; });
            pdfPathInput.value = path;
            pdfState.innerHTML = `Uploaded &#10004; <code>${Utils.escapeHtml(path)}</code>`;
            pdfState.style.color = 'var(--color-success)';
            showToast('PDF uploaded', 'success');
        } catch (e) {
            pdfState.textContent = `Upload failed: ${e.message}`;
            pdfState.style.color = 'var(--color-danger)';
            showToast(`Upload failed: ${e.message}`, 'error');
        }
    }

    // Auto slug
    if (!isEdit) {
        document.getElementById('ed-title').addEventListener('input', (e) => {
            document.getElementById('ed-slug').value = Utils.slugify(e.target.value);
        });
    }

    // Markdown toolbar actions
    const edBody = document.getElementById('ed-body');
    document.getElementById('md-toolbar').addEventListener('click', (e) => {
        const btn = e.target.closest('.md-btn');
        if (!btn) return;
        const action = btn.dataset.action;
        const ta = edBody;
        const start = ta.selectionStart, end = ta.selectionEnd;
        const sel = ta.value.substring(start, end);
        let insert = '', cursorOffset = 0;

        switch (action) {
            case 'bold':    insert = `**${sel || 'bold text'}**`; cursorOffset = sel ? 0 : -2; break;
            case 'italic':  insert = `*${sel || 'italic text'}*`; cursorOffset = sel ? 0 : -1; break;
            case 'strikethrough': insert = `~~${sel || 'text'}~~`; cursorOffset = sel ? 0 : -2; break;
            case 'h2':      insert = `\n## ${sel || 'Heading 2'}\n`; break;
            case 'h3':      insert = `\n### ${sel || 'Heading 3'}\n`; break;
            case 'link':    insert = `[${sel || 'link text'}](url)`; cursorOffset = sel ? -1 : -4; break;
            case 'image':   insert = `![${sel || 'alt text'}](image-url)`; cursorOffset = sel ? -1 : -10; break;
            case 'code':    insert = `\`${sel || 'code'}\``; cursorOffset = sel ? 0 : -1; break;
            case 'codeblock': insert = `\n\`\`\`\n${sel || 'code here'}\n\`\`\`\n`; cursorOffset = sel ? 0 : -5; break;
            case 'ul':      insert = `\n- ${sel || 'list item'}\n`; break;
            case 'ol':      insert = `\n1. ${sel || 'list item'}\n`; break;
            case 'quote':   insert = `\n> ${sel || 'quote'}\n`; break;
            case 'hr':      insert = `\n---\n`; break;
            case 'table':
                insert = `\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n`;
                break;
            case 'mermaid':
                insert = `\n\`\`\`mermaid\n${sel || 'graph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Result 1]\n    B -->|No| D[Result 2]'}\n\`\`\`\n`;
                break;
            default: return;
        }

        ta.focus();
        ta.setRangeText(insert, start, end, 'end');
        if (cursorOffset) ta.selectionStart = ta.selectionEnd = ta.selectionEnd + cursorOffset;
        ta.dispatchEvent(new Event('input'));
    });

    // Keyboard shortcuts in editor
    edBody.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            document.querySelector('.md-btn[data-action="bold"]').click();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            document.querySelector('.md-btn[data-action="italic"]').click();
        }
        // Tab key inserts 4 spaces instead of changing focus
        if (e.key === 'Tab') {
            e.preventDefault();
            const s = edBody.selectionStart, end = edBody.selectionEnd;
            edBody.setRangeText('    ', s, end, 'end');
            edBody.dispatchEvent(new Event('input'));
        }
    });

    // ── Draft autosave ──
    // Snapshots all editor fields to localStorage every 2s of inactivity.
    // On load, if a draft exists for this slug (or the "new" key), offer it.
    const DRAFT_KEY = `editor_draft:${isEdit ? slug : '__new'}`;
    function captureDraft() {
        return {
            ts: Date.now(),
            title: document.getElementById('ed-title')?.value || '',
            slug: document.getElementById('ed-slug')?.value || '',
            description: document.getElementById('ed-desc')?.value || '',
            category: document.getElementById('ed-cat')?.value || '',
            tags: document.getElementById('ed-tags')?.value || '',
            image: document.getElementById('ed-image')?.value || '',
            type: document.getElementById('ed-type')?.value || 'article',
            collection: document.getElementById('ed-collection')?.value || '',
            kind: document.getElementById('ed-kind')?.value || 'blog',
            order: document.getElementById('ed-order')?.value || '',
            featured: document.getElementById('ed-featured')?.checked || false,
            draft: document.getElementById('ed-draft')?.checked || false,
            pdf: document.getElementById('ed-pdf')?.value || '',
            repo: document.getElementById('ed-repo')?.value || '',
            mediaType: document.getElementById('ed-media-type')?.value || 'none',
            mediaUrl: document.getElementById('ed-media-url')?.value || '',
            body: document.getElementById('ed-body')?.value || '',
        };
    }
    const saveDraft = Utils.debounce(() => {
        try {
            const d = captureDraft();
            // Don't save empty drafts.
            if (!d.title && !d.body) return;
            localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
        } catch {}
    }, 2000);

    // Restore prompt: if there's a draft newer than what we just rendered, offer it.
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
            const d = JSON.parse(raw);
            const ageMin = Math.round((Date.now() - (d.ts || 0)) / 60000);
            const currentBody = document.getElementById('ed-body').value;
            if (d.body && d.body !== currentBody) {
                const restore = confirm(`A local draft from ~${ageMin} min ago exists. Restore it?`);
                if (restore) {
                    document.getElementById('ed-title').value = d.title;
                    document.getElementById('ed-slug').value = d.slug;
                    document.getElementById('ed-desc').value = d.description;
                    document.getElementById('ed-cat').value = d.category;
                    document.getElementById('ed-tags').value = d.tags;
                    document.getElementById('ed-image').value = d.image;
                    document.getElementById('ed-type').value = d.type;
                    document.getElementById('ed-type').dispatchEvent(new Event('change'));
                    document.getElementById('ed-collection').value = d.collection;
                    if (document.getElementById('ed-kind') && d.kind) document.getElementById('ed-kind').value = d.kind;
                    document.getElementById('ed-order').value = d.order;
                    document.getElementById('ed-featured').checked = d.featured;
                    document.getElementById('ed-draft').checked = d.draft;
                    document.getElementById('ed-pdf').value = d.pdf;
                    document.getElementById('ed-repo').value = d.repo;
                    document.getElementById('ed-media-type').value = d.mediaType;
                    document.getElementById('ed-media-type').dispatchEvent(new Event('change'));
                    document.getElementById('ed-media-url').value = d.mediaUrl;
                    document.getElementById('ed-body').value = d.body;
                }
            }
        }
    } catch {}

    // Listen on every input in the editor for autosave.
    document.querySelector('.editor-container').addEventListener('input', saveDraft);
    document.querySelector('.editor-container').addEventListener('change', saveDraft);

    // Live preview with full rendering (highlight.js, mermaid, YouTube, tables)
    const textarea = document.getElementById('ed-body');
    const preview = document.getElementById('ed-preview');
    let _editorHljs = null;
    async function updatePreview() {
        if (!_editorHljs) {
            try { _editorHljs = await LibLoader.loadHighlightJs(); } catch (e) { _editorHljs = null; }
        }
        configureMarked({ hljs: _editorHljs });
        await renderMarkdownInto(preview, textarea.value || '*Start typing...*');
        renderMermaidBlocks('#ed-preview');
    }
    textarea.addEventListener('input', Utils.debounce(updatePreview, 400));
    updatePreview();

    // Save
    document.getElementById('editor-save').addEventListener('click', async () => {
        const title = document.getElementById('ed-title').value.trim();
        const postSlug = document.getElementById('ed-slug').value.trim();
        if (!title || !postSlug) { showToast('Title and slug required', 'error'); return; }

        const desc = document.getElementById('ed-desc').value.trim();
        const cat = document.getElementById('ed-cat').value.trim();
        const tags = document.getElementById('ed-tags').value.trim().split(',').map(t => t.trim()).filter(Boolean);
        const image = document.getElementById('ed-image').value.trim();
        const type = document.getElementById('ed-type').value;
        const draft = document.getElementById('ed-draft').checked;
        const featured = document.getElementById('ed-featured').checked;
        const kind = document.getElementById('ed-kind')?.value || 'blog';
        const collection = document.getElementById('ed-collection').value.trim();
        const orderRaw = document.getElementById('ed-order').value.trim();
        const order = orderRaw ? parseInt(orderRaw, 10) : null;
        const pdfPath = document.getElementById('ed-pdf').value.trim();
        const repoUrl = document.getElementById('ed-repo').value.trim();
        const mediaType = document.getElementById('ed-media-type').value;
        const mediaUrl = document.getElementById('ed-media-url').value.trim();
        const body = textarea.value;
        const date = isEdit ? post.date : new Date().toISOString().split('T')[0];
        const fileName = `${postSlug}.md`;

        const entry = { slug: postSlug, title, description: desc, date, category: cat, tags, image, type, draft };
        if (type !== 'repo') entry.file = fileName;
        if (type === 'pdf' && pdfPath) entry.pdf = pdfPath;
        if (type === 'repo' && repoUrl) entry.repo = repoUrl;
        if (mediaType !== 'none' && mediaUrl) entry.media = { type: mediaType, url: mediaUrl };
        if (featured) entry.featured = true;
        if (collection) entry.collection = collection;
        if (order != null && !Number.isNaN(order)) entry.order = order;
        if (kind && kind !== 'blog') entry.kind = kind;

        try {
            document.getElementById('editor-save').disabled = true;
            document.getElementById('editor-save').textContent = 'Saving...';

            // Save markdown file (skip for repo type)
            if (type !== 'repo') {
                const fm = ['---', `title: "${title}"`, `description: "${desc}"`, `date: "${date}"`, `category: "${cat}"`,
                    `tags: [${tags.map(t => `"${t}"`).join(', ')}]`, image ? `image: "${image}"` : null,
                    `type: "${type}"`, type === 'pdf' && pdfPath ? `pdf: "${pdfPath}"` : null, `draft: ${draft}`, '---'].filter(Boolean).join('\n');
                let mdSha = null;
                if (isEdit) { const ex = await GitHubAPI.getFile(`${CONFIG.contentPath}/posts/${fileName}`); if (ex) mdSha = ex.sha; }
                await GitHubAPI.putFile(`${CONFIG.contentPath}/posts/${fileName}`, `${fm}\n\n${body}`, `${isEdit ? 'Update' : 'Add'}: ${title}`, mdSha);
            }

            // Update manifest
            const mf = await GitHubAPI.getFile(`${CONFIG.contentPath}/posts.json`);
            let manifest = { posts: [] }, mSha = null;
            if (mf) { manifest = JSON.parse(mf.content); mSha = mf.sha; }
            const idx = manifest.posts.findIndex(p => p.slug === postSlug);
            if (idx >= 0) manifest.posts[idx] = entry; else manifest.posts.push(entry);
            await GitHubAPI.putFile(`${CONFIG.contentPath}/posts.json`, JSON.stringify(manifest, null, 2), `Manifest: ${title}`, mSha);

            ContentService.invalidateCache();
            try { localStorage.removeItem(DRAFT_KEY); } catch {}
            showToast(isEdit ? 'Updated!' : 'Published!', 'success');
            window.location.hash = '#/admin';
        } catch (e) {
            showToast('Save failed: ' + e.message, 'error');
            document.getElementById('editor-save').disabled = false;
            document.getElementById('editor-save').textContent = isEdit ? 'Update' : 'Publish';
        }
    });
}

// ── Upload page ──

function renderUploadPage() {
    if (!GitHubAPI.isAuthenticated()) { renderAdminLogin(); return; }
    document.getElementById('app').innerHTML = `
    <div class="editor-container">
        <div class="editor-toolbar"><div class="editor-toolbar-left"><a href="#/admin" class="btn btn-ghost btn-sm">&#8592; Dashboard</a><span style="color:var(--color-text-muted);font-size:0.9rem;">Upload Files</span></div></div>
        <div class="form-row" style="margin-bottom:24px;">
            <div><h3 style="margin-bottom:16px;">Images</h3>
                <div class="file-upload-area" id="img-area"><div class="file-upload-icon">&#128247;</div><p><strong>Drop images here</strong> or click</p><input type="file" id="img-input" accept="image/*" multiple hidden></div>
                <div class="uploaded-files" id="img-list"></div></div>
            <div><h3 style="margin-bottom:16px;">PDFs</h3>
                <div class="file-upload-area" id="pdf-area"><div class="file-upload-icon">&#128196;</div><p><strong>Drop PDFs here</strong> or click</p><input type="file" id="pdf-input" accept=".pdf" multiple hidden></div>
                <div class="uploaded-files" id="pdf-list"></div></div>
        </div></div>`;

    function setup(areaId, inputId, listId, subdir) {
        const area = document.getElementById(areaId), input = document.getElementById(inputId), list = document.getElementById(listId);
        area.addEventListener('click', () => input.click());
        area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag-over'); });
        area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
        area.addEventListener('drop', e => { e.preventDefault(); area.classList.remove('drag-over'); handle(e.dataTransfer.files); });
        input.addEventListener('change', e => handle(e.target.files));
        async function handle(files) {
            for (const file of files) {
                const name = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const path = `${CONFIG.uploadsPath}/${subdir}/${name}`;
                const item = document.createElement('div'); item.className = 'uploaded-file';
                const sizeMb = (file.size / 1024 / 1024).toFixed(1);
                item.innerHTML = `
                    <span>${Utils.escapeHtml(name)} <span style="color:var(--color-text-muted);font-size:0.8em;">(${sizeMb} MB)</span></span>
                    <span class="upload-status" style="color:var(--color-text-muted);">uploading...</span>
                    <div class="editor-pdf-upload-progress"><div class="editor-pdf-upload-progress-bar" style="width:0%;"></div></div>`;
                list.appendChild(item);
                if (file.size > GitHubAPI.UPLOAD_WARN_LIMIT) {
                    showToast(`Large file (${sizeMb} MB) — upload may take a while`, 'info');
                }
                const status = item.querySelector('.upload-status');
                const bar = item.querySelector('.editor-pdf-upload-progress-bar');
                try {
                    await GitHubAPI.uploadBinary(path, file, `Upload ${subdir}: ${name}`,
                        (frac) => { bar.style.width = `${Math.round(frac * 100)}%`; });
                    item.innerHTML = `<span>${Utils.escapeHtml(name)}</span>
                        <button class="uploaded-file-remove" data-path="${Utils.escapeHtml(path)}">Copy Path</button>`;
                    item.querySelector('button').addEventListener('click', () => {
                        navigator.clipboard.writeText(path).then(() => showToast('Copied!', 'success'));
                    });
                    showToast(`Uploaded: ${name}`, 'success');
                } catch (e) {
                    status.textContent = e.message || 'failed';
                    status.style.color = 'var(--color-danger)';
                    bar.style.background = 'var(--color-danger)';
                }
            }
        }
    }
    setup('img-area', 'img-input', 'img-list', 'images');
    setup('pdf-area', 'pdf-input', 'pdf-list', 'pdfs');
}

/* ============================================
   Phase 6b: Collections (post series)
   ============================================ */

async function renderCollectionsIndex() {
    Head.set({ title: 'Collections', description: 'Series of related posts.' });
    const app = document.getElementById('app');
    const posts = await ContentService.getPosts();

    // Group posts by collection
    const groups = new Map();
    posts.forEach(p => {
        if (!p.collection) return;
        if (!groups.has(p.collection)) groups.set(p.collection, []);
        groups.get(p.collection).push(p);
    });

    if (groups.size === 0) {
        app.innerHTML = `<div class="collection-detail">
            <a href="#/" class="post-back">&#8592; Back to feed</a>
            <h1>Collections</h1>
            <p class="collection-desc">No collections yet. Add a <code>collection</code> field to a post to start one.</p>
        </div>`;
        return;
    }

    // Sort each group by order then date.
    const cards = [];
    for (const [name, list] of groups) {
        list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || new Date(a.date) - new Date(b.date));
        cards.push({ slug: name, name, count: list.length, posts: list.slice(0, 3) });
    }
    cards.sort((a, b) => b.count - a.count);

    app.innerHTML = `
        <div class="collection-detail">
            <a href="#/" class="post-back">&#8592; Back to feed</a>
            <h1>Collections</h1>
            <p class="collection-desc">Series of related posts grouped by topic.</p>
            <div class="collections-grid">
                ${cards.map(c => `
                    <a class="collection-card" href="#/collection/${encodeURIComponent(c.slug)}">
                        <h3>${Utils.escapeHtml(c.name.replace(/-/g, ' '))}</h3>
                        <span class="count">${c.count} post${c.count === 1 ? '' : 's'}</span>
                        <div class="collection-card-list">
                            ${c.posts.map(p => `<span>&#9656; ${Utils.escapeHtml(p.title)}</span>`).join('')}
                        </div>
                    </a>`).join('')}
            </div>
        </div>`;
}

async function renderCollectionDetail({ slug }) {
    const app = document.getElementById('app');
    const posts = await ContentService.getPosts();
    const list = posts.filter(p => p.collection === slug);
    if (list.length === 0) {
        app.innerHTML = `<div class="collection-detail">
            <a href="#/collections" class="post-back">&#8592; Back to collections</a>
            <h1>Not found</h1>
            <p class="collection-desc">No posts in this collection.</p>
        </div>`;
        return;
    }
    list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || new Date(a.date) - new Date(b.date));

    app.innerHTML = `
        <div class="collection-detail">
            <a href="#/collections" class="post-back">&#8592; All collections</a>
            <h1>${Utils.escapeHtml(slug.replace(/-/g, ' '))}</h1>
            <p class="collection-desc">${list.length} post${list.length === 1 ? '' : 's'} in this series.</p>
            ${list.map((p, i) => {
                const link = p.type === 'pdf' ? `#/pdf/${p.slug}` : `#/post/${p.slug}`;
                return `<a class="collection-step" href="${link}">
                    <div class="collection-step-num">${i + 1}</div>
                    <div class="collection-step-info">
                        <h4>${Utils.escapeHtml(p.title)}</h4>
                        <p>${Utils.escapeHtml(p.description || '')}</p>
                    </div>
                </a>`;
            }).join('')}
        </div>`;
}

/* ============================================
   Phase 6d: Tag & Category index pages
   ============================================ */

async function renderTagPage({ slug }) {
    const decoded = decodeURIComponent(slug);
    Head.set({ title: `Tag: ${decoded}`, description: `Posts tagged "${decoded}".` });
    const app = document.getElementById('app');
    const posts = await ContentService.getPosts();
    const filtered = posts.filter(p => (p.tags || []).includes(decoded));
    renderTaxonomyPage(app, `Tag: ${decoded}`, filtered, '#/');
}

async function renderCategoryPage({ slug }) {
    const decoded = decodeURIComponent(slug);
    Head.set({ title: `Category: ${decoded}`, description: `Posts in "${decoded}".` });
    const app = document.getElementById('app');
    const posts = await ContentService.getPosts();
    const filtered = posts.filter(p => p.category === decoded);
    renderTaxonomyPage(app, `Category: ${decoded.replace(/-/g, ' ')}`, filtered, '#/');
}

function renderTaxonomyPage(app, heading, posts, backHref) {
    if (!posts.length) {
        app.innerHTML = `<div class="collection-detail">
            <a href="${backHref}" class="post-back">&#8592; Back</a>
            <h1>${Utils.escapeHtml(heading)}</h1>
            <p class="collection-desc">No posts found.</p>
        </div>`;
        return;
    }
    app.innerHTML = `
        <div class="collection-detail">
            <a href="${backHref}" class="post-back">&#8592; Back to feed</a>
            <h1>${Utils.escapeHtml(heading)}</h1>
            <p class="collection-desc">${posts.length} post${posts.length === 1 ? '' : 's'}.</p>
            <div class="feed-list">
                ${posts.map(p => renderFeedItem(p)).join('')}
            </div>
        </div>`;
    initInlinePdfs();
}

/* ============================================
   Phase 6c: Docs (GitHub-Pages style)
   ============================================ */

async function renderDocsPage({ slug } = {}) {
    const app = document.getElementById('app');
    const posts = await ContentService.getPosts();
    const docs = posts.filter(p => p.type === 'doc');
    Head.set({ title: 'Docs', description: 'Documentation and tutorials.' });

    if (docs.length === 0) {
        app.innerHTML = `<div class="collection-detail">
            <a href="#/" class="post-back">&#8592; Back to feed</a>
            <h1>Documentation</h1>
            <p class="collection-desc">No docs yet. Add a post with <code>type: "doc"</code> to start writing.</p>
        </div>`;
        return;
    }

    // Group docs by collection (sidebar sections)
    const groups = new Map();
    docs.forEach(d => {
        const g = d.collection || 'General';
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(d);
    });
    for (const list of groups.values()) {
        list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    }

    const target = slug ? docs.find(d => d.slug === slug) : docs[0];
    if (!target) { app.innerHTML = '<p style="padding:48px;text-align:center;">Doc not found.</p>'; return; }

    Head.set({
        title: target.title || 'Docs',
        description: target.description || 'Documentation and tutorials.',
    });

    app.innerHTML = `
        <button class="docs-mobile-toggle" type="button" id="docs-nav-toggle" aria-label="Show documentation menu">&#9776; Docs menu</button>
        <div class="docs-layout">
            <aside class="docs-sidebar" id="docs-sidebar">
                ${[...groups.entries()].map(([name, list]) => `
                    <h4>${Utils.escapeHtml(name.replace(/-/g, ' '))}</h4>
                    ${list.map(d => `
                        <a class="${d.slug === target.slug ? 'active' : ''}" href="#/docs/${d.slug}">
                            ${Utils.escapeHtml(d.title)}
                        </a>`).join('')}
                `).join('')}
            </aside>
            <article class="docs-content post-content" id="docs-content">
                <div class="loading-state"><div class="spinner"></div></div>
            </article>
            <aside class="toc" id="docs-toc" aria-label="On this page" hidden>
                <div class="toc-header">On this page</div>
                <nav id="docs-toc-nav"></nav>
            </aside>
        </div>
        <button class="toc-mobile-toggle" type="button" id="toc-mobile-toggle" aria-label="Show on-page contents" hidden>&#9776; Contents</button>
    `;

    // Wire mobile docs-sidebar toggle
    const navToggle = document.getElementById('docs-nav-toggle');
    const sidebar = document.getElementById('docs-sidebar');
    if (navToggle && sidebar) {
        navToggle.addEventListener('click', () => {
            const open = sidebar.getAttribute('data-mobile-open') === '1';
            sidebar.setAttribute('data-mobile-open', open ? '0' : '1');
        });
    }

    // Load and render the target doc
    const post = await ContentService.getPost(target.slug);
    if (!post) {
        document.getElementById('docs-content').innerHTML = '<p>Doc could not be loaded.</p>';
        return;
    }

    // Same configureMarked path as posts so headings are slugged into a TOC.
    const hljs = await LibLoader.loadHighlightJs();
    const docTocItems = [];
    configureMarked({ hljs, tocItems: docTocItems });
    await renderMarkdownInto(document.getElementById('docs-content'), post.body);
    renderMermaidBlocks('#docs-content');

    // Populate the on-this-page TOC if the doc has enough headings.
    if (docTocItems.length > 1) {
        const tocAside = document.getElementById('docs-toc');
        const tocNav = document.getElementById('docs-toc-nav');
        tocNav.innerHTML = docTocItems.map(item =>
            `<a href="#${item.id}" class="toc-link toc-level-${item.level}" data-id="${item.id}">${Utils.escapeHtml(item.text)}</a>`
        ).join('');
        tocAside.removeAttribute('hidden');
        document.body.classList.add('has-toc');
        Cleanup.add(() => document.body.classList.remove('has-toc'));
        const tocToggle = document.getElementById('toc-mobile-toggle');
        if (tocToggle) {
            tocToggle.removeAttribute('hidden');
            tocToggle.addEventListener('click', () => {
                const open = tocAside.getAttribute('data-mobile-open') === '1';
                tocAside.setAttribute('data-mobile-open', open ? '0' : '1');
            });
        }

        // Active heading tracking
        const links = tocNav.querySelectorAll('a');
        const headings = docTocItems.map(i => document.getElementById(i.id)).filter(Boolean);
        const handler = () => {
            let curr = '';
            headings.forEach(h => { if (h.getBoundingClientRect().top < 140) curr = h.id; });
            links.forEach(a => a.classList.toggle('active', a.dataset.id === curr));
        };
        window.addEventListener('scroll', handler, { passive: true });
        Cleanup.add(() => window.removeEventListener('scroll', handler));
    }
}

/* ============================================
   Phase 7: Route Registration & Init
   ============================================ */

Router.add('/', renderProjectsPage);
Router.add('/blog', renderBlogPage);
Router.add('/post/:slug', renderPostPage);
Router.add('/pdf/:slug', renderPdfPage);
Router.add('/collections', renderCollectionsIndex);
Router.add('/collection/:slug', renderCollectionDetail);
Router.add('/tag/:slug', renderTagPage);
Router.add('/category/:slug', renderCategoryPage);
Router.add('/docs', renderDocsPage);
Router.add('/docs/:slug', renderDocsPage);
Router.add('/admin', renderAdminDashboard);
Router.add('/admin/new', renderEditorPage);
Router.add('/admin/edit/:slug', renderEditorPage);
Router.add('/admin/upload', renderUploadPage);

/* ============================================
   Phase 9: Command Palette (⌘K)
   ============================================ */

const CommandPalette = (() => {
    let overlay = null, input = null, results = null;
    let items = [], activeIdx = -1;

    function build() {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.id = 'cmd-palette-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Command palette');
        overlay.hidden = true;
        overlay.innerHTML = `
            <div class="cmd-palette">
                <div class="cmd-palette-header">
                    <svg class="cmd-palette-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input type="text" class="cmd-palette-input" placeholder="Search posts, docs, tags…" autocomplete="off" spellcheck="false">
                    <kbd class="cmd-palette-esc">esc</kbd>
                </div>
                <div class="cmd-palette-results" role="listbox"></div>
                <div class="cmd-palette-footer">
                    <span><kbd>↑↓</kbd> navigate</span>
                    <span><kbd>⏎</kbd> open</span>
                    <span><kbd>esc</kbd> close</span>
                </div>
            </div>`;
        input = overlay.querySelector('.cmd-palette-input');
        results = overlay.querySelector('.cmd-palette-results');
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        overlay.querySelector('.cmd-palette-esc').addEventListener('click', close);
        input.addEventListener('input', () => render(input.value));
        input.addEventListener('keydown', e => {
            if (e.key === 'Escape') { e.preventDefault(); close(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
            else if (e.key === 'Enter') { e.preventDefault(); selectActive(); }
        });
        document.body.appendChild(overlay);
    }

    async function open() {
        build();
        overlay.hidden = false;
        document.body.classList.add('cmd-open');
        setTimeout(() => { input.focus(); input.select(); }, 10);
        const posts = await ContentService.getPosts();
        render(input.value, posts);
    }

    function close() {
        if (!overlay) return;
        overlay.hidden = true;
        document.body.classList.remove('cmd-open');
        input.value = '';
        results.innerHTML = '';
        items = [];
        activeIdx = -1;
    }

    function render(query, allPosts) {
        const posts = allPosts || ContentService._cache || [];
        const q = query.trim().toLowerCase();
        const filtered = q
            ? posts.filter(p =>
                (p.title || '').toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q) ||
                (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
                (p.category || '').toLowerCase().includes(q))
            : posts.slice(0, 8);

        items = [];
        let html = '';
        const docs = filtered.filter(p => p.type === 'doc').slice(0, 4);
        const others = filtered.filter(p => p.type !== 'doc').slice(0, 6);

        const iconFor = p => p.type === 'pdf' ? '📄' : p.type === 'repo' ? '📦' : p.type === 'doc' ? '📖' : '📝';
        const hrefFor = p => p.type === 'pdf' ? `#/pdf/${p.slug}` : p.type === 'doc' ? `#/docs/${p.slug}` : `#/post/${p.slug}`;

        const row = p => {
            const idx = items.length;
            items.push({ href: hrefFor(p) });
            return `<div class="cmd-item" data-idx="${idx}" role="option">
                <span class="cmd-item-icon">${iconFor(p)}</span>
                <span class="cmd-item-body">
                    <span class="cmd-item-title">${Utils.escapeHtml(p.title)}</span>
                    ${p.description ? `<span class="cmd-item-sub">${Utils.escapeHtml(p.description)}</span>` : ''}
                </span>
                ${p.date ? `<span class="cmd-item-date">${p.date.slice(0, 7)}</span>` : ''}
            </div>`;
        };

        if (others.length) { html += `<div class="cmd-group">${q ? 'Results' : 'Recent Posts'}</div>`; html += others.map(row).join(''); }
        if (docs.length)   { html += `<div class="cmd-group">Documentation</div>`; html += docs.map(row).join(''); }

        if (q) {
            const tagSet = new Set();
            posts.forEach(p => (p.tags || []).forEach(t => { if (t.toLowerCase().includes(q)) tagSet.add(t); }));
            const tags = [...tagSet].slice(0, 3);
            if (tags.length) {
                html += `<div class="cmd-group">Tags</div>`;
                tags.forEach(t => {
                    const idx = items.length;
                    items.push({ href: `#/tag/${encodeURIComponent(t)}` });
                    html += `<div class="cmd-item" data-idx="${idx}" role="option">
                        <span class="cmd-item-icon">#</span>
                        <span class="cmd-item-body"><span class="cmd-item-title">${Utils.escapeHtml(t)}</span></span>
                    </div>`;
                });
            }
        }

        if (!html) html = `<div class="cmd-empty">No results for "<strong>${Utils.escapeHtml(query)}</strong>"</div>`;

        results.innerHTML = html;
        activeIdx = -1;
        results.querySelectorAll('.cmd-item').forEach(el => {
            el.addEventListener('click', () => go(parseInt(el.dataset.idx, 10)));
            el.addEventListener('mouseenter', () => { activeIdx = parseInt(el.dataset.idx, 10); highlight(); });
        });
    }

    function move(dir) {
        if (!items.length) return;
        activeIdx = (activeIdx + dir + items.length) % items.length;
        highlight();
        results.querySelector(`.cmd-item[data-idx="${activeIdx}"]`)?.scrollIntoView({ block: 'nearest' });
    }

    function highlight() {
        results.querySelectorAll('.cmd-item').forEach(el =>
            el.classList.toggle('active', parseInt(el.dataset.idx, 10) === activeIdx));
    }

    function selectActive() {
        if (activeIdx >= 0 && activeIdx < items.length) go(activeIdx);
    }

    function go(idx) {
        const item = items[idx];
        if (!item) return;
        close();
        window.location.hash = item.href;
    }

    return {
        open,
        close,
        init() {
            document.addEventListener('keydown', e => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); open(); }
            });
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape' && overlay && !overlay.hidden) close();
            });
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    // ── Mobile nav drawer ──
    const navMenu = document.getElementById('nav-mobile-menu');
    const navDrawer = document.getElementById('nav-mobile-drawer');
    if (navMenu && navDrawer) {
        const closeDrawer = () => navDrawer.setAttribute('hidden', '');
        const openDrawer  = () => navDrawer.removeAttribute('hidden');
        navMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            navDrawer.hasAttribute('hidden') ? openDrawer() : closeDrawer();
        });
        // Tap a link inside the drawer or anywhere outside → close
        navDrawer.addEventListener('click', (e) => {
            if (e.target.closest('.nav-tab')) closeDrawer();
        });
        document.addEventListener('click', (e) => {
            if (!navDrawer.hasAttribute('hidden')
                && !navDrawer.contains(e.target)
                && !navMenu.contains(e.target)) closeDrawer();
        });
        // Close on route change
        window.addEventListener('hashchange', closeDrawer);
    }

    // ── Theme toggle ──
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const apply = (t) => {
            if (t) document.documentElement.setAttribute('data-theme', t);
            else document.documentElement.removeAttribute('data-theme');
        };
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            // Cycle: (system) → light → dark → system
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const next =
                !current ? (prefersDark ? 'light' : 'dark') :
                current === 'light' ? 'dark' :
                'light';
            try { localStorage.setItem('theme', next); } catch {}
            apply(next);
        });
    }

    // ── Coalesced scroll listener (replaces multiple individual ones) ──
    let scrollRaf = null;
    window.addEventListener('scroll', () => {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(() => {
            scrollRaf = null;
            const y = window.scrollY;
            const nav = document.getElementById('navbar');
            if (nav) nav.classList.toggle('scrolled', y > 10);
            const btt = document.getElementById('back-to-top');
            if (btt) btt.classList.toggle('visible', y > 400);
        });
    }, { passive: true });

    // Back-to-top — visibility is handled by the coalesced scroll listener above.
    const btt = document.getElementById('back-to-top');
    if (btt) btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Admin gear toggle — if already on admin, go home; otherwise go to admin
    const adminBtn = document.querySelector('.nav-action-btn[aria-label="Admin"]');
    if (adminBtn) {
        adminBtn.addEventListener('click', e => {
            e.preventDefault();
            const current = window.location.hash.slice(1) || '/';
            window.location.hash = current.startsWith('/admin') ? '#/' : '#/admin';
        });
    }

    // ⌘K command palette
    CommandPalette.init();
    const cmdBtn = document.getElementById('cmd-palette-btn');
    if (cmdBtn) cmdBtn.addEventListener('click', () => CommandPalette.open());

    // Start router
    Router.init();
});
