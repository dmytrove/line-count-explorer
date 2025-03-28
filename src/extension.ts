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
    }),
    vscode.commands.registerCommand('lineCountExplorer.quickSelectPreset', () => {
      configManager.quickSelectPreset();
    }),
    vscode.commands.registerCommand('lineCountExplorer.toggleExtension', () => {
      // If currently indexing, cancel the indexing operation
      if (lineCounterManager.isCurrentlyIndexing()) {
        lineCounterManager.cancelIndexing();
      }
      configManager.toggleExtension();
    }),
    vscode.commands.registerCommand('lineCountExplorer.cancelIndexing', () => {
      lineCounterManager.cancelIndexing();
      vscode.window.showInformationMessage('Line Count Explorer: Indexing canceled');
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
    vscode.commands.registerCommand('lineCountExplorer.clearCaches', () => {
      lineCounterManager.clearCaches();
      vscode.window.showInformationMessage('Line Count Explorer: Caches cleared');
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
        
        // If currently indexing, cancel it before starting again
        if (lineCounterManager.isCurrentlyIndexing()) {
          lineCounterManager.cancelIndexing();
        }
        
        // Refresh indexing
        lineCounterManager.startIndexing();
        
        // Refresh decorations
        decorationProvider.refresh();
      }
    })
  );

  // Add event handler for workspace folder changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      // If currently indexing, cancel it before starting again
      if (lineCounterManager.isCurrentlyIndexing()) {
        lineCounterManager.cancelIndexing();
      }
      
      // Reindex when workspace folders change
      lineCounterManager.startIndexing(true);
      decorationProvider.refresh();
    })
  );

  // Register with the extension context to properly dispose
  context.subscriptions.push({
    dispose: () => {
      // Cancel any ongoing indexing
      lineCounterManager.cancelIndexing();
      // Clear caches to free memory
      lineCounterManager.clearCaches();
    }
  });

  // Start initial indexing with a short delay to allow for UI to load
  // but prioritize visible files for better user experience
  setTimeout(() => {
    const isEnabled = vscode.workspace.getConfiguration('lineCountExplorer').get('enabled', true);
    if (isEnabled) {
      lineCounterManager.startIndexing();
    }
  }, 1000);
}

export function deactivate() {
  // Cleanup already handled through the context subscriptions
}