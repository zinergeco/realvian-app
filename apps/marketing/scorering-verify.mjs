import { chromium } from '@playwright/test';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext({ viewport: { width: 700, height: 250 } })).newPage();
await page.goto('http://localhost:3100/dev-test-scorering');
await page.waitForTimeout(800);
await page.screenshot({ path: '/home/claude/scorering-comparison.png' });
console.log('done');
