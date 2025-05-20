const Tesseract = require('tesseract.js');
const path = require('path');

const pdfDir = 'C:/Users/mhoulem1/Documents/Scripts/UHALL Layout Project/Context';

const filesToProcess = [
  'UNH-3 11x17.pdf',
  'UNH-4 11x17.pdf',
];

filesToProcess.forEach(file => {
  const pdfPath = path.join(pdfDir, file);

  Tesseract.recognize(pdfPath, 'eng', {
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
    }

    const rooms = data.words
      .filter(w => /^\d{3,4}$/.test(w.text)) // match room numbers
      .map(w => ({
        room: w.text,
        xPct: w.bbox.x0 / baseWidth,
        yPct: w.bbox.y0 / baseHeight
      }));

    const outputFile = path.join(__dirname, file.replace('.pdf', '-rooms.json'));
    const fs = require('fs');
    fs.writeFileSync(outputFile, JSON.stringify(rooms, null, 2), 'utf-8');
    console.log("Extracted rooms from " + file + " and saved to " + outputFile);
  }).catch(err => {
    console.error("Error processing " + file + ":", err);
  });
});
