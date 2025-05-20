const Tesseract = require('tesseract.js');
const path = require('path');

const imagesDir = path.join(__dirname, '../uhall-layout/public');

const filesToProcess = [
  'UNH-3-11x17.png',
  'UNH-4-11x17.png',
];

filesToProcess.forEach(file => {
  const imagePath = path.join(imagesDir, file);

  const fs = require('fs');
  Tesseract.recognize(imagePath, 'eng', {
    logger: m => console.log(m),
  }).then(({ data }) => {
    const imageWidth = data?.image?.width || 1;
    const imageHeight = data?.image?.height || 1;

    let baseWidth = imageWidth;
    let baseHeight = imageHeight;

    if (data.textlines && data.textlines.length > 0) {
      baseWidth = data.textlines[0].bbox.x1;
      baseHeight = data.textlines[0].bbox.y1;
    } else if (data.lines && data.lines.length > 0) {
      baseWidth = data.lines[0].bbox.x1;
      baseHeight = data.lines[0].bbox.y1;
    } else if (data.blocks && data.blocks.length > 0) {
      baseWidth = data.blocks[0].bbox.x1;
      baseHeight = data.blocks[0].bbox.y1;
    }

    const rooms = data.words
      .filter(w => /^\d{3,4}$/.test(w.text)) // match room numbers
      .map(w => ({
        room: w.text,
        xPct: w.bbox.x0 / baseWidth,
        yPct: w.bbox.y0 / baseHeight
      }));

    const outputFile = path.join(__dirname, file.replace('.png', '-rooms.json'));
    const outputPdf = path.join(__dirname, file.replace('.png', '-rooms.txt'));
    const fs = require('fs');
    fs.writeFileSync(outputFile, JSON.stringify(rooms, null, 2), 'utf-8');
    // Write a simple text file for easier review
    const textContent = rooms.map(r => "Room: " + r.room + ", X%: " + (r.xPct*100).toFixed(2) + ", Y%: " + (r.yPct*100).toFixed(2)).join('\n');
    fs.writeFileSync(outputPdf, textContent, 'utf-8');
    console.log("Extracted rooms from " + file + " and saved to " + outputFile);
    console.log("Text output saved to " + outputPdf);
  }).catch(err => {
    console.error("Error processing " + file + ":", err);
  });
});
