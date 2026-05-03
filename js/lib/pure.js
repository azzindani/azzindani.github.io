/* ============================================
   Pure utilities — pure functions, no DOM access.
   Loaded as a script tag in browser (window.Pure.*)
   and as a CommonJS module by Node tests.
   ============================================ */
(function (root) {
    'use strict';

    function slugify(t) {
        if (!t) return '';
        return String(t).toLowerCase().trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/-+/g, '-');
    }

    function extractYouTubeId(url) {
        if (!url) return null;
        const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return m ? m[1] : null;
    }

    // parseRepoUrl(url) → { host, owner, name, branch, subtype } | null
    function parseRepoUrl(url) {
        if (!url) return null;
        let u;
        try { u = new URL(String(url).replace(/\/+$/, '')); }
        catch { return null; }
        const parts = u.pathname.split('/').filter(Boolean);
        if (u.hostname === 'github.com' && parts.length >= 2) {
            return { host: 'github', owner: parts[0], name: parts[1], branch: 'main' };
        }
        if (u.hostname === 'huggingface.co' || u.hostname.endsWith('.huggingface.co')) {
            if (parts[0] === 'datasets' || parts[0] === 'spaces') {
                if (parts.length >= 3) {
                    return { host: 'huggingface', subtype: parts[0], owner: parts[1], name: parts[2], branch: 'main' };
                }
                if (parts.length === 2) {
                    // Canonical / single-segment dataset like /datasets/squad
                    return { host: 'huggingface', subtype: parts[0], owner: '', name: parts[1], branch: 'main' };
                }
            } else if (parts.length >= 2) {
                return { host: 'huggingface', subtype: '', owner: parts[0], name: parts[1], branch: 'main' };
            }
        }
        if (u.hostname === 'gitlab.com' && parts.length >= 2) {
            return { host: 'gitlab', owner: parts[0], name: parts[1], branch: 'main' };
        }
        return null;
    }

    function rewriteRelativeAssetPaths(md, info, branch) {
        if (!md || !info) return md;
        // Truly absolute: protocol URLs, data: blobs, mailto:, page anchors.
        // Note: a leading "/" in a README means *repo-root relative*, NOT
        // domain-absolute, so it is rewritten too.
        const isAbs = (s) => /^(https?:|data:|mailto:|#)/i.test(s);
        let rawBase, htmlBase;
        if (info.host === 'github') {
            rawBase  = `https://raw.githubusercontent.com/${info.owner}/${info.name}/${branch || 'main'}/`;
            htmlBase = `https://github.com/${info.owner}/${info.name}/blob/${branch || 'main'}/`;
        } else if (info.host === 'huggingface') {
            const path = info.subtype ? `${info.subtype}/${info.owner}/${info.name}` : `${info.owner}/${info.name}`;
            rawBase  = `https://huggingface.co/${path}/resolve/${branch || 'main'}/`;
            htmlBase = `https://huggingface.co/${path}/blob/${branch || 'main'}/`;
        } else if (info.host === 'gitlab') {
            rawBase  = `https://gitlab.com/${info.owner}/${info.name}/-/raw/${branch || 'main'}/`;
            htmlBase = `https://gitlab.com/${info.owner}/${info.name}/-/blob/${branch || 'main'}/`;
        } else {
            return md;
        }

        // Strip "./" or leading "/" before joining onto the base — both forms
        // mean "the path inside the repo".
        const normalize = (p) => p.replace(/^\.\//, '').replace(/^\//, '');

        let out = md.replace(/(!?)\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g,
            (match, bang, label, target, title) => {
                if (isAbs(target)) return match;
                const base = bang === '!' ? rawBase : htmlBase;
                return `${bang}[${label}](${base}${normalize(target)}${title || ''})`;
            });

        out = out.replace(/<img\s+([^>]*?)src=(["'])([^"']+)\2/gi,
            (match, attrs, q, src) => {
                if (isAbs(src)) return match;
                return `<img ${attrs}src=${q}${rawBase}${normalize(src)}${q}`;
            });

        // <a href="..."> too — repo-root relative anchors should resolve to the
        // repo's html base so they don't 404 against the SPA router.
        out = out.replace(/<a\s+([^>]*?)href=(["'])([^"']+)\2/gi,
            (match, attrs, q, href) => {
                if (isAbs(href)) return match;
                return `<a ${attrs}href=${q}${htmlBase}${normalize(href)}${q}`;
            });

        return out;
    }

    function parseFrontmatter(content) {
        const text = String(content || '').replace(/\r\n/g, '\n');
        const m = text.match(/^---\n([\s\S]*?)\n---/);
        if (!m) return { meta: {}, body: text };
        const meta = {};
        m[1].split('\n').forEach(line => {
            const i = line.indexOf(':');
            if (i === -1) return;
            const key = line.slice(0, i).trim();
            let val = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
            if (val.startsWith('[') && val.endsWith(']')) {
                val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
            }
            if (val === 'true') val = true;
            if (val === 'false') val = false;
            meta[key] = val;
        });
        return { meta, body: text.slice(m[0].length).trim() };
    }

    // Returns { html, store } where html has placeholder spans for each math
    // expression and store is a Map(id → {display, expr}).
    function extractMath(md) {
        const store = new Map();
        if (!md) return { html: md, store };

        const codeBlocks = [];
        let safe = md.replace(/```[\s\S]*?```/g, (m) => {
            codeBlocks.push(m); return `CB${codeBlocks.length - 1}`;
        });
        const inlineCode = [];
        safe = safe.replace(/`[^`\n]+`/g, (m) => {
            inlineCode.push(m); return `IC${inlineCode.length - 1}`;
        });

        const place = (display, expr) => {
            const id = `kx-${store.size}`;
            store.set(id, { display, expr });
            return `<span class="math-placeholder" data-id="${id}"></span>`;
        };

        safe = safe.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => place(true, expr.trim()));
        safe = safe.replace(
            /(^|[^\\$])\$([^\s$][^$\n]*?[^\s$]|[^\s$])\$(?!\d)/g,
            (_, pre, expr) => `${pre}${place(false, expr)}`
        );

        safe = safe.replace(/IC(\d+)/g, (_, i) => inlineCode[+i]);
        safe = safe.replace(/CB(\d+)/g, (_, i) => codeBlocks[+i]);
        return { html: safe, store };
    }

    function filterPosts(posts, opts) {
        const { search = '', category = 'all', type = 'all' } = opts || {};
        const q = search.toLowerCase();
        return posts.filter(p => {
            const ms = !q ||
                (p.title || '').toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q) ||
                (p.tags || []).some(t => String(t).toLowerCase().includes(q));
            const mc = category === 'all' || p.category === category;
            const mt = type === 'all' || p.type === type;
            return ms && mc && mt;
        });
    }

    const Pure = {
        slugify,
        extractYouTubeId,
        parseRepoUrl,
        rewriteRelativeAssetPaths,
        parseFrontmatter,
        extractMath,
        filterPosts,
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Pure;
    } else {
        root.Pure = Pure;
    }
})(typeof window !== 'undefined' ? window : globalThis);
