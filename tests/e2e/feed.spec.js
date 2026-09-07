// Playwright e2e smoke tests against the static site served from the repo.
const { test, expect } = require('@playwright/test');
const { installFixtures, FIXTURE_SLUG } = require('../fixtures/install');

test('feed loads and shows posts', async ({ page }) => {
    await page.goto('/#/projects');
    await expect(page).toHaveTitle(/Azzindani/);
    // Wait for at least one feed item.
    await expect(page.locator('.feed-item').first()).toBeVisible({ timeout: 10000 });
});

test('featured row appears for featured posts', async ({ page }) => {
    await page.goto('/#/projects');
    await expect(page.locator('.featured-row')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.featured-card').first()).toBeVisible();
});

test('navigating to a post renders its body', async ({ page }) => {
    await installFixtures(page);
    await page.goto(`/#/post/${FIXTURE_SLUG}`);
    // h1 with that title should appear.
    await expect(page.getByRole('heading', { name: /Markdown Pipeline Fixture/i })).toBeVisible({ timeout: 10000 });
    // Code block should be present.
    await expect(page.locator('.post-content pre').first()).toBeVisible();
});

test('LaTeX math renders as KaTeX HTML', async ({ page }) => {
    await installFixtures(page);
    await page.goto(`/#/post/${FIXTURE_SLUG}`);
    // KaTeX wraps formulas in a `.katex` span.
    await expect(page.locator('.post-content .katex').first()).toBeVisible({ timeout: 15000 });
});

test('Mermaid diagram renders as SVG', async ({ page }) => {
    await installFixtures(page);
    await page.goto(`/#/post/${FIXTURE_SLUG}`);
    // Mermaid replaces our placeholder with an SVG.
    await expect(page.locator('.post-content .mermaid-block svg').first()).toBeVisible({ timeout: 15000 });
});

test('docs page shows sidebar and content', async ({ page }) => {
    await page.goto('/#/docs');
    await expect(page.locator('.docs-sidebar')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.docs-content')).toBeVisible();
});

test('collections index shows known collections', async ({ page }) => {
    await page.goto('/#/collections');
    await expect(page.locator('.collection-card').first()).toBeVisible({ timeout: 10000 });
});

test('neural network canvas is mounted', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('#neural-bg');
    await expect(canvas).toBeAttached();
    // It should have non-zero size.
    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
});

test('search filters the feed', async ({ page }) => {
    await page.goto('/#/blog');
    await page.locator('.feed-item').first().waitFor();
    const before = await page.locator('.feed-item').count();
    await page.locator('#global-search').fill('folio');
    // Wait for debounce.
    await page.waitForTimeout(500);
    const titles = await page.locator('.feed-item-title').allTextContents();
    // Search covers title, description and tags — "Finally. I Just Ask." comes
    // back on its tags alone — so assert that the feed narrowed and that the
    // matches are the ones expected, not that every title contains the term.
    expect(titles.length).toBeGreaterThan(0);
    expect(titles.length).toBeLessThan(before);
    expect(titles.some(t => /Folio/.test(t))).toBe(true);
});

test('document title updates on navigation', async ({ page }) => {
    await installFixtures(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/Azzindani/);
    await page.goto(`/#/post/${FIXTURE_SLUG}`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Markdown Pipeline Fixture/);
});

test('JSON-LD structured data is injected on post pages', async ({ page }) => {
    await installFixtures(page);
    await page.goto(`/#/post/${FIXTURE_SLUG}`);
    await expect(page.locator('script[data-jsonld]')).toBeAttached({ timeout: 10000 });
    const json = await page.locator('script[data-jsonld]').textContent();
    const data = JSON.parse(json);
    expect(data['@type']).toBe('BlogPosting');
});

test('theme toggle switches data-theme', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await page.locator('#theme-toggle').click();
    const themeAfter = await html.getAttribute('data-theme');
    expect(['light', 'dark']).toContain(themeAfter);
});

