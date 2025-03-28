import { LineCountConfig } from './types';

/**
 * Built-in presets that come with the extension
 */
export const builtInPresets: {[key: string]: LineCountConfig} = {
  'default': {
    countMode: 'lines',
    supportedExtensions: ['.js', '.ts', '.py', '.html', '.css'],
    thresholds: [
      {value: 0, indicator: '⚪', description: 'Tiny size'},
      {value: 100, indicator: '🔵', description: 'Small size'},
      {value: 500, indicator: '🟢', description: 'Medium size'},
      {value: 1000, indicator: '🟡', description: 'Medium-large size'},
      {value: 2000, indicator: '🟠', description: 'Approaching large size'},
      {value: 5000, indicator: '🔴', description: 'Large, consider splitting'},
      {value: 10000, indicator: '⛔', description: 'Very large, should be split'}
    ],
    indicatorSymbolSet: 'Colored Circles'
  },
  'llm-context': {
    countMode: 'tokens',
    supportedExtensions: ['.txt', '.md', '.json', '.py', '.js'],
    thresholds: [
      {value: 0, indicator: '⚪', description: 'Tiny size'},
      {value: 2000, indicator: '🔵', description: '2K token context'},
      {value: 4000, indicator: '🟢', description: '4K token context'},
      {value: 8000, indicator: '🟡', description: '8K token context'},
      {value: 16000, indicator: '🟠', description: '16K token context'},
      {value: 32000, indicator: '🔴', description: '32K token context'},
      {value: 64000, indicator: '⛔', description: 'Exceeds most context windows'}
    ],
    indicatorSymbolSet: 'Colored Circles'
  },
  'code-review': {
    countMode: 'lines',
    supportedExtensions: ['.js', '.ts', '.py', '.java', '.c', '.cpp', '.cs', '.go', '.rs'],
    thresholds: [
      {value: 0, indicator: '✅', description: 'Easy to review'},
      {value: 50, indicator: '🟩', description: 'Quick review'},
      {value: 200, indicator: '🟨', description: 'Moderate review time'},
      {value: 500, indicator: '🟧', description: 'Detailed review needed'},
      {value: 1000, indicator: '🟥', description: 'Extensive review required'},
      {value: 2000, indicator: '⚠️', description: 'Consider splitting for review'},
      {value: 5000, indicator: '🛑', description: 'Too large for effective review'}
    ],
    indicatorSymbolSet: 'Mood'
  },
  'documentation': {
    countMode: 'lines',
    supportedExtensions: ['.md', '.txt', '.rst', '.adoc', '.docx', '.tex'],
    thresholds: [
      {value: 0, indicator: '📝', description: 'Note'},
      {value: 100, indicator: '📄', description: 'Brief document'},
      {value: 500, indicator: '📑', description: 'Multi-page document'},
      {value: 1000, indicator: '📚', description: 'Chapter-sized content'},
      {value: 3000, indicator: '📔', description: 'Large document'},
      {value: 10000, indicator: '📙', description: 'Book-sized content'},
      {value: 30000, indicator: '📘', description: 'Comprehensive documentation'}
    ],
    indicatorSymbolSet: 'Documentation Icons'
  }
};
