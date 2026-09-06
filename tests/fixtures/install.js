// Fixtures for the markdown rendering pipeline, served by route interception.
//
// No real post on this site uses LaTeX or mermaid — the content is repo
// READMEs, PDF decks and plain articles — so the pipeline tests need a post of
// their own. It used to be a demo post committed to content/ and hidden with
// `draft: true`, which meant the published manifest carried two placeholder
// entries purely for the test suite, and a content rewrite broke the suite.
//
// Intercepting the manifest fetch instead keeps content/ entirely real and
// makes these tests independent of what is published. The interception has to
// be installed before the first navigation, because ContentService caches the
// manifest on the module the moment any route asks for it.
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const FIXTURE_SLUG = 'markdown-pipeline-fixture';
const FIXTURE_TITLE = 'Markdown Pipeline Fixture';

const BODY = fs.readFileSync(path.join(__dirname, 'markdown-pipeline.md'), 'utf8');

// Manifest fields win over markdown frontmatter (see ContentService.getPost),
// so the title asserted by the tests lives here.
const ENTRY = {
    slug: FIXTURE_SLUG,
    title: FIXTURE_TITLE,
    description: 'Exercises every renderer configureMarked wires up.',
    date: '2026-01-01',
    category: 'fixtures',
    tags: ['latex', 'mermaid', 'fixture'],
    image: '',
    type: 'article',
    kind: 'blog',
    file: `${FIXTURE_SLUG}.md`,
    draft: false,
};

async function installFixtures(page) {
    // Read the real manifest each time rather than at require time, so the
    // fixture rides on whatever is actually published rather than a snapshot.
    await page.route('**/content/posts.json*', async (route) => {
        const manifest = JSON.parse(
            fs.readFileSync(path.join(REPO, 'content', 'posts.json'), 'utf8'));
        manifest.posts = [ENTRY, ...manifest.posts];
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(manifest),
        });
    });

    await page.route(`**/content/posts/${FIXTURE_SLUG}.md`, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'text/markdown; charset=utf-8',
            body: BODY,
        });
    });
}

module.exports = { installFixtures, FIXTURE_SLUG, FIXTURE_TITLE };
