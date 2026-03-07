const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR STACK:', error.stack));

    console.log('Navigating to Vercel preview...');
    const response = await page.goto('http://localhost:4180', { waitUntil: 'domcontentloaded' });
    console.log('Status:', response.status());

    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({path: 'vercel_preview_local.png'});
    
    await browser.close();
})();
