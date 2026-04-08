/* ============================================
   Phase 1: Configuration, Utilities & Router
   ============================================ */

// Site configuration — all dummy credentials
const CONFIG = {
    siteName: 'Portfolio',
    siteDescription: 'A personal space for sharing projects, ideas, and explorations.',
    author: 'Your Name',
    github: {
        username: 'yourusername',
        repo: 'yourusername.github.io',
        branch: 'main'
    },
    social: {
        github: 'https://github.com/yourusername',
        linkedin: 'https://linkedin.com/in/yourprofile',
        email: 'user@example.com'
    },
    postsPerPage: 9,
    contentPath: 'content',
    uploadsPath: 'uploads'
};

// ── Utility helpers ──

const Utils = {
    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    },

    slugify(text) {
        return text.toLowerCase().trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/-+/g, '-');
    },

    debounce(fn, ms) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), ms);
        };
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    readingTime(text) {
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    },

    parseFrontmatter(content) {
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (!match) return { meta: {}, body: content };

        const meta = {};
        match[1].split('\n').forEach(line => {
            const idx = line.indexOf(':');
            if (idx === -1) return;
            const key = line.slice(0, idx).trim();
            let val = line.slice(idx + 1).trim();
            // remove wrapping quotes
            val = val.replace(/^["']|["']$/g, '');
            // parse arrays
            if (val.startsWith('[') && val.endsWith(']')) {
                val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
            }
            if (val === 'true') val = true;
            if (val === 'false') val = false;
            meta[key] = val;
        });

        return { meta, body: content.slice(match[0].length).trim() };
    }
};

// ── Toast notifications ──

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ── Simple hash router ──

const Router = {
    routes: {},
    currentRoute: null,

    add(pattern, handler) {
        this.routes[pattern] = handler;
    },

    resolve() {
        const hash = window.location.hash.slice(1) || '/';
        window.scrollTo(0, 0);

        // Try exact match first
        if (this.routes[hash]) {
            this.currentRoute = hash;
            this.routes[hash]();
            this.updateNavLinks(hash);
            return;
        }

        // Try pattern matching (e.g. /post/:slug)
        for (const pattern of Object.keys(this.routes)) {
            const paramNames = [];
            const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
                paramNames.push(name);
                return '([^/]+)';
            });
            const match = hash.match(new RegExp(`^${regexStr}$`));
            if (match) {
                const params = {};
                paramNames.forEach((name, i) => params[name] = decodeURIComponent(match[i + 1]));
                this.currentRoute = pattern;
                this.routes[pattern](params);
                this.updateNavLinks(hash);
                return;
            }
        }

        // 404 fallback
        this.render404();
    },

    updateNavLinks(hash) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            const route = link.getAttribute('data-route');
            if (route === 'home' && (hash === '/' || hash === '')) {
                link.classList.add('active');
            } else if (route === 'posts' && hash.startsWith('/posts')) {
                link.classList.add('active');
            } else if (route === 'about' && hash === '/about') {
                link.classList.add('active');
            } else if (route === 'admin' && hash.startsWith('/admin')) {
                link.classList.add('active');
            }
        });
    },

    render404() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="empty-state" style="padding-top:120px;">
                <div class="empty-state-icon">&#128566;</div>
                <h3>Page Not Found</h3>
                <p>The page you're looking for doesn't exist.</p>
                <a href="#/" class="btn btn-primary" style="margin-top:16px;">Go Home</a>
            </div>`;
    },

    init() {
        window.addEventListener('hashchange', () => this.resolve());
        this.resolve();
    }
};

/* ============================================
   Phase 2: Content Service
   ============================================ */

const ContentService = {
    _cache: null,

    async getPosts() {
        if (this._cache) return this._cache;
        try {
            const resp = await fetch(`${CONFIG.contentPath}/posts.json`);
            if (!resp.ok) throw new Error('Could not load posts manifest');
            const data = await resp.json();
            // Sort by date descending
            data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            this._cache = data.posts;
            return this._cache;
        } catch (err) {
            console.error('ContentService.getPosts:', err);
            return [];
        }
    },

    async getPost(slug) {
        const posts = await this.getPosts();
        const entry = posts.find(p => p.slug === slug);
        if (!entry) return null;

        try {
            const resp = await fetch(`${CONFIG.contentPath}/posts/${entry.file}`);
            if (!resp.ok) throw new Error('Post file not found');
            const raw = await resp.text();
            const { meta, body } = Utils.parseFrontmatter(raw);
            return { ...entry, ...meta, body };
        } catch (err) {
            console.error('ContentService.getPost:', err);
            return null;
        }
    },

    getCategories(posts) {
        const cats = new Set();
        posts.forEach(p => {
            if (p.category) cats.add(p.category);
        });
        return Array.from(cats).sort();
    },

    filterPosts(posts, { search = '', category = 'all' } = {}) {
        return posts.filter(p => {
            const term = search.toLowerCase();
            const matchSearch = !term ||
                p.title.toLowerCase().includes(term) ||
                (p.description || '').toLowerCase().includes(term) ||
                (p.tags || []).some(t => t.toLowerCase().includes(term));
            const matchCat = category === 'all' || p.category === category;
            return matchSearch && matchCat;
        });
    },

    invalidateCache() {
        this._cache = null;
    }
};

/* ============================================
   Phase 3: Home Page
   ============================================ */

function renderCard(post) {
    const link = post.type === 'pdf'
        ? `#/pdf/${post.slug}`
        : `#/post/${post.slug}`;

    const imageHtml = post.image
        ? `<img class="card-image" src="${post.image}" alt="${Utils.escapeHtml(post.title)}" loading="lazy" onerror="this.outerHTML='<div class=\\'card-image-placeholder\\'>&#128196;</div>'">`
        : `<div class="card-image-placeholder">&#128196;</div>`;

    const badges = [];
    if (post.featured) badges.push('<span class="card-badge card-badge-featured">Featured</span>');
    if (post.type === 'pdf') badges.push('<span class="card-badge card-badge-pdf">PDF</span>');

    const tags = (post.tags || []).slice(0, 3)
        .map(t => `<span class="tag">${Utils.escapeHtml(t)}</span>`).join('');

    return `
        <article class="card">
            <a href="${link}" class="card-link">
                <div style="position:relative;">
                    ${imageHtml}
                    ${badges.join('')}
                </div>
                <div class="card-body">
                    <h3 class="card-title">${Utils.escapeHtml(post.title)}</h3>
                    <p class="card-excerpt">${Utils.escapeHtml(post.description || '')}</p>
                    <div class="card-meta">
                        <span class="card-date">${Utils.formatDate(post.date)}</span>
                        <div class="card-tags">${tags}</div>
                    </div>
                </div>
            </a>
        </article>`;
}

