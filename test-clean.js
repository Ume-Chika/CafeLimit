import puppeteer from 'puppeteer';

async function testNewInteractionAndScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 950, deviceScaleFactor: 2 });
  
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  await page.waitForSelector('canvas');
  await new Promise(r => setTimeout(r, 600));

  // 1. 通常状態のスクリーンショット
  const screenshotDefault = '/Users/umeda_chikara/Programs/web/CafeLimit/screenshot-clean.png';
  await page.screenshot({ path: screenshotDefault, fullPage: true });

  // 2. グラフの空白（例: 14:00 付近）をクリックして Info バナーを表示
  const canvas = await page.$('canvas');
  if (canvas) {
    const box = await canvas.boundingBox();
    if (box) {
      // 14:00 付近（幅の約50%あたり）をクリック
      await page.mouse.click(box.x + box.width * 0.50, box.y + box.height * 0.45);
      await new Promise(r => setTimeout(r, 600));
    }
  }

  const screenshotBanner = '/Users/umeda_chikara/Programs/web/CafeLimit/screenshot-banner.png';
  await page.screenshot({ path: screenshotBanner, fullPage: true });

  // 3. 就寝時刻ボタンをクリックしてクイックピッカーを開く
  const bedBtn = await page.$('#sleep-safety-section button');
  if (bedBtn) {
    await bedBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }

  const screenshotBedPicker = '/Users/umeda_chikara/Programs/web/CafeLimit/screenshot-bedpicker.png';
  await page.screenshot({ path: screenshotBedPicker, fullPage: true });

  await browser.close();
  console.log('All verification screenshots captured!');
}

testNewInteractionAndScreenshots().catch(console.error);
