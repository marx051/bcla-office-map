const fs = require('fs');
const path = require('path');

const tesseractDataPath = path.join(__dirname, 'UNH-3-11x17-rooms.json'); // Adjust as needed
const officeDataPath = path.join(__dirname, '../uhall-layout/data/Copy of UNH QUERY 8-15-24 (No Names).json'); // Convert your Excel to JSON and place here

// Load JSON data
const tesseractData = JSON.parse(fs.readFileSync(tesseractDataPath, 'utf-8'));
const officeData = JSON.parse(fs.readFileSync(officeDataPath, 'utf-8'));

// Merge by room number
const mergedData = tesseractData.map(coord => {
  const match = officeData.find(office => office.room === coord.room);
  return {
    ...coord,
    ...(match || {})
  };
});

// Save merged data
const outputPath = path.join(__dirname, 'merged-room-data.json');
fs.writeFileSync(outputPath, JSON.stringify(mergedData, null, 2), 'utf-8');
console.log('Merged room data saved to', outputPath);
