import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { LineCountConfig, FileLineCount, DirectoryLineCount } from './types';

export class LineCounterManager {
  private config: LineCountConfig;
  private fileCache: Map<string, FileLineCount> = new Map();
  private directoryCache: Map<string, DirectoryLineCount> = new Map();
  private isIndexing: boolean = false;
  private readonly MAX_FILE_SIZE: number = 5 * 1024 * 1024; // 5MB limit for file size

  constructor(config: LineCountConfig) {
    this.config = config;
  }

  updateConfig(newConfig: LineCountConfig) {
    this.config = newConfig;
    // Clear caches to force recalculation with new config
    this.fileCache.clear();
    this.directoryCache.clear();
  }

  startIndexing(forceRefresh: boolean = false) {
    if (this.isIndexing) return;
    this.isIndexing = true;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      this.isIndexing = false;
      return;
    }

    // Use setTimeout to perform indexing asynchronously
    setTimeout(() => {
      try {
        workspaceFolders.forEach(folder => {
          this.indexDirectory(folder.uri.fsPath, forceRefresh);
        });
      } catch (error) {
        console.error('Error during indexing:', error);
      } finally {
        this.isIndexing = false;
      }
    }, 0);
  }

  private indexDirectory(dirPath: string, forceRefresh: boolean = false): DirectoryLineCount {
    const cachedResult = this.directoryCache.get(dirPath);
    if (cachedResult && !forceRefresh) return cachedResult;

    const children: (FileLineCount | DirectoryLineCount)[] = [];
    let totalLineCount = 0;
    let totalTokenCount = 0;

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          const dirCount = this.indexDirectory(fullPath);
          children.push(dirCount);
          totalLineCount += dirCount.totalLineCount;
          totalTokenCount += dirCount.totalTokenCount;
        } else if (this.isValidFile(fullPath)) {
          const fileCount = this.countLines(fullPath, forceRefresh);
          children.push(fileCount);
          totalLineCount += fileCount.lineCount;
          totalTokenCount += fileCount.tokenCount;
        }
      }
    } catch (error) {
      console.error(`Error indexing directory ${dirPath}:`, error);
    }

    const indicator = this.getIndicator(totalLineCount);
    const directoryCount: DirectoryLineCount = {
      path: dirPath,
      totalLineCount,
      totalTokenCount,
      children
    };

    this.directoryCache.set(dirPath, directoryCount);
    return directoryCount;
  }

  private isValidFile(filePath: string): boolean {
    const ext = path.extname(filePath);
    
    // Skip node_modules, .git, and other common directories to ignore
    if (filePath.includes('node_modules') || 
        filePath.includes('.git') || 
        filePath.includes('dist') || 
        filePath.includes('build') || 
        filePath.includes('out')) {
      return false;
    }
    
    // Check file size before processing (skip files larger than MAX_FILE_SIZE)
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > this.MAX_FILE_SIZE) { // 5MB
        return false;
      }
    } catch (error) {
      // If we can't get file stats, skip it
      return false;
    }
    
    return this.config.supportedExtensions.includes(ext);
  }

  private countLines(filePath: string, forceRefresh: boolean = false): FileLineCount {
    const cachedResult = this.fileCache.get(filePath);
    if (cachedResult && !forceRefresh) return cachedResult;

    try {
      // Use readFileSync but with a more efficient line counting approach
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Count lines more efficiently
      let lineCount = 0;
      for (let i = 0; i < content.length; i++) {
        if (content[i] === '\n') lineCount++;
      }
      // Add 1 for the last line if it doesn't end with a newline
      if (content.length > 0 && content[content.length - 1] !== '\n') {
        lineCount++;
      }
      
      // Simple token counting without splitting the whole string
      let tokenCount = 0;
      let inToken = false;
      
      for (let i = 0; i < content.length; i++) {
        const char = content[i];
        // If whitespace, we're not in a token
        if (/\s/.test(char)) {
          inToken = false;
        } else if (!inToken) {
          // If not whitespace and we weren't in a token, we found a new token
          inToken = true;
          tokenCount++;
        }
      }
      
      const fileCount: FileLineCount = {
        path: filePath,
        lineCount,
        tokenCount,
        indicator: this.getIndicator(
          this.config.countMode === 'lines' ? lineCount : tokenCount
        )
      };

      this.fileCache.set(filePath, fileCount);
      return fileCount;
    } catch (error) {
      console.error(`Error counting lines in ${filePath}:`, error);
      return {
        path: filePath,
        lineCount: 0,
        tokenCount: 0,
        indicator: '⚪'
      };
    }
  }

  private getIndicator(count: number): string {
    const thresholds = [...this.config.thresholds].sort((a, b) => b.value - a.value);
    
    for (const threshold of thresholds) {
      if (count >= threshold.value) {
        return threshold.indicator;
      }
    }

    return '⚪'; // Default smallest indicator
  }

  // Getters for external access
  getFileLineCount(filePath: string): FileLineCount | undefined {
    return this.fileCache.get(filePath);
  }

  getDirectoryLineCount(dirPath: string): DirectoryLineCount | undefined {
    return this.directoryCache.get(dirPath);
  }
}