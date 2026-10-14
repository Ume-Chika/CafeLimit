import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PUBLIC_DIR = '/Users/umeda_chikara/Programs/web/CafeLimit/public';

// アプリ内で使われている公式アイコンSVG（#3E271E 角丸スクエア ＋ Lucide Coffee）
function getOfficialAppIconSvg(size = 512, rounded = true) {
  const rx = rounded ? (size * 0.234) : 0; // 約120px on 512
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
      <!-- 背景：アプリ公式カラー #3E271E -->
      <rect width="512" height="512" rx="${rx}" fill="#3E271E" />
      
      <!-- コーヒーカップアイコン（Lucide Coffee 幾何学パス） -->
      <g transform="translate(112, 112) scale(12)" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M10 2v2" />
        <path d="M14 2v2" />
        <path d="M6 2v2" />
        <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
      </g>
    </svg>
  `.trim();
}

async function main() {
  console.log('Generating official app icons based on in-app Coffee icon...');

  // 1. public/favicon.svg 保存
  const faviconSvg = getOfficialAppIconSvg(512, true);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), faviconSvg);
  console.log('Updated public/favicon.svg');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // 2. apple-touch-icon.png (180x180)
  await page.setViewport({ width: 180, height: 180, deviceScaleFactor: 1 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 180px; height: 180px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #3E271E; }
          svg { width: 180px; height: 180px; }
        </style>
      </head>
      <body>
        ${getOfficialAppIconSvg(180, false)}
      </body>
    </html>
  `);
  await page.screenshot({ path: path.join(PUBLIC_DIR, 'apple-touch-icon.png') });
  console.log('Generated apple-touch-icon.png (180x180)');

  // 3. icon-192.png (192x192)
  await page.setViewport({ width: 192, height: 192, deviceScaleFactor: 1 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 192px; height: 192px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: transparent; }
          svg { width: 192px; height: 192px; }
        </style>
      </head>
      <body>
        ${getOfficialAppIconSvg(192, true)}
      </body>
    </html>
  `);
  await page.screenshot({ path: path.join(PUBLIC_DIR, 'icon-192.png'), omitBackground: true });
  console.log('Generated icon-192.png (192x192)');

  // 4. icon-512.png (512x512)
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 512px; height: 512px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: transparent; }
          svg { width: 512px; height: 512px; }
        </style>
      </head>
      <body>
        ${getOfficialAppIconSvg(512, true)}
      </body>
    </html>
  `);
  await page.screenshot({ path: path.join(PUBLIC_DIR, 'icon-512.png'), omitBackground: true });
  console.log('Generated icon-512.png (512x512)');

  // 5. icon-maskable-192.png & icon-maskable-512.png (Android Safe Zone: scale 0.75)
  function getMaskableSvg(_size) {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
        <rect width="512" height="512" fill="#3E271E" />
        <g transform="translate(148, 148) scale(9)" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <path d="M10 2v2" />
          <path d="M14 2v2" />
          <path d="M6 2v2" />
          <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
        </g>
      </svg>
    `.trim();
  }

  await page.setViewport({ width: 192, height: 192, deviceScaleFactor: 1 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 192px; height: 192px; overflow: hidden; }
          svg { width: 192px; height: 192px; }
        </style>
      </head>
      <body>${getMaskableSvg(192)}</body>
    </html>
  `);
  await page.screenshot({ path: path.join(PUBLIC_DIR, 'icon-maskable-192.png') });
  console.log('Generated icon-maskable-192.png');

  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 512px; height: 512px; overflow: hidden; }
          svg { width: 512px; height: 512px; }
        </style>
      </head>
      <body>${getMaskableSvg(512)}</body>
    </html>
  `);
  await page.screenshot({ path: path.join(PUBLIC_DIR, 'icon-maskable-512.png') });
  console.log('Generated icon-maskable-512.png');

  // 6. og-image.png (1200x630)
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=Zen+Kaku+Gothic+New:wght@600;700;900&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 1200px;
            height: 630px;
            background: #F8F5EE;
            font-family: 'Zen Kaku Gothic New', 'Plus Jakarta Sans', sans-serif;
            color: #1C1917;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 60px 80px;
          }

          .container {
            display: flex;
            align-items: center;
            gap: 60px;
            max-width: 1040px;
            width: 100%;
            background: #FFFFFF;
            border: 1.5px solid #E7E5E4;
            border-radius: 36px;
            padding: 50px 60px;
            box-shadow: 0 20px 40px rgba(62, 39, 30, 0.08);
          }

          .icon-box {
            width: 160px;
            height: 160px;
            border-radius: 36px;
            background: #3E271E;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 12px 24px rgba(62, 39, 30, 0.2);
          }

          .icon-box svg {
            width: 90px;
            height: 90px;
          }

          .content {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .brand-row {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .brand-name {
            font-size: 48px;
            font-weight: 900;
            color: #1C1917;
            letter-spacing: -0.03em;
          }

          .brand-badge {
            font-size: 13px;
            font-weight: 800;
            color: #B45309;
            background: #FEF3C7;
            border: 1px solid #FDE68A;
            padding: 3px 12px;
            border-radius: 20px;
          }

          .hero-catch {
            font-size: 28px;
            font-weight: 900;
            color: #292524;
            line-height: 1.35;
          }

          .hero-sub {
            font-size: 16px;
            color: #78716C;
            font-weight: 600;
            line-height: 1.5;
          }

          .tags-row {
            display: flex;
            gap: 8px;
            margin-top: 6px;
          }

          .tag {
            font-size: 13px;
            font-weight: 700;
            color: #57534E;
            background: #F5F5F4;
            border: 1px solid #E7E5E4;
            padding: 4px 12px;
            border-radius: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon-box">
            <svg viewBox="0 0 24 24" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
              <path d="M10 2v2" />
              <path d="M14 2v2" />
              <path d="M6 2v2" />
              <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
            </svg>
          </div>
          <div class="content">
            <div class="brand-row">
              <div class="brand-name">CafeLimit</div>
              <div class="brand-badge">カフェイン＆睡眠シミュレーター</div>
            </div>
            <div class="hero-catch">
              カフェインを楽しみ、ぐっすり眠るためのシミュレーター
            </div>
            <div class="hero-sub">
              飲むタイミングと就寝への影響を科学的に可視化。今夜の睡眠を守るリミット時刻を自動逆算します。
            </div>
            <div class="tags-row">
              <div class="tag">☕ ネスカフェ・エナドリ対応</div>
              <div class="tag">🌙 就寝閾値逆算</div>
              <div class="tag">⚡ 経口吸収Batemanモデル</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
  await page.screenshot({ path: path.join(PUBLIC_DIR, 'og-image.png') });
  console.log('Generated og-image.png (1200x630)');

  await browser.close();

  // 7. favicon.ico マルチサイズ生成 (Python Pillow)
  console.log('Generating favicon.ico...');
  const pyCode = `
from PIL import Image
import os

pub = "${PUBLIC_DIR}"
img = Image.open(os.path.join(pub, "icon-512.png"))
img.save(os.path.join(pub, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print("favicon.ico generated successfully.")
`;
  fs.writeFileSync('/tmp/make_official_ico.py', pyCode);
  execSync('python3 /tmp/make_official_ico.py');
  fs.unlinkSync('/tmp/make_official_ico.py');

  console.log('All official assets generated successfully!');
}

main().catch(console.error);
