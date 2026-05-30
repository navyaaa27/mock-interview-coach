const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("Navigating to local app...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    console.log("Logging in...");
    await page.fill('#login-email', 'test_user_a@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('#btn-login');

    // Wait for dashboard to load
    await page.waitForSelector('#dashboard-view', { state: 'visible', timeout: 10000 });
    console.log("Dashboard loaded.");

    console.log("Clicking 'Start New Interview Session'...");
    await page.click('.btn-start-interview');

    // Wait for setup view
    await page.waitForSelector('#setup-view', { state: 'visible', timeout: 5000 });
    console.log("Setup View is visible.");

    console.log("Selecting Behavioral interview type...");
    await page.click('#type-behavioral');

    console.log("Selecting Hard difficulty...");
    await page.click('#diff-hard');

    console.log("Checking readiness checklist...");
    await page.check('#check-mic');
    await page.check('#check-cam');
    await page.check('#check-quiet');

    console.log("Clicking 'Start Interview'...");
    
    // Setup dialog handler to catch the alert
    let dialogMessage = "";
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      console.log(`Alert received: ${dialogMessage}`);
      await dialog.accept();
    });

    await page.click('#btn-begin-interview');

    // Wait for the alert to trigger and DB call to finish
    await page.waitForTimeout(4000);

    if (dialogMessage.includes('Session Created!')) {
      console.log("✅ Success: Session was created successfully in Supabase!");
    } else {
      console.log("❌ Error: Expected success alert not seen. Found:", dialogMessage);
    }
    
    await page.screenshot({ path: path.join(__dirname, 'setup_screen_test.png') });

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();
