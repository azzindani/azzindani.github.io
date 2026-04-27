// Playwright e2e smoke tests against the static site served from the repo.
const { test, expect } = require('@playwright/test');

test('feed loads and shows posts', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Portfolio/);
    // Wait for at least one feed item.
    await expect(page.locator('.feed-item').first()).toBeVisible({ timeout: 10000 });
});

test('featured row appears for featured posts', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.featured-row')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.featured-card').first()).toBeVisible();
});

test('navigating to a post renders its body', async ({ page }) => {
    await page.goto('/#/post/math-and-mermaid-showcase');
    // h1 with that title should appear.
    await expect(page.getByRole('heading', { name: /Markdown Showcase/i })).toBeVisible({ timeout: 10000 });
    // Code block should be present.
    await expect(page.locator('.post-content pre').first()).toBeVisible();
});

test('LaTeX math renders as KaTeX HTML on the showcase post', async ({ page }) => {
    await page.goto('/#/post/math-and-mermaid-showcase');
    // KaTeX wraps formulas in a `.katex` span.
    await expect(page.locator('.post-content .katex').first()).toBeVisible({ timeout: 15000 });
});

test('Mermaid diagram renders as SVG', async ({ page }) => {
    await page.goto('/#/post/math-and-mermaid-showcase');
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
    await page.goto('/');
    await page.locator('.feed-item').first().waitFor();
    await page.locator('#global-search').fill('mermaid');
    // Wait for debounce.
    await page.waitForTimeout(500);
    const titles = await page.locator('.feed-item-title').allTextContents();
    expect(titles.some(t => /mermaid|showcase/i.test(t))).toBe(true);
});
