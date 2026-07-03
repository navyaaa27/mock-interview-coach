const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const statePath = path.join(__dirname, 'supabase_state.json');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: statePath });
  const page = await context.newPage();
  
  const sqlCode = `
CREATE TABLE IF NOT EXISTS public.study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) NOT NULL,
  generated_at timestamptz DEFAULT now(),
  interview_date date,
  weeks_until_interview integer,
  plan_json jsonb NOT NULL,
  is_active boolean DEFAULT true
);

-- Basic RLS for study_plans
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own study plans" ON public.study_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own study plans" ON public.study_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own study plans" ON public.study_plans FOR UPDATE USING (auth.uid() = user_id);
`;

  try {
    console.log("Navigating to SQL Editor...");
    await page.goto('https://supabase.com/dashboard/project/oymtdxfzsccgczlqluud/sql/new');
    
    // Wait for the SQL Editor interface to load
    await page.waitForTimeout(10000);
    
    console.log("Focusing Monaco Editor...");
    const textarea = page.locator('div.monaco-editor textarea');
    await textarea.first().focus();
    
    console.log("Pasting SQL Code...");
    await textarea.first().fill(sqlCode);
    await page.waitForTimeout(2000);
    
    console.log("Locating and clicking 'Run' button...");
    await page.keyboard.press('Control+Enter');
    
    console.log("Query triggered. Waiting for execution...");
    await page.waitForTimeout(6000);
    
    const screenshotPath = 'C:/Users/suhan/.gemini/antigravity/brain/4a1d61c1-1516-48bd-8c5d-d869b979bd00/sql_study_plans.png';
    await page.screenshot({ path: screenshotPath });
    console.log("Screenshot saved to:", screenshotPath);
    
  } catch (error) {
    console.error("Error occurred running SQL:", error);
    await page.screenshot({ path: 'C:/Users/suhan/.gemini/antigravity/brain/4a1d61c1-1516-48bd-8c5d-d869b979bd00/playwright_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
