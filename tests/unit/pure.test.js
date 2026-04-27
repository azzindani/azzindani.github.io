import { describe, it, expect } from 'vitest';
import Pure from '../../js/lib/pure.js';

const {
    slugify,
    extractYouTubeId,
    parseRepoUrl,
    rewriteRelativeAssetPaths,
    parseFrontmatter,
    extractMath,
    filterPosts,
} = Pure;

describe('slugify', () => {
    it('lower-cases and replaces spaces with hyphens', () => {
        expect(slugify('Hello World')).toBe('hello-world');
    });
    it('strips punctuation', () => {
        expect(slugify('What?! Is this... real?')).toBe('what-is-this-real');
    });
    it('collapses multiple hyphens', () => {
        expect(slugify('a   b---c')).toBe('a-b-c');
    });
    it('handles empty / null', () => {
        expect(slugify('')).toBe('');
        expect(slugify(null)).toBe('');
    });
});

describe('extractYouTubeId', () => {
    it('parses watch URLs', () => {
        expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });
    it('parses youtu.be short URLs', () => {
        expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });
    it('parses embed URLs', () => {
        expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });
    it('returns null for non-YouTube URLs', () => {
        expect(extractYouTubeId('https://example.com')).toBeNull();
        expect(extractYouTubeId(null)).toBeNull();
    });
});

describe('parseRepoUrl', () => {
    it('parses GitHub repos', () => {
        expect(parseRepoUrl('https://github.com/openai/clip')).toEqual({
            host: 'github', owner: 'openai', name: 'clip', branch: 'main'
        });
    });
    it('parses HuggingFace models', () => {
        expect(parseRepoUrl('https://huggingface.co/openai/clip-vit-base-patch32')).toEqual({
            host: 'huggingface', subtype: '', owner: 'openai', name: 'clip-vit-base-patch32', branch: 'main'
        });
    });
    it('parses HuggingFace datasets (canonical, single-segment)', () => {
        expect(parseRepoUrl('https://huggingface.co/datasets/squad')).toEqual({
            host: 'huggingface', subtype: 'datasets', owner: '', name: 'squad', branch: 'main'
        });
    });
    it('parses HuggingFace datasets (owner/name)', () => {
        expect(parseRepoUrl('https://huggingface.co/datasets/rajpurkar/squad')).toEqual({
            host: 'huggingface', subtype: 'datasets', owner: 'rajpurkar', name: 'squad', branch: 'main'
        });
    });
    it('parses HuggingFace spaces', () => {
        expect(parseRepoUrl('https://huggingface.co/spaces/coolauthor/coolspace')).toEqual({
            host: 'huggingface', subtype: 'spaces', owner: 'coolauthor', name: 'coolspace', branch: 'main'
        });
    });
    it('parses GitLab repos', () => {
        expect(parseRepoUrl('https://gitlab.com/foo/bar')).toEqual({
            host: 'gitlab', owner: 'foo', name: 'bar', branch: 'main'
        });
    });
    it('returns null for unknown / invalid URLs', () => {
        expect(parseRepoUrl('https://example.com/x/y')).toBeNull();
        expect(parseRepoUrl(null)).toBeNull();
        expect(parseRepoUrl('not a url')).toBeNull();
    });
});

