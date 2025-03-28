import { IndicatorSymbolSet, LineCountThreshold } from './types';

/**
 * Collection of all available indicator symbol sets
 */
export const indicatorSymbolSets: {[key: string]: IndicatorSymbolSet} = {
  'Colored Circles': {
    name: 'Colored Circles',
    description: 'Color-coded circles ⚪ 🔵 🟢 🟡 🟠 🔴 ⛔',
    detail: 'Visual progression from white to red circles, ending with stop sign',
    symbols: ['⚪', '🔵', '🟢', '🟡', '🟠', '🔴', '⛔']
  },
  'Emoji Faces': {
    name: 'Emoji Faces',
    description: 'Emotion progression 😀 🙂 😐 🙁 😟 😰 🤯',
    detail: 'From happy to overwhelmed expressions',
    symbols: ['😀', '🙂', '😐', '🙁', '😟', '😰', '🤯']
  },
  'Documentation Icons': {
    name: 'Documentation Icons',
    description: 'Document-themed icons 📝 📄 📑 📚 📔 📙 📘',
    detail: 'Visual progression of document sizes and formats',
    symbols: ['📝', '📄', '📑', '📚', '📔', '📙', '📘']
  },
  'Numbers': {
    name: 'Numbers',
    description: 'Simple numeric indicators 1 2 3 4 5 6 7',
    detail: 'Clean, minimalist numeric badges showing size category',
    symbols: ['1', '2', '3', '4', '5', '6', '7']
  },
  'ASCII Blocks': {
    name: 'ASCII Blocks',
    description: 'Block height indicators ▁ ▂ ▃ ▄ ▅ ▆ ▇',
    detail: 'Visual progression using block characters of increasing height',
    symbols: ['▁', '▂', '▃', '▄', '▅', '▆', '▇']
  },
  'Weather': {
    name: 'Weather',
    description: 'Weather condition icons ☀️ 🌤️ ⛅ 🌥️ ☁️ 🌧️ ⛈️',
    detail: 'From clear skies to thunderstorms based on icon complexity',
    symbols: ['☀️', '🌤️', '⛅', '🌥️', '☁️', '🌧️', '⛈️']
  },
  'Food': {
    name: 'Food',
    description: 'Food portion sizes 🥜 🍪 🍔 🍕 🍱 🎂 🍽️',
    detail: 'From snacks to feasts based on file size',
    symbols: ['🥜', '🍪', '🍔', '🍕', '🍱', '🎂', '🍽️']
  },
  'Animals': {
    name: 'Animals',
    description: 'Animal size progression 🐜 🐁 🐈 🐕 🦊 🐎 🐘',
    detail: 'From tiny creatures to massive beasts',
    symbols: ['🐜', '🐁', '🐈', '🐕', '🦊', '🐎', '🐘']
  },
  'Space': {
    name: 'Space',
    description: 'Cosmic size scale ⚛️ 🔬 🛰️ 🌎 🪐 ☀️ 🌌',
    detail: 'From atoms to galaxies based on magnitude',
    symbols: ['⚛️', '🔬', '🛰️', '🌎', '🪐', '☀️', '🌌']
  },
  'Mood': {
    name: 'Mood',
    description: 'Developer emotions 🥰 😊 🤔 😐 😟 😰 🤯',
    detail: 'How a developer might feel when opening files of different sizes',
    symbols: ['🥰', '😊', '🤔', '😐', '😟', '😰', '🤯']
  },
  'Circular Fill Progression': {
    name: 'Circular Fill Progression',
    description: 'Empty to full circle progression ○ ◔ ◐ ◑ ◒ ◓ ●',
    detail: 'Gradual fill of a circle symbol representing level progression',
    symbols: ['○', '◔', '◐', '◑', '◒', '◓', '●']
  },
  'Vertical Bar Fill': {
    name: 'Vertical Bar Fill',
    description: 'Vertical bar fill levels ▏ ▎ ▍ ▌ ▋ ▊ ▉',
    detail: 'Bars with increasing fill from minimal to nearly full',
    symbols: ['▏', '▎', '▍', '▌', '▋', '▊', '▉']
  },
  'Moon Phases': {
    name: 'Moon Phases',
    description: 'Lunar cycle progression 🌑 🌒 🌓 🌔 🌕 🌖 🌗',
    detail: 'From new moon to waning phases in a 7-stage cycle',
    symbols: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗']
  },
  'Clock Faces': {
    name: 'Clock Faces',
    description: 'Time progression on clocks 🕐 🕑 🕒 🕓 🕔 🕕 🕖',
    detail: 'Clock faces showing increasing hours',
    symbols: ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖']
  },
  'Planetary Symbols': {
    name: 'Planetary Symbols',
    description: 'Celestial progression ☿ ♀ ♁ ♂ ♃ ♄ ♅',
    detail: 'From Mercury to Uranus based on planetary order',
    symbols: ['☿', '♀', '♁', '♂', '♃', '♄', '♅']
  },
  'Roman Numerals': {
    name: 'Roman Numerals',
    description: 'Numerical progression I II III IV V VI VII',
    detail: 'Classic Roman numeral representation for 1-7',
    symbols: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
  },
  'Alphabetical Progression': {
    name: 'Alphabetical Progression',
    description: 'Sequence of letters A B C D E F G',
    detail: 'Simple progression of letters representing levels',
    symbols: ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  },
  'Circled Numbers': {
    name: 'Circled Numbers',
    description: 'Numbers enclosed in circles ① ② ③ ④ ⑤ ⑥ ⑦',
    detail: 'Progression of circled numbers for level indication',
    symbols: ['①', '②', '③', '④', '⑤', '⑥', '⑦']
  },
  'Parenthesized Numbers': {
    name: 'Parenthesized Numbers',
    description: 'Numbers in parentheses ⑴ ⑵ ⑶ ⑷ ⑸ ⑹ ⑺',
    detail: 'A different styling for number progression',
    symbols: ['⑴', '⑵', '⑶', '⑷', '⑸', '⑹', '⑺']
  },
  'Superscript Numbers': {
    name: 'Superscript Numbers',
    description: 'Numbers in superscript ¹ ² ³ ⁴ ⁵ ⁶ ⁷',
    detail: 'Elevated numeric style for subtle level indication',
    symbols: ['¹', '²', '³', '⁴', '⁵', '⁶', '⁷']
  },
  'Squared Latin Letters': {
    name: 'Squared Latin Letters',
    description: 'Square-enclosed letters 🅰 🅱 🅲 🅳 🅴 🅵 🅶',
    detail: 'Bold block letters representing sequential levels',
    symbols: ['🅰', '🅱', '🅲', '🅳', '🅴', '🅵', '🅶']
  },
  'Star Brightness': {
    name: 'Star Brightness',
    description: 'Stars from empty to full ☆ ✩ ✫ ✬ ✭ ✮ ★',
    detail: 'Stars increasing in intensity from faint to brilliant',
    symbols: ['☆', '✩', '✫', '✬', '✭', '✮', '★']
  },
  'Flower Growth': {
    name: 'Flower Growth',
    description: 'Floral stages 🌱 🌿 🍃 🌷 🌸 🌹 🌺',
    detail: 'Progression from a sprout to a full bloom',
    symbols: ['🌱', '🌿', '🍃', '🌷', '🌸', '🌹', '🌺']
  },
  'Musical Notes': {
    name: 'Musical Notes',
    description: 'Note progression ♩ ♪ ♫ ♬ 🎵 🎶 𝅘𝅥𝅮',
    detail: 'Increasing complexity in musical notation',
    symbols: ['♩', '♪', '♫', '♬', '🎵', '🎶', '𝅘𝅥𝅮']
  },
  'Arrow Progression': {
    name: 'Arrow Progression',
    description: 'Directional arrows → ↠ ⟶ ➔ ➜ ➝ ➞',
    detail: 'Arrows increasing in emphasis and direction',
    symbols: ['→', '↠', '⟶', '➔', '➜', '➝', '➞']
  },
  'Currency Symbols': {
    name: 'Currency Symbols',
    description: 'Various currency symbols ¢ $ € £ ¥ ₩ ₹',
    detail: 'Representing monetary value progression',
    symbols: ['¢', '$', '€', '£', '¥', '₩', '₹']
  },
  'Chess Pieces': {
    name: 'Chess Pieces',
    description: 'Chess pieces progression ♙ ♘ ♗ ♖ ♕ ♔ ♚',
    detail: 'Progression from pawn to king in a chess set',
    symbols: ['♙', '♘', '♗', '♖', '♕', '♔', '♚']
  },
  'Circled Latin Letters': {
    name: 'Circled Latin Letters',
    description: 'Letters enclosed in circles ⓐ ⓑ ⓒ ⓓ ⓔ ⓕ ⓖ',
    detail: 'A sequential progression using circled letters',
    symbols: ['ⓐ', 'ⓑ', 'ⓒ', 'ⓓ', 'ⓔ', 'ⓕ', 'ⓖ']
  },
  'CJK Numerals': {
    name: 'CJK Numerals',
    description: 'East Asian number symbols 一 二 三 四 五 六 七',
    detail: 'Traditional Chinese/Japanese numeral progression',
    symbols: ['一', '二', '三', '四', '五', '六', '七']
  },
  'Zodiac Signs': {
    name: 'Zodiac Signs',
    description: 'Astrological progression ♈ ♉ ♊ ♋ ♌ ♍ ♎',
    detail: 'Sequence of zodiac symbols representing astrological signs',
    symbols: ['♈', '♉', '♊', '♋', '♌', '♍', '♎']
  }
};

