const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const csvFilePath = path.join(__dirname, '../uhall-layout/data/Copy of UNH QUERY 8-15-24 (No Names).csv');
const jsonFilePath = path.join(__dirname, '../uhall-layout/data/Copy of UNH QUERY 8-15-24 (No Names).json');

fs.readFile(csvFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading CSV file:', err);
    return;
  }
  Papa.parse(data, {
    header: true,
    complete: (results) => {
      fs.writeFile(jsonFilePath, JSON.stringify(results.data, null, 2), 'utf8', (err) => {
        if (err) {
          console.error('Error writing JSON file:', err);
          return;
        }
        console.log('CSV file successfully converted to JSON:', jsonFilePath);
      });
    },
    error: (error) => {
      console.error('Error parsing CSV:', error);
    }
  });
});