async function renderHomePage() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <section class="hero">
            <div class="hero-content">
                <div class="hero-badge">
                    <span class="hero-badge-dot"></span>
                    Open to collaborations
                </div>
                <h1>Projects, Ideas &amp; <span class="hero-gradient">Explorations</span></h1>
                <p>${Utils.escapeHtml(CONFIG.siteDescription)}</p>
                <div class="hero-actions">
                    <a href="#/posts" class="btn btn-primary">Browse Posts</a>
                    <a href="${CONFIG.social.github}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">GitHub</a>
                </div>
            </div>
        </section>

        <section style="padding:60px 0;">
            <div class="section-header">
                <h2>Latest Posts</h2>
                <p>Recent projects and articles</p>
            </div>

            <div class="card-grid" id="home-cards">
                <div class="loading-state" style="grid-column:1/-1;">
                    <div class="spinner"></div>
                    <p class="loading-text">Loading posts...</p>
                </div>
            </div>

            <div style="text-align:center; margin-top:40px;" id="home-more-wrap"></div>
        </section>`;

    const posts = await ContentService.getPosts();
    const grid = document.getElementById('home-cards');
    const moreWrap = document.getElementById('home-more-wrap');

    if (posts.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <div class="empty-state-icon">&#128221;</div>
                <h3>No posts yet</h3>
                <p>Content will appear here once posts are added.</p>
            </div>`;
        return;
    }

    const preview = posts.slice(0, CONFIG.postsPerPage);
    grid.innerHTML = preview.map(renderCard).join('');

    if (posts.length > CONFIG.postsPerPage) {
        moreWrap.innerHTML = `<a href="#/posts" class="btn btn-secondary">View All Posts</a>`;
    }
}

/* ============================================
   Phase 4: Posts List Page (search + filter)
   ============================================ */

