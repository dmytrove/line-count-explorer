# Changelog

## [2.0.0] - 2025-03-28
### Added
- Parallel file processing for up to 5x faster indexing
- Progress reporting during indexing operations
- New commands for canceling indexing and clearing caches
- Event-based architecture for better performance
- Memory management improvements for large workspaces
- Prioritized indexing of visible and open files

### Improved
- Optimized line counting algorithm using regex
- More efficient directory structure generation
- Asynchronous file operations for better responsiveness
- Better error handling and recovery
- Enhanced token counting accuracy
- Automatic exclusion of more common build directories

### Fixed
- Memory leaks in long-running indexing operations
- UI freezes during large workspace indexing
- Inefficient polling in status bar updates
- Race conditions when canceling operations
- Incorrect line counts for empty files

## [1.0.0] - 2024-03-28
### Added
- Initial release of Line Count Explorer
- Line and token counting for files
- Configurable thresholds and indicators
- Support for multiple file extensions
- Configuration UI
- Status bar integration
- Preset selection

### Features
- Visualize file and directory line/token counts
- Multiple indicator styles
- Customizable counting modes
- Quick preset selection
- Performance-optimized caching mechanism

### Known Limitations
- Initial version with basic functionality
- Potential performance impact on very large projects
- Limited tokenization methods