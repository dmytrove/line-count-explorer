export type CountMode = 'lines' | 'tokens';

export interface LineCountThreshold {
  value: number;
  indicator: string;
  description: string;
}

export interface IndicatorSymbolSet {
  name: string;
  description: string;
  detail: string;
  symbols: string[];
}

export interface LineCountConfig {
  countMode: CountMode;
  supportedExtensions: string[];
  thresholds: LineCountThreshold[];
  indicatorSymbolSet?: string;
}

export interface FileLineCount {
  path: string;
  lineCount: number;
  tokenCount: number;
  indicator: string;
}

export interface DirectoryLineCount {
  path: string;
  totalLineCount: number;
  totalTokenCount: number;
  children: (FileLineCount | DirectoryLineCount)[];
}