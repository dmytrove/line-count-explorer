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

  it('should count lines correctly', async () => {
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
    
    // Test the async line counting method
    await lineCounterManager['processFile'](testFilePath, true);
    const fileInfo = lineCounterManager.getFileLineCount(testFilePath);
    
    assert.ok(fileInfo, 'File info should be available after processing');
    assert.strictEqual(fileInfo?.lineCount, 10, 'Line count should match the expected value');
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
  
  it('should handle indexing state changes correctly', (done) => {
    // Listen for indexing state changes
    const disposable = lineCounterManager.onIndexingStateChanged((isIndexing) => {
      if (isIndexing) {
        // When indexing starts, check that isCurrentlyIndexing returns true
        assert.strictEqual(lineCounterManager.isCurrentlyIndexing(), true, 'isCurrentlyIndexing should return true when indexing');
        
        // Cancel the indexing, which should trigger a state change to false
        lineCounterManager.cancelIndexing();
      } else {
        // Indexing has finished or been canceled
        assert.strictEqual(lineCounterManager.isCurrentlyIndexing(), false, 'isCurrentlyIndexing should return false when not indexing');
        disposable.dispose();
        done();
      }
    });
    
    // Start indexing which should trigger the event
    lineCounterManager.startIndexing();
  });
  
  it('should clear caches correctly', async () => {
    const testFilePath = path.resolve(__dirname, '../../src/test/fixtures/test-file.txt');
    
    // Process a file to add it to the cache
    await lineCounterManager['processFile'](testFilePath, true);
    
    // Verify it's in the cache
    assert.ok(lineCounterManager.getFileLineCount(testFilePath), 'File should be in cache after processing');
    
    // Clear caches
    lineCounterManager.clearCaches();
    
    // Verify it's no longer in the cache
    assert.strictEqual(lineCounterManager.getFileLineCount(testFilePath), undefined, 'File should not be in cache after clearing');
  });
  
  it('should handle token counting correctly', async () => {
    const testFilePath = path.resolve(__dirname, '../../src/test/fixtures/test-file.txt');
    
    // Update to token mode
    const tokenConfig: LineCountConfig = {
      countMode: 'tokens',
      supportedExtensions: ['.txt', '.js'],
      thresholds: [
        {value: 0, indicator: '⚪', description: 'Tiny size'},
        {value: 100, indicator: '🔵', description: 'Small size'}
      ],
      indicatorSymbolSet: 'Colored Circles'
    };
    
    lineCounterManager.updateConfig(tokenConfig);
    
    // Process the file to count tokens
    await lineCounterManager['processFile'](testFilePath, true);
    const fileInfo = lineCounterManager.getFileLineCount(testFilePath);
    
    assert.ok(fileInfo, 'File info should be available after processing');
    assert.ok(fileInfo?.tokenCount > 0, 'Token count should be greater than zero');
    
    // Manually verify token count is reasonable
    const content = fs.readFileSync(testFilePath, 'utf-8');
    const roughTokenCount = content.split(/\s+/).filter(t => t.length > 0).length;
    assert.strictEqual(fileInfo?.tokenCount, roughTokenCount, 'Token count should match expected value');
  });
});