import * as vscode from 'vscode';
import { LineCountConfig, CountMode } from './modules/types';
import { LineCounterManager } from './modules/lineCounter';
import { DecorationProvider } from './modules/decorationProvider';
import { ConfigManager } from './modules/configManager';
import { StatusBarManager } from './modules/statusBarManager';

export function activate(context: vscode.ExtensionContext) {
  // Initialize configuration manager
  const configManager = new ConfigManager(context);
  const config = configManager.getConfig();

  // Initialize line counter manager
  const lineCounterManager = new LineCounterManager(config);

  // Initialize decoration provider
  const decorationProvider = new DecorationProvider(lineCounterManager);

  // Initialize status bar manager
  const statusBarManager = new StatusBarManager(lineCounterManager, configManager);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('lineCountExplorer.openConfigUI', () => {
      configManager.openConfigurationUI();
    }),
    vscode.commands.registerCommand('lineCountExplorer.refreshCounts', () => {
      // Clear caches and trigger reindexing
      const currentConfig = configManager.getConfig();
      lineCounterManager.updateConfig(currentConfig);
      lineCounterManager.startIndexing(true); // Force refresh
      decorationProvider.refresh();
      vscode.window.showInformationMessage('Line Count Explorer: Refreshed counts');
    }),
    vscode.commands.registerCommand('lineCountExplorer.quickSelectPreset', () => {
      configManager.quickSelectPreset();
    }),
    vscode.commands.registerCommand('lineCountExplorer.toggleExtension', () => {
      configManager.toggleExtension();
    }),
    vscode.commands.registerCommand('lineCountExplorer.saveCurrentConfigAsPreset', () => {
      configManager.saveCurrentConfigAsPreset();
    }),
    vscode.commands.registerCommand('lineCountExplorer.managePresets', () => {
      configManager.managePresets();
    }),
    vscode.commands.registerCommand('lineCountExplorer.quickSelectIndicatorSet', () => {
      configManager.quickSelectIndicatorSet();
    }),
    vscode.commands.registerCommand('lineCountExplorer.setCustomThresholds', () => {
      configManager.setCustomThresholds();
    }),
    vscode.commands.registerCommand('lineCountExplorer.importSymbolSetsFromCsv', () => {
      configManager.importSymbolSetsFromCsv();
    })
  );

  // Register file decoration provider
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(decorationProvider)
  );

  // Watch for configuration changes and refresh when needed
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('lineCountExplorer.countMode') ||
          e.affectsConfiguration('lineCountExplorer.supportedExtensions') ||
          e.affectsConfiguration('lineCountExplorer.thresholds') ||
          e.affectsConfiguration('lineCountExplorer.indicatorSymbolSet') ||
          e.affectsConfiguration('lineCountExplorer.selectedPreset')) {
        // Update the line counter configuration
        const updatedConfig = configManager.getConfig();
        lineCounterManager.updateConfig(updatedConfig);
        
        // Refresh indexing
        lineCounterManager.startIndexing();
        
        // Refresh decorations
        decorationProvider.refresh();
      }
    })
  );

  // Add a configuration for ignored patterns
  // Initial indexing - don't block activation but start after a delay to allow for UI to load
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      // Reindex when workspace folders change
      lineCounterManager.startIndexing(true);
      decorationProvider.refresh();
    })
  );

  // Start initial indexing with a short delay
  setTimeout(() => {
    lineCounterManager.startIndexing();
  }, 1000);
}

export function deactivate() {
  // Cleanup logic if needed
}