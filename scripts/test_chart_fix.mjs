import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/CafeLimit/', { waitUntil: 'networkidle0' });

  // グラフ部分のスクリーンショット
  await page.screenshot({ path: '/Users/umeda_chikara/.gemini/antigravity/brain/be3398f0-b3ce-4b4b-8fbd-127c82ba5a41/test_chart_header_fixed.png' });

  await browser.close();
  console.log('Fixed chart header screenshot captured successfully.');
})();
