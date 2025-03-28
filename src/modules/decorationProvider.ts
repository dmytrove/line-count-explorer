import * as vscode from 'vscode';
import * as path from 'path';
import { LineCounterManager } from './lineCounter';

export class DecorationProvider implements vscode.FileDecorationProvider {
  private lineCounterManager: LineCounterManager;

  private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri[] | undefined>();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

  constructor(lineCounterManager: LineCounterManager) {
    this.lineCounterManager = lineCounterManager;
  }

  refresh(): void {
    // Trigger a full refresh of the decorations
    this._onDidChangeFileDecorations.fire(undefined);
  }

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    const filePath = uri.fsPath;
    
    // For files
    const fileCount = this.lineCounterManager.getFileLineCount(filePath);
    if (fileCount) {
      return new vscode.FileDecoration(
        fileCount.indicator, 
        this.getTooltip(fileCount),
        this.getColor(fileCount.indicator)
      );
    }

    // For directories
    const dirCount = this.lineCounterManager.getDirectoryLineCount(path.dirname(filePath));
    if (dirCount) {
      // Find the specific subdirectory or file
      const matchingChild = dirCount.children.find(
        child => child.path === filePath
      );

      if (matchingChild) {
        return new vscode.FileDecoration(
          'indicator' in matchingChild ? (matchingChild as any).indicator : '⚪',
          this.getTooltip(matchingChild),
          this.getColor('indicator' in matchingChild ? (matchingChild as any).indicator : '⚪')
        );
      }
    }

    return undefined;
  }

  private getTooltip(count: any): string {
    return `Lines: ${count.lineCount || count.totalLineCount}\n` +
           `Tokens: ${count.tokenCount || count.totalTokenCount}`;
  }

  private getColor(indicator: string): vscode.ThemeColor | undefined {
    const colorMap: {[key: string]: vscode.ThemeColor} = {
      '⚪': new vscode.ThemeColor('lineCount.tiny'),
      '🔵': new vscode.ThemeColor('lineCount.small'),
      '🟢': new vscode.ThemeColor('lineCount.medium'),
      '🟡': new vscode.ThemeColor('lineCount.mediumLarge'),
      '🟠': new vscode.ThemeColor('lineCount.large'),
      '🔴': new vscode.ThemeColor('lineCount.veryLarge'),
      '⛔': new vscode.ThemeColor('lineCount.criticallyLarge')
    };

    return colorMap[indicator];
  }
}