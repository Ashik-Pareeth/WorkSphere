const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true,
    executablePath: 'C:\\Users\\Ashik\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // 1. Login
    console.log("Navigating to login...");
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    // Type credentials
    await page.type('input[type="text"], input[name="username"], input[name="email"], input[id="username"]', 'admin');
    await page.type('input[type="password"]', 'admin123');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    console.log("Waiting for dashboard...");
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // 2. Screenshot Dashboard
    console.log("Taking Dashboard screenshot...");
    await page.screenshot({ path: 'dashboard.png', fullPage: true });

    // 3. Screenshot Tasks
    console.log("Navigating to Tasks...");
    await page.goto('http://localhost:5173/tasks', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'tasks.png', fullPage: true });

    // 4. Screenshot Hiring/Jobs (Kanban placeholder)
    console.log("Navigating to Hiring...");
    await page.goto('http://localhost:5173/hiring/jobs', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'kanban.png', fullPage: true });

    // 5. Screenshot Payroll
    console.log("Navigating to Payroll...");
    await page.goto('http://localhost:5173/hr/payroll', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'payroll.png', fullPage: true });

    console.log("All screenshots taken successfully!");
  } catch (error) {
    console.error("Error capturing screenshots:", error);
  } finally {
    await browser.close();
  }
})();
