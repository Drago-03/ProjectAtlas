# Changelog

All notable changes to this project will be documented in this file. The format follows Keep a Changelog guidelines.

## [0.2.5] - 2025-08-15

### Major Features

- **Search Functionality**: Powerful search system that indexes symbols, diagnostics, and code elements with real-time filtering
- **Data Export Capabilities**: Export project analysis data in JSON and CSV formats for external analysis and reporting
- **Auto-refresh System**: Configurable automatic data refresh with user-controlled intervals and real-time updates
- **Keyboard Shortcuts**: Full keyboard navigation support (Ctrl/Cmd+R for refresh, Ctrl/Cmd+F for search, number keys for tabs)
- **Notification System**: Toast notifications for user feedback with auto-dismiss and manual close options
- **Enhanced Loading Experience**: Progressive loading with animated progress bars and detailed status indicators

### UI/UX Enhancements

- **Modern Design System**: Complete CSS overhaul with CSS custom properties, consistent spacing, and design tokens
- **Enhanced Animations**: Smooth transitions, hover effects, and progressive loading animations throughout the interface
- **Responsive Design**: Improved mobile and tablet compatibility with flexible layouts and touch-friendly interactions
- **Dark Theme Support**: Enhanced dark mode with proper color schemes and improved contrast ratios
- **Status Indicators**: Real-time connection status, live data updates, and system health indicators
- **Card-based Layout**: Professional card components with hover effects and improved visual hierarchy

### Enhanced Analytics

