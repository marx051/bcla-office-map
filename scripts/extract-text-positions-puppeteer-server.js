const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer');

const PORT = 8080;
const HOST = 'localhost';

function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(rootDir, decodeURIComponent(req.url));
      if (filePath.endsWith('/')) {
        filePath += 'index.html';
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        let contentType = 'text/html';
        if (filePath.endsWith('.svg')) {
          contentType = 'image/svg+xml';
        }
        res.setHeader('Content-Type', contentType);
        res.end(data);
      });
    });

    server.listen(PORT, HOST, () => {
      console.log(`Static server running at http://${HOST}:${PORT}/`);
      resolve(server);
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

async function extractTextPositionsFromSVG(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle0' });

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

async function processAllSVGsInFolder(rootDir, outputFile) {
  const server = await startStaticServer(rootDir);
  const files = fs.readdirSync(rootDir);
  const allData = {};

  for (const file of files) {
    if (file.toLowerCase().endsWith('.svg')) {
      const url = `http://${HOST}:${PORT}/${encodeURIComponent(file)}`;
      console.log(`Processing ${file} at ${url}...`);
      const extracted = await extractTextPositionsFromSVG(url);
      allData[file] = extracted;
      console.log(`  Extracted ${extracted.length} text elements.`);
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2), 'utf-8');
  console.log(`✅ Extraction complete. Data saved to ${outputFile}`);

  server.close();
}

(async () => {
  const folder = path.resolve(__dirname, '..', '..', 'UHALL Layout Project', 'Text Extraction');
  const outputFile = path.join(folder, 'all_svg_text_coordinates_puppeteer_server.json');
  await processAllSVGsInFolder(folder, outputFile);
})();