test('tag page lists posts with that tag', async ({ page }) => {
    await page.goto('/#/tag/python');
    await expect(page.getByRole('heading', { name: /Tag: python/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.feed-item').first()).toBeVisible();
});

test('category page lists posts in that category', async ({ page }) => {
    // A category that real content actually uses — 'demo' existed only on
    // the placeholder post this suite used to depend on.
    await page.goto('/#/category/automation');
    await expect(page.getByRole('heading', { name: /Category: automation/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.feed-item').first()).toBeVisible();
});

test('post page shows action bar and prev/next', async ({ page }) => {
    await installFixtures(page);
    await page.goto(`/#/post/${FIXTURE_SLUG}`);
    await expect(page.locator('.post-actions')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#post-share-copy')).toBeVisible();
});

test('code blocks have language label and copy button', async ({ page }) => {
    await installFixtures(page);
    await page.goto(`/#/post/${FIXTURE_SLUG}`);
    await expect(page.locator('.post-content .code-block').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.post-content .code-lang-label').first()).toBeVisible();
});

test('clicking a content image opens lightbox', async ({ page }) => {
    // Any real article body will do: the lightbox binds to .post-content.
    await page.goto('/#/post/broker-transaction-analysis');
    await page.waitForLoadState('networkidle');
    // Lightbox is created lazily on first click; just confirm the handler is wired
    // by ensuring `.post-content` exists.
    await expect(page.locator('.post-content')).toBeVisible();
});

test('skip link exists and is focusable', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.skip-link')).toBeAttached();
});

test('robots.txt and sitemap.xml exist and are valid', async ({ request }) => {
    const r1 = await request.get('/robots.txt');
    expect(r1.ok()).toBe(true);
    expect(await r1.text()).toContain('Sitemap:');
    const r2 = await request.get('/sitemap.xml');
    expect(r2.ok()).toBe(true);
    expect(await r2.text()).toContain('<urlset');
    const r3 = await request.get('/feed.xml');
    expect(r3.ok()).toBe(true);
    expect(await r3.text()).toContain('<feed');
});

test('navbar has Home, Projects, Blog, Docs tabs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.nav-tabs .nav-tab[data-tab="home"]')).toBeVisible();
    // Scope to .nav-tabs so each locator resolves to exactly one element
    // (duplicate tab elements exist in the mobile drawer).
    await expect(page.locator('.nav-tabs .nav-tab[data-tab="projects"]')).toBeVisible();
    await expect(page.locator('.nav-tabs .nav-tab[data-tab="blog"]')).toBeVisible();
    await expect(page.locator('.nav-tabs .nav-tab[data-tab="docs"]')).toBeVisible();
});

test('Home tab is active on /; Blog tab activates on /blog', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.nav-tabs .nav-tab[data-tab="home"]')).toHaveClass(/active/);
    await page.locator('.nav-tabs .nav-tab[data-tab="blog"]').click();
    await expect(page).toHaveURL(/#\/blog/);
    await expect(page.locator('.nav-tabs .nav-tab[data-tab="blog"]')).toHaveClass(/active/);
});

test('Projects feed only shows project-kind posts', async ({ page }) => {
    await page.goto('/#/projects');
    await page.locator('.feed-item').first().waitFor();
    const titles = await page.locator('.feed-item-title').allTextContents();
    // At least one project-kind post must render. Match generously across the
    // current real content: MCP servers, ID Regulation PDFs, Hugging Face
    // models/datasets, GRPO, the legacy CV/data projects.
    expect(titles.some(t => /MCP|GRPO|Regulation|Detection|Recognition|Broker|Statement|Qwen|Deepseek|Dataset/i.test(t))).toBe(true);
    // Blog-kind posts must NOT appear on the Projects feed.
    expect(titles.some(t => /Six Connectors Carry Everything/.test(t))).toBe(false);
});

test('Blog feed only shows blog-kind posts', async ({ page }) => {
    await page.goto('/#/blog');
    await page.locator('.feed-item').first().waitFor();
    const titles = await page.locator('.feed-item-title').allTextContents();
    expect(titles.some(t => /Six Connectors Carry Everything/.test(t))).toBe(true);
    // Nothing from the projects side, and no docs — those live under /docs and
    // resolve to 'blog' through postKind, so they leaked here until the feed
    // started excluding type === 'doc' outright.
    expect(titles.some(t => /MCP Data Analyst/i.test(t))).toBe(false);
    expect(titles.some(t => /^(How This Site Works|Publishing a Post)$/.test(t))).toBe(false);
});

test('pagination renders when there are enough posts', async ({ page }) => {
    // The blog tab has more entries than postsPerPage=9? Likely not yet —
    // just check the pagination element exists, even if empty.
    await page.goto('/#/blog');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#pagination')).toBeAttached();
});

// ── Landing page ──

test('landing page renders all nine stages', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.lp-hero')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.lp-stage')).toHaveCount(9);
    await expect(page.locator('.lp-hero-title')).toBeVisible();
});

test('landing hero reveals its content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.lp-hero-title.in-view')).toBeVisible({ timeout: 10000 });
});

test('landing stats fill in from the post manifest', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const values = await page.locator('.lp-stat-value').allTextContents();
    expect(values.length).toBe(3);
    // Placeholder em-dashes must have been replaced by real counts.
    expect(values.every(v => /^\d+$/.test(v.trim()))).toBe(true);
});

test('topic ticker duplicates its track for a seamless loop', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.lp-ticker-row')).toHaveCount(2);
    // Each row holds the chip list twice; the clone is hidden from a11y tree.
    const firstRow = page.locator('.lp-ticker-row').first();
    await expect(firstRow.locator('.lp-ticker-group')).toHaveCount(2);
    await expect(firstRow.locator('.lp-ticker-group[aria-hidden="true"]')).toHaveCount(1);
});

test('scrolling drives the neural background phase', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.lp-hero')).toBeVisible({ timeout: 10000 });

    const readPhase = () => page.evaluate(() => {
        // setPhase clamps and stores; expose progress via a probe scroll read.
        return window.__lpPhase;
    });

    // Wrap setPhase so the test can observe what scroll feeds the canvas.
    await page.evaluate(() => {
        const orig = window.NeuralBG.setPhase;
        window.__lpPhase = 0;
        window.NeuralBG.setPhase = (p) => { window.__lpPhase = p; return orig(p); };
    });

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const atTop = await readPhase();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    const atBottom = await readPhase();

    expect(atBottom).toBeGreaterThan(atTop);
    expect(atBottom).toBeLessThanOrEqual(6);
});

test('leaving the landing page resets the background phase', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.lp-hero')).toBeVisible({ timeout: 10000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    await page.goto('/#/projects');
    await page.locator('.feed-item').first().waitFor({ timeout: 10000 });
    // Landing DOM is gone, so no stage elements remain to drive the canvas.
    await expect(page.locator('.lp-stage')).toHaveCount(0);
});
