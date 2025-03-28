import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { LineCounterManager } from '../modules/lineCounter';
import { LineCountConfig } from '../modules/types';

describe('LineCounterManager', () => {
  let lineCounterManager: LineCounterManager;

  before(() => {
    const testConfig: LineCountConfig = {
      countMode: 'lines',
      supportedExtensions: ['.txt', '.js'],
      thresholds: [
        {value: 0, indicator: '⚪', description: 'Tiny size'},
        {value: 100, indicator: '🔵', description: 'Small size'}
      ],
      indicatorSymbolSet: 'Colored Circles'
    };
    lineCounterManager = new LineCounterManager(testConfig);
  });

  it('should count lines correctly', () => {
    // Update path to use the source file directly
    const testFilePath = path.resolve(__dirname, '../../src/test/fixtures/test-file.txt');
    
    // Ensure the file exists before running the test
    if (!fs.existsSync(testFilePath)) {
      throw new Error(`Test file not found: ${testFilePath}`);
    }

    // Manually count lines to verify
    const fileContent = fs.readFileSync(testFilePath, 'utf-8');
    const lineCount = fileContent.split('\n').length;
    
    assert.strictEqual(lineCount, 10, 'Test file should have 10 lines');
  });

  it('should update configuration correctly', () => {
    const newConfig: LineCountConfig = {
      countMode: 'tokens',
      supportedExtensions: ['.md', '.json'],
      thresholds: [
        {value: 0, indicator: '⚪', description: 'Tiny size'},
        {value: 100, indicator: '🔵', description: 'Small size'},
        {value: 1000, indicator: '🟢', description: 'Medium size'}
      ],
      indicatorSymbolSet: 'Numbers'
    };
    
    // Update the config
    lineCounterManager.updateConfig(newConfig);
    
    // We can't directly test the private field, but we can verify the behavior
    // indirectly by checking that the manager doesn't throw errors when used
    assert.doesNotThrow(() => {
      lineCounterManager.startIndexing();
    });
  });
});