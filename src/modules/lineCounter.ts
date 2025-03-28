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

    // Use the workspace API to find files
    Promise.all(workspaceFolders.map(folder => this.indexWorkspaceFolder(folder, forceRefresh)))
      .then(() => {
        this.isIndexing = false;
      })
      .catch(error => {
        console.error('Error during indexing:', error);
        this.isIndexing = false;
      });
  }

  private async indexWorkspaceFolder(folder: vscode.WorkspaceFolder, forceRefresh: boolean = false): Promise<void> {
    const folderPath = folder.uri.fsPath;
    
    // Find all files in workspace using VS Code's workspace API
    const fileExtensionsPattern = this.config.supportedExtensions.map(ext => `**/*${ext}`);
    
    // Create exclude patterns for common directories to ignore
    const excludePattern = {
      '**/node_modules/**': true,
      '**/.git/**': true,
      '**/dist/**': true,
      '**/build/**': true,
      '**/out/**': true
    };

    // Find all files matching extension patterns and not excluded
    const fileUris = await vscode.workspace.findFiles(
      `{${fileExtensionsPattern.join(',')}}`,
      JSON.stringify(excludePattern)
    );

    // Process each file
    for (const uri of fileUris) {
      const filePath = uri.fsPath;
      
      // Skip files that are too large
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > this.MAX_FILE_SIZE) {
          continue;
        }
      } catch (error) {
        continue; // Skip if can't read stats
      }
      
      // Count lines in file
      this.countLines(filePath, forceRefresh);
    }

    // Build directory structure from file information
    this.buildDirectoryStructure(folderPath);
  }

  private buildDirectoryStructure(rootPath: string): void {
    // Map to track directories and their contents
    const dirMap = new Map<string, DirectoryLineCount>();
    
    // Initialize with root directory
    dirMap.set(rootPath, {
      path: rootPath,
      totalLineCount: 0,
      totalTokenCount: 0,
      children: []
    });
    
    // Add all parent directories to the map
    for (const [filePath, fileCount] of this.fileCache.entries()) {
      let currentDir = path.dirname(filePath);
      
      // Skip if file is not under the root path
      if (!currentDir.startsWith(rootPath)) {
        continue;
      }
      
      // Ensure all parent directories exist in the map
      while (currentDir !== rootPath && !dirMap.has(currentDir)) {
        dirMap.set(currentDir, {
          path: currentDir,
          totalLineCount: 0,
          totalTokenCount: 0,
          children: []
        });
        
        // Move up to parent directory
        const parentDir = path.dirname(currentDir);
        
        // Add this directory as a child to its parent
        const parentDirInfo = dirMap.get(parentDir);
        if (parentDirInfo) {
          // Check if child already exists in parent
          const existingChild = parentDirInfo.children.find(child => child.path === currentDir);
          if (!existingChild) {
            parentDirInfo.children.push(dirMap.get(currentDir)!);
          }
        }
        
        currentDir = parentDir;
      }
      
      // Add file to its immediate parent directory
      const parentDir = path.dirname(filePath);
      const parentDirInfo = dirMap.get(parentDir);
      
      if (parentDirInfo) {
        // Check if file already exists in parent
        const existingFile = parentDirInfo.children.find(child => child.path === filePath);
        if (!existingFile) {
          parentDirInfo.children.push(fileCount);
        }
        
        // Update directory counts
        let currentDir = parentDir;
        while (dirMap.has(currentDir)) {
          const dirInfo = dirMap.get(currentDir)!;
          dirInfo.totalLineCount += fileCount.lineCount;
          dirInfo.totalTokenCount += fileCount.tokenCount;
          
          if (currentDir === rootPath) break;
          currentDir = path.dirname(currentDir);
        }
      }
    }
    
    // Save directory info to cache
    for (const [dirPath, dirInfo] of dirMap.entries()) {
      this.directoryCache.set(dirPath, dirInfo);
    }
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