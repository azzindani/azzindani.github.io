// Playwright config — chromium only by default, runs against local static server.
const { defineConfig, devices } = require('@playwright/test');

const PORT = process.env.PORT || 4173;

module.exports = defineConfig({
    testDir: './tests/e2e',
    timeout: 30_000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'on-first-retry',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
        command: `node tests/serve.js`,
        port: +PORT,
        reuseExistingServer: !process.env.CI,
        env: { PORT: String(PORT) },
        timeout: 30_000,
    },
});