async function renderPostsPage() {
    const app = document.getElementById('app');
    const allPosts = await ContentService.getPosts();
    const categories = ContentService.getCategories(allPosts);

    const catOptions = categories
        .map(c => `<option value="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</option>`)
        .join('');

    app.innerHTML = `
        <div class="posts-page">
            <div class="section-header">
                <h2>All Posts</h2>
                <p>Browse everything in one place</p>
            </div>

            <div class="filter-bar">
                <div class="search-box">
                    <span class="search-box-icon">&#128269;</span>
                    <input type="text" id="posts-search" placeholder="Search posts...">
                </div>
                <select class="filter-select" id="posts-category">
                    <option value="all">All Categories</option>
                    ${catOptions}
                </select>
            </div>

            <div class="card-grid" id="posts-grid"></div>

            <div style="text-align:center; margin-top:32px;" id="posts-load-more-wrap"></div>
        </div>`;

    let displayed = 0;
    let filtered = [...allPosts];

    function renderBatch(reset) {
        const grid = document.getElementById('posts-grid');
        const moreWrap = document.getElementById('posts-load-more-wrap');
        if (reset) {
            grid.innerHTML = '';
            displayed = 0;
        }

        if (filtered.length === 0 && displayed === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <div class="empty-state-icon">&#128269;</div>
                    <h3>No results</h3>
                    <p>Try a different search or category.</p>
                </div>`;
            moreWrap.innerHTML = '';
            return;
        }

        const batch = filtered.slice(displayed, displayed + CONFIG.postsPerPage);
        grid.insertAdjacentHTML('beforeend', batch.map(renderCard).join(''));
        displayed += batch.length;

        if (displayed < filtered.length) {
            moreWrap.innerHTML = `<button class="btn btn-secondary" id="load-more-btn">Load More</button>`;
            document.getElementById('load-more-btn').addEventListener('click', () => renderBatch(false));
        } else {
            moreWrap.innerHTML = '';
        }
    }

    function applyFilters() {
        const search = document.getElementById('posts-search').value;
        const category = document.getElementById('posts-category').value;
        filtered = ContentService.filterPosts(allPosts, { search, category });
        renderBatch(true);
    }

    document.getElementById('posts-search').addEventListener('input', Utils.debounce(applyFilters, 300));
    document.getElementById('posts-category').addEventListener('change', applyFilters);

    renderBatch(true);
}

/* ============================================
   Phase 5: Single Post Viewer
   ============================================ */

async function renderPostPage({ slug }) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="post-view">
            <div class="loading-state"><div class="spinner"></div><p class="loading-text">Loading post...</p></div>
        </div>`;

    const post = await ContentService.getPost(slug);

    if (!post) {
        app.innerHTML = `
            <div class="post-view">
                <a href="#/posts" class="post-back">&#8592; Back to posts</a>
                <div class="empty-state">
                    <div class="empty-state-icon">&#128533;</div>
                    <h3>Post not found</h3>
                    <p>This post may have been removed or the URL is incorrect.</p>
                </div>
            </div>`;
        return;
    }

    // Configure marked
    marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        }
    });

    const htmlContent = marked.parse(post.body);
    const readTime = Utils.readingTime(post.body);
    const tags = (post.tags || []).map(t => `<span class="tag tag-primary">${Utils.escapeHtml(t)}</span>`).join('');

    const coverHtml = post.image
        ? `<img class="post-cover" src="${post.image}" alt="${Utils.escapeHtml(post.title)}" onerror="this.style.display='none'">`
        : '';

    app.innerHTML = `
        <article class="post-view">
            <div class="post-header">
                <a href="#/posts" class="post-back">&#8592; Back to posts</a>
                <h1 class="post-title">${Utils.escapeHtml(post.title)}</h1>
                <div class="post-meta-bar">
                    <span>${Utils.formatDate(post.date)}</span>
                    <span class="post-meta-divider"></span>
                    <span>${readTime}</span>
                    ${post.category ? `<span class="post-meta-divider"></span><span>${Utils.escapeHtml(post.category)}</span>` : ''}
                </div>
            </div>
            ${coverHtml}
            <div class="post-content">${htmlContent}</div>
            ${tags ? `<div class="post-tags">${tags}</div>` : ''}
        </article>`;

    // Highlight code blocks that marked didn't catch
    document.querySelectorAll('.post-content pre code').forEach(block => {
        hljs.highlightElement(block);
    });
}

/* ============================================
   Phase 6: PDF Carousel Viewer
   ============================================ */

