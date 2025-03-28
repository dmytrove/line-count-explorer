import * as vscode from 'vscode';
import { LineCounterManager } from './lineCounter';
import { ConfigManager } from './configManager';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private presetStatusBarItem: vscode.StatusBarItem;
  private refreshStatusBarItem: vscode.StatusBarItem;
  private lineCounterManager: LineCounterManager;
  private configManager: ConfigManager;

  constructor(lineCounterManager: LineCounterManager, configManager: ConfigManager) {
    this.lineCounterManager = lineCounterManager;
    this.configManager = configManager;
    
    // Create status bar item for the main extension
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right, 
      100
    );
    
    this.statusBarItem.command = 'lineCountExplorer.toggleExtension';
    this.statusBarItem.show();

    // Create status bar item for the preset indicator
    this.presetStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right, 
      99
    );
    
    this.presetStatusBarItem.command = 'lineCountExplorer.quickSelectPreset';
    this.presetStatusBarItem.show();

    // Create status bar item for the refresh button
    this.refreshStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right, 
      98
    );
    
    this.refreshStatusBarItem.text = "$(refresh)";
    this.refreshStatusBarItem.tooltip = "Refresh Line Count Explorer";
    this.refreshStatusBarItem.command = 'lineCountExplorer.refreshCounts';
    this.refreshStatusBarItem.show();

    // Initial update
    this.updateStatusBar();

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('lineCountExplorer')) {
        this.updateStatusBar();
      }
    });
  }

  private updateStatusBar() {
    const config = vscode.workspace.getConfiguration('lineCountExplorer');
    const isEnabled = config.get('enabled', true);
    const selectedPreset = config.get('selectedPreset', 'default');

    // Update main status bar item
    if (isEnabled) {
      this.statusBarItem.text = `$(file-code) Indexing Files`;
      this.statusBarItem.tooltip = 'Line Count Explorer: Click to toggle';
      
      // Show the indexing animation
      this.showIndexingProgress();
      
      // Show the preset status bar item when enabled
      this.presetStatusBarItem.show();
      this.refreshStatusBarItem.show();
    } else {
      this.statusBarItem.text = `$(x) Line Count Explorer Disabled`;
      this.statusBarItem.tooltip = 'Click to enable';
      
      // Hide the preset status bar item when disabled
      this.presetStatusBarItem.hide();
      this.refreshStatusBarItem.hide();
    }
    
    // Update preset status bar item
    if (isEnabled) {
      const isBuiltIn = this.configManager.isBuiltInPreset(selectedPreset);
      this.presetStatusBarItem.text = `$(gear) Preset: ${selectedPreset}`;
      this.presetStatusBarItem.tooltip = `Current Preset: ${selectedPreset} (${isBuiltIn ? 'Built-in' : 'User-defined'}). Click to change.`;
    }
  }

  private showIndexingProgress() {
    // Set indexing indicator
    this.statusBarItem.text = `$(sync~spin) Indexing Files`;
    this.statusBarItem.tooltip = 'Line Count Explorer: Indexing in progress...';
    this.refreshStatusBarItem.hide(); // Hide refresh button during indexing
    
    // Start the actual indexing process
    this.lineCounterManager.startIndexing();
    
    // Check every 500ms if indexing is complete
    const checkInterval = setInterval(() => {
      if (!(this.lineCounterManager as any).isIndexing) { // Access private property
        clearInterval(checkInterval);
        this.statusBarItem.text = `$(check) Line Count Explorer`;
        this.statusBarItem.tooltip = 'Line Count Explorer: Click to toggle';
        this.refreshStatusBarItem.show(); // Show refresh button when done
      }
    }, 500);
    
    // Safety timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      this.statusBarItem.text = `$(check) Line Count Explorer`;
      this.statusBarItem.tooltip = 'Line Count Explorer: Click to toggle';
      this.refreshStatusBarItem.show();
    }, 30000);
  }

  dispose() {
    this.statusBarItem.dispose();
    this.presetStatusBarItem.dispose();
    this.refreshStatusBarItem.dispose();
  }
}