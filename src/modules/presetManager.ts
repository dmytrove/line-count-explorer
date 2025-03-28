import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { LineCountConfig, LineCountThreshold, IndicatorSymbolSet } from './types';
import { builtInPresets } from './builtInPresets';
import { SymbolSetManager } from './symbolSets';

export class PresetManager {
  private presetsFolder: string;
  private userPresets: {[key: string]: LineCountConfig} = {};

  constructor(context: vscode.ExtensionContext) {
    this.presetsFolder = path.join(context.globalStorageUri.fsPath, 'presets');
    this.ensurePresetsFolderExists();
    this.loadUserPresets();
  }

  private ensurePresetsFolderExists() {
    try {
      if (!fs.existsSync(this.presetsFolder)) {
        fs.mkdirSync(this.presetsFolder, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create presets folder:', error);
    }
  }

  /**
   * Load user presets from files
   */
  private loadUserPresets() {
    try {
      if (!fs.existsSync(this.presetsFolder)) {
        return;
      }

      const files = fs.readdirSync(this.presetsFolder);
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.presetsFolder, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const preset = JSON.parse(fileContent) as LineCountConfig;
            
            // Verify that the preset has the required properties
            if (preset && preset.countMode && preset.supportedExtensions && preset.thresholds) {
              const presetName = file.replace('.json', '');
              this.userPresets[presetName] = preset;
            }
          } catch (err) {
            console.error(`Failed to load preset file ${file}:`, err);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load presets from files:', error);
    }
  }

  /**
   * Save all user presets to files
   */
  private saveUserPresets() {
    try {
      this.ensurePresetsFolderExists();
      
      // Save each preset to its own file (don't delete existing files to prevent data loss)
      for (const [name, preset] of Object.entries(this.userPresets)) {
        const filePath = path.join(this.presetsFolder, `${name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(preset, null, 2), 'utf8');
      }
    } catch (error) {
      console.error('Failed to save presets to files:', error);
    }
  }

  /**
   * Get all presets (built-in and user-defined)
   */
  getAllPresets(): {[key: string]: LineCountConfig} {
    return { ...builtInPresets, ...this.userPresets };
  }

  /**
   * Get names of all presets
   */
  getPresetNames(): string[] {
    return [...Object.keys(builtInPresets), ...Object.keys(this.userPresets)];
  }

  /**
   * Get user preset names
   */
  getUserPresetNames(): string[] {
    return Object.keys(this.userPresets);
  }

  /**
   * Check if a preset is built-in
   */
  isBuiltInPreset(name: string): boolean {
    return Object.keys(builtInPresets).includes(name);
  }

  /**
   * Get a preset by name
   */
  getPreset(name: string): LineCountConfig | undefined {
    return this.getAllPresets()[name];
  }

  /**
   * Add or update a user preset
   */
  savePreset(name: string, preset: LineCountConfig): boolean {
    // Don't allow overwriting built-in presets
    if (this.isBuiltInPreset(name)) {
      return false;
    }

    this.userPresets[name] = preset;
    this.saveUserPresets();
    return true;
  }

  /**
   * Delete a user preset
   */
  deletePreset(name: string): boolean {
    // Don't allow deleting built-in presets
    if (this.isBuiltInPreset(name)) {
      return false;
    }

    if (this.userPresets[name]) {
      delete this.userPresets[name];
      
      // Delete the preset file
      try {
        const filePath = path.join(this.presetsFolder, `${name}.json`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Failed to delete preset file for ${name}:`, error);
      }
      
      return true;
    }

    return false;
  }

  /**
   * Export all presets to a folder
   */
  exportPresets(targetFolder?: string): string | null {
    try {
      const exportFolder = targetFolder || path.join(this.presetsFolder, 'export');
      
      // Ensure the export folder exists
      if (!fs.existsSync(exportFolder)) {
        fs.mkdirSync(exportFolder, { recursive: true });
      }
      
      // Export built-in presets
      for (const [name, preset] of Object.entries(builtInPresets)) {
        const filePath = path.join(exportFolder, `${name}-builtin.json`);
        fs.writeFileSync(filePath, JSON.stringify(preset, null, 2), 'utf8');
      }
      
      // Export user presets
      for (const [name, preset] of Object.entries(this.userPresets)) {
        const filePath = path.join(exportFolder, `${name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(preset, null, 2), 'utf8');
      }
      
      return exportFolder;
    } catch (error) {
      console.error('Failed to export presets:', error);
      return null;
    }
  }

  /**
   * Import presets from a file or folder
   */
  importPresets(sourcePath: string): boolean {
    try {
      if (!fs.existsSync(sourcePath)) {
        return false;
      }
      
      let importedCount = 0;
      const stats = fs.statSync(sourcePath);
      
      if (stats.isFile() && sourcePath.endsWith('.json')) {
        // Import a single preset file
        const presetName = path.basename(sourcePath, '.json').replace('-builtin', '');
        try {
          const fileContent = fs.readFileSync(sourcePath, 'utf8');
          const preset = JSON.parse(fileContent) as LineCountConfig;
          
          // Verify that the preset has the required properties
          if (preset && preset.countMode && preset.supportedExtensions && preset.thresholds) {
            // Don't overwrite built-in presets
            if (!this.isBuiltInPreset(presetName)) {
              this.userPresets[presetName] = preset;
              importedCount++;
            }
          }
        } catch (err) {
          console.error(`Failed to import preset file ${sourcePath}:`, err);
        }
      } else if (stats.isDirectory()) {
        // Import all preset files from a directory
        const files = fs.readdirSync(sourcePath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.join(sourcePath, file);
              const fileContent = fs.readFileSync(filePath, 'utf8');
              const preset = JSON.parse(fileContent) as LineCountConfig;
              
              // Verify that the preset has the required properties
              if (preset && preset.countMode && preset.supportedExtensions && preset.thresholds) {
                const presetName = file.replace('.json', '').replace('-builtin', '');
                
                // Don't overwrite built-in presets
                if (!this.isBuiltInPreset(presetName)) {
                  this.userPresets[presetName] = preset;
                  importedCount++;
                }
              }
            } catch (err) {
              console.error(`Failed to import preset file ${file}:`, err);
            }
          }
        }
      }
      
      if (importedCount > 0) {
        this.saveUserPresets();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import presets:', error);
      return false;
    }
  }

  /**
   * Update an existing preset's threshold values with a new symbol set
   */
  updatePresetSymbols(presetName: string, symbolSetName: string): boolean {
    const preset = this.getAllPresets()[presetName];
    if (!preset) {
      return false;
    }

    // Get the symbol set
    const symbolSet = SymbolSetManager.getSymbolSet(symbolSetName);
    if (!symbolSet) {
      return false;
    }

    // Create a copy of the preset
    const updatedPreset = { ...preset };
    
    // Update each threshold with the new symbol
    updatedPreset.thresholds = updatedPreset.thresholds.map((threshold, index) => {
      if (index < symbolSet.symbols.length) {
        return {
          ...threshold,
          indicator: symbolSet.symbols[index]
        };
      }
      return threshold;
    });

    // Update the indicator symbol set name
    updatedPreset.indicatorSymbolSet = symbolSetName;

    // If it's a built-in preset, create a user preset with the same name
    if (this.isBuiltInPreset(presetName)) {
      // Create a new user preset with a different name
      const newName = `${presetName}-custom`;
      this.userPresets[newName] = updatedPreset;
      this.saveUserPresets();
      return true;
    } else {
      // Update the existing user preset
      this.userPresets[presetName] = updatedPreset;
      this.saveUserPresets();
      return true;
    }
  }

  /**
   * Import indicator symbol sets from CSV content
   */
  importSymbolSetsFromCsv(csvContent: string): IndicatorSymbolSet[] {
    return SymbolSetManager.parseSymbolSetCsv(csvContent);
  }
}
