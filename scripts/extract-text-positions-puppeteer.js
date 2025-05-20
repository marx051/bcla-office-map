const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function extractTextPositionsFromSVG(svgFilePath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Load the SVG file as a data URL
  const svgContent = fs.readFileSync(svgFilePath, 'utf-8');
  const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);

  await page.goto(dataUrl);

  // Extract text elements and their bounding box positions
  const textData = await page.evaluate(() => {
    const texts = [];
    const textElements = document.querySelectorAll('text');

    textElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const text = el.textContent.trim();
      if (text) {
        texts.push({
          text,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        });
      }
    });
    return texts;
  });

  await browser.close();
  return textData;
}

async function processAllSVGsInFolder(folderPath, outputFile) {
  const files = fs.readdirSync(folderPath);
  const allData = {};

  for (const file of files) {
    if (file.toLowerCase().endsWith('.svg')) {
      const fullPath = path.join(folderPath, file);
      console.log(`Processing ${file}...`);
      const extracted = await extractTextPositionsFromSVG(fullPath);
      allData[file] = extracted;
      console.log(`  Extracted ${extracted.length} text elements.`);
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2), 'utf-8');
  console.log(`✅ Extraction complete. Data saved to ${outputFile}`);
}

(async () => {
  const folder = path.resolve(__dirname, '..', '..', 'UHALL Layout Project', 'Text Extraction');
  const outputFile = path.join(folder, 'all_svg_text_coordinates_puppeteer.json');
  await processAllSVGsInFolder(folder, outputFile);
})();
