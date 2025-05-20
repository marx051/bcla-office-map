const { exec } = require('child_process');
const path = require('path');

const sourceDir = 'C:/Users/mhoulem1/Documents/Scripts/UHALL Layout Project/Context';
const outputDir = path.join(__dirname, '../uhall-layout/public');

const filesToConvert = [
  'UNH-3 11x17.pdf',
  'UNH-4 11x17.pdf',
];

filesToConvert.forEach(file => {
  const inputPath = path.join(sourceDir, file);
  const outputFileName = file.replace('.pdf', '.png').replace(/ /g, '-');
  const outputPath = path.join(outputDir, outputFileName);

  const command = "magick convert \"" + inputPath + "\" -density 300 -quality 100 \"" + outputPath + "\"";

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Error converting " + file + ":", error);
      return;
    }
    if (stderr) {
      console.error("Conversion stderr for " + file + ":", stderr);
    }
    console.log("Converted " + file + " to " + outputFileName);
  });
});