/**
 * Utility class to manage indicator symbol sets
 */
export class SymbolSetManager {
  /**
   * Get all available indicator symbol sets
   */
  static getAllSymbolSets(): {[key: string]: IndicatorSymbolSet} {
    return indicatorSymbolSets;
  }

  /**
   * Get the names of all available symbol sets
   */
  static getSymbolSetNames(): string[] {
    return Object.keys(indicatorSymbolSets);
  }

  /**
   * Get a specific symbol set by name
   */
  static getSymbolSet(name: string): IndicatorSymbolSet | undefined {
    return indicatorSymbolSets[name];
  }

  /**
   * Parse a CSV string to get symbol set data
   * Format: Name,Description,Detail,Symbols
   */
  static parseSymbolSetCsv(csvContent: string): IndicatorSymbolSet[] {
    const results: IndicatorSymbolSet[] = [];
    
    const lines = csvContent.split('\n');
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Basic CSV parsing - split by commas, respecting quotes
        let parts: string[] = [];
        let currentPart = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(currentPart);
            currentPart = '';
          } else {
            currentPart += char;
          }
        }
        
        // Add the last part
        parts.push(currentPart);
        
        // Clean up quotes
        parts = parts.map(part => part.trim().replace(/^"|"$/g, ''));
        
        if (parts.length >= 4) {
          const [name, description, detail, symbolsStr] = parts;
          const symbols = symbolsStr.split(';').map(s => s.trim());
          
          if (symbols.length >= 7) {
            results.push({
              name,
              description,
              detail,
              symbols
            });
          }
        }
      } catch (error) {
        console.error(`Error parsing symbol set CSV line: ${line}`, error);
      }
    }
    
    return results;
  }

  /**
   * Update thresholds with symbols from a specified symbol set
   */
  static updateThresholdsWithSymbolSet(
    thresholds: LineCountThreshold[], 
    symbolSetName: string
  ): LineCountThreshold[] {
    const symbolSet = indicatorSymbolSets[symbolSetName];
    if (!symbolSet || !symbolSet.symbols || symbolSet.symbols.length < thresholds.length) {
      return thresholds; // Return original thresholds if symbol set is invalid or too small
    }

    // Create a new array of thresholds with the updated indicators
    return thresholds.map((threshold, index) => {
      return {
        ...threshold,
        indicator: symbolSet.symbols[index]
      };
    });
  }
}
