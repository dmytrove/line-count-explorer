import * as vscode from 'vscode';
import { LineCountConfig, CountMode, LineCountThreshold, IndicatorSymbolSet } from './types';
import { PresetManager } from './presetManager';
import { SymbolSetManager } from './symbolSets';

export class ConfigManager {
  private context: vscode.ExtensionContext;
  private presetManager: PresetManager;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.presetManager = new PresetManager(context);
  }

  /**
   * Check if a preset is a built-in preset
   */
  isBuiltInPreset(name: string): boolean {
    return this.presetManager.isBuiltInPreset(name);
  }

  /**
   * Parse comma-separated threshold values
   */
  private parseThresholdValues(input: string): number[] {
    if (!input.trim()) {
      return [0, 100, 500, 1000, 2000, 5000, 10000]; // Default values
    }

    try {
      // Split by commas, trim whitespace, and convert to numbers
      return input
        .split(',')
        .map(val => val.trim())
        .filter(val => val.length > 0) // Filter out empty values
        .map(val => {
          const num = Number(val);
          if (isNaN(num)) {
            throw new Error(`Invalid number: ${val}`);
          }
          return num;
        });
    } catch (error) {
      console.error(`Error parsing threshold values: ${error}`);
      return [0, 100, 500, 1000, 2000, 5000, 10000]; // Default values on error
    }
  }

  /**
   * Create thresholds with symbols from a specified symbol set
   */
  private createThresholdsWithSymbols(values: number[], symbolSetName: string): LineCountThreshold[] {
    const symbolSet = SymbolSetManager.getSymbolSet(symbolSetName);
    if (!symbolSet || !symbolSet.symbols || symbolSet.symbols.length < values.length) {
      throw new Error(`Invalid symbol set or not enough symbols for the threshold values.`);
    }

    // Sort values in ascending order
    const sortedValues = [...values].sort((a, b) => a - b);

    // Create descriptions based on the values
    const descriptions = [
      'Tiny size',
      'Small size',
      'Medium size',
      'Medium-large size',
      'Large size',
      'Very large size',
      'Extremely large size'
    ];

    return sortedValues.map((value, index) => {
      return {
        value,
        indicator: symbolSet.symbols[index],
        description: index < descriptions.length ? descriptions[index] : `Level ${index + 1}`
      };
    });
  }

  getConfig(): LineCountConfig {
    const config = vscode.workspace.getConfiguration('lineCountExplorer');
    
    // Get the current configuration
    return {
      countMode: config.get('countMode', 'lines') as CountMode,
      supportedExtensions: config.get('supportedExtensions', ['.js', '.ts', '.py', '.html', '.css']),
      thresholds: config.get('thresholds', []),
      indicatorSymbolSet: config.get('indicatorSymbolSet', 'Colored Circles')
    };
  }

  openConfigurationUI() {
    vscode.commands.executeCommand('workbench.action.openSettings', 'lineCountExplorer');
  }

  /**
   * Quick select a preset from the list of available presets
   */
  quickSelectPreset() {
    const presetNames = this.presetManager.getPresetNames();
    const currentSelectedPreset = vscode.workspace.getConfiguration('lineCountExplorer').get('selectedPreset', 'default');
    
    const presetItems = presetNames.map(name => {
      const preset = this.presetManager.getPreset(name);
      if (!preset) return null;
      
      return {
        label: name,
        description: this.presetManager.isBuiltInPreset(name) ? '(Built-in)' : '(User-defined)',
        detail: `Mode: ${preset.countMode}, Extensions: ${preset.supportedExtensions.join(', ')}`,
        picked: name === currentSelectedPreset
      };
    }).filter(item => item !== null) as vscode.QuickPickItem[];
    
    vscode.window.showQuickPick(presetItems, {
      placeHolder: 'Select a preset configuration',
      matchOnDescription: true,
      matchOnDetail: true
    }).then(selected => {
      if (!selected) return;
      
      const selectedName = selected.label;
      const selectedPreset = this.presetManager.getPreset(selectedName);
      
      if (!selectedPreset) return;
      
      // Update workspace configuration
      const config = vscode.workspace.getConfiguration('lineCountExplorer');
      config.update('countMode', selectedPreset.countMode, 
        vscode.ConfigurationTarget.Workspace);
      config.update('supportedExtensions', selectedPreset.supportedExtensions, 
        vscode.ConfigurationTarget.Workspace);
      config.update('thresholds', selectedPreset.thresholds, 
        vscode.ConfigurationTarget.Workspace);
      config.update('selectedPreset', selectedName, 
        vscode.ConfigurationTarget.Workspace);
      
      if (selectedPreset.indicatorSymbolSet) {
        config.update('indicatorSymbolSet', selectedPreset.indicatorSymbolSet, 
          vscode.ConfigurationTarget.Workspace);
      }

      vscode.window.showInformationMessage(`Applied preset: ${selectedName}`);
    });
  }

  /**
   * Quick select an indicator symbol set
   */
  quickSelectIndicatorSet() {
    const symbolSetNames = SymbolSetManager.getSymbolSetNames();
    const currentSymbolSet = vscode.workspace.getConfiguration('lineCountExplorer').get('indicatorSymbolSet', 'Colored Circles');
    
    const symbolSetItems = symbolSetNames.map(name => {
      const symbolSet = SymbolSetManager.getSymbolSet(name);
      if (!symbolSet) return null;
      
      return {
        label: name,
        description: symbolSet.description,
        detail: symbolSet.detail,
        picked: name === currentSymbolSet
      };
    }).filter(item => item !== null) as vscode.QuickPickItem[];
    
    vscode.window.showQuickPick(symbolSetItems, {
      placeHolder: 'Select an indicator symbol set',
      matchOnDescription: true,
      matchOnDetail: true
    }).then(selected => {
      if (!selected) return;
      
      const selectedName = selected.label;
      const symbolSet = SymbolSetManager.getSymbolSet(selectedName);
      
      if (!symbolSet) return;
      
      // Get current configuration
      const config = vscode.workspace.getConfiguration('lineCountExplorer');
      const selectedPreset = config.get('selectedPreset', 'default');
      
      // Ask if user wants to update just the current config or also save it as a preset
      vscode.window.showQuickPick(
        [
          { label: 'Apply to current configuration only', description: 'Change current workspace settings' },
          { label: 'Apply and save as preset', description: 'Update current configuration and save as a preset' }
        ],
        { placeHolder: 'How would you like to apply this symbol set?' }
      ).then(option => {
        if (!option) return;
        
        // Get current thresholds
        const currentThresholds = config.get<LineCountThreshold[]>('thresholds', []);
        
        // Update symbols in thresholds
        const updatedThresholds = currentThresholds.map((threshold, index) => {
          if (index < symbolSet.symbols.length) {
            return {
              ...threshold,
              indicator: symbolSet.symbols[index]
            };
          }
          return threshold;
        });
        
        // Update workspace configuration
        config.update('thresholds', updatedThresholds, vscode.ConfigurationTarget.Workspace);
        config.update('indicatorSymbolSet', selectedName, vscode.ConfigurationTarget.Workspace);

        // If user wants to save as preset, update the preset too
        if (option.label === 'Apply and save as preset') {
          this.saveCurrentConfigAsPreset();
        } else {
          vscode.window.showInformationMessage(`Applied symbol set: ${selectedName}`);
        }
      });
    });
  }

  /**
   * Set custom thresholds using comma-separated values
   */
  setCustomThresholds() {
    vscode.window.showInputBox({
      placeHolder: 'Enter threshold values (comma separated)',
      prompt: 'Example: 0, 100, 500, 1000, 2000, 5000, 10000',
      value: '0, 100, 500, 1000, 2000, 5000, 10000'
    }).then(input => {
      if (!input) return;
      
      // Get current config
      const config = vscode.workspace.getConfiguration('lineCountExplorer');
      const currentSymbolSet = config.get('indicatorSymbolSet', 'Colored Circles');
      
      try {
        // Parse and limit values
        const values = this.parseThresholdValues(input);
        const limitedValues = values.slice(0, 7);
        
        if (limitedValues.length < 1) {
          vscode.window.showErrorMessage('No valid threshold values provided.');
          return;
        }
        
        if (limitedValues.length < values.length) {
          vscode.window.showWarningMessage(`Using only the first ${limitedValues.length} values. Maximum of 7 thresholds are supported.`);
        }
        
        // Create thresholds with appropriate symbols
        const thresholds = this.createThresholdsWithSymbols(limitedValues, currentSymbolSet);
        
        // Update configuration
        config.update('thresholds', thresholds, vscode.ConfigurationTarget.Workspace);
        
        // Offer to save as preset
        vscode.window.showInformationMessage(
          'Custom thresholds applied. Would you like to save this as a preset?',
          'Save as Preset',
          'No Thanks'
        ).then(selection => {
          if (selection === 'Save as Preset') {
            this.saveCurrentConfigAsPreset();
          }
        });
        
      } catch (error) {
        vscode.window.showErrorMessage(`Error setting custom thresholds: ${error}`);
      }
    });
  }

  /**
   * Save the current configuration as a new preset
   */
  saveCurrentConfigAsPreset() {
    const config = this.getConfig();
    
    vscode.window.showInputBox({
      placeHolder: 'Enter a name for your preset',
      prompt: 'Save current configuration as preset'
    }).then(name => {
      if (!name) return;
      
      // Check if preset name already exists
      if (this.presetManager.isBuiltInPreset(name)) {
        vscode.window.showWarningMessage(
          `Cannot overwrite built-in preset "${name}". Would you like to save with a different name?`,
          'Save as Different Name',
          'Cancel'
        ).then(selection => {
          if (selection === 'Save as Different Name') {
            this.saveCurrentConfigAsPreset(); // Show input box again
          }
        });
        return;
      }
      
      // Check if user preset already exists
      const allPresets = this.presetManager.getAllPresets();
      if (allPresets[name]) {
        vscode.window.showWarningMessage(
          `Preset "${name}" already exists. Overwrite?`,
          { modal: true },
          'Overwrite',
          'Cancel'
        ).then(selection => {
          if (selection === 'Overwrite') {
            this.presetManager.savePreset(name, config);
            vscode.window.showInformationMessage(`Preset "${name}" saved.`);
          }
        });
      } else {
        // Save new preset
        this.presetManager.savePreset(name, config);
        vscode.window.showInformationMessage(`Preset "${name}" saved.`);
      }
    });
  }

  /**
   * Manage existing user presets
   */
  managePresets() {
    const userPresetNames = this.presetManager.getUserPresetNames();
    
    // Check if there are any user presets
    if (userPresetNames.length === 0) {
      const items = [
        { label: 'Create New Preset', description: 'Save current configuration as a new preset' },
        { label: 'Apply Built-in Preset', description: 'Apply one of the built-in presets' },
        { label: 'Import Presets', description: 'Import presets from a folder or file' }
      ];
      
      vscode.window.showQuickPick(items, {
        placeHolder: 'No user presets found. What would you like to do?'
      }).then(selected => {
        if (!selected) return;
        
        if (selected.label === 'Create New Preset') {
          this.saveCurrentConfigAsPreset();
        } else if (selected.label === 'Apply Built-in Preset') {
          this.quickSelectPreset();
        } else if (selected.label === 'Import Presets') {
          this.importPresets();
        }
      });
      return;
    }

    // Show list of user presets to manage
    const items = userPresetNames.map(name => ({
      label: name,
      description: 'User-defined preset'
    }));
    
    // Add options for more actions
    items.push({
      label: '➕ Create New Preset',
      description: 'Save current configuration as a new preset'
    });
    
    items.push({
      label: '📤 Export/Import Presets',
      description: 'Export presets to files or import from files'
    });

    items.push({
      label: '🎨 Change Symbol Set',
      description: 'Select a different icon set for thresholds'
    });

    items.push({
      label: '✏️ Edit Threshold Values',
      description: 'Set custom threshold values'
    });

    vscode.window.showQuickPick(items, {
      placeHolder: 'Select a preset to manage or choose an action'
    }).then(selected => {
      if (!selected) return;
      
      const actionLabel = selected.label;
      
      // Handle actions
      if (actionLabel === '➕ Create New Preset') {
        this.saveCurrentConfigAsPreset();
        return;
      }
      
      if (actionLabel === '📤 Export/Import Presets') {
        this.showImportExportOptions();
        return;
      }
      
      if (actionLabel === '🎨 Change Symbol Set') {
        this.quickSelectIndicatorSet();
        return;
      }
      
      if (actionLabel === '✏️ Edit Threshold Values') {
        this.setCustomThresholds();
        return;
      }
      
      // If a preset was selected, manage it
      const name = selected.label;
      vscode.window.showQuickPick(
        ['Apply', 'Delete', 'Update Symbol Set', 'Edit Threshold Values'],
        { placeHolder: `Manage preset "${name}"` }
      ).then(action => {
        if (!action) return;
        
        if (action === 'Apply') {
          const preset = this.presetManager.getPreset(name);
          if (!preset) return;
          
          // Apply the preset
          const config = vscode.workspace.getConfiguration('lineCountExplorer');
          config.update('countMode', preset.countMode, vscode.ConfigurationTarget.Workspace);
          config.update('supportedExtensions', preset.supportedExtensions, vscode.ConfigurationTarget.Workspace);
          config.update('thresholds', preset.thresholds, vscode.ConfigurationTarget.Workspace);
          config.update('selectedPreset', name, vscode.ConfigurationTarget.Workspace);
          
          if (preset.indicatorSymbolSet) {
            config.update('indicatorSymbolSet', preset.indicatorSymbolSet, vscode.ConfigurationTarget.Workspace);
          }
          
          vscode.window.showInformationMessage(`Applied preset: ${name}`);
        } 
        else if (action === 'Delete') {
          vscode.window.showWarningMessage(
            `Are you sure you want to delete preset "${name}"?`,
            { modal: true },
            'Delete',
            'Cancel'
          ).then(confirmation => {
            if (confirmation === 'Delete') {
              const deleted = this.presetManager.deletePreset(name);
              if (deleted) {
                vscode.window.showInformationMessage(`Preset "${name}" deleted.`);
              } else {
                vscode.window.showErrorMessage(`Failed to delete preset "${name}".`);
              }
            }
          });
        }
        else if (action === 'Update Symbol Set') {
          this.updatePresetSymbolSet(name);
        }
        else if (action === 'Edit Threshold Values') {
          this.editPresetThresholds(name);
        }
      });
    });
  }

  /**
   * Update the symbol set for a preset
   */
  private updatePresetSymbolSet(presetName: string) {
    const symbolSetNames = SymbolSetManager.getSymbolSetNames();
    
    const preset = this.presetManager.getPreset(presetName);
    if (!preset) return;
    
    const currentSymbolSet = preset.indicatorSymbolSet || 'Colored Circles';
    
    const symbolSetItems = symbolSetNames.map(name => {
      const symbolSet = SymbolSetManager.getSymbolSet(name);
      if (!symbolSet) return null;
      
      return {
        label: name,
        description: symbolSet.description,
        detail: symbolSet.detail,
        picked: name === currentSymbolSet
      };
    }).filter(item => item !== null) as vscode.QuickPickItem[];
    
    vscode.window.showQuickPick(symbolSetItems, {
      placeHolder: `Select a symbol set for preset "${presetName}"`,
      matchOnDescription: true,
      matchOnDetail: true
    }).then(selected => {
      if (!selected) return;
      
      const symbolSetName = selected.label;
      const updated = this.presetManager.updatePresetSymbols(presetName, symbolSetName);
      
      if (updated) {
        vscode.window.showInformationMessage(`Updated preset "${presetName}" with symbol set "${symbolSetName}".`);
      } else {
        vscode.window.showErrorMessage(`Failed to update preset "${presetName}" with symbol set "${symbolSetName}".`);
      }
    });
  }

  /**
   * Edit threshold values for a preset
   */
  private editPresetThresholds(presetName: string) {
    const preset = this.presetManager.getPreset(presetName);
    if (!preset) return;
    
    // Extract current values and format as comma-separated string
    const currentValues = preset.thresholds.map(t => t.value).join(', ');
    
    vscode.window.showInputBox({
      placeHolder: 'Enter threshold values (comma separated)',
      prompt: `Edit thresholds for preset "${presetName}"`,
      value: currentValues
    }).then(input => {
      if (!input) return;
      
      try {
        // Get current info
        const symbolSetName = preset.indicatorSymbolSet || 'Colored Circles';
        const countMode = preset.countMode;
        const extensions = preset.supportedExtensions;
        
        // Create updated preset
        const updatedPreset = {
          countMode: countMode as CountMode,
          supportedExtensions: extensions,
          thresholds: this.createThresholdsWithSymbols(this.parseThresholdValues(input), symbolSetName),
          indicatorSymbolSet: symbolSetName
        };
        
        // Handle built-in presets differently
        if (this.presetManager.isBuiltInPreset(presetName)) {
          const customName = `${presetName}-custom`;
          vscode.window.showWarningMessage(
            `Cannot modify built-in preset. Save as "${customName}" instead?`,
            'Save as Custom',
            'Cancel'
          ).then(choice => {
            if (choice === 'Save as Custom') {
              this.presetManager.savePreset(customName, updatedPreset);
              vscode.window.showInformationMessage(`Saved as custom preset: "${customName}"`);
            }
          });
        } else {
          // Save the updated preset
          this.presetManager.savePreset(presetName, updatedPreset);
          vscode.window.showInformationMessage(`Updated threshold values for preset "${presetName}".`);
        }
        
      } catch (error) {
        vscode.window.showErrorMessage(`Error updating thresholds: ${error}`);
      }
    });
  }

  /**
   * Show import/export options for presets
   */
  private showImportExportOptions() {
    vscode.window.showQuickPick(
      [
        { label: 'Export All Presets', description: 'Export all presets to a directory' },
        { label: 'Import Presets', description: 'Import presets from files' },
        { label: 'Import Symbol Sets from CSV', description: 'Import custom symbol sets from CSV data' }
      ],
      { placeHolder: 'Choose an import/export option' }
    ).then(selected => {
      if (!selected) return;
      
      if (selected.label === 'Export All Presets') {
        this.exportPresets();
      } else if (selected.label === 'Import Presets') {
        this.importPresets();
      } else if (selected.label === 'Import Symbol Sets from CSV') {
        this.importSymbolSetsFromCsv();
      }
    });
  }

  /**
   * Export all presets to a directory
   */
  private exportPresets() {
    vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: 'Select Export Folder'
    }).then(folders => {
      if (!folders || folders.length === 0) return;
      
      const exportFolder = folders[0].fsPath;
      const result = this.presetManager.exportPresets(exportFolder);
      
      if (result) {
        vscode.window.showInformationMessage(`Presets exported to ${result}`);
      } else {
        vscode.window.showErrorMessage('Failed to export presets.');
      }
    });
  }

  /**
   * Import presets from files
   */
  private importPresets() {
    vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: true,
      canSelectMany: true,
      filters: {
        'JSON files': ['json']
      },
      openLabel: 'Select Preset Files or Folder'
    }).then(async selected => {
      if (!selected || selected.length === 0) return;
      
      let successCount = 0;
      
      for (const uri of selected) {
        const success = this.presetManager.importPresets(uri.fsPath);
        if (success) {
          successCount++;
        }
      }
      
      if (successCount > 0) {
        vscode.window.showInformationMessage(`Successfully imported presets from ${successCount} source(s).`);
      } else {
        vscode.window.showWarningMessage('No valid presets found to import.');
      }
    });
  }

  /**
   * Toggle extension enabled state
   */
  toggleExtension() {
    const config = vscode.workspace.getConfiguration('lineCountExplorer');
    const currentState = config.get('enabled', true);
    
    config.update('enabled', !currentState, vscode.ConfigurationTarget.Workspace);

    vscode.window.showInformationMessage(
      `Line Count Explorer ${currentState ? 'disabled' : 'enabled'}`
    );
  }

  /**
   * Import indicator symbol sets from CSV
   */
  importSymbolSetsFromCsv() {
    vscode.window.showInputBox({
      prompt: 'Paste CSV content for symbol sets',
      placeHolder: 'Name,Description,Detail,Symbols',
      ignoreFocusOut: true,
      value: 'Name,Description,Detail,Symbols\n"Colored Circles","Color-coded circles","Visual progression","⚪;🔵;🟢;🟡;🟠;🔴;⛔"'
    }).then(input => {
      if (!input) return;
      
      try {
        const symbolSets = this.presetManager.importSymbolSetsFromCsv(input);
        
        if (symbolSets.length > 0) {
          vscode.window.showInformationMessage(`Parsed ${symbolSets.length} symbol sets.`);
          
          // Allow user to pick one to apply
          const items = symbolSets.map(set => ({
            label: set.name,
            description: set.description,
            detail: set.detail
          }));
          
          vscode.window.showQuickPick(items, {
            placeHolder: 'Select a symbol set to apply'
          }).then(selected => {
            if (!selected) return;
            
            // Find the selected symbol set
            const selectedSet = symbolSets.find(set => set.name === selected.label);
            if (!selectedSet) return;
            
            // Apply to current configuration
            const config = vscode.workspace.getConfiguration('lineCountExplorer');
            const currentThresholds = config.get<LineCountThreshold[]>('thresholds', []);
            
            // Create updated thresholds with new symbols
            const updatedThresholds = currentThresholds.map((threshold, index) => {
              if (index < selectedSet.symbols.length) {
                return {
                  ...threshold,
                  indicator: selectedSet.symbols[index]
                };
              }
              return threshold;
            });
            
            // Update configuration
            config.update('thresholds', updatedThresholds, vscode.ConfigurationTarget.Workspace);
            
            vscode.window.showInformationMessage(`Applied symbol set: ${selectedSet.name}`);
          });
        } else {
          vscode.window.showWarningMessage('No valid symbol sets found in the CSV data.');
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Error importing symbol sets: ${error}`);
      }
    });
  }
}