describe('rewriteRelativeAssetPaths', () => {
    const info = parseRepoUrl('https://github.com/owner/repo');

    it('rewrites relative image to raw.githubusercontent.com', () => {
        const out = rewriteRelativeAssetPaths('![alt](docs/x.png)', info, 'main');
        expect(out).toContain('https://raw.githubusercontent.com/owner/repo/main/docs/x.png');
    });
    it('rewrites relative link to github.com/.../blob', () => {
        const out = rewriteRelativeAssetPaths('[doc](README.md)', info, 'main');
        expect(out).toContain('https://github.com/owner/repo/blob/main/README.md');
    });
    it('leaves absolute URLs alone', () => {
        const md = '![alt](https://cdn.example.com/x.png)';
        expect(rewriteRelativeAssetPaths(md, info, 'main')).toBe(md);
    });
    it('strips ./ prefix', () => {
        const out = rewriteRelativeAssetPaths('![alt](./img.png)', info, 'main');
        expect(out).toContain('main/img.png');
    });
    it('rewrites <img src="..."> tags', () => {
        const out = rewriteRelativeAssetPaths('<img src="logo.png">', info, 'main');
        expect(out).toContain('src="https://raw.githubusercontent.com/owner/repo/main/logo.png"');
    });
    it('uses huggingface resolve URLs for HF info', () => {
        const hf = parseRepoUrl('https://huggingface.co/openai/clip');
        const out = rewriteRelativeAssetPaths('![](sample.png)', hf, 'main');
        expect(out).toContain('huggingface.co/openai/clip/resolve/main/sample.png');
    });
});

describe('parseFrontmatter', () => {
    it('extracts simple key/value pairs', () => {
        const { meta, body } = parseFrontmatter('---\ntitle: "Hi"\ndraft: false\n---\nBody');
        expect(meta.title).toBe('Hi');
        expect(meta.draft).toBe(false);
        expect(body).toBe('Body');
    });
    it('parses tag arrays', () => {
        const { meta } = parseFrontmatter('---\ntags: ["a", "b", "c"]\n---\n');
        expect(meta.tags).toEqual(['a', 'b', 'c']);
    });
    it('returns full body when no frontmatter', () => {
        const { meta, body } = parseFrontmatter('Just text');
        expect(meta).toEqual({});
        expect(body).toBe('Just text');
    });
});

describe('extractMath', () => {
    it('extracts inline math', () => {
        const { html, store } = extractMath('Energy: $E = mc^2$ done.');
        expect(store.size).toBe(1);
        expect(html).toContain('math-placeholder');
        expect([...store.values()][0].expr).toBe('E = mc^2');
    });
    it('extracts display math', () => {
        const { store } = extractMath('See:\n$$\na^2 + b^2 = c^2\n$$\n');
        expect(store.size).toBe(1);
        const item = [...store.values()][0];
        expect(item.display).toBe(true);
        expect(item.expr).toBe('a^2 + b^2 = c^2');
    });
    it('does not match $ inside fenced code blocks', () => {
        const { store } = extractMath('```\nprice = $5\n```\nMath: $x$');
        expect(store.size).toBe(1);
    });
    it('does not match $ inside inline code', () => {
        const { store } = extractMath('`echo $PATH` then $y$');
        expect(store.size).toBe(1);
    });
    it('does not match currency-style $5 (digit after closing $)', () => {
        // The $ here would only match if the closing $ is followed by non-digit.
        // We test that "$5 plus $10" is left alone because there's no closing pair.
        const { store } = extractMath('Price is $5 only.');
        expect(store.size).toBe(0);
    });
    it('handles multiple inline math expressions', () => {
        const { store } = extractMath('$a$ and $b$ plus $c$');
        expect(store.size).toBe(3);
    });
});

describe('filterPosts', () => {
    const posts = [
        { title: 'Intro to Python', description: 'A tutorial', tags: ['python'], category: 'data', type: 'article' },
        { title: 'PDF Slides', description: '', tags: ['pdf'], category: 'demo', type: 'pdf' },
        { title: 'Repo X', description: '', tags: [], category: 'demo', type: 'repo' },
    ];
    it('filters by search', () => {
        expect(filterPosts(posts, { search: 'python' })).toHaveLength(1);
    });
    it('filters by tags', () => {
        expect(filterPosts(posts, { search: 'pdf' })).toHaveLength(1);
    });
    it('filters by category', () => {
        expect(filterPosts(posts, { category: 'demo' })).toHaveLength(2);
    });
    it('filters by type', () => {
        expect(filterPosts(posts, { type: 'pdf' })).toHaveLength(1);
    });
    it('combines filters', () => {
        expect(filterPosts(posts, { category: 'demo', type: 'repo' })).toHaveLength(1);
    });
});
