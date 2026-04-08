/* ============================================
   Phase 1: Configuration, Utilities & Router
   ============================================ */

const CONFIG = {
    siteName: 'Portfolio',
    siteDescription: 'A personal space for sharing projects, ideas, and explorations.',
    author: 'Your Name',
    authorInitial: 'Y',
    github: { username: 'yourusername', repo: 'yourusername.github.io', branch: 'main' },
    social: {
        github: 'https://github.com/yourusername',
        linkedin: 'https://linkedin.com/in/yourprofile',
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

// ── Router ──

const Router = {
    routes: {},
    currentRoute: null,

    add(pattern, handler) { this.routes[pattern] = handler; },

    resolve() {
        Cleanup.run(); // destroy observers, PDF docs, listeners from previous page
        const hash = window.location.hash.slice(1) || '/';
        window.scrollTo(0, 0);

        // Hide reading progress bar unless on post page
        const prog = document.getElementById('reading-progress');
        if (prog) prog.style.width = '0';

        // Update nav active state
        document.querySelectorAll('.nav-action-btn').forEach(b => b.classList.remove('active'));
        const activeLabel = hash.startsWith('/admin') ? 'Admin' : 'Feed';
        document.querySelector(`.nav-action-btn[aria-label="${activeLabel}"]`)?.classList.add('active');

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
            let body = '';
            if (repoUrl.includes('github.com')) {
                // GitHub: /repos/{owner}/{repo}/readme
                const parts = repoUrl.replace(/\/$/, '').split('/');
                const repo = parts.pop();
                const owner = parts.pop();
                const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`,
                    { headers: { 'Accept': 'application/vnd.github.v3+json' } });
                if (r.ok) {
                    const data = await r.json();
                    body = atob(data.content.replace(/\n/g, ''));
                }
            } else if (repoUrl.includes('huggingface.co')) {
                // HuggingFace: raw README
                const parts = repoUrl.replace(/\/$/, '').split('/');
                const model = parts.pop();
                const owner = parts.pop();
                const r = await fetch(`https://huggingface.co/${owner}/${model}/raw/main/README.md`);
                if (r.ok) body = await r.text();
            }
            // Strip YAML frontmatter from README if present
            const { body: cleanBody } = Utils.parseFrontmatter(body);
            this._readmeCache.set(repoUrl, cleanBody);
            return cleanBody;
        } catch (e) {
            console.error('getRepoReadme:', e);
            this._readmeCache.set(repoUrl, '');
            return '';
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
        if (options.hljs && lang && options.hljs.getLanguage(lang)) {
            const highlighted = options.hljs.highlight(code, { language: lang }).value;
            return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
        }
        if (options.hljs) {
            const highlighted = options.hljs.highlightAuto(code).value;
            return `<pre><code class="hljs">${highlighted}</code></pre>`;
        }
        return `<pre><code>${Utils.escapeHtml(code)}</code></pre>`;
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

    marked.setOptions({ breaks: true, gfm: true, renderer });
    return renderer;
}

/* ============================================
   Phase 3: Feed Page + Feed Item Renderer
   ============================================ */

function renderFeedItem(post) {
    const link = post.type === 'pdf' ? `#/pdf/${post.slug}` : `#/post/${post.slug}`;
    const tags = (post.tags || []).slice(0, 4).map(t =>
        `<span class="tag">${Utils.escapeHtml(t)}</span>`).join('');

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

async function renderFeedPage() {
    const app = document.getElementById('app');
    const allPosts = await ContentService.getPosts();
    const categories = ContentService.getCategories(allPosts);

    // Sync search bar value
    const globalSearch = document.getElementById('global-search');
    const searchVal = globalSearch ? globalSearch.value : '';

    app.innerHTML = `
    <div class="feed-layout">
        <div class="feed-page">
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
            <div id="feed-sentinel" style="height:1px;"></div>
        </div>
        <aside class="feed-sidebar" id="feed-sidebar"></aside>
    </div>`;

    let filtered = [...allPosts];
    let displayed = 0;
    let currentType = 'all';
    let currentCat = 'all';

    function applyFilters() {
        const search = document.getElementById('global-search')?.value || '';
        filtered = ContentService.filterPosts(allPosts, { search, category: currentCat, type: currentType });
        displayed = 0;
        document.getElementById('feed-list').innerHTML = '';
        loadBatch();
    }

    function loadBatch() {
        const list = document.getElementById('feed-list');
        if (!list) return;
        const batch = filtered.slice(displayed, displayed + CONFIG.postsPerPage);

        if (batch.length === 0 && displayed === 0) {
            list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">&#128269;</div><h3>No posts found</h3><p>Try different filters or search terms.</p></div>`;
            return;
        }

        batch.forEach(post => {
            list.insertAdjacentHTML('beforeend', renderFeedItem(post));
        });
        displayed += batch.length;

        // Initialize inline PDFs for the newly added items
        initInlinePdfs();
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

    // Category filter
    document.getElementById('feed-category').addEventListener('change', (e) => {
        currentCat = e.target.value;
        applyFilters();
    });

    // Global search (in navbar) drives feed filter
    if (globalSearch) {
        const handler = Utils.debounce(() => applyFilters(), 300);
        globalSearch.addEventListener('input', handler);
        Cleanup.add(() => globalSearch.removeEventListener('input', handler));
    }

    // Infinite scroll sentinel
    const sentinel = document.getElementById('feed-sentinel');
    if (sentinel) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && displayed < filtered.length) {
                loadBatch();
            }
        }, { rootMargin: '200px' });
        observer.observe(sentinel);
        Cleanup.add(() => observer.disconnect());
    }

    // Initial load
    loadBatch();

    // If search had a value, apply it
    if (searchVal) applyFilters();

    // Populate sidebar
    renderSidebar(allPosts);
}

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
        ${topTags.length ? `
        <div class="sidebar-card">
            <h4>Popular Tags</h4>
            <div class="sidebar-tags">
                ${topTags.map(t => `<span class="sidebar-tag" data-tag="${Utils.escapeHtml(t)}">${Utils.escapeHtml(t)}</span>`).join('')}
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

    // Tag click → set search input and trigger filter
    sidebar.querySelectorAll('.sidebar-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const search = document.getElementById('global-search');
            if (search) {
                search.value = tag.dataset.tag;
                search.dispatchEvent(new Event('input'));
            }
        });
    });
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

    const htmlContent = marked.parse(post.body);
    const readTime = Utils.readingTime(post.body);
    const tags = (post.tags || []).map(t => `<span class="tag tag-primary">${Utils.escapeHtml(t)}</span>`).join('');

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
        ${tocHtml}
        <article class="post-view">
            <div class="post-header">
                <a href="#/" class="post-back">&#8592; Back to feed</a>
                <h1 class="post-title">${Utils.escapeHtml(post.title)}</h1>
                <div class="post-meta-bar">
                    <span>${Utils.formatDate(post.date)}</span>
                    <span class="post-meta-divider"></span>
                    <span>${readTime}</span>
                    ${post.category ? `<span class="post-meta-divider"></span><span>${Utils.escapeHtml(post.category)}</span>` : ''}
                </div>
                ${repoBadge}
            </div>
            ${coverHtml}
            ${mediaHtml}
            <div class="post-content">${htmlContent}</div>
            ${tags ? `<div class="post-tags">${tags}</div>` : ''}
            ${relatedHtml}
        </article>`;

    // Render mermaid diagrams
    renderMermaidBlocks('.post-content');

    // Copy code buttons
    document.querySelectorAll('.post-content pre').forEach(pre => {
        const btn = document.createElement('button');
        btn.className = 'code-copy-btn';
        btn.textContent = 'Copy';
        btn.addEventListener('click', () => {
            const code = pre.querySelector('code');
            navigator.clipboard.writeText(code ? code.textContent : pre.textContent)
                .then(() => { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000); })
                .catch(() => showToast('Copy failed', 'error'));
        });
        pre.style.position = 'relative';
        pre.appendChild(btn);
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

const GitHubAPI = {
    getToken() { return localStorage.getItem('gh_token') || ''; },
    setToken(t) { localStorage.setItem('gh_token', t); },
    clearToken() { localStorage.removeItem('gh_token'); },
    isAuthenticated() { return !!this.getToken(); },
    headers() {
        return { 'Authorization': `token ${this.getToken()}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' };
    },
    async getFile(path) {
        const r = await fetch(`https://api.github.com/repos/${CONFIG.github.username}/${CONFIG.github.repo}/contents/${path}?ref=${CONFIG.github.branch}`, { headers: this.headers() });
        if (!r.ok) return null;
        const d = await r.json();
        return { content: atob(d.content.replace(/\n/g, '')), sha: d.sha };
    },
    async putFile(path, content, message, sha) {
        const body = { message, content: btoa(unescape(encodeURIComponent(content))), branch: CONFIG.github.branch };
        if (sha) body.sha = sha;
        const r = await fetch(`https://api.github.com/repos/${CONFIG.github.username}/${CONFIG.github.repo}/contents/${path}`, { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) });
        if (!r.ok) { const e = await r.json(); throw new Error(e.message || 'Save failed'); }
        return r.json();
    },
    async uploadBinary(path, file, message) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const r = await fetch(`https://api.github.com/repos/${CONFIG.github.username}/${CONFIG.github.repo}/contents/${path}`, {
                        method: 'PUT', headers: this.headers(),
                        body: JSON.stringify({ message, content: reader.result.split(',')[1], branch: CONFIG.github.branch })
                    });
                    if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
                    resolve(await r.json());
                } catch (e) { reject(e); }
            };
            reader.onerror = () => reject(new Error('Read failed'));
            reader.readAsDataURL(file);
        });
    },
    async deleteFile(path, sha, message) {
        const r = await fetch(`https://api.github.com/repos/${CONFIG.github.username}/${CONFIG.github.repo}/contents/${path}`, {
            method: 'DELETE', headers: this.headers(), body: JSON.stringify({ message, sha, branch: CONFIG.github.branch })
        });
        if (!r.ok) throw new Error('Delete failed');
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
    document.getElementById('admin-login-btn').addEventListener('click', () => {
        const t = document.getElementById('admin-token').value.trim();
        if (!t) { showToast('Enter a token', 'error'); return; }
        GitHubAPI.setToken(t);
        renderAdminDashboard();
    });
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
                </select></div>
            <div class="form-group"><label class="form-label" style="display:flex;align-items:center;gap:8px;">
                <input type="checkbox" id="ed-draft" ${isEdit && post.draft ? 'checked' : ''}> Draft (hidden from feed)</label></div>
            <div class="form-group" id="ed-pdf-group" style="${isEdit && post.type === 'pdf' ? '' : 'display:none;'}">
                <label class="form-label">PDF Path</label><input type="text" class="form-input" id="ed-pdf" value="${isEdit && post.pdf ? Utils.escapeHtml(post.pdf) : ''}"></div>
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

    // Live preview with full rendering (highlight.js, mermaid, YouTube, tables)
    const textarea = document.getElementById('ed-body');
    const preview = document.getElementById('ed-preview');
    let _editorHljs = null;
    async function updatePreview() {
        if (!_editorHljs) {
            try { _editorHljs = await LibLoader.loadHighlightJs(); } catch (e) { _editorHljs = null; }
        }
        configureMarked({ hljs: _editorHljs });
        preview.innerHTML = marked.parse(textarea.value || '*Start typing...*');
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
        const pdfPath = document.getElementById('ed-pdf').value.trim();
        const repoUrl = document.getElementById('ed-repo').value.trim();
        const mediaType = document.getElementById('ed-media-type').value;
        const mediaUrl = document.getElementById('ed-media-url').value.trim();
        const body = textarea.value;
        const date = isEdit ? post.date : new Date().toISOString().split('T')[0];
        const fileName = `${postSlug}.md`;

        const entry = { slug: postSlug, title, description: desc, date, category: cat, tags, image, type, file: fileName, draft };
        if (type === 'pdf' && pdfPath) entry.pdf = pdfPath;
        if (type === 'repo' && repoUrl) entry.repo = repoUrl;
        if (mediaType !== 'none' && mediaUrl) entry.media = { type: mediaType, url: mediaUrl };

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
                item.innerHTML = `<span>${Utils.escapeHtml(name)}</span> <span style="color:var(--color-text-muted);">uploading...</span>`;
                list.appendChild(item);
                try {
                    await GitHubAPI.uploadBinary(path, file, `Upload ${subdir}: ${name}`);
                    item.innerHTML = `<span>${Utils.escapeHtml(name)}</span><button class="uploaded-file-remove" onclick="navigator.clipboard.writeText('${path}');showToast('Copied!');">Copy Path</button>`;
                    showToast(`Uploaded: ${name}`, 'success');
                } catch (e) { item.innerHTML = `<span>${Utils.escapeHtml(name)}</span> <span style="color:var(--color-danger);">failed</span>`; }
            }
        }
    }
    setup('img-area', 'img-input', 'img-list', 'images');
    setup('pdf-area', 'pdf-input', 'pdf-list', 'pdfs');
}

/* ============================================
   Phase 7: Route Registration & Init
   ============================================ */

Router.add('/', renderFeedPage);
Router.add('/post/:slug', renderPostPage);
Router.add('/pdf/:slug', renderPdfPage);
Router.add('/admin', renderAdminDashboard);
Router.add('/admin/new', renderEditorPage);
Router.add('/admin/edit/:slug', renderEditorPage);
Router.add('/admin/upload', renderUploadPage);

document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll shadow
    window.addEventListener('scroll', () => {
        document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
    });

    // Back to top
    const btt = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => { btt.classList.toggle('visible', window.scrollY > 400); });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Admin gear toggle — if already on admin, go home; otherwise go to admin
    const adminBtn = document.querySelector('.nav-action-btn[aria-label="Admin"]');
    if (adminBtn) {
        adminBtn.addEventListener('click', e => {
            e.preventDefault();
            const current = window.location.hash.slice(1) || '/';
            window.location.hash = current.startsWith('/admin') ? '#/' : '#/admin';
        });
    }

    // Start router
    Router.init();
});
