const fs = require('fs');
const path = require('path');

const sourceDir = 'C:/Users/mhoulem1/Documents/Scripts/UHALL Layout Project/Context';
const destDir = path.join(__dirname, '../uhall-layout/public');

const filesToCopy = [
  'Copy of UNH QUERY 8-15-24 (No Names).csv',
];

filesToCopy.forEach(file => {
  const srcPath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);

  fs.copyFile(srcPath, destPath, (err) => {
    if (err) {
      console.error(`Failed to copy ${file}:`, err);
    } else {
      console.log(`Copied ${file} to public directory.`);
    }
  });
});
