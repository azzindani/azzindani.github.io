#!/usr/bin/env node
// Reads content/posts.json and writes sitemap.xml + feed.xml at the repo
// root. Run after editing posts: `node tools/build-content-files.js`.
//
// Hash-based SPA routes (#/post/...) aren't ideal for crawlers, so the
// sitemap also references them with the canonical URL (origin + /#/...).
// Search engines that respect the meta canonical tag we emit at runtime
// will index them; others will just see the home page.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = process.env.SITE_ORIGIN || 'https://azzindani.github.io';
const SITE_TITLE = 'Portfolio';
const SITE_DESC = 'Personal portfolio and blog — Data Science, ML & AI projects';
const AUTHOR = 'Azzindani';

const manifestPath = path.join(ROOT, 'content/posts.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const posts = (manifest.posts || [])
    .filter(p => !p.draft)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

function postUrl(p) {
    const path = p.type === 'pdf' ? `/#/pdf/${p.slug}` : `/#/post/${p.slug}`;
    return ORIGIN + path;
}

function xmlEscape(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// ── sitemap.xml ───────────────────────────────────────────────────────
const sitemapEntries = [
    { loc: ORIGIN + '/', lastmod: new Date().toISOString(), priority: '1.0' },
    { loc: ORIGIN + '/#/collections', lastmod: new Date().toISOString(), priority: '0.6' },
    { loc: ORIGIN + '/#/docs', lastmod: new Date().toISOString(), priority: '0.6' },
    ...posts.map(p => ({
        loc: postUrl(p),
        lastmod: p.date,
        priority: p.featured ? '0.9' : '0.7',
    })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(e => `  <url>
    <loc>${xmlEscape(e.loc)}</loc>
    <lastmod>${xmlEscape(e.lastmod)}</lastmod>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
console.log(`Wrote sitemap.xml (${sitemapEntries.length} URLs)`);

// ── feed.xml (Atom 1.0) ──────────────────────────────────────────────
const newest = posts[0];
const updated = newest ? new Date(newest.date).toISOString() : new Date().toISOString();
const feedEntries = posts.slice(0, 30).map(p => `  <entry>
    <title>${xmlEscape(p.title)}</title>
    <link href="${xmlEscape(postUrl(p))}"/>
    <id>${xmlEscape(postUrl(p))}</id>
    <updated>${xmlEscape(new Date(p.date).toISOString())}</updated>
    <published>${xmlEscape(new Date(p.date).toISOString())}</published>
    <author><name>${xmlEscape(AUTHOR)}</name></author>
    <summary>${xmlEscape(p.description || '')}</summary>
    ${(p.tags || []).map(t => `<category term="${xmlEscape(t)}"/>`).join('\n    ')}
  </entry>`).join('\n');

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${xmlEscape(SITE_TITLE)}</title>
  <subtitle>${xmlEscape(SITE_DESC)}</subtitle>
  <link href="${xmlEscape(ORIGIN + '/feed.xml')}" rel="self"/>
  <link href="${xmlEscape(ORIGIN + '/')}"/>
  <updated>${updated}</updated>
  <id>${xmlEscape(ORIGIN + '/')}</id>
  <author><name>${xmlEscape(AUTHOR)}</name></author>
${feedEntries}
</feed>
`;
fs.writeFileSync(path.join(ROOT, 'feed.xml'), feed);
console.log(`Wrote feed.xml (${Math.min(posts.length, 30)} entries)`);
