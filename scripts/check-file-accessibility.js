const fs = require('fs');
const path = require('path');

const filesToCheck = [
  '../uhall-layout/public/UNH-3 Thematic Plan (BCLA).svg',
  '../uhall-layout/public/UNH-4 Thematic Plan (BCLA).svg',
  '../uhall-layout/public/room-mapping-3.json',
  '../uhall-layout/public/room-mapping-4.json',
  '../uhall-layout/public/Copy of UNH QUERY 8-15-24 (No Names).csv',
];

filesToCheck.forEach((filePath) => {
  const resolvedPath = path.resolve(__dirname, filePath);
  try {
    if (fs.existsSync(resolvedPath)) {
      console.log(`File exists: ${resolvedPath}`);
    } else {
      console.error(`File NOT found: ${resolvedPath}`);
    }
  } catch (err) {
    console.error(`Error checking file ${resolvedPath}:`, err);
  }
});
