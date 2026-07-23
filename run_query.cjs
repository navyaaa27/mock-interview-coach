const { chromium } = require('playwright');
const path = require('path');

const queryFile = process.argv[2] && process.argv[2].endsWith('.sql') ? process.argv[2] : 'query.sql';
const query = process.argv[2] && !process.argv[2].endsWith('.sql') ? process.argv[2] : require('fs').readFileSync(queryFile, 'utf8');

(async () => {
  const statePath = path.join(__dirname, 'supabase_state.json');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: statePath });
  const page = await context.newPage();
  
  try {
    console.log("Navigating to SQL Editor...");
    await page.goto('https://supabase.com/dashboard/project/oymtdxfzsccgczlqluud/sql/new', { 
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
    await page.waitForTimeout(10000);
    
    console.log("Setting SQL via Monaco API...");
    const success = await page.evaluate((q) => {
      if (window.monaco && window.monaco.editor) {
        const models = window.monaco.editor.getModels();
        if (models.length > 0) {
          models[0].setValue(q);
          return true;
        }
      }
      return false;
    }, query);
    
    if (!success) {
      console.log("Fallback: trying to type it in directly...");
      const textarea = page.locator('div.monaco-editor textarea');
      await textarea.first().click({ force: true });
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(500);
      await page.keyboard.insertText(query);
    }
    await page.waitForTimeout(2000);
    
    console.log("Executing SQL...");
    await page.keyboard.press('Control+Enter');
    await page.waitForTimeout(4000);
    
    // Check if the confirmation modal is visible
    const runQueryButton = page.locator('button:has-text("Run query")');
    if (await runQueryButton.count() > 0) {
      console.log("Confirmation modal found. Clicking 'Run query'...");
      await runQueryButton.click({ force: true });
    }
    
    console.log("Waiting for results to load (8 seconds)...");
    await page.waitForTimeout(8000);
    
    // Take a screenshot of the results
    const screenshotPath = 'C:/Users/suhan/.gemini/antigravity/brain/4a1d61c1-1516-48bd-8c5d-d869b979bd00/query_results.png';
    await page.screenshot({ path: screenshotPath });
    console.log("Screenshot saved to:", screenshotPath);
    
    // Extract results from DOM. 
    // In Supabase, the results grid is inside a panel. Let's extract paragraphs, tables, or buttons.
    console.log("Extracting results text from page...");
    
    // Let's get the entire text content of the page under the editor/results area
    const resultsArea = page.locator('.sql-editor-results, main, .grid-canvas');
    if (await resultsArea.count() > 0) {
      const text = await resultsArea.first().textContent();
      console.log("\n--- RESULTS AREA TEXT ---");
      console.log(text.trim());
      console.log("-------------------------\n");
    } else {
      // Fallback: search for any tables or pre tags or text in the main body
      const mainText = await page.textContent('body');
      console.log("\n--- BODY SNIPPET ---");
      console.log(mainText.substring(0, 1500).trim());
      console.log("--------------------\n");
    }

  } catch (error) {
    console.error("Error executing query:", error);
  } finally {
    await browser.close();
  }
})();
