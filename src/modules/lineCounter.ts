import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { LineCountConfig, FileLineCount, DirectoryLineCount } from './types';

/**
 * Manages counting lines and tokens in files across the workspace
 */
export class LineCounterManager {
  private config: LineCountConfig;
  private fileCache: Map<string, FileLineCount> = new Map();
  private directoryCache: Map<string, DirectoryLineCount> = new Map();
  private isIndexing: boolean = false;
  private indexingProgress: vscode.Progress<{ message?: string; increment?: number }> | undefined;
  private indexingToken: vscode.CancellationTokenSource | undefined;
  private readonly MAX_FILE_SIZE: number = 5 * 1024 * 1024; // 5MB limit for file size
  private readonly BATCH_SIZE: number = 20; // Number of files to process in parallel
  
  // Event emitter for tracking indexing state
  private _onIndexingStateChanged = new vscode.EventEmitter<boolean>();
  readonly onIndexingStateChanged = this._onIndexingStateChanged.event;

  constructor(config: LineCountConfig) {
    this.config = config;
  }

  updateConfig(newConfig: LineCountConfig) {
    this.config = newConfig;
    // Clear caches to force recalculation with new config
    this.fileCache.clear();
    this.directoryCache.clear();
  }

  isCurrentlyIndexing(): boolean {
    return this.isIndexing;
  }

  cancelIndexing(): void {
    if (this.indexingToken) {
      this.indexingToken.cancel();
    }
  }