async function renderPdfPage({ slug }) {
    const app = document.getElementById('app');

    // Find the post to get the PDF path
    const posts = await ContentService.getPosts();
    const post = posts.find(p => p.slug === slug);

    if (!post || !post.pdf) {
        app.innerHTML = `
            <div class="pdf-viewer">
                <a href="#/posts" class="post-back">&#8592; Back to posts</a>
                <div class="pdf-error">
                    <p>&#128196;</p>
                    <h3>PDF not found</h3>
                    <p>This PDF may have been removed.</p>
                </div>
            </div>`;
        return;
    }

    app.innerHTML = `
        <div class="pdf-viewer">
            <div class="pdf-viewer-header">
                <a href="#/posts" class="post-back">&#8592; Back</a>
                <h2 class="pdf-viewer-title">${Utils.escapeHtml(post.title)}</h2>
                <a href="${post.pdf}" download class="btn btn-sm btn-secondary">&#8595; Download</a>
            </div>
            <div class="pdf-stage" id="pdf-stage">
                <div class="pdf-loading" id="pdf-loading">
                    <div class="spinner"></div>
                    <p class="loading-text">Loading PDF...</p>
                </div>
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

    // Initialize PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    let pdfDoc = null;
    let currentPage = 1;
    let totalPages = 0;
    let rendering = false;
    let pendingPage = false;
    const thumbCanvases = [];

    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas.getContext('2d');

    function getScale(page) {
        const containerW = Math.min(document.getElementById('pdf-stage').clientWidth - 120, 860);
        const vp = page.getViewport({ scale: 1 });
        return Math.max(containerW / vp.width, 0.5);
    }

    async function renderSlide(num) {
        if (rendering) { pendingPage = num; return; }
        rendering = true;
        pendingPage = false;

        const page = await pdfDoc.getPage(num);
        const scale = getScale(page);
        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;

        document.getElementById('pdf-page-info').textContent = `Slide ${num} of ${totalPages}`;
        document.getElementById('pdf-prev').disabled = num <= 1;
        document.getElementById('pdf-next').disabled = num >= totalPages;

        // highlight active thumb
        thumbCanvases.forEach((tc, i) => {
            tc.parentElement.classList.toggle('active', i === num - 1);
        });
        if (thumbCanvases[num - 1]) {
            thumbCanvases[num - 1].parentElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }

        rendering = false;
        if (pendingPage !== false) {
            const p = pendingPage;
            pendingPage = false;
            renderSlide(p);
        }
    }

    async function renderThumb(num) {
        const page = await pdfDoc.getPage(num);
        const vp = page.getViewport({ scale: 0.18 });
        const wrap = document.createElement('div');
        wrap.className = 'pdf-thumb';
        wrap.addEventListener('click', () => goTo(num));
        const tc = document.createElement('canvas');
        tc.width = vp.width;
        tc.height = vp.height;
        await page.render({ canvasContext: tc.getContext('2d'), viewport: vp }).promise;
        wrap.appendChild(tc);
        document.getElementById('pdf-thumbs').appendChild(wrap);
        thumbCanvases.push(tc);
    }

    function goTo(num) {
        if (!pdfDoc || num < 1 || num > totalPages) return;
        currentPage = num;
        renderSlide(currentPage);
    }

    // Navigation
    document.getElementById('pdf-prev').addEventListener('click', () => goTo(currentPage - 1));
    document.getElementById('pdf-next').addEventListener('click', () => goTo(currentPage + 1));

    // Keyboard
    const keyHandler = (e) => {
        if (Router.currentRoute !== '/pdf/:slug') {
            document.removeEventListener('keydown', keyHandler);
            return;
        }
        if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); goTo(currentPage - 1); }
        if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) { e.preventDefault(); goTo(currentPage + 1); }
        if (e.key === 'Home') goTo(1);
        if (e.key === 'End') goTo(totalPages);
    };
    document.addEventListener('keydown', keyHandler);

    // Touch/swipe
    let touchX = 0;
    canvas.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    canvas.addEventListener('touchend', e => {
        const dx = touchX - e.changedTouches[0].clientX;
        if (Math.abs(dx) > 50) dx > 0 ? goTo(currentPage + 1) : goTo(currentPage - 1);
    }, { passive: true });

    // Resize
    let resizeTimer;
    const resizeHandler = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { if (pdfDoc) renderSlide(currentPage); }, 250);
    };
    window.addEventListener('resize', resizeHandler);

    // Load PDF
    try {
        pdfDoc = await pdfjsLib.getDocument(post.pdf).promise;
        totalPages = pdfDoc.numPages;

        document.getElementById('pdf-loading').style.display = 'none';
        document.getElementById('pdf-canvas-wrap').style.display = 'flex';
        document.getElementById('pdf-controls').style.display = 'flex';

        await renderSlide(1);

        for (let i = 1; i <= totalPages; i++) {
            await renderThumb(i);
            if (i === 1 && thumbCanvases[0]) thumbCanvases[0].parentElement.classList.add('active');
        }
    } catch (err) {
        console.error('PDF load error:', err);
        document.getElementById('pdf-loading').innerHTML = `
            <div class="pdf-error">
                <p style="font-size:2rem;">&#128196;</p>
                <h3>Could not load PDF</h3>
                <p>${Utils.escapeHtml(err.message || 'Unknown error')}</p>
            </div>`;
    }
}

/* ============================================
   Phase 7: About Page
   ============================================ */

function renderAboutPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="about-page">
            <h1>About</h1>
            <div class="about-content">
                <p>
                    Welcome! This is a personal portfolio for sharing projects, ideas, and
                    explorations in data science, machine learning, and artificial intelligence.
                </p>
                <p>
                    Every project here represents a chapter in a journey of learning and creating
                    meaningful solutions through technology, data, and innovation.
                </p>
                <p>
                    This site works as a web application &mdash; you can create posts, upload images
                    and PDFs, and present projects in a carousel format, all powered by GitHub Pages.
                </p>
            </div>
            <div class="about-links">
                <a href="${CONFIG.social.github}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href="${CONFIG.social.linkedin}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a href="mailto:${CONFIG.social.email}" class="btn btn-secondary">Email</a>
            </div>
        </div>`;
}

/* ============================================
   Phase 8: GitHub API Service (for Admin)
   ============================================ */

