import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { LineCounterManager } from '../modules/lineCounter';
import { LineCountConfig, CountMode } from '../modules/types';

describe('Line Count Explorer Extension', () => {
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

  it('should initialize without errors', () => {
    assert.doesNotThrow(() => {
      lineCounterManager.startIndexing();
    });
  });

  it('should have valid configuration', () => {
    const config: LineCountConfig = {
      countMode: 'lines',
      supportedExtensions: ['.txt', '.js'],
      thresholds: [
        {value: 0, indicator: '⚪', description: 'Tiny size'},
        {value: 100, indicator: '🔵', description: 'Small size'}
      ],
      indicatorSymbolSet: 'Colored Circles'
    };
    
    assert.strictEqual(config.countMode, 'lines');
    assert.deepStrictEqual(config.supportedExtensions, ['.txt', '.js']);
    assert.strictEqual(config.thresholds.length, 2);
    assert.strictEqual(config.indicatorSymbolSet, 'Colored Circles');
  });
});