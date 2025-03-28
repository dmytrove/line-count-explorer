const fs = require('fs');
const path = require('path');

// Define the source and destination paths
const fixturesDir = path.join('out', 'test', 'fixtures');
const sourceFile = path.join('src', 'test', 'fixtures', 'test-file.txt');
const destFile = path.join(fixturesDir, 'test-file.txt');

// Create the fixtures directory if it doesn't exist
if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
    console.log(`Created directory: ${fixturesDir}`);
}

// Copy the test file
try {
    fs.copyFileSync(sourceFile, destFile);
    console.log(`Successfully copied test fixture: ${sourceFile} -> ${destFile}`);
} catch (err) {
    console.error(`Error copying fixture file: ${err.message}`);
    process.exit(1);
}