const GitHubAPI = {
    getToken() {
        return localStorage.getItem('gh_token') || '';
    },

    setToken(token) {
        localStorage.setItem('gh_token', token);
    },

    clearToken() {
        localStorage.removeItem('gh_token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    headers() {
        return {
            'Authorization': `token ${this.getToken()}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
    },

    async getFile(path) {
        const resp = await fetch(
            `https://api.github.com/repos/${CONFIG.github.username}/${CONFIG.github.repo}/contents/${path}?ref=${CONFIG.github.branch}`,
            { headers: this.headers() }
        );
        if (!resp.ok) return null;
        const data = await resp.json();
        return {
            content: atob(data.content.replace(/\n/g, '')),
            sha: data.sha
        };
    },

    async putFile(path, content, message, sha) {
        const body = {
            message,
            content: btoa(unescape(encodeURIComponent(content))),
            branch: CONFIG.github.branch
        };
        if (sha) body.sha = sha;

        const resp = await fetch(
            `https://api.github.com/repos/${CONFIG.github.username}/${CONFIG.github.repo}/contents/${path}`,
            { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) }
        );
        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.message || 'Failed to save file');
        }
        return resp.json();
    },

    async uploadBinary(path, file, message) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result.split(',')[1];
                const body = {
                    message,
                    content: base64,
                    branch: CONFIG.github.branch
                };
                try {
                    const resp = await fetch(
                        `https://api.github.com/repos/${CONFIG.github.username}/${CONFIG.github.repo}/contents/${path}`,
                        { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) }
                    );
                    if (!resp.ok) {
                        const err = await resp.json();
                        throw new Error(err.message || 'Upload failed');
                    }
                    resolve(await resp.json());
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('File read failed'));
            reader.readAsDataURL(file);
        });
    },

    async deleteFile(path, sha, message) {
        const resp = await fetch(
            `https://api.github.com/repos/${CONFIG.github.username}/${CONFIG.github.repo}/contents/${path}`,
            {
                method: 'DELETE',
                headers: this.headers(),
                body: JSON.stringify({ message, sha, branch: CONFIG.github.branch })
            }
        );
        if (!resp.ok) throw new Error('Delete failed');
        return resp.json();
    }
};

/* ============================================
   Phase 9: Admin Panel
   ============================================ */

function renderAdminLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="admin-auth">
            <h2>Admin Access</h2>
            <p>Enter your GitHub Personal Access Token to manage content.<br>
               The token is stored only in your browser's localStorage.</p>
            <div class="form-group">
                <label class="form-label">GitHub Token</label>
                <input type="password" class="form-input" id="admin-token" placeholder="ghp_xxxxxxxxxxxx">
            </div>
            <button class="btn btn-primary" id="admin-login-btn" style="width:100%;">Sign In</button>
            <p style="margin-top:16px; font-size:0.8rem; color:var(--color-text-muted);">
                Requires a token with <code>repo</code> scope.
            </p>
        </div>`;

    document.getElementById('admin-login-btn').addEventListener('click', () => {
        const token = document.getElementById('admin-token').value.trim();
        if (!token) { showToast('Please enter a token', 'error'); return; }
        GitHubAPI.setToken(token);
        renderAdminDashboard();
    });
}

async function renderAdminDashboard() {
    if (!GitHubAPI.isAuthenticated()) {
        renderAdminLogin();
        return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="admin-container">
            <div class="admin-header">
                <h1>Dashboard</h1>
                <div style="display:flex; gap:8px;">
                    <a href="#/admin/new" class="btn btn-primary btn-sm">+ New Post</a>
                    <a href="#/admin/upload" class="btn btn-secondary btn-sm">Upload Files</a>
                    <button class="btn btn-ghost btn-sm" id="admin-logout">Sign Out</button>
                </div>
            </div>

            <div class="admin-tabs">
                <button class="admin-tab active" data-tab="posts">Posts</button>
                <button class="admin-tab" data-tab="files">Uploaded Files</button>
            </div>

            <div id="admin-tab-content">
                <div class="loading-state"><div class="spinner"></div><p class="loading-text">Loading...</p></div>
            </div>
        </div>`;

    document.getElementById('admin-logout').addEventListener('click', () => {
        GitHubAPI.clearToken();
        showToast('Signed out');
        renderAdminLogin();
    });

    // Tab switching
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
    const container = document.getElementById('admin-tab-content');
    container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

    try {
        ContentService.invalidateCache();
        const posts = await ContentService.getPosts();

        if (posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">&#128221;</div>
                    <h3>No posts yet</h3>
                    <p>Create your first post to get started.</p>
                    <a href="#/admin/new" class="btn btn-primary" style="margin-top:12px;">+ New Post</a>
                </div>`;
            return;
        }

        container.innerHTML = `<div class="admin-posts-list">
            ${posts.map(p => `
                <div class="admin-post-item">
                    <div class="admin-post-info">
                        <h4>${Utils.escapeHtml(p.title)}</h4>
                        <p>${Utils.formatDate(p.date)} &middot; ${p.type === 'pdf' ? 'PDF' : 'Article'}${p.category ? ' &middot; ' + p.category : ''}</p>
                    </div>
                    <div class="admin-post-actions">
                        <a href="#/admin/edit/${p.slug}" class="btn btn-ghost btn-sm">Edit</a>
                        <button class="btn btn-ghost btn-sm" data-delete="${p.slug}" style="color:var(--color-danger);">Delete</button>
                    </div>
                </div>`).join('')}
        </div>`;

        // Delete handlers
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const slug = btn.dataset.delete;
                if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
                try {
                    await deletePost(slug);
                    showToast('Post deleted', 'success');
                    loadAdminPosts();
                } catch (err) {
                    showToast('Delete failed: ' + err.message, 'error');
                }
            });
        });
    } catch (err) {
        container.innerHTML = `<div class="empty-state"><h3>Error loading posts</h3><p>${err.message}</p></div>`;
    }
}

async function deletePost(slug) {
    // Get current manifest
    const file = await GitHubAPI.getFile(`${CONFIG.contentPath}/posts.json`);
    if (!file) throw new Error('Manifest not found');
    const manifest = JSON.parse(file.content);
    const postIdx = manifest.posts.findIndex(p => p.slug === slug);
    if (postIdx === -1) throw new Error('Post not in manifest');

    const post = manifest.posts[postIdx];

    // Delete the markdown file
    const mdFile = await GitHubAPI.getFile(`${CONFIG.contentPath}/posts/${post.file}`);
    if (mdFile) {
        await GitHubAPI.deleteFile(`${CONFIG.contentPath}/posts/${post.file}`, mdFile.sha, `Delete post: ${post.title}`);
    }

    // Update manifest
    manifest.posts.splice(postIdx, 1);
    await GitHubAPI.putFile(
        `${CONFIG.contentPath}/posts.json`,
        JSON.stringify(manifest, null, 2),
        `Remove ${post.title} from manifest`,
        file.sha
    );

    ContentService.invalidateCache();
}

async function loadAdminFiles() {
    const container = document.getElementById('admin-tab-content');
    container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

    try {
        const resp = await fetch(
            `https://api.github.com/repos/${CONFIG.github.username}/${CONFIG.github.repo}/contents/${CONFIG.uploadsPath}`,
            { headers: GitHubAPI.headers() }
        );
        const items = resp.ok ? await resp.json() : [];

        // Flatten both images/ and pdfs/ directories
        let allFiles = [];
        for (const item of (Array.isArray(items) ? items : [])) {
            if (item.type === 'dir') {
                const subResp = await fetch(item.url, { headers: GitHubAPI.headers() });
                if (subResp.ok) {
                    const subItems = await subResp.json();
                    allFiles = allFiles.concat(subItems.filter(f => f.type === 'file' && f.name !== '.gitkeep'));
                }
            } else if (item.type === 'file' && item.name !== '.gitkeep') {
                allFiles.push(item);
            }
        }

        if (allFiles.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">&#128193;</div>
                    <h3>No uploaded files</h3>
                    <p>Upload images and PDFs from the upload page.</p>
                    <a href="#/admin/upload" class="btn btn-primary" style="margin-top:12px;">Upload Files</a>
                </div>`;
            return;
        }

        container.innerHTML = `<div class="admin-posts-list">
            ${allFiles.map(f => `
                <div class="admin-post-item">
                    <div class="admin-post-info">
                        <h4>${Utils.escapeHtml(f.name)}</h4>
                        <p>${f.path} &middot; ${(f.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div class="admin-post-actions">
                        <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText('${f.path}'); showToast('Path copied!');">Copy Path</button>
                    </div>
                </div>`).join('')}
        </div>`;
    } catch (err) {
        container.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>`;
    }
}

