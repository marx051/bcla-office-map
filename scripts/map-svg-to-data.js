const fs = require('fs');
const path = require('path');
const { parse } = require('svgson');
const Papa = require('papaparse');

async function parseSVG(svgPath) {
  const svgContent = fs.readFileSync(svgPath, 'utf-8');
  const svgJson = await parse(svgContent);
  const texts = [];

  function traverse(node) {
    if (node.name === 'text' && node.children && node.children.length > 0) {
      const textValue = node.children.map(c => c.value).join('').trim();
      if (textValue) {
        const x = node.attributes.x || null;
        const y = node.attributes.y || null;
        texts.push({ text: textValue, x: parseFloat(x), y: parseFloat(y) });
      }
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(svgJson);
  return texts;
}

function parseCSV(csvPath) {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
}

async function mapRooms(svgPath, csvPath, outputPath) {
  try {
    const svgTexts = await parseSVG(svgPath);
    const csvData = await parseCSV(csvPath);

    // Create a map from RoomID to metadata
    const roomMap = {};
    csvData.forEach(row => {
      if (row.RoomID) {
        roomMap[row.RoomID] = row;
      }
    });

    // Match SVG text to CSV data by room number
    const mapped = svgTexts
      .map(({ text, x, y }) => {
        const roomData = roomMap[text];
        if (roomData) {
          return {
            RoomID: text,
            x,
            y,
            metadata: roomData,
          };
        }
        return null;
      })
      .filter(Boolean);

    fs.writeFileSync(outputPath, JSON.stringify(mapped, null, 2), 'utf-8');
    console.log(`Mapping saved to ${outputPath}`);
  } catch (error) {
    console.error('Error mapping SVG to data:', error);
  }
}

const svg3Path = path.resolve(__dirname, '../uhall-layout/data/UNH-3 Thematic Plan (BCLA).svg');
const csv3Path = path.resolve(__dirname, '../uhall-layout/data/Copy of UNH QUERY 8-15-24 (No Names).csv');
const output3Path = path.resolve(__dirname, '../uhall-layout/public/room-mapping-3.json');

const svg4Path = path.resolve(__dirname, '../uhall-layout/data/UNH-4 Thematic Plan (BCLA).svg');
const csv4Path = path.resolve(__dirname, '../uhall-layout/data/Copy of UNH QUERY 8-15-24 (No Names).csv');
const output4Path = path.resolve(__dirname, '../uhall-layout/public/room-mapping-4.json');

mapRooms(svg3Path, csv3Path, output3Path);
mapRooms(svg4Path, csv4Path, output4Path);
