const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console events
  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));

  // Listen for unhandled exceptions
  page.on('pageerror', error => console.error(`[Browser Error] ${error.message}`));

  console.log('Navigating to http://localhost:3000');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  console.log('Waiting for engine to load...');
  await page.waitForTimeout(2000);

  console.log('Simulating click on the Navegador app icon...');
  // Assuming the click on the app icon based on the previously known DOM structure
  // and the data-path targeting from logic_os.js
  const navegadorIcon = await page.$('[data-path*="app_navegador"]');
  if (navegadorIcon) {
      await navegadorIcon.click({ force: true });
  } else {
      console.log('Could not find Navegador icon directly, trying alternative click...');
      // If we don't find it, we can just click center of screen where it might be, or use evaluate
      await page.evaluate(() => {
          const app = document.querySelector('[data-path*="app_navegador"]');
          if (app) app.click();
      });
  }

  console.log('Waiting for Navegador app to mount and iframe to load eficell.cl...');
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'verification/eficell_loaded.png' });
  console.log('Screenshot saved to verification/eficell_loaded.png');

  await browser.close();
})();