/* ============================================
   Phase 10: Post Editor (create / edit)
   ============================================ */

async function renderEditorPage({ slug } = {}) {
    if (!GitHubAPI.isAuthenticated()) {
        renderAdminLogin();
        return;
    }

    const isEdit = !!slug;
    let existingPost = null;
    let existingBody = '';

    if (isEdit) {
        existingPost = await ContentService.getPost(slug);
        if (!existingPost) {
            showToast('Post not found', 'error');
            window.location.hash = '#/admin';
            return;
        }
        existingBody = existingPost.body || '';
    }

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="editor-container">
            <div class="editor-toolbar">
                <div class="editor-toolbar-left">
                    <a href="#/admin" class="btn btn-ghost btn-sm">&#8592; Dashboard</a>
                    <span style="color:var(--color-text-muted); font-size:0.9rem;">${isEdit ? 'Edit Post' : 'New Post'}</span>
                </div>
                <div class="editor-toolbar-right">
                    <button class="btn btn-primary btn-sm" id="editor-save">
                        ${isEdit ? 'Update' : 'Publish'}
                    </button>
                </div>
            </div>

            <div class="editor-meta">
                <div class="form-group">
                    <label class="form-label">Title</label>
                    <input type="text" class="form-input" id="editor-title" placeholder="Post title..." value="${isEdit ? Utils.escapeHtml(existingPost.title) : ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Slug</label>
                    <input type="text" class="form-input" id="editor-slug" placeholder="post-url-slug" value="${isEdit ? slug : ''}" ${isEdit ? 'readonly' : ''}>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <input type="text" class="form-input" id="editor-desc" placeholder="Short description..." value="${isEdit ? Utils.escapeHtml(existingPost.description || '') : ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <input type="text" class="form-input" id="editor-category" placeholder="e.g. data-science" value="${isEdit ? Utils.escapeHtml(existingPost.category || '') : ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Tags (comma separated)</label>
                    <input type="text" class="form-input" id="editor-tags" placeholder="python, ml, data" value="${isEdit && existingPost.tags ? existingPost.tags.join(', ') : ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Cover Image Path</label>
                    <input type="text" class="form-input" id="editor-image" placeholder="uploads/images/cover.jpg" value="${isEdit ? Utils.escapeHtml(existingPost.image || '') : ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <select class="form-select" id="editor-type">
                        <option value="article" ${!isEdit || existingPost.type !== 'pdf' ? 'selected' : ''}>Article</option>
                        <option value="pdf" ${isEdit && existingPost.type === 'pdf' ? 'selected' : ''}>PDF Presentation</option>
                    </select>
                </div>
                <div class="form-group" id="editor-pdf-group" style="${isEdit && existingPost.type === 'pdf' ? '' : 'display:none;'}">
                    <label class="form-label">PDF File Path</label>
                    <input type="text" class="form-input" id="editor-pdf" placeholder="uploads/pdfs/presentation.pdf" value="${isEdit && existingPost.pdf ? Utils.escapeHtml(existingPost.pdf) : ''}">
                </div>
            </div>

            <div class="editor-split">
                <div class="editor-pane">
                    <div class="editor-pane-header">Markdown</div>
                    <textarea class="editor-textarea" id="editor-body" placeholder="Write your content in Markdown...">${existingBody}</textarea>
                </div>
                <div class="editor-pane">
                    <div class="editor-pane-header">Preview</div>
                    <div class="editor-preview post-content" id="editor-preview"></div>
                </div>
            </div>
        </div>`;

    // Auto-generate slug from title
    if (!isEdit) {
        document.getElementById('editor-title').addEventListener('input', (e) => {
            document.getElementById('editor-slug').value = Utils.slugify(e.target.value);
        });
    }

    // Show/hide PDF field
    document.getElementById('editor-type').addEventListener('change', (e) => {
        document.getElementById('editor-pdf-group').style.display = e.target.value === 'pdf' ? '' : 'none';
    });

    // Live preview
    const textarea = document.getElementById('editor-body');
    const preview = document.getElementById('editor-preview');

    function updatePreview() {
        marked.setOptions({ breaks: true, gfm: true });
        preview.innerHTML = marked.parse(textarea.value || '*Start typing to see preview...*');
        preview.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
    }

    textarea.addEventListener('input', Utils.debounce(updatePreview, 300));
    updatePreview();

    // Save handler
    document.getElementById('editor-save').addEventListener('click', async () => {
        const title = document.getElementById('editor-title').value.trim();
        const postSlug = document.getElementById('editor-slug').value.trim();
        const description = document.getElementById('editor-desc').value.trim();
        const category = document.getElementById('editor-category').value.trim();
        const tagsStr = document.getElementById('editor-tags').value.trim();
        const image = document.getElementById('editor-image').value.trim();
        const type = document.getElementById('editor-type').value;
        const pdfPath = document.getElementById('editor-pdf').value.trim();
        const body = textarea.value;

        if (!title || !postSlug) {
            showToast('Title and slug are required', 'error');
            return;
        }

        const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
        const date = isEdit ? existingPost.date : new Date().toISOString().split('T')[0];
        const fileName = `${postSlug}.md`;

        // Build frontmatter
        const frontmatter = [
            '---',
            `title: "${title}"`,
            `description: "${description}"`,
            `date: "${date}"`,
            `category: "${category}"`,
            `tags: [${tags.map(t => `"${t}"`).join(', ')}]`,
            image ? `image: "${image}"` : null,
            `type: "${type}"`,
            type === 'pdf' && pdfPath ? `pdf: "${pdfPath}"` : null,
            '---'
        ].filter(Boolean).join('\n');

        const fileContent = `${frontmatter}\n\n${body}`;

        try {
            document.getElementById('editor-save').disabled = true;
            document.getElementById('editor-save').textContent = 'Saving...';

            // Save markdown file
            let mdSha = null;
            if (isEdit) {
                const existing = await GitHubAPI.getFile(`${CONFIG.contentPath}/posts/${fileName}`);
                if (existing) mdSha = existing.sha;
            }

            await GitHubAPI.putFile(
                `${CONFIG.contentPath}/posts/${fileName}`,
                fileContent,
                isEdit ? `Update post: ${title}` : `Add post: ${title}`,
                mdSha
            );

            // Update manifest
            const manifestFile = await GitHubAPI.getFile(`${CONFIG.contentPath}/posts.json`);
            let manifest = { posts: [] };
            let manifestSha = null;

            if (manifestFile) {
                manifest = JSON.parse(manifestFile.content);
                manifestSha = manifestFile.sha;
            }

            const postEntry = {
                slug: postSlug,
                title,
                description,
                date,
                category,
                tags,
                image,
                type,
                file: fileName,
                ...(type === 'pdf' && pdfPath ? { pdf: pdfPath } : {})
            };

            const existingIdx = manifest.posts.findIndex(p => p.slug === postSlug);
            if (existingIdx >= 0) {
                manifest.posts[existingIdx] = postEntry;
            } else {
                manifest.posts.push(postEntry);
            }

            await GitHubAPI.putFile(
                `${CONFIG.contentPath}/posts.json`,
                JSON.stringify(manifest, null, 2),
                `Update manifest: ${title}`,
                manifestSha
            );

            ContentService.invalidateCache();
            showToast(isEdit ? 'Post updated!' : 'Post published!', 'success');
            window.location.hash = '#/admin';

        } catch (err) {
            console.error('Save error:', err);
            showToast('Save failed: ' + err.message, 'error');
            document.getElementById('editor-save').disabled = false;
            document.getElementById('editor-save').textContent = isEdit ? 'Update' : 'Publish';
        }
    });
}

/* ============================================
   Phase 11: File Upload Page
   ============================================ */

function renderUploadPage() {
    if (!GitHubAPI.isAuthenticated()) {
        renderAdminLogin();
        return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="editor-container">
            <div class="editor-toolbar">
                <div class="editor-toolbar-left">
                    <a href="#/admin" class="btn btn-ghost btn-sm">&#8592; Dashboard</a>
                    <span style="color:var(--color-text-muted); font-size:0.9rem;">Upload Files</span>
                </div>
            </div>

            <div class="form-row" style="margin-bottom:24px;">
                <div>
                    <h3 style="margin-bottom:16px;">Images</h3>
                    <div class="file-upload-area" id="image-upload-area">
                        <div class="file-upload-icon">&#128247;</div>
                        <p><strong>Drop images here</strong> or click to browse</p>
                        <p style="font-size:0.8rem; color:var(--color-text-muted);">PNG, JPG, GIF, WebP</p>
                        <input type="file" id="image-upload-input" accept="image/*" multiple hidden>
                    </div>
                    <div class="uploaded-files" id="image-upload-list"></div>
                </div>
                <div>
                    <h3 style="margin-bottom:16px;">PDFs</h3>
                    <div class="file-upload-area" id="pdf-upload-area">
                        <div class="file-upload-icon">&#128196;</div>
                        <p><strong>Drop PDFs here</strong> or click to browse</p>
                        <p style="font-size:0.8rem; color:var(--color-text-muted);">PDF files only</p>
                        <input type="file" id="pdf-upload-input" accept=".pdf" multiple hidden>
                    </div>
                    <div class="uploaded-files" id="pdf-upload-list"></div>
                </div>
            </div>
        </div>`;

    function setupUploadArea(areaId, inputId, listId, subdir) {
        const area = document.getElementById(areaId);
        const input = document.getElementById(inputId);
        const list = document.getElementById(listId);

        area.addEventListener('click', () => input.click());

        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('drag-over');
        });

        area.addEventListener('dragleave', () => area.classList.remove('drag-over'));

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('drag-over');
            handleFiles(e.dataTransfer.files);
        });

        input.addEventListener('change', (e) => handleFiles(e.target.files));

        async function handleFiles(files) {
            for (const file of files) {
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const path = `${CONFIG.uploadsPath}/${subdir}/${safeName}`;

                const item = document.createElement('div');
                item.className = 'uploaded-file';
                item.innerHTML = `<span>${Utils.escapeHtml(safeName)}</span> <span style="color:var(--color-text-muted);">uploading...</span>`;
                list.appendChild(item);

                try {
                    await GitHubAPI.uploadBinary(path, file, `Upload ${subdir}: ${safeName}`);
                    item.innerHTML = `
                        <span>${Utils.escapeHtml(safeName)}</span>
                        <button class="uploaded-file-remove" onclick="navigator.clipboard.writeText('${path}'); showToast('Path copied!');">Copy Path</button>`;
                    showToast(`Uploaded: ${safeName}`, 'success');
                } catch (err) {
                    item.innerHTML = `<span>${Utils.escapeHtml(safeName)}</span> <span style="color:var(--color-danger);">failed</span>`;
                    showToast('Upload failed: ' + err.message, 'error');
                }
            }
        }
    }

    setupUploadArea('image-upload-area', 'image-upload-input', 'image-upload-list', 'images');
    setupUploadArea('pdf-upload-area', 'pdf-upload-input', 'pdf-upload-list', 'pdfs');
}

/* ============================================
   Phase 12: Route Registration & Init
   ============================================ */

// Register all routes
Router.add('/', renderHomePage);
Router.add('/posts', renderPostsPage);
Router.add('/post/:slug', renderPostPage);
Router.add('/pdf/:slug', renderPdfPage);
Router.add('/about', renderAboutPage);
Router.add('/admin', renderAdminDashboard);
Router.add('/admin/new', renderEditorPage);
Router.add('/admin/edit/:slug', renderEditorPage);
Router.add('/admin/upload', renderUploadPage);

// ── Global UI init ──

document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const toggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    if (toggle) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            navLinks.classList.toggle('open');
        });
        // Close on link click
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('active');
                navLinks.classList.remove('open');
            });
        });
    }

    // Navbar scroll shadow
    window.addEventListener('scroll', () => {
        document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
    });

    // Back to top
    const btt = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        btt.classList.toggle('visible', window.scrollY > 400);
    });
    btt.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Start router
    Router.init();
});