  startIndexing(forceRefresh: boolean = false) {
    if (this.isIndexing) return;
    
    this.isIndexing = true;
    this._onIndexingStateChanged.fire(true);
    
    // Create a new cancellation token
    this.indexingToken = new vscode.CancellationTokenSource();
    
    // Show progress in the VS Code UI
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Window,
        title: 'Line Count Explorer: Indexing files',
        cancellable: true
      },
      async (progress, token) => {
        // Store progress for updating from other methods
        this.indexingProgress = progress;
        
        // Link our token with VS Code's token
        token.onCancellationRequested(() => {
          if (this.indexingToken) {
            this.indexingToken.cancel();
          }
        });
        
        progress.report({ message: 'Starting indexing...' });
        
        try {
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (!workspaceFolders) {
            this.finishIndexing();
            return;
          }
          
          // Process each workspace folder
          for (const folder of workspaceFolders) {
            if (this.indexingToken?.token.isCancellationRequested) {
              break;
            }
            
            // Make sure we have a valid token before passing it
            if (this.indexingToken) {
              await this.indexWorkspaceFolder(folder, forceRefresh, progress, this.indexingToken.token);
            } else {
              // Create a default cancellation token if needed
              const defaultToken = new vscode.CancellationTokenSource();
              await this.indexWorkspaceFolder(folder, forceRefresh, progress, defaultToken.token);
              defaultToken.dispose();
            }
          }
          
          this.finishIndexing();
        } catch (error) {
          console.error('Error during indexing:', error);
          this.finishIndexing();
        }
      }
    );
  }

  private async indexWorkspaceFolder(
    folder: vscode.WorkspaceFolder, 
    forceRefresh: boolean = false,
    progress: vscode.Progress<{ message?: string; increment?: number }>,
    cancellationToken: vscode.CancellationToken
  ): Promise<void> {
    const folderPath = folder.uri.fsPath;
    
    progress.report({ message: `Scanning ${path.basename(folderPath)}...` });
    
    // Find all files in workspace using VS Code's workspace API
    const fileExtensionsPattern = this.config.supportedExtensions.map(ext => `**/*${ext}`);
    
    // Create exclude patterns for common directories to ignore
    const excludePattern = {
      '**/node_modules/**': true,
      '**/.git/**': true,
      '**/dist/**': true,
      '**/build/**': true,
      '**/out/**': true,
      '**/.github/**': true,
      '**/.vscode-test/**': true
    };

    // Find all files matching extension patterns and not excluded
    const fileUris = await vscode.workspace.findFiles(
      `{${fileExtensionsPattern.join(',')}}`,
      JSON.stringify(excludePattern),
      undefined,
      cancellationToken
    );
    
    if (cancellationToken.isCancellationRequested) {
      return;
    }
    
    // First prioritize visible files in the explorer
    const visibleFiles = new Set<string>();
    const allEditors = vscode.window.visibleTextEditors;
    
    // Add currently open files to the priority set
    for (const editor of allEditors) {
      visibleFiles.add(editor.document.uri.fsPath);
    }
    
    // Sort files so that visible ones come first
    const sortedFiles = fileUris.sort((a, b) => {
      const aVisible = visibleFiles.has(a.fsPath) ? 0 : 1;
      const bVisible = visibleFiles.has(b.fsPath) ? 0 : 1;
      return aVisible - bVisible;
    });
    
    // Process files in batches
    const totalFiles = sortedFiles.length;
    let processedFiles = 0;
    
    // Split files into batches
    for (let i = 0; i < sortedFiles.length; i += this.BATCH_SIZE) {
      if (cancellationToken.isCancellationRequested) {
        break;
      }
      
      const batch = sortedFiles.slice(i, i + this.BATCH_SIZE);
      const batchTasks = batch.map(uri => this.processFile(uri.fsPath, forceRefresh));
      
      // Process batch in parallel
      await Promise.all(batchTasks);
      
      // Update progress
      processedFiles += batch.length;
      const percentComplete = (processedFiles / totalFiles) * 100;
      progress.report({ 
        message: `Indexing files... ${processedFiles}/${totalFiles}`,
        increment: (batch.length / totalFiles) * 100
      });
      
      // Allow the UI to remain responsive by yielding execution
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    if (cancellationToken.isCancellationRequested) {
      return;
    }
    
    // Build directory structure from file information
    progress.report({ message: 'Building directory structure...' });
    await this.buildDirectoryStructure(folderPath);
  }

  private async processFile(filePath: string, forceRefresh: boolean): Promise<void> {
    // Skip files that are already cached unless a refresh is forced
    if (!forceRefresh && this.fileCache.has(filePath)) {
      return;
    }
    
    try {
      // Get file stats
      const stats = await fs.promises.stat(filePath);
      
      // Skip files that are too large
      if (stats.size > this.MAX_FILE_SIZE) {
        return;
      }
      
      // Count lines in file
      await this.countLines(filePath, forceRefresh);
    } catch (error) {
      // Skip files that can't be processed
      console.warn(`Skipping file ${filePath}: ${error}`);
    }
  }

  private async buildDirectoryStructure(rootPath: string): Promise<void> {
    // Use an efficient data structure to track directories
    const dirMap = new Map<string, DirectoryLineCount>();
    const directoryStats = new Map<string, { lines: number, tokens: number }>();
    
    // Initialize with root directory
    dirMap.set(rootPath, {
      path: rootPath,
      totalLineCount: 0,
      totalTokenCount: 0,
      children: []
    });
    
    directoryStats.set(rootPath, { lines: 0, tokens: 0 });
    
    // First pass: collect all directories and create their data structures
    for (const [filePath, fileCount] of this.fileCache.entries()) {
      // Skip if file is not under the root path
      if (!filePath.startsWith(rootPath)) {
        continue;
      }
      
      // Get all parent directories of this file
      let currentDir = path.dirname(filePath);
      const parentDirs = new Set<string>();
      
      while (currentDir.startsWith(rootPath)) {
        parentDirs.add(currentDir);
        
        // Break if we've reached the root
        if (currentDir === rootPath) {
          break;
        }
        
        currentDir = path.dirname(currentDir);
      }
      
      // Create any missing directory entries
      for (const dir of parentDirs) {
        if (!dirMap.has(dir)) {
          dirMap.set(dir, {
            path: dir,
            totalLineCount: 0,
            totalTokenCount: 0,
            children: []
          });
          
          directoryStats.set(dir, { lines: 0, tokens: 0 });
        }
      }
      
      // Add file to its immediate parent
      const parentDir = path.dirname(filePath);
      const parentDirData = dirMap.get(parentDir);
      
      if (parentDirData) {
        // Check for duplicates
        const existingFile = parentDirData.children.find(child => child.path === filePath);
        if (!existingFile) {
          parentDirData.children.push(fileCount);
        }
        
        // Update stats for all parent directories in one pass
        for (const dir of parentDirs) {
          const stats = directoryStats.get(dir);
          if (stats) {
            stats.lines += fileCount.lineCount;
            stats.tokens += fileCount.tokenCount;
          }
        }
      }
    }
    
    // Second pass: build the directory tree structure (parent-child relationships)
    for (const [dirPath, dirData] of dirMap.entries()) {
      // Skip root
      if (dirPath === rootPath) continue;
      
      const parentDir = path.dirname(dirPath);
      const parentDirData = dirMap.get(parentDir);
      
      if (parentDirData) {
        // Check if directory already exists in parent
        const existingDir = parentDirData.children.find(child => child.path === dirPath);
        if (!existingDir) {
          parentDirData.children.push(dirData);
        }
      }
    }
    
    // Third pass: apply the calculated statistics
    for (const [dirPath, dirData] of dirMap.entries()) {
      const stats = directoryStats.get(dirPath);
      if (stats) {
        dirData.totalLineCount = stats.lines;
        dirData.totalTokenCount = stats.tokens;
      }
    }
    
    // Save directory info to cache
    for (const [dirPath, dirData] of dirMap.entries()) {
      this.directoryCache.set(dirPath, dirData);
    }
  }

  private async countLines(filePath: string, forceRefresh: boolean = false): Promise<FileLineCount> {
    // Check cache first
    const cachedResult = this.fileCache.get(filePath);
    if (cachedResult && !forceRefresh) return cachedResult;

    try {
      // Use async file reading for better performance
      const content = await fs.promises.readFile(filePath, 'utf-8');
      
      // Use more efficient line counting with regex
      const lineCount = (content.match(/\n/g) || []).length + 
                         (content.length > 0 && content[content.length - 1] !== '\n' ? 1 : 0);
      
      // Improved token counting with regex for better accuracy
      // This is still an approximation but faster than character-by-character
      // We split on whitespace and count non-empty tokens
      const tokenCount = content.split(/\s+/).filter(token => token.length > 0).length;
      
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
      
      // Create a minimal entry for failed files
      const fileCount: FileLineCount = {
        path: filePath,
        lineCount: 0,
        tokenCount: 0,
        indicator: '⚪'
      };
      
      this.fileCache.set(filePath, fileCount);
      return fileCount;
    }
  }

  private getIndicator(count: number): string {
    // Cache the sorted thresholds to avoid repeated sorting
    const thresholds = [...this.config.thresholds].sort((a, b) => b.value - a.value);
    
    for (const threshold of thresholds) {
      if (count >= threshold.value) {
        return threshold.indicator;
      }
    }

    return '⚪'; // Default smallest indicator
  }

  private finishIndexing() {
    this.isIndexing = false;
    this._onIndexingStateChanged.fire(false);
    
    if (this.indexingToken) {
      this.indexingToken.dispose();
      this.indexingToken = undefined;
    }
    
    this.indexingProgress = undefined;
  }

  // Getters for external access
  getFileLineCount(filePath: string): FileLineCount | undefined {
    return this.fileCache.get(filePath);
  }

  getDirectoryLineCount(dirPath: string): DirectoryLineCount | undefined {
    return this.directoryCache.get(dirPath);
  }

  // Method to clear caches and free memory
  clearCaches(): void {
    this.fileCache.clear();
    this.directoryCache.clear();
  }
}