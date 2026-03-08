import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

// Host the dist directory using python
const server = spawn('python3', ['-m', 'http.server', '5177', '-d', 'dist']);

setTimeout(async () => {
  console.log('Server running at http://localhost:5177');
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Capture all logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE EXCEPTION:', err));
  
  try {
      await page.goto('http://localhost:5177', { waitUntil: 'networkidle0', timeout: 10000 });
      console.log('Page loaded successfully');
  } catch (e) {
      console.log('Goto err:', e.message);
  }
  
  await browser.close();
  server.kill();
  process.exit(0);
}, 2000);