- **Advanced Code Metrics**: 
  - Lines of code analysis
  - Duplicate code detection
  - Cyclomatic complexity calculation
  - Function and class counting
  - Multi-language support (TS, JS, Python, Go, Java, C++, C#, PHP, Ruby, Swift)
- **Performance Monitoring**:
  - Build time tracking
  - Bundle size analysis with real file system data
  - CPU and memory usage estimates
  - Disk space utilization
- **Dependency Analysis**:
  - Separate tracking for dev and peer dependencies
  - Enhanced license detection and categorization
  - Improved vulnerability assessment
  - Package categorization and analysis

### Technical Improvements

- **Enhanced VS Code Integration**: Better communication protocol between webview and extension with robust error handling
- **Real-time Data Updates**: Live data synchronization with configurable refresh intervals
- **Memory Optimization**: Efficient state management and reduced memory footprint
- **Error Recovery**: Comprehensive error handling with automatic retry mechanisms
- **Type Safety**: Enhanced TypeScript definitions and better type checking throughout the codebase
- **Code Quality**: Improved code organization, documentation, and maintainability

### Developer Experience

- **Debugging Tools**: Enhanced debug information panel with connection status, performance metrics, and data flow tracking
- **Configuration Options**: User-configurable settings for auto-refresh, themes, and data display preferences
- **Extension API**: Improved VS Code extension API integration with better command handling
- **Error Reporting**: Detailed error messages and diagnostic information for troubleshooting
- **Performance Monitoring**: Built-in performance tracking for extension load times and data processing

### Security & Reliability

- **Input Validation**: Enhanced input sanitization and validation throughout the application
- **Error Boundaries**: Comprehensive error handling to prevent application crashes
- **Data Privacy**: Local-only data processing with no external data transmission
- **Secure Communication**: Improved message passing between extension and webview components

### Future Roadmap (Planned Features)

- **Git Integration**: Branch analysis, commit history, and merge conflict detection
- **Test Coverage Visualization**: Interactive test coverage reports and recommendations
- **Code Quality Trends**: Historical tracking of code quality metrics over time
- **Team Collaboration**: Multi-developer workspace insights and shared configurations
- **CI/CD Integration**: Build pipeline analysis and deployment tracking
- **Custom Metrics**: User-defined metrics and extensible analysis framework
- **Advanced Search**: Semantic code search with AI-powered suggestions
- **Code Recommendations**: Automated suggestions for code improvements and refactoring
- **Performance Profiling**: Deep performance analysis with bottleneck identification
- **Documentation Generation**: Automated documentation extraction and API reference generation

## [0.2.4] - 2025-08-14

### Added

- **Advanced Code Analysis Dashboard**: Comprehensive code quality metrics including complexity scoring, maintainability index, code smells detection, and technical debt estimation
- **Performance Monitoring**: Real-time performance metrics with build time tracking, bundle size analysis, load time monitoring, and memory usage profiling
- **Dependencies Management**: Complete dependency overview with outdated package detection, vulnerability scanning, and license distribution analysis
- **Tabbed Navigation**: Multi-tab interface with Overview, Code Analysis, Performance, and Dependencies sections
- **Interactive Metrics**: Color-coded progress bars and trend indicators for all performance and quality metrics
- **Enhanced UI Components**: Professional dashboard design with metric cards, performance indicators, and actionable insights
- **Real-time Data Updates**: Dynamic data fetching and updates from VS Code extension backend
- **Version Display**: Updated version badge to v0.2.4 throughout the interface

### Changed

- **Complete UI Overhaul**: Transformed from single-view to comprehensive multi-tab dashboard experience
- **Enhanced Loading States**: Improved loading experience with detailed progress information and analysis status
- **Error Handling**: Upgraded error recovery with specific retry mechanisms for different dashboard components
- **State Management**: Expanded application state to handle complex dashboard data and user interactions
- **Theme Integration**: Enhanced theme support across all new dashboard components

### Improved

- **User Experience**: Professional dashboard interface with intuitive navigation and clear visual hierarchy
- **Data Visualization**: Advanced progress bars, trend indicators, and color-coded metrics for better insights
- **Performance Insights**: Comprehensive build and runtime performance analysis with actionable recommendations
- **Code Quality**: Deep code analysis with industry-standard metrics and best practice recommendations
- **Accessibility**: Enhanced Safari compatibility and improved cross-browser support
- **CSS Architecture**: Comprehensive stylesheet organization with modular component styling

### Fixed

- **UI Loading Issues**: Resolved critical webview loading problems that prevented extension functionality
- **Asset Path Resolution**: Fixed relative path issues in Vite configuration for proper VS Code webview integration
- **API Integration**: Enhanced VS Code API communication with robust error handling and retry mechanisms
- **Cross-browser Compatibility**: Added Safari-specific CSS vendor prefixes for better compatibility

## [0.2.3] - 2025-08-13

### Added

- **Comprehensive Development Documentation**: Complete basic instructions guide with setup, coding standards, and contribution workflow
- **VS Code Workspace Configuration**: Enhanced settings, launch configurations, tasks, and recommended extensions
- **Contributing Guide**: Step-by-step contribution workflow documentation
- **Development Helper Script**: `scripts/dev.sh` with common development commands (setup, build, test, lint, package)
- **Code Quality Tools**: ESLint configuration with TypeScript support and environment-specific rules
- **Prettier Configuration**: Consistent code formatting rules for TypeScript and Markdown
- **Markdown Linting**: Reasonable markdown standards with `.markdownlint.json`
- **Professional README**: Modern, aesthetic, marketplace-ready documentation with animations

### Changed

- **README Redesign**: Complete overhaul with modern styling, animated badges, and professional presentation
- **Package Management**: Updated to v0.2.3 with improved build process and cleaner package structure
- **Code Quality**: Improved linting from 25 errors to 8 warnings (no errors)
- **Documentation Structure**: Enhanced linking between basic instructions, contributing guide, and architecture docs
- **Repository Structure**: Verified compliance with recommended directory organization
- **Development Workflow**: Streamlined with helper scripts and automated tasks

### Improved

- **ESLint Configuration**: Better support for Node.js and browser environments with proper globals
- **VS Code Integration**: Enhanced debugging, tasks, and extension recommendations
- **Performance Metrics**: Added clear benchmarks and technical specifications to documentation
- **Marketplace Readiness**: Professional presentation optimized for VS Code Marketplace
- **Build Process**: Verified and optimized extension (10.1MB) and webview (207KB) bundles

### Removed

- **Contributors Section**: Removed from README for professional marketplace presentation
- **Legacy Packages**: Cleaned up older v0.2.1 and v0.2.2 VSIX files

## [0.2.2] - 2025-08-13

### Changed (0.2.1)

- Version bump only (documentation & security matrix update). No code changes since 0.2.1.

## [0.2.1] - 2025-08-13

### Added

- Python & Go provider stubs (diagnostic-only placeholders) registered.
- Search / filter UI (directory name substring filtering).
- Initial public extension API export `getProjectAtlasApi()` returning provider registration hook.
- Status bar entry (toggle via `projectAtlas.enableStatusBar`).
- Activity bar view container + dashboard tree view.
- Explorer & editor context menu command: "ProjectAtlas: Open".
- Walkthrough (Get Started) with initial steps.
- Settings: showWelcomeOnStartup, enableStatusBar.
- Notification on activation (quick open shortcut).
- Hover provider (TypeScript symbols preview message).
- Bundled extension with esbuild (single file output) + .vscodeignore slimming groundwork.
- New 16px activity icon SVG.
- Status bar helper + unit test for disabled state.
- Dynamic (lazy) mermaid import to defer heavy dependency load.

### Changed

- Package JSON contributions expanded (menus, views, walkthroughs, settings).
- Build pipeline switched from tsc emit to esbuild bundling.
- Reduced packaged surface (planned further pruning of unused dist/test sources).

### Planned / In Progress (0.2.1)

- Additional slimming: exclude tests & source maps from VSIX (phase 2) and optional code-splitting for webview.
- Rich per-function caller nodes (design drafted; not yet emitted).
- Collapsible symbol groups (UI not implemented yet).
- Diagram export (SVG/PNG) & PlantUML renderer (pending design / deps choice).
- Multi-root workspace aggregation (future enhancement; current: first workspace only).
- Public provider plugin loading (scaffolding begun via API exposure).

## [Unreleased]

### Planned (see Roadmap)

- Rich per-function caller nodes & collapsible groups.
- Diagram export (SVG/PNG) & PlantUML support.
- Multi-root workspace aggregation.
- Public extension API for custom symbol providers & render plugins.

## [0.1.1] - 2025-08-13

### Added (0.1.1)

- D3 visualizations: directory tree (hierarchical) and workflow graph (job dependency DAG).
- Workflow YAML scanning of `.github/workflows` with live watcher dispatching `WORKFLOW_UPDATE`.
- Symbol graph enhancements: import edges, basic call edges.
- Mermaid theming awareness + explicit error reporting (`MERMAID_ERROR`).
- Incremental patch schema including deletions `{nodesAdded,nodesRemoved,edgesAdded,edgesRemoved}`.

### Changed (0.1.1)

- Extracted diff logic to isolated module for pure testing.
- Debounced file-save recomputation (200ms) for symbol/workflow rebuild.

### Tests (0.1.1)

- Added unit tests for patch merging and diff logic.
- Added panel mermaid integration test (jsdom guarded environment).

### Documentation (0.1.1)

- Rewritten README with features, patch protocol, roadmap.

## [0.1.0] - 2025-08-13

### Added (0.1.0)

- Initial scaffold: activation command `projectAtlas.open`, React webview shell, TypeScript symbol provider (baseline), Markdown + Mermaid rendering.

---

## Roadmap Snapshot

| Version | Planned Items |
|---------|---------------|
| 0.2 | Python / Go provider stubs, search/filter UI |
| 0.3 | Rich call graph (per-function caller nodes), collapse/expand groups |
| 0.4 | Export diagrams (SVG/PNG), PlantUML support |
| 0.5 | Multi-repo / workspace multi-root aggregation |
| 1.0 | Extension API: custom symbol providers & render plugins